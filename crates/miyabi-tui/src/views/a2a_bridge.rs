//! A2A Bridge Interactive View with Agent Tool Execution

use crossterm::event::{KeyCode, KeyEvent};
use miyabi_llm::AnthropicClient;
use miyabi_llm::LlmClient;
use ratatui::{
    prelude::*,
    widgets::{Block, Borders, List, ListItem, ListState, Paragraph, Wrap},
};
use std::time::Instant;

/// Tool execution result
#[derive(Clone)]
pub struct ToolResult {
    pub tool: String,
    pub success: bool,
    pub output: String,
    pub time_ms: u64,
}

/// A2A Tool definition
#[derive(Clone)]
pub struct A2ATool {
    pub name: String,
    pub description: String,
    pub agent_prompt: String,
}

/// A2A Bridge view state
pub struct A2ABridgeView {
    /// Available tools
    pub tools: Vec<A2ATool>,
    /// Selected tool
    pub selected: ListState,
    /// Input buffer
    pub input: String,
    /// Execution history
    pub history: Vec<ToolResult>,
    /// Input mode
    pub input_mode: bool,
    /// Loading state
    pub loading: bool,
    /// LLM Client
    client: Option<AnthropicClient>,
    /// Error message
    pub error: Option<String>,
}

impl Default for A2ABridgeView {
    fn default() -> Self {
        Self::new()
    }
}

impl A2ABridgeView {
    pub fn new() -> Self {
        // Initialize Claude Sonnet 4.5 client from ANTHROPIC_API_KEY env var
        let client = match std::env::var("ANTHROPIC_API_KEY") {
            Ok(key) if !key.is_empty() => match AnthropicClient::from_env() {
                Ok(c) => Some(
                    c.with_model("claude-sonnet-4-5-20250929".to_string())
                        .with_max_tokens(2048),
                ),
                Err(e) => {
                    tracing::error!("Failed to initialize Anthropic client: {}", e);
                    None
                }
            },
            _ => None,
        };

        let tools = vec![
            A2ATool {
                name: "a2a.coordinator_agent.decompose_issue".to_string(),
                description: "Decompose issue into subtasks".to_string(),
                agent_prompt:
                    r#"You are the CoordinatorAgent. Decompose the given task into subtasks.
Output JSON: {"subtasks": [{"id": 1, "title": "...", "priority": "high|medium|low"}]}"#
                        .to_string(),
            },
            A2ATool {
                name: "a2a.code_generation_agent.generate_code".to_string(),
                description: "Generate code implementation".to_string(),
                agent_prompt: r#"You are the CodeGenAgent. Generate Rust code for the given task.
Output the code with explanation."#
                    .to_string(),
            },
            A2ATool {
                name: "a2a.code_review_agent.review_code".to_string(),
                description: "Review code for issues".to_string(),
                agent_prompt: r#"You are the ReviewAgent. Review the given code.
Output JSON: {"issues": [{"severity": "error|warning|info", "message": "..."}], "score": 0-100}"#
                    .to_string(),
            },
            A2ATool {
                name: "a2a.issue_analysis_agent.analyze_issue".to_string(),
                description: "Analyze GitHub issue".to_string(),
                agent_prompt: r#"You are the IssueAgent. Analyze the issue and suggest labels.
Output JSON: {"labels": ["label1", "label2"], "priority": "P0|P1|P2", "effort": "S|M|L"}"#
                    .to_string(),
            },
            A2ATool {
                name: "a2a.self_analysis_agent.analyze_self".to_string(),
                description: "Personal SWOT analysis".to_string(),
                agent_prompt: r#"You are the SelfAnalysisAgent. Perform SWOT analysis.
Output JSON: {"strengths": [...], "weaknesses": [...], "opportunities": [...], "threats": [...]}"#
                    .to_string(),
            },
            A2ATool {
                name: "a2a.market_research_agent.research_market".to_string(),
                description: "Market research analysis".to_string(),
                agent_prompt:
                    r#"You are the MarketResearchAgent. Analyze market for the given product.
Output JSON: {"tam": "...", "sam": "...", "competitors": [...], "trends": [...]}"#
                        .to_string(),
            },
        ];

        let mut selected = ListState::default();
        selected.select(Some(0));

        Self {
            tools,
            selected,
            input: String::new(),
            history: vec![],
            input_mode: false,
            loading: false,
            client,
            error: None,
        }
    }

    /// Execute the selected tool with input
    pub async fn execute_tool(&mut self) {
        if self.input.is_empty() || self.loading {
            return;
        }

        let Some(idx) = self.selected.selected() else {
            return;
        };

        let Some(tool) = self.tools.get(idx).cloned() else {
            return;
        };

        self.loading = true;
        self.error = None;

        let Some(client) = &self.client else {
            self.error = Some("LLM client not initialized. Check ANTHROPIC_API_KEY.".to_string());
            self.loading = false;
            return;
        };

        let start = Instant::now();

        // Build prompt for agent
        let system_prompt = tool.agent_prompt.clone();
        let user_input = self.input.clone();

        let messages = vec![miyabi_llm::Message {
            role: miyabi_llm::Role::User,
            content: format!("{}\n\nTask: {}", system_prompt, user_input),
        }];

        // Execute agent via LLM
        match client.chat(messages).await {
            Ok(response) => {
                let elapsed = start.elapsed().as_millis() as u64;
                self.history.push(ToolResult {
                    tool: tool.name.clone(),
                    success: true,
                    output: response,
                    time_ms: elapsed,
                });
            }
            Err(e) => {
                let elapsed = start.elapsed().as_millis() as u64;
                self.error = Some(format!("API Error: {}", e));
                self.history.push(ToolResult {
                    tool: tool.name.clone(),
                    success: false,
                    output: format!("Error: {}", e),
                    time_ms: elapsed,
                });
            }
        }

        self.input.clear();
        self.input_mode = false;
        self.loading = false;
    }

    pub fn on_key(&mut self, key: KeyEvent) -> bool {
        if self.input_mode {
            match key.code {
                KeyCode::Enter => {
                    if !self.input.is_empty() && !self.loading {
                        return true; // Signal to call execute_tool
                    }
                    false
                }
                KeyCode::Esc => {
                    self.input_mode = false;
                    self.input.clear();
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
                _ => false,
            }
        } else {
            match key.code {
                KeyCode::Up | KeyCode::Char('k') => {
                    let i = match self.selected.selected() {
                        Some(i) => i.saturating_sub(1),
                        None => 0,
                    };
                    self.selected.select(Some(i));
                    false
                }
                KeyCode::Down | KeyCode::Char('j') => {
                    let i = match self.selected.selected() {
                        Some(i) => (i + 1).min(self.tools.len() - 1),
                        None => 0,
                    };
                    self.selected.select(Some(i));
                    false
                }
                KeyCode::Enter | KeyCode::Char('e') => {
                    self.input_mode = true;
                    false
                }
                _ => false,
            }
        }
    }

    pub fn draw(&self, f: &mut Frame, area: Rect) {
        let chunks = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(40), Constraint::Percentage(60)])
            .split(area);

        // Tool list
        let items: Vec<ListItem> = self
            .tools
            .iter()
            .map(|tool| {
                ListItem::new(vec![
                    Line::from(Span::styled(
                        tool.name.clone(),
                        Style::default().fg(Color::Cyan),
                    )),
                    Line::from(Span::styled(
                        format!("  {}", tool.description),
                        Style::default().fg(Color::DarkGray),
                    )),
                ])
            })
            .collect();

        let title = if self.client.is_some() {
            " A2A Tools (Claude Sonnet 4.5) "
        } else {
            " A2A Tools (No API Key) "
        };

        let list = List::new(items)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(title)
                    .title_style(Style::default().fg(Color::Yellow)),
            )
            .highlight_style(
                Style::default()
                    .bg(Color::DarkGray)
                    .add_modifier(Modifier::BOLD),
            )
            .highlight_symbol(">> ");

        f.render_stateful_widget(list, chunks[0], &mut self.selected.clone());

        // Right panel
        let right_chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(5), // Input
                Constraint::Min(0),    // Output
            ])
            .split(chunks[1]);

        // Input area
        let input_style = if self.input_mode {
            Style::default().fg(Color::Yellow)
        } else {
            Style::default().fg(Color::Gray)
        };

        let input_title = if self.loading {
            " ⏳ Executing agent... "
        } else if self.input_mode {
            " Input (Enter to execute, Esc to cancel) "
        } else {
            " Input (Press Enter to edit) "
        };

        let input = Paragraph::new(self.input.clone()).style(input_style).block(
            Block::default()
                .borders(Borders::ALL)
                .title(input_title)
                .border_style(if self.input_mode || self.loading {
                    Style::default().fg(Color::Yellow)
                } else {
                    Style::default()
                }),
        );
        f.render_widget(input, right_chunks[0]);

        // Output/History
        let mut history_lines: Vec<Line> = vec![];

        // Show error if any
        if let Some(err) = &self.error {
            history_lines.push(Line::from(Span::styled(
                format!("⚠ {}", err),
                Style::default().fg(Color::Red),
            )));
            history_lines.push(Line::from(""));
        }

        // Show execution history
        for result in self.history.iter().rev().take(5) {
            let status = if result.success { "✓" } else { "✗" };
            let color = if result.success {
                Color::Green
            } else {
                Color::Red
            };

            history_lines.push(Line::from(vec![
                Span::styled(status, Style::default().fg(color)),
                Span::raw(" "),
                Span::styled(&result.tool, Style::default().fg(Color::Cyan)),
                Span::raw(format!(" ({}ms)", result.time_ms)),
            ]));

            // Show first 3 lines of output
            for (i, line) in result.output.lines().take(3).enumerate() {
                let prefix = if i == 0 { "  → " } else { "    " };
                history_lines.push(Line::from(Span::styled(
                    format!("{}{}", prefix, line),
                    Style::default().fg(Color::White),
                )));
            }
            if result.output.lines().count() > 3 {
                history_lines.push(Line::from(Span::styled(
                    "    ...",
                    Style::default().fg(Color::DarkGray),
                )));
            }
            history_lines.push(Line::from(""));
        }

        let output = Paragraph::new(history_lines)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(" Execution History "),
            )
            .wrap(Wrap { trim: true });
        f.render_widget(output, right_chunks[1]);
    }
}
