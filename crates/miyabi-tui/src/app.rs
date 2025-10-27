use anyhow::Result;
use crossterm::{
    event::{self, Event, KeyCode, KeyEvent, KeyModifiers},
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
    ExecutableCommand,
};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Constraint, Direction, Layout},
    style::{Color, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, Paragraph},
    Frame, Terminal,
};
use std::io::stdout;
use std::sync::Arc;
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tracing::{debug, info};

// LLM Integration
use futures::{stream::BoxStream, StreamExt};
use miyabi_llm::{AnthropicClient, LlmError, Message as LlmMessage, OpenAIClient, Role as LlmRole};

/// LLM Provider wrapper for both OpenAI and Anthropic
enum LlmProvider {
    OpenAI(Arc<OpenAIClient>),
    Anthropic(Arc<AnthropicClient>),
}

impl LlmProvider {
    /// Initialize from environment variables
    /// Priority: OPENAI_API_KEY > ANTHROPIC_API_KEY
    fn from_env() -> Option<Self> {
        // Try OpenAI first
        if let Ok(client) = OpenAIClient::from_env() {
            info!("Initialized OpenAI client (gpt-4o)");
            return Some(LlmProvider::OpenAI(Arc::new(client)));
        }

        // Fallback to Anthropic
        if let Ok(client) = AnthropicClient::from_env() {
            info!("Initialized Anthropic client (claude-3-5-sonnet-20241022)");
            return Some(LlmProvider::Anthropic(Arc::new(client)));
        }

        None
    }

    /// Get streaming chat completion
    async fn chat_stream(
        &self,
        messages: Vec<LlmMessage>,
    ) -> Result<BoxStream<'static, Result<String, LlmError>>, LlmError> {
        match self {
            LlmProvider::OpenAI(client) => {
                let stream = client.chat_stream(messages).await?;
                Ok(Box::pin(stream))
            }
            LlmProvider::Anthropic(client) => {
                let stream = client.chat_stream(messages).await?;
                Ok(Box::pin(stream))
            }
        }
    }

    /// Get provider name for display
    fn name(&self) -> &str {
        match self {
            LlmProvider::OpenAI(_) => "OpenAI (GPT-4o)",
            LlmProvider::Anthropic(_) => "Anthropic (Claude 3.5 Sonnet)",
        }
    }
}

/// Main TUI application
pub struct App {
    /// Message history
    messages: Vec<Message>,

    /// Current input buffer
    input: String,

    /// Cursor position in input
    cursor_position: usize,

    /// Scroll offset for message list
    #[allow(dead_code)]
    scroll_offset: u16,

    /// Application state
    state: AppState,

    /// Should quit flag
    should_quit: bool,

    /// Event sender
    event_tx: UnboundedSender<AppEvent>,

    /// Event receiver
    event_rx: UnboundedReceiver<AppEvent>,

    /// LLM provider (OpenAI or Anthropic)
    llm_provider: Option<LlmProvider>,
}

/// Application state
#[derive(Debug, Clone, PartialEq)]
pub enum AppState {
    /// Idle, waiting for input
    Idle,
    /// Processing user message
    Processing,
    /// Streaming assistant response
    Streaming,
    /// Waiting for user approval
    WaitingForApproval,
    /// Executing tool
    ExecutingTool,
}

/// Message in conversation history
#[derive(Debug, Clone)]
pub struct Message {
    /// Message role
    pub role: MessageRole,
    /// Message content
    pub content: String,
    /// Timestamp
    pub timestamp: std::time::SystemTime,
}

/// Message role
#[derive(Debug, Clone, PartialEq)]
pub enum MessageRole {
    /// User message
    User,
    /// Assistant message
    Assistant,
    /// System message
    System,
    /// Tool call
    ToolCall,
    /// Tool result
    ToolResult,
}

/// Application events
#[derive(Debug, Clone)]
pub enum AppEvent {
    /// Quit application
    Quit,
    /// Submit current input
    Submit,
    /// Assistant response chunk
    AssistantChunk(String),
    /// Assistant response complete
    AssistantComplete(String),
    /// State change
    StateChange(AppState),
    /// Error occurred
    Error(String),
    /// Tool execution started
    ToolStart(String),
    /// Tool execution completed
    ToolComplete(String),
}

impl App {
    /// Create new TUI application
    pub fn new() -> Self {
        let (event_tx, event_rx) = unbounded_channel();

        // Try to initialize LLM provider (OpenAI or Anthropic)
        let llm_provider = LlmProvider::from_env();

        if let Some(ref provider) = llm_provider {
            info!("LLM provider initialized: {}", provider.name());
        } else {
            info!("No LLM provider available. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
        }

        Self {
            messages: vec![Message {
                role: MessageRole::System,
                content: "Welcome to Miyabi TUI! Type a message and press Enter.".to_string(),
                timestamp: std::time::SystemTime::now(),
            }],
            input: String::new(),
            cursor_position: 0,
            scroll_offset: 0,
            state: AppState::Idle,
            should_quit: false,
            event_tx,
            event_rx,
            llm_provider,
        }
    }

    /// Run the TUI application
    pub async fn run(&mut self) -> Result<()> {
        info!("Starting Miyabi TUI");

        // Initialize terminal
        enable_raw_mode()?;
        stdout().execute(EnterAlternateScreen)?;

        let backend = CrosstermBackend::new(stdout());
        let mut terminal = Terminal::new(backend)?;
        terminal.clear()?;

        // Main event loop
        while !self.should_quit {
            // Render frame
            terminal.draw(|frame| self.render(frame))?;

            // Use tokio::select! to handle both terminal and app events
            tokio::select! {
                // Terminal events (keyboard input)
                result = Self::poll_terminal_event() => {
                    if let Some(event) = result? {
                        self.handle_key_event(event).await?;
                    }
                }
                // App events (LLM responses, state changes)
                Some(app_event) = self.event_rx.recv() => {
                    self.handle_app_event(app_event).await?;
                }
            }
        }

        // Cleanup
        disable_raw_mode()?;
        stdout().execute(LeaveAlternateScreen)?;

        info!("Miyabi TUI shutdown complete");
        Ok(())
    }

    /// Render the TUI
    fn render(&self, frame: &mut Frame) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3), // Header
                Constraint::Min(0),    // Messages
                Constraint::Length(3), // Input
            ])
            .split(frame.area());

        // Header
        let header = Paragraph::new("Miyabi TUI - Codex Architecture")
            .block(Block::default().borders(Borders::ALL))
            .style(Style::default().fg(Color::Cyan));
        frame.render_widget(header, chunks[0]);

        // Messages
        let items: Vec<ListItem> = self
            .messages
            .iter()
            .map(|msg| {
                let (prefix, color) = match msg.role {
                    MessageRole::User => ("You: ", Color::Green),
                    MessageRole::Assistant => ("Miyabi: ", Color::Blue),
                    MessageRole::System => ("System: ", Color::Yellow),
                    MessageRole::ToolCall => ("Tool: ", Color::Magenta),
                    MessageRole::ToolResult => ("Result: ", Color::Cyan),
                };

                let line = Line::from(vec![
                    Span::styled(prefix, Style::default().fg(color)),
                    Span::raw(&msg.content),
                ]);

                ListItem::new(line)
            })
            .collect();

        let list = List::new(items).block(
            Block::default()
                .borders(Borders::ALL)
                .title(format!("Messages ({})", self.state_string())),
        );
        frame.render_widget(list, chunks[1]);

        // Input
        let input = Paragraph::new(self.input.as_str()).block(
            Block::default()
                .borders(Borders::ALL)
                .title("Input (Ctrl+C to quit, Enter to send)"),
        );
        frame.render_widget(input, chunks[2]);

        // Cursor
        frame.set_cursor_position((
            chunks[2].x + self.cursor_position as u16 + 1,
            chunks[2].y + 1,
        ));
    }

    /// Get state string for display
    fn state_string(&self) -> String {
        match self.state {
            AppState::Idle => "Idle",
            AppState::Processing => "Processing...",
            AppState::Streaming => "Streaming...",
            AppState::WaitingForApproval => "Waiting for approval",
            AppState::ExecutingTool => "Executing tool...",
        }
        .to_string()
    }

    /// Poll for terminal events (non-blocking)
    async fn poll_terminal_event() -> Result<Option<KeyEvent>> {
        if event::poll(std::time::Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                return Ok(Some(key));
            }
        }
        Ok(None)
    }

    /// Handle keyboard events
    async fn handle_key_event(&mut self, key: KeyEvent) -> Result<()> {
        // Ctrl+C to quit
        if key.code == KeyCode::Char('c') && key.modifiers.contains(KeyModifiers::CONTROL) {
            debug!("Quit requested");
            self.should_quit = true;
            return Ok(());
        }

        match key.code {
            KeyCode::Enter => {
                debug!("Submit requested");
                self.submit_message();
            }
            KeyCode::Char(c) => {
                self.input.insert(self.cursor_position, c);
                self.cursor_position += 1;
            }
            KeyCode::Backspace => {
                if self.cursor_position > 0 {
                    self.input.remove(self.cursor_position - 1);
                    self.cursor_position -= 1;
                }
            }
            KeyCode::Left => {
                if self.cursor_position > 0 {
                    self.cursor_position -= 1;
                }
            }
            KeyCode::Right => {
                if self.cursor_position < self.input.len() {
                    self.cursor_position += 1;
                }
            }
            KeyCode::Home => {
                self.cursor_position = 0;
            }
            KeyCode::End => {
                self.cursor_position = self.input.len();
            }
            _ => {}
        }

        Ok(())
    }

    /// Submit current input as message
    fn submit_message(&mut self) {
        if self.input.is_empty() {
            return;
        }

        debug!("Submitting message: {}", self.input);

        // Add user message
        let user_msg = Message {
            role: MessageRole::User,
            content: self.input.clone(),
            timestamp: std::time::SystemTime::now(),
        };
        self.messages.push(user_msg.clone());

        // Clear input
        let input_text = std::mem::take(&mut self.input);
        self.cursor_position = 0;

        debug!("Message submitted: {}", input_text);

        // Send to LLM (async background task)
        if let Some(ref provider) = self.llm_provider {
            self.send_to_llm(provider, input_text);
        } else {
            // No LLM provider available - show error
            let _ = self.event_tx.send(AppEvent::Error(
                "LLM provider not initialized. Set OPENAI_API_KEY or ANTHROPIC_API_KEY."
                    .to_string(),
            ));
        }
    }

    /// Send message to LLM and stream responses
    fn send_to_llm(&self, provider: &LlmProvider, _user_input: String) {
        let event_tx = self.event_tx.clone();
        let messages = self.messages.clone();
        let provider = match provider {
            LlmProvider::OpenAI(client) => LlmProvider::OpenAI(Arc::clone(client)),
            LlmProvider::Anthropic(client) => LlmProvider::Anthropic(Arc::clone(client)),
        };

        // Spawn background task for LLM API call
        tokio::spawn(async move {
            // Change state to Streaming
            let _ = event_tx.send(AppEvent::StateChange(AppState::Streaming));

            // Convert messages to LLM format
            let llm_messages: Vec<LlmMessage> = messages
                .iter()
                .filter(|m| m.role == MessageRole::User || m.role == MessageRole::Assistant)
                .map(|m| LlmMessage {
                    role: match m.role {
                        MessageRole::User => LlmRole::User,
                        MessageRole::Assistant => LlmRole::Assistant,
                        _ => LlmRole::User, // Fallback
                    },
                    content: m.content.clone(),
                })
                .collect();

            // Call LLM with streaming
            match provider.chat_stream(llm_messages).await {
                Ok(mut stream) => {
                    // Stream chunks as they arrive
                    while let Some(chunk_result) = stream.next().await {
                        match chunk_result {
                            Ok(text) => {
                                let _ = event_tx.send(AppEvent::AssistantChunk(text));
                            }
                            Err(e) => {
                                let _ =
                                    event_tx.send(AppEvent::Error(format!("Stream error: {}", e)));
                                break;
                            }
                        }
                    }

                    // Stream complete, return to idle
                    let _ = event_tx.send(AppEvent::StateChange(AppState::Idle));
                }
                Err(e) => {
                    let _ = event_tx.send(AppEvent::Error(format!("Stream start failed: {}", e)));
                }
            }
        });
    }

    /// Handle application events
    async fn handle_app_event(&mut self, event: AppEvent) -> Result<()> {
        match event {
            AppEvent::Quit => {
                debug!("Quit event received");
                self.should_quit = true;
            }
            AppEvent::Submit => {
                self.submit_message();
            }
            AppEvent::AssistantChunk(chunk) => {
                debug!("Assistant chunk: {}", chunk);
                self.state = AppState::Streaming;
                // Append to last assistant message or create new one
                if let Some(last) = self.messages.last_mut() {
                    if last.role == MessageRole::Assistant {
                        last.content.push_str(&chunk);
                        return Ok(());
                    }
                }
                // Create new assistant message
                self.messages.push(Message {
                    role: MessageRole::Assistant,
                    content: chunk,
                    timestamp: std::time::SystemTime::now(),
                });
            }
            AppEvent::ToolStart(tool_name) => {
                debug!("Tool start: {}", tool_name);
                self.state = AppState::ExecutingTool;
                self.messages.push(Message {
                    role: MessageRole::ToolCall,
                    content: format!("Executing: {}", tool_name),
                    timestamp: std::time::SystemTime::now(),
                });
            }
            AppEvent::ToolComplete(result) => {
                debug!("Tool complete: {}", result);
                self.state = AppState::Idle;
                self.messages.push(Message {
                    role: MessageRole::ToolResult,
                    content: result,
                    timestamp: std::time::SystemTime::now(),
                });
            }
            AppEvent::AssistantComplete(response) => {
                debug!("Assistant response complete: {} chars", response.len());
                self.state = AppState::Idle;
                self.messages.push(Message {
                    role: MessageRole::Assistant,
                    content: response,
                    timestamp: std::time::SystemTime::now(),
                });
            }
            AppEvent::StateChange(new_state) => {
                debug!("State change: {:?}", new_state);
                self.state = new_state;
            }
            AppEvent::Error(error) => {
                debug!("Error occurred: {}", error);
                self.state = AppState::Idle;
                self.messages.push(Message {
                    role: MessageRole::System,
                    content: format!("Error: {}", error),
                    timestamp: std::time::SystemTime::now(),
                });
            }
        }

        Ok(())
    }

    /// Get event sender
    pub fn event_sender(&self) -> UnboundedSender<AppEvent> {
        self.event_tx.clone()
    }
}

impl Default for App {
    fn default() -> Self {
        Self::new()
    }
}
