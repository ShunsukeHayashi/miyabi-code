//! Miyabi TUI 2.0 - Integrated LLM Chat with Agent Tool Use + Streaming
//!
//! Premium UI/UX with card-style messages and Miyabi Theme

use crossterm::event::{KeyCode, KeyEvent};
use ratatui::{
    prelude::*,
    widgets::{
        Block, BorderType, Borders, Padding, Paragraph, Scrollbar, ScrollbarOrientation,
        ScrollbarState, Wrap,
    },
};

// Additional theme colors for premium look
const MIYABI_BG: Color = Color::Rgb(26, 27, 38); // Tokyo Night Background
const MIYABI_CARD_BG: Color = Color::Rgb(36, 40, 59); // Card Background
const MIYABI_BORDER: Color = Color::Rgb(65, 72, 104); // Subtle Blue-Gray
use futures::StreamExt;
use miyabi_llm::AnthropicClient;
use miyabi_llm::LlmStreamingClient;
use serde::Serialize;
use serde_json::json;
use std::time::Instant;

// Import shimmer, markdown, and history_cell modules from crate root
use crate::history_cell::{
    AssistantMessageCell, HistoryCell, SystemMessageCell, SystemMessageType, ToolResultCell,
    UserMessageCell,
};
use crate::markdown_render::MarkdownRenderer;
use crate::shimmer::{shimmer_text, spinner_frame, ShimmerConfig};

// Miyabi Theme Colors
const MIYABI_PURPLE: Color = Color::Rgb(187, 154, 247); // #bb9af7
const MIYABI_GOLD: Color = Color::Rgb(224, 175, 104); // #e0af68
const MIYABI_GREEN: Color = Color::Rgb(158, 206, 106); // #9ece6a
const MIYABI_CYAN: Color = Color::Rgb(125, 207, 255); // #7dcfff
const MIYABI_RED: Color = Color::Rgb(247, 118, 142); // #f7768e
const MIYABI_DIM: Color = Color::Rgb(86, 95, 137); // #565f89
const MIYABI_FG: Color = Color::Rgb(192, 202, 245); // #c0caf5

/// Chat message with tool use support
#[derive(Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
    pub timestamp: String,
    pub tool_use: Option<ToolUseInfo>,
    pub is_streaming: bool,
}

/// Tool use information
#[derive(Clone)]
pub struct ToolUseInfo {
    pub tool_name: String,
    pub time_ms: u64,
}

/// Agent tool definition
#[derive(Clone, Serialize)]
struct AgentTool {
    name: String,
    description: String,
    input_schema: serde_json::Value,
}

/// Chat view with integrated tool use and streaming
pub struct ChatView {
    /// History cells for polymorphic rendering (OpenAI Codex pattern)
    pub cells: Vec<Box<dyn HistoryCell>>,
    /// Legacy messages for API compatibility
    pub messages: Vec<ChatMessage>,
    pub input: String,
    pub scroll: u16,
    pub content_height: u16,
    pub loading: bool,
    client: Option<AnthropicClient>,
    tools: Vec<AgentTool>,
    pub error: Option<String>,
    pub auto_scroll: bool,
    pub token_count: usize,
}

impl ChatView {
    pub fn new() -> Self {
        let (client, init_message) = match std::env::var("ANTHROPIC_API_KEY") {
            Ok(key) if !key.is_empty() => match AnthropicClient::from_env() {
                Ok(c) => (
                    Some(
                        c.with_model("claude-sonnet-4-5-20250929".to_string())
                            .with_max_tokens(4096),
                    ),
                    format!("✓ API Key ({}...)", &key[..8.min(key.len())]),
                ),
                Err(e) => (None, format!("✗ {}", e)),
            },
            _ => (None, "✗ Set ANTHROPIC_API_KEY".to_string()),
        };

        let tools = vec![
            AgentTool {
                name: "analyze_issue".to_string(),
                description: "Analyze GitHub issue".to_string(),
                input_schema: json!({"type": "object", "properties": {"issue_description": {"type": "string"}}, "required": ["issue_description"]}),
            },
            AgentTool {
                name: "decompose_task".to_string(),
                description: "Break down task".to_string(),
                input_schema: json!({"type": "object", "properties": {"task": {"type": "string"}}, "required": ["task"]}),
            },
            AgentTool {
                name: "generate_code".to_string(),
                description: "Generate Rust code".to_string(),
                input_schema: json!({"type": "object", "properties": {"requirement": {"type": "string"}}, "required": ["requirement"]}),
            },
            AgentTool {
                name: "review_code".to_string(),
                description: "Review code".to_string(),
                input_schema: json!({"type": "object", "properties": {"code": {"type": "string"}}, "required": ["code"]}),
            },
            AgentTool {
                name: "market_research".to_string(),
                description: "Market research".to_string(),
                input_schema: json!({"type": "object", "properties": {"product": {"type": "string"}}, "required": ["product"]}),
            },
            AgentTool {
                name: "swot_analysis".to_string(),
                description: "SWOT analysis".to_string(),
                input_schema: json!({"type": "object", "properties": {"subject": {"type": "string"}}, "required": ["subject"]}),
            },
        ];

        let timestamp = chrono::Local::now().format("%H:%M:%S").to_string();
        let system_content = format!(
            "{}\n\nAgents: analyze, decompose, generate code, review, market, swot",
            init_message
        );

        // Create initial system cell using HistoryCell pattern
        let initial_cell: Box<dyn HistoryCell> = Box::new(SystemMessageCell {
            content: system_content.clone(),
            timestamp: timestamp.clone(),
            message_type: SystemMessageType::Info,
        });

        Self {
            cells: vec![initial_cell],
            messages: vec![ChatMessage {
                role: "system".to_string(),
                content: system_content,
                timestamp,
                tool_use: None,
                is_streaming: false,
            }],
            input: String::new(),
            scroll: 0,
            content_height: 0,
            loading: false,
            client,
            tools,
            error: None,
            auto_scroll: true,
            token_count: 0,
        }
    }

    async fn execute_tool_streaming(
        &mut self,
        tool_name: &str,
        input: &serde_json::Value,
    ) -> Result<(), String> {
        let Some(client) = &self.client else {
            return Err("LLM client not initialized".to_string());
        };

        let (agent_role, task) = match tool_name {
            "analyze_issue" => {
                let desc = input
                    .get("issue_description")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                (
                    "IssueAgent",
                    format!("Analyze: {}\nOutput JSON: labels, priority, effort", desc),
                )
            }
            "decompose_task" => {
                let task_desc = input.get("task").and_then(|v| v.as_str()).unwrap_or("");
                (
                    "CoordinatorAgent",
                    format!("Decompose: {}\nOutput JSON: subtasks", task_desc),
                )
            }
            "generate_code" => {
                let req = input
                    .get("requirement")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                ("CodeGenAgent", format!("Generate Rust code: {}", req))
            }
            "review_code" => {
                let code = input.get("code").and_then(|v| v.as_str()).unwrap_or("");
                (
                    "ReviewAgent",
                    format!("Review: {}\nOutput: issues, score", code),
                )
            }
            "market_research" => {
                let product = input.get("product").and_then(|v| v.as_str()).unwrap_or("");
                ("MarketResearchAgent", format!("Research: {}", product))
            }
            "swot_analysis" => {
                let subject = input.get("subject").and_then(|v| v.as_str()).unwrap_or("");
                ("SelfAnalysisAgent", format!("SWOT: {}", subject))
            }
            _ => return Err(format!("Unknown tool: {}", tool_name)),
        };

        let messages = vec![miyabi_llm::Message {
            role: miyabi_llm::Role::User,
            content: format!("You are {}. {}", agent_role, task),
        }];

        let msg_idx = self.messages.len();
        let timestamp = chrono::Local::now().format("%H:%M:%S").to_string();
        let tool_name_str = tool_name.to_string();
        self.messages.push(ChatMessage {
            role: "tool".to_string(),
            content: String::new(),
            timestamp: timestamp.clone(),
            tool_use: Some(ToolUseInfo {
                tool_name: tool_name_str.clone(),
                time_ms: 0,
            }),
            is_streaming: true,
        });

        let start = Instant::now();

        match client.chat_stream(messages).await {
            Ok(mut stream) => {
                while let Some(chunk_result) = stream.next().await {
                    match chunk_result {
                        Ok(text) => {
                            self.token_count += text.len() / 4;
                            if let Some(msg) = self.messages.get_mut(msg_idx) {
                                msg.content.push_str(&text);
                            }
                        }
                        Err(e) => {
                            if let Some(msg) = self.messages.get_mut(msg_idx) {
                                msg.content.push_str(&format!("\n[Error: {}]", e));
                            }
                            break;
                        }
                    }
                }
            }
            Err(e) => {
                if let Some(msg) = self.messages.get_mut(msg_idx) {
                    msg.content = format!("Error: {}", e);
                }
                // Add error cell
                self.cells.push(Box::new(ToolResultCell {
                    tool_name: tool_name_str.clone(),
                    content: format!("Error: {}", e),
                    timestamp: timestamp.clone(),
                    execution_time_ms: start.elapsed().as_millis() as u64,
                    success: false,
                }));
                return Err(e.to_string());
            }
        }

        // Tool execution complete - add cell
        if let Some(msg) = self.messages.get_mut(msg_idx) {
            msg.is_streaming = false;
            let elapsed_ms = start.elapsed().as_millis() as u64;
            if let Some(ref mut tool_info) = msg.tool_use {
                tool_info.time_ms = elapsed_ms;
            }
            self.cells.push(Box::new(ToolResultCell {
                tool_name: tool_name_str,
                content: msg.content.clone(),
                timestamp,
                execution_time_ms: elapsed_ms,
                success: true,
            }));
        }

        Ok(())
    }

    pub async fn send_message(&mut self) {
        if self.input.is_empty() || self.loading {
            return;
        }

        let user_msg = self.input.clone();
        let timestamp = chrono::Local::now().format("%H:%M:%S").to_string();
        self.token_count += user_msg.len() / 4;

        // Add to cells (OpenAI Codex pattern)
        self.cells.push(Box::new(UserMessageCell {
            content: user_msg.clone(),
            timestamp: timestamp.clone(),
        }));

        // Legacy messages for API compatibility
        self.messages.push(ChatMessage {
            role: "user".to_string(),
            content: user_msg.clone(),
            timestamp,
            tool_use: None,
            is_streaming: false,
        });
        self.input.clear();
        self.loading = true;
        self.error = None;
        self.auto_scroll = true;

        let Some(client) = &self.client else {
            self.error = Some("LLM client not initialized".to_string());
            self.loading = false;
            return;
        };

        let tool_keywords = [
            (
                "analyze_issue",
                vec!["analyze issue", "issue analysis", "label", "github issue"],
            ),
            (
                "decompose_task",
                vec!["decompose", "break down", "subtasks", "分解"],
            ),
            (
                "generate_code",
                vec!["generate code", "implement", "write code", "コード生成"],
            ),
            (
                "review_code",
                vec!["review code", "code review", "レビュー"],
            ),
            (
                "market_research",
                vec!["market research", "competitive", "競合"],
            ),
            ("swot_analysis", vec!["swot", "strengths", "分析"]),
        ];

        let user_lower = user_msg.to_lowercase();
        let mut tool_to_use: Option<(&str, serde_json::Value)> = None;

        for (tool_name, keywords) in &tool_keywords {
            if keywords.iter().any(|kw| user_lower.contains(kw)) {
                let input = match *tool_name {
                    "analyze_issue" => json!({"issue_description": user_msg}),
                    "decompose_task" => json!({"task": user_msg}),
                    "generate_code" => json!({"requirement": user_msg}),
                    "review_code" => json!({"code": user_msg}),
                    "market_research" => json!({"product": user_msg}),
                    "swot_analysis" => json!({"subject": user_msg}),
                    _ => json!({}),
                };
                tool_to_use = Some((tool_name, input));
                break;
            }
        }

        if let Some((tool_name, input)) = tool_to_use {
            let timestamp = chrono::Local::now().format("%H:%M:%S").to_string();
            let content = format!("Activating {}...", tool_name);

            // Add to cells
            self.cells.push(Box::new(AssistantMessageCell {
                content: content.clone(),
                timestamp: timestamp.clone(),
                streaming: false,
            }));

            self.messages.push(ChatMessage {
                role: "assistant".to_string(),
                content,
                timestamp,
                tool_use: None,
                is_streaming: false,
            });

            if let Err(e) = self.execute_tool_streaming(tool_name, &input).await {
                self.error = Some(e);
            }
        } else {
            let messages = vec![miyabi_llm::Message {
                role: miyabi_llm::Role::User,
                content: user_msg,
            }];

            let msg_idx = self.messages.len();
            let timestamp = chrono::Local::now().format("%H:%M:%S").to_string();
            self.messages.push(ChatMessage {
                role: "assistant".to_string(),
                content: String::new(),
                timestamp: timestamp.clone(),
                tool_use: None,
                is_streaming: true,
            });

            match client.chat_stream(messages).await {
                Ok(mut stream) => {
                    while let Some(chunk_result) = stream.next().await {
                        match chunk_result {
                            Ok(text) => {
                                self.token_count += text.len() / 4;
                                if let Some(msg) = self.messages.get_mut(msg_idx) {
                                    msg.content.push_str(&text);
                                }
                            }
                            Err(e) => {
                                if let Some(msg) = self.messages.get_mut(msg_idx) {
                                    msg.content.push_str(&format!("\n[Error: {}]", e));
                                }
                                break;
                            }
                        }
                    }
                    // Streaming complete - add cell with final content
                    if let Some(msg) = self.messages.get_mut(msg_idx) {
                        msg.is_streaming = false;
                        self.cells.push(Box::new(AssistantMessageCell {
                            content: msg.content.clone(),
                            timestamp: timestamp.clone(),
                            streaming: false,
                        }));
                    }
                }
                Err(e) => {
                    self.error = Some(format!("API Error: {}", e));
                    if let Some(msg) = self.messages.get_mut(msg_idx) {
                        msg.content = format!("Error: {}", e);
                        msg.is_streaming = false;
                        self.cells.push(Box::new(AssistantMessageCell {
                            content: msg.content.clone(),
                            timestamp: timestamp.clone(),
                            streaming: false,
                        }));
                    }
                }
            }
        }

        self.loading = false;
    }

    pub fn on_key(&mut self, key: KeyEvent) -> bool {
        match key.code {
            KeyCode::Enter => {
                if !self.input.is_empty() && !self.loading {
                    return true;
                }
                false
            }
            KeyCode::Char(c) => {
                self.input.push(c);
                false
            }
            KeyCode::Backspace => {
                self.input.pop();
                false
            }
            KeyCode::Up => {
                self.auto_scroll = false;
                self.scroll = self.scroll.saturating_sub(1);
                false
            }
            KeyCode::Down => {
                if self.scroll < self.content_height.saturating_sub(10) {
                    self.scroll = self.scroll.saturating_add(1);
                } else {
                    self.auto_scroll = true;
                }
                false
            }
            KeyCode::PageUp => {
                self.auto_scroll = false;
                self.scroll = self.scroll.saturating_sub(10);
                false
            }
            KeyCode::PageDown => {
                self.scroll = self.scroll.saturating_add(10);
                if self.scroll >= self.content_height.saturating_sub(10) {
                    self.auto_scroll = true;
                }
                false
            }
            KeyCode::Home => {
                self.auto_scroll = false;
                self.scroll = 0;
                false
            }
            KeyCode::End => {
                self.auto_scroll = true;
                self.scroll = self.content_height;
                false
            }
            _ => false,
        }
    }

    pub fn draw(&mut self, f: &mut Frame, area: Rect) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(4), // Premium Header
                Constraint::Min(0),    // Messages
                Constraint::Length(5), // Rich Input
                Constraint::Length(2), // Status Bar
            ])
            .split(area);

        // ═══════════════════════════════════════════════════════════════════
        // Premium Header - Gradient-like effect with double borders
        // ═══════════════════════════════════════════════════════════════════
        let status_icon = if self.loading {
            spinner_frame() // Use shimmer module's animated spinner
        } else {
            "●"
        };

        let status_color = if self.loading {
            MIYABI_GOLD
        } else {
            MIYABI_GREEN
        };

        let header_content = vec![
            Line::from(vec![
                Span::styled("╔", Style::default().fg(MIYABI_PURPLE)),
                Span::styled("═══════════════════════════════════════════════════════════════════════════════════╗", Style::default().fg(MIYABI_PURPLE)),
            ]),
            Line::from(vec![
                Span::styled("║  ", Style::default().fg(MIYABI_PURPLE)),
                Span::styled("✧ MIYABI ", Style::default().fg(MIYABI_GOLD).add_modifier(Modifier::BOLD)),
                Span::styled("Chat ", Style::default().fg(MIYABI_FG).add_modifier(Modifier::BOLD)),
                Span::styled("│ ", Style::default().fg(MIYABI_DIM)),
                Span::styled("Claude Sonnet 4.5 ", Style::default().fg(MIYABI_CYAN)),
                Span::styled("│ ", Style::default().fg(MIYABI_DIM)),
                Span::styled(format!("{} ", status_icon), Style::default().fg(status_color)),
                Span::styled(
                    if self.loading { "Streaming" } else { "Ready" },
                    Style::default().fg(status_color)
                ),
                Span::styled(format!("  │  📊 {} tokens", self.token_count), Style::default().fg(MIYABI_DIM)),
                Span::styled(format!("{:>30}║", ""), Style::default().fg(MIYABI_PURPLE)),
            ]),
            Line::from(vec![
                Span::styled("╚", Style::default().fg(MIYABI_PURPLE)),
                Span::styled("═══════════════════════════════════════════════════════════════════════════════════╝", Style::default().fg(MIYABI_PURPLE)),
            ]),
        ];

        let header = Paragraph::new(header_content);
        f.render_widget(header, chunks[0]);

        let msg_area = chunks[1];
        let inner_height = msg_area.height.saturating_sub(2) as u16;

        // ═══════════════════════════════════════════════════════════════════
        // Premium Message Cards with sophisticated styling
        // ═══════════════════════════════════════════════════════════════════
        let mut lines: Vec<Line> = vec![];

        // Welcome message if empty
        if self.messages.is_empty() {
            lines.push(Line::from(""));
            lines.push(Line::from(vec![
                Span::styled("  ┌", Style::default().fg(MIYABI_DIM)),
                Span::styled(
                    "────────────────────────────────────────",
                    Style::default().fg(MIYABI_DIM),
                ),
                Span::styled("┐", Style::default().fg(MIYABI_DIM)),
            ]));
            lines.push(Line::from(vec![
                Span::styled("  │", Style::default().fg(MIYABI_DIM)),
                Span::styled("    ✧ Welcome to ", Style::default().fg(MIYABI_FG)),
                Span::styled(
                    "Miyabi Chat",
                    Style::default()
                        .fg(MIYABI_PURPLE)
                        .add_modifier(Modifier::BOLD),
                ),
                Span::styled("                │", Style::default().fg(MIYABI_DIM)),
            ]));
            lines.push(Line::from(vec![
                Span::styled("  │", Style::default().fg(MIYABI_DIM)),
                Span::styled(
                    "                                        ",
                    Style::default().fg(MIYABI_DIM),
                ),
                Span::styled("│", Style::default().fg(MIYABI_DIM)),
            ]));
            lines.push(Line::from(vec![
                Span::styled("  │", Style::default().fg(MIYABI_DIM)),
                Span::styled(
                    "    Powered by Claude Sonnet 4.5        ",
                    Style::default().fg(MIYABI_DIM),
                ),
                Span::styled("│", Style::default().fg(MIYABI_DIM)),
            ]));
            lines.push(Line::from(vec![
                Span::styled("  │", Style::default().fg(MIYABI_DIM)),
                Span::styled(
                    "    with integrated A2A Agent tools     ",
                    Style::default().fg(MIYABI_DIM),
                ),
                Span::styled("│", Style::default().fg(MIYABI_DIM)),
            ]));
            lines.push(Line::from(vec![
                Span::styled("  │", Style::default().fg(MIYABI_DIM)),
                Span::styled(
                    "                                        ",
                    Style::default().fg(MIYABI_DIM),
                ),
                Span::styled("│", Style::default().fg(MIYABI_DIM)),
            ]));
            lines.push(Line::from(vec![
                Span::styled("  │", Style::default().fg(MIYABI_DIM)),
                Span::styled("    💡 ", Style::default().fg(MIYABI_GOLD)),
                Span::styled("Try: ", Style::default().fg(MIYABI_FG)),
                Span::styled(
                    "\"analyze this issue\"       ",
                    Style::default().fg(MIYABI_CYAN),
                ),
                Span::styled("│", Style::default().fg(MIYABI_DIM)),
            ]));
            lines.push(Line::from(vec![
                Span::styled("  │", Style::default().fg(MIYABI_DIM)),
                Span::styled("    💡 ", Style::default().fg(MIYABI_GOLD)),
                Span::styled("Or:  ", Style::default().fg(MIYABI_FG)),
                Span::styled(
                    "\"generate code for auth\"   ",
                    Style::default().fg(MIYABI_CYAN),
                ),
                Span::styled("│", Style::default().fg(MIYABI_DIM)),
            ]));
            lines.push(Line::from(vec![
                Span::styled("  └", Style::default().fg(MIYABI_DIM)),
                Span::styled(
                    "────────────────────────────────────────",
                    Style::default().fg(MIYABI_DIM),
                ),
                Span::styled("┘", Style::default().fg(MIYABI_DIM)),
            ]));
        }

        // ═══════════════════════════════════════════════════════════════════
        // Render all history cells using the HistoryCell trait
        // (OpenAI Codex TUI pattern for polymorphic message rendering)
        // ═══════════════════════════════════════════════════════════════════
        let width = msg_area.width.saturating_sub(4);
        for cell in &self.cells {
            lines.push(Line::from("")); // Spacing between cells
            lines.extend(cell.render(width));
        }

        // Show error
        if let Some(err) = &self.error {
            lines.push(Line::from(Span::styled(
                format!("⚠️  {}", err),
                Style::default().fg(MIYABI_RED),
            )));
        }

        // Calculate content height and auto-scroll
        self.content_height = lines.len() as u16;
        if self.auto_scroll && self.content_height > inner_height {
            self.scroll = self.content_height.saturating_sub(inner_height);
        }

        let messages_para = Paragraph::new(lines.clone())
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .border_type(BorderType::Rounded)
                    .border_style(Style::default().fg(MIYABI_BORDER))
                    .padding(Padding::new(1, 1, 0, 0))
                    .bg(MIYABI_BG)
                    .title(" 💬 Conversation ")
                    .title_style(
                        Style::default()
                            .fg(MIYABI_PURPLE)
                            .add_modifier(Modifier::BOLD),
                    ),
            )
            .wrap(Wrap { trim: false })
            .scroll((self.scroll, 0));

        f.render_widget(messages_para, msg_area);

        // Scrollbar
        if self.content_height > inner_height {
            let scrollbar = Scrollbar::new(ScrollbarOrientation::VerticalRight)
                .begin_symbol(Some("↑"))
                .end_symbol(Some("↓"))
                .track_symbol(Some("│"))
                .thumb_symbol("█");
            let mut scrollbar_state =
                ScrollbarState::new(self.content_height as usize).position(self.scroll as usize);
            f.render_stateful_widget(
                scrollbar,
                msg_area.inner(Margin {
                    vertical: 1,
                    horizontal: 0,
                }),
                &mut scrollbar_state,
            );
        }

        // ═══════════════════════════════════════════════════════════════════
        // Premium Input Area with rich visual feedback
        // ═══════════════════════════════════════════════════════════════════
        let input_content = if self.loading {
            // Create shimmer effect for loading text
            let loading_text = "Streaming response from Claude...";
            let shimmer_config = ShimmerConfig {
                base_color: MIYABI_GOLD,
                highlight_color: Color::Rgb(255, 230, 150),
                ..Default::default()
            };
            let shimmer_chars = shimmer_text(loading_text, &shimmer_config);
            let shimmer_spans: Vec<Span> = shimmer_chars
                .into_iter()
                .map(|(c, style)| Span::styled(c.to_string(), style))
                .collect();

            vec![
                Line::from(vec![
                    Span::styled("╭─", Style::default().fg(MIYABI_GOLD)),
                    Span::styled(
                        "─────────────────────────────────────────────────────────────────────",
                        Style::default().fg(MIYABI_GOLD),
                    ),
                    Span::styled("─╮", Style::default().fg(MIYABI_GOLD)),
                ]),
                Line::from({
                    let mut spans = vec![
                        Span::styled("│ ", Style::default().fg(MIYABI_GOLD)),
                        Span::styled(
                            format!("{} ", spinner_frame()),
                            Style::default()
                                .fg(MIYABI_GOLD)
                                .add_modifier(Modifier::BOLD),
                        ),
                    ];
                    spans.extend(shimmer_spans);
                    spans.push(Span::styled(
                        format!("{:>6}│", ""),
                        Style::default().fg(MIYABI_GOLD),
                    ));
                    spans
                }),
                Line::from(vec![
                    Span::styled("╰─", Style::default().fg(MIYABI_GOLD)),
                    Span::styled(
                        "─────────────────────────────────────────────────────────────────────",
                        Style::default().fg(MIYABI_GOLD),
                    ),
                    Span::styled("─╯", Style::default().fg(MIYABI_GOLD)),
                ]),
            ]
        } else if self.input.is_empty() {
            vec![
                Line::from(vec![
                    Span::styled("╭─", Style::default().fg(MIYABI_GREEN)),
                    Span::styled(
                        "─────────────────────────────────────────────────────────────────────",
                        Style::default().fg(MIYABI_GREEN),
                    ),
                    Span::styled("─╮", Style::default().fg(MIYABI_GREEN)),
                ]),
                Line::from(vec![
                    Span::styled("│ ", Style::default().fg(MIYABI_GREEN)),
                    Span::styled(
                        "❯ ",
                        Style::default()
                            .fg(MIYABI_GREEN)
                            .add_modifier(Modifier::BOLD),
                    ),
                    Span::styled("Type your message...", Style::default().fg(MIYABI_DIM)),
                    Span::styled(format!("{:>47}│", ""), Style::default().fg(MIYABI_GREEN)),
                ]),
                Line::from(vec![
                    Span::styled("│ ", Style::default().fg(MIYABI_GREEN)),
                    Span::styled("  💡 ", Style::default().fg(MIYABI_GOLD)),
                    Span::styled("Keywords: ", Style::default().fg(MIYABI_DIM)),
                    Span::styled("analyze", Style::default().fg(MIYABI_CYAN)),
                    Span::styled(" • ", Style::default().fg(MIYABI_DIM)),
                    Span::styled("generate", Style::default().fg(MIYABI_CYAN)),
                    Span::styled(" • ", Style::default().fg(MIYABI_DIM)),
                    Span::styled("review", Style::default().fg(MIYABI_CYAN)),
                    Span::styled(" • ", Style::default().fg(MIYABI_DIM)),
                    Span::styled("swot", Style::default().fg(MIYABI_CYAN)),
                    Span::styled(format!("{:>16}│", ""), Style::default().fg(MIYABI_GREEN)),
                ]),
                Line::from(vec![
                    Span::styled("╰─", Style::default().fg(MIYABI_GREEN)),
                    Span::styled(
                        "─────────────────────────────────────────────────────────────────────",
                        Style::default().fg(MIYABI_GREEN),
                    ),
                    Span::styled("─╯", Style::default().fg(MIYABI_GREEN)),
                ]),
            ]
        } else {
            vec![
                Line::from(vec![
                    Span::styled("╭─", Style::default().fg(MIYABI_GREEN)),
                    Span::styled(
                        "─────────────────────────────────────────────────────────────────────",
                        Style::default().fg(MIYABI_GREEN),
                    ),
                    Span::styled("─╮", Style::default().fg(MIYABI_GREEN)),
                ]),
                Line::from(vec![
                    Span::styled("│ ", Style::default().fg(MIYABI_GREEN)),
                    Span::styled(
                        "❯ ",
                        Style::default()
                            .fg(MIYABI_GREEN)
                            .add_modifier(Modifier::BOLD),
                    ),
                    Span::styled(
                        format!("{:<66}", &self.input),
                        Style::default().fg(MIYABI_FG),
                    ),
                    Span::styled("│", Style::default().fg(MIYABI_GREEN)),
                ]),
                Line::from(vec![
                    Span::styled("│ ", Style::default().fg(MIYABI_GREEN)),
                    Span::styled(
                        format!("  {:>66}", "⏎ Enter to send"),
                        Style::default().fg(MIYABI_DIM),
                    ),
                    Span::styled("│", Style::default().fg(MIYABI_GREEN)),
                ]),
                Line::from(vec![
                    Span::styled("╰─", Style::default().fg(MIYABI_GREEN)),
                    Span::styled(
                        "─────────────────────────────────────────────────────────────────────",
                        Style::default().fg(MIYABI_GREEN),
                    ),
                    Span::styled("─╯", Style::default().fg(MIYABI_GREEN)),
                ]),
            ]
        };

        let input_para = Paragraph::new(input_content);
        f.render_widget(input_para, chunks[2]);

        // ═══════════════════════════════════════════════════════════════════
        // Premium Status Bar with rich information
        // ═══════════════════════════════════════════════════════════════════
        let api_status = if self.client.is_some() { "✓" } else { "✗" };
        let api_color = if self.client.is_some() {
            MIYABI_GREEN
        } else {
            MIYABI_RED
        };

        let status_content = vec![Line::from(vec![
            Span::styled(
                " ◆ ",
                Style::default()
                    .fg(MIYABI_PURPLE)
                    .add_modifier(Modifier::BOLD),
            ),
            Span::styled(
                "MIYABI TUI ",
                Style::default().fg(MIYABI_FG).add_modifier(Modifier::BOLD),
            ),
            Span::styled("v2.0", Style::default().fg(MIYABI_DIM)),
            Span::styled(" │ ", Style::default().fg(MIYABI_DIM)),
            Span::styled("API ", Style::default().fg(MIYABI_DIM)),
            Span::styled(api_status, Style::default().fg(api_color)),
            Span::styled(" │ ", Style::default().fg(MIYABI_DIM)),
            Span::styled("Scroll ", Style::default().fg(MIYABI_DIM)),
            Span::styled("↑↓ PgUp/PgDn", Style::default().fg(MIYABI_CYAN)),
            Span::styled(" │ ", Style::default().fg(MIYABI_DIM)),
            Span::styled("Quit ", Style::default().fg(MIYABI_DIM)),
            Span::styled("Ctrl+C", Style::default().fg(MIYABI_CYAN)),
            Span::styled(" │ ", Style::default().fg(MIYABI_DIM)),
            Span::styled(
                format!("Messages: {}", self.messages.len()),
                Style::default().fg(MIYABI_DIM),
            ),
        ])];

        let status_para = Paragraph::new(status_content);
        f.render_widget(status_para, chunks[3]);
    }
}
