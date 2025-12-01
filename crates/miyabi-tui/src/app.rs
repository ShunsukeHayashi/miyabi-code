//! Application state and main loop

use crate::event::{Event, EventHandler};
use crate::ui;
use crate::views::{A2ABridgeView, AgentDashboard, ChatView, MonitorView};
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use ratatui::prelude::*;
use std::time::Duration;

/// Active tab in the TUI
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Tab {
    Dashboard,
    A2ABridge,
    Chat,
    Monitor,
}

impl Tab {
    pub fn title(&self) -> &'static str {
        match self {
            Tab::Dashboard => "Dashboard",
            Tab::A2ABridge => "A2A Bridge",
            Tab::Chat => "LLM Chat",
            Tab::Monitor => "Monitor",
        }
    }

    pub fn all() -> &'static [Tab] {
        &[Tab::Dashboard, Tab::A2ABridge, Tab::Chat, Tab::Monitor]
    }

    pub fn next(&self) -> Tab {
        match self {
            Tab::Dashboard => Tab::A2ABridge,
            Tab::A2ABridge => Tab::Chat,
            Tab::Chat => Tab::Monitor,
            Tab::Monitor => Tab::Dashboard,
        }
    }

    pub fn prev(&self) -> Tab {
        match self {
            Tab::Dashboard => Tab::Monitor,
            Tab::A2ABridge => Tab::Dashboard,
            Tab::Chat => Tab::A2ABridge,
            Tab::Monitor => Tab::Chat,
        }
    }
}

/// Main application state
pub struct App {
    /// Current active tab
    pub active_tab: Tab,
    /// Should quit the application
    pub should_quit: bool,
    /// Dashboard view state
    pub dashboard: AgentDashboard,
    /// A2A Bridge view state
    pub a2a_bridge: A2ABridgeView,
    /// Chat view state
    pub chat: ChatView,
    /// Monitor view state
    pub monitor: MonitorView,
    /// Status message
    pub status: String,
}

impl Default for App {
    fn default() -> Self {
        Self::new()
    }
}

impl App {
    pub fn new() -> Self {
        Self {
            active_tab: Tab::Dashboard,
            should_quit: false,
            dashboard: AgentDashboard::new(),
            a2a_bridge: A2ABridgeView::new(),
            chat: ChatView::new(),
            monitor: MonitorView::new(),
            status: "Welcome to Miyabi TUI! Press ? for help.".to_string(),
        }
    }

    /// Main application loop
    pub async fn run<B: Backend>(&mut self, terminal: &mut Terminal<B>) -> Result<(), Box<dyn std::error::Error>> {
        let mut event_handler = EventHandler::new(Duration::from_millis(100));

        loop {
            // Draw UI
            terminal.draw(|f| ui::draw(f, self))?;

            // Handle events
            match event_handler.next().await? {
                Event::Tick => {
                    self.on_tick().await;
                }
                Event::Key(key) => {
                    self.on_key(key).await;
                }
                Event::Mouse(_) => {}
                Event::Resize(_, _) => {}
            }

            if self.should_quit {
                break;
            }
        }

        Ok(())
    }

    /// Handle tick event (update state)
    async fn on_tick(&mut self) {
        self.monitor.update();
        self.dashboard.update();
    }

    /// Handle key event
    async fn on_key(&mut self, key: KeyEvent) {
        // Global keys
        match key.code {
            KeyCode::Char('q') if key.modifiers.contains(KeyModifiers::CONTROL) => {
                self.should_quit = true;
                return;
            }
            KeyCode::Char('c') if key.modifiers.contains(KeyModifiers::CONTROL) => {
                self.should_quit = true;
                return;
            }
            KeyCode::Tab => {
                self.active_tab = self.active_tab.next();
                return;
            }
            KeyCode::BackTab => {
                self.active_tab = self.active_tab.prev();
                return;
            }
            KeyCode::Char('1') => {
                self.active_tab = Tab::Dashboard;
                return;
            }
            KeyCode::Char('2') => {
                self.active_tab = Tab::A2ABridge;
                return;
            }
            KeyCode::Char('3') => {
                self.active_tab = Tab::Chat;
                return;
            }
            KeyCode::Char('4') => {
                self.active_tab = Tab::Monitor;
                return;
            }
            _ => {}
        }

        // Tab-specific keys
        match self.active_tab {
            Tab::Dashboard => self.dashboard.on_key(key),
            Tab::A2ABridge => {
                // on_key returns true if we should execute tool
                if self.a2a_bridge.on_key(key) {
                    self.a2a_bridge.execute_tool().await;
                }
            }
            Tab::Chat => {
                // on_key returns true if we should send message
                if self.chat.on_key(key) {
                    self.chat.send_message().await;
                }
            }
            Tab::Monitor => self.monitor.on_key(key),
        }
    }
}
