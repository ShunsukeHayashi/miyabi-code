//! Worktree Monitor - Real-time TUI for Worktree Status Display
//!
//! This module provides a rich terminal UI for monitoring Git worktrees,
//! displaying their status, disk usage, and associated Agent execution states.

use anyhow::Result;
use chrono::Utc;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEvent},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use miyabi_worktree::{WorktreeState, WorktreeStateManager, WorktreeStatusDetailed};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, Paragraph, Gauge},
    Frame, Terminal,
};
use std::{
    io::{self, Stdout},
    path::PathBuf,
    time::{Duration, Instant},
};

/// Worktree Monitor Application
pub struct WorktreeMonitorApp {
    /// State manager for worktree operations
    state_manager: WorktreeStateManager,
    /// Current list of worktrees
    worktrees: Vec<WorktreeState>,
    /// Currently selected worktree index
    selected_index: usize,
    /// Flag to quit the application
    should_quit: bool,
    /// Last refresh time
    last_refresh: Instant,
    /// Auto-refresh interval (500ms)
    refresh_interval: Duration,
}

impl WorktreeMonitorApp {
    /// Create a new WorktreeMonitorApp
    pub fn new(project_root: PathBuf) -> Result<Self> {
        let state_manager = WorktreeStateManager::new(project_root)?;
        let worktrees = state_manager.scan_worktrees()?;

        Ok(Self {
            state_manager,
            worktrees,
            selected_index: 0,
            should_quit: false,
            last_refresh: Instant::now(),
            refresh_interval: Duration::from_millis(500),
        })
    }

    /// Run the TUI application
    pub async fn run(&mut self) -> Result<()> {
        // Setup terminal
        enable_raw_mode()?;
        let mut stdout = io::stdout();
        execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
        let backend = CrosstermBackend::new(stdout);
        let mut terminal = Terminal::new(backend)?;

        // Main loop
        let result = self.run_loop(&mut terminal).await;

        // Cleanup terminal
        disable_raw_mode()?;
        execute!(
            terminal.backend_mut(),
            LeaveAlternateScreen,
            DisableMouseCapture
        )?;
        terminal.show_cursor()?;

        result
    }

    /// Main event loop
    async fn run_loop(&mut self, terminal: &mut Terminal<CrosstermBackend<Stdout>>) -> Result<()> {
        loop {
            // Draw UI
            terminal.draw(|f| self.draw(f))?;

            // Handle events with timeout
            if event::poll(Duration::from_millis(100))? {
                if let Event::Key(key) = event::read()? {
                    self.handle_key_event(key)?;
                }
            }

            // Auto-refresh
            if self.last_refresh.elapsed() >= self.refresh_interval {
                self.refresh()?;
            }

            if self.should_quit {
                break;
            }
        }

        Ok(())
    }

    /// Refresh worktree list
    fn refresh(&mut self) -> Result<()> {
        self.worktrees = self.state_manager.scan_worktrees()?;
        self.last_refresh = Instant::now();
        Ok(())
    }

    /// Handle keyboard events
    fn handle_key_event(&mut self, key: KeyEvent) -> Result<()> {
        match key.code {
            KeyCode::Char('q') | KeyCode::Esc => {
                self.should_quit = true;
            }
            KeyCode::Char('r') => {
                self.refresh()?;
            }
            KeyCode::Up | KeyCode::Char('k') => {
                if self.selected_index > 0 {
                    self.selected_index -= 1;
                }
            }
            KeyCode::Down | KeyCode::Char('j') => {
                if self.selected_index < self.worktrees.len().saturating_sub(1) {
                    self.selected_index += 1;
                }
            }
            KeyCode::Home => {
                self.selected_index = 0;
            }
            KeyCode::End => {
                self.selected_index = self.worktrees.len().saturating_sub(1);
            }
            _ => {}
        }

        Ok(())
    }

    /// Draw the UI
    fn draw(&self, frame: &mut Frame) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3), // Header
                Constraint::Min(10),   // Worktree List
                Constraint::Length(5), // Summary
                Constraint::Length(3), // Footer
            ])
            .split(frame.area());

        // Header
        self.draw_header(frame, chunks[0]);

        // Worktree List
        self.draw_worktree_list(frame, chunks[1]);

        // Summary
        self.draw_summary(frame, chunks[2]);

        // Footer
        self.draw_footer(frame, chunks[3]);
    }

    /// Draw header section
    fn draw_header(&self, frame: &mut Frame, area: Rect) {
        let now = Utc::now();
        let status = if self.worktrees.is_empty() {
            "No Worktrees"
        } else {
            "OK"
        };

        let header_text = vec![Line::from(vec![
            Span::styled(
                "🌸 Miyabi Worktree Monitor",
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            ),
            Span::raw("    "),
            Span::styled(
                format!("[Status: {}]", status),
                Style::default().fg(if status == "OK" {
                    Color::Green
                } else {
                    Color::Yellow
                }),
            ),
            Span::raw("    "),
            Span::styled(
                format!("[{}]", now.format("%Y-%m-%d %H:%M:%S")),
                Style::default().fg(Color::DarkGray),
            ),
        ])];

        let header = Paragraph::new(header_text).block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(Style::default().fg(Color::Cyan)),
        );

        frame.render_widget(header, area);
    }

    /// Draw worktree list section
    fn draw_worktree_list(&self, frame: &mut Frame, area: Rect) {
        if self.worktrees.is_empty() {
            let empty_msg = Paragraph::new("No worktrees found\n\nWorktrees will appear here when created.")
                .block(
                    Block::default()
                        .borders(Borders::ALL)
                        .title("Worktree List (0)"),
                )
                .style(Style::default().fg(Color::DarkGray));
            frame.render_widget(empty_msg, area);
            return;
        }

        let items: Vec<ListItem> = self
            .worktrees
            .iter()
            .enumerate()
            .map(|(i, wt)| self.format_worktree_item(wt, i == self.selected_index))
            .collect();

        let list = List::new(items)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(format!("Worktree List ({} worktrees)", self.worktrees.len())),
            )
            .highlight_style(
                Style::default()
                    .fg(Color::Black)
                    .bg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            );

        frame.render_widget(list, area);
    }

    /// Format a single worktree list item
    fn format_worktree_item(&self, wt: &WorktreeState, is_selected: bool) -> ListItem {
        let (status_icon, status_color) = match wt.status {
            WorktreeStatusDetailed::Active => ("✅", Color::Green),
            WorktreeStatusDetailed::Idle => ("⏸️ ", Color::Yellow),
            WorktreeStatusDetailed::Stuck => ("⚠️ ", Color::Red),
            WorktreeStatusDetailed::Orphaned => ("🔗", Color::Red),
            WorktreeStatusDetailed::Corrupted => ("❌", Color::Red),
        };

        let disk_mb = wt.disk_usage / 1024 / 1024;
        let age = Utc::now().signed_duration_since(wt.last_accessed);
        let age_str = if age.num_days() > 0 {
            format!("{}d ago", age.num_days())
        } else if age.num_hours() > 0 {
            format!("{}h ago", age.num_hours())
        } else {
            format!("{}m ago", age.num_minutes())
        };

        let issue_str = if let Some(issue) = wt.issue_number {
            format!("#{}", issue)
        } else {
            "N/A".to_string()
        };

        let path_display = wt
            .path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("?");

        let line = Line::from(vec![
            Span::styled(status_icon, Style::default().fg(status_color)),
            Span::raw(" "),
            Span::styled(
                format!("{:30}", path_display),
                Style::default().add_modifier(if is_selected {
                    Modifier::BOLD
                } else {
                    Modifier::empty()
                }),
            ),
            Span::raw(" "),
            Span::styled(
                format!("[{}]", issue_str),
                Style::default().fg(Color::Cyan),
            ),
            Span::raw(" "),
            Span::styled(format!("{:?}", wt.status), Style::default().fg(status_color)),
            Span::raw(" "),
            Span::styled(format!("({} MB)", disk_mb), Style::default().fg(Color::Blue)),
            Span::raw(" "),
            Span::styled(age_str, Style::default().fg(Color::DarkGray)),
        ]);

        ListItem::new(line)
    }

    /// Draw summary section
    fn draw_summary(&self, frame: &mut Frame, area: Rect) {
        let active_count = self
            .worktrees
            .iter()
            .filter(|w| w.status == WorktreeStatusDetailed::Active)
            .count();
        let idle_count = self
            .worktrees
            .iter()
            .filter(|w| w.status == WorktreeStatusDetailed::Idle)
            .count();
        let stuck_count = self
            .worktrees
            .iter()
            .filter(|w| w.status == WorktreeStatusDetailed::Stuck)
            .count();
        let orphaned_count = self
            .worktrees
            .iter()
            .filter(|w| w.status == WorktreeStatusDetailed::Orphaned)
            .count();

        let total_disk_mb: u64 = self.worktrees.iter().map(|w| w.disk_usage).sum::<u64>() / 1024 / 1024;

        let summary_text = vec![
            Line::from(vec![
                Span::styled("Total: ", Style::default().add_modifier(Modifier::BOLD)),
                Span::raw(format!("{} worktrees, {} MB", self.worktrees.len(), total_disk_mb)),
            ]),
            Line::from(vec![
                Span::styled("✅ Active: ", Style::default().fg(Color::Green)),
                Span::raw(format!("{}", active_count)),
                Span::raw("    "),
                Span::styled("⏸️  Idle: ", Style::default().fg(Color::Yellow)),
                Span::raw(format!("{}", idle_count)),
                Span::raw("    "),
                Span::styled("⚠️  Stuck: ", Style::default().fg(Color::Red)),
                Span::raw(format!("{}", stuck_count)),
                Span::raw("    "),
                Span::styled("🔗 Orphaned: ", Style::default().fg(Color::Red)),
                Span::raw(format!("{}", orphaned_count)),
            ]),
        ];

        let summary = Paragraph::new(summary_text).block(
            Block::default()
                .borders(Borders::ALL)
                .title("Summary"),
        );

        frame.render_widget(summary, area);
    }

    /// Draw footer section
    fn draw_footer(&self, frame: &mut Frame, area: Rect) {
        let footer_text = Line::from(vec![
            Span::styled("[q]", Style::default().fg(Color::Yellow)),
            Span::raw(" Quit    "),
            Span::styled("[r]", Style::default().fg(Color::Yellow)),
            Span::raw(" Refresh    "),
            Span::styled("[↑↓]", Style::default().fg(Color::Yellow)),
            Span::raw(" Navigate    "),
            Span::styled("[Home/End]", Style::default().fg(Color::Yellow)),
            Span::raw(" Jump"),
        ]);

        let footer = Paragraph::new(footer_text).block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(Style::default().fg(Color::DarkGray)),
        );

        frame.render_widget(footer, area);
    }
}

/// Run the Worktree Monitor TUI
pub async fn run_worktree_monitor(project_root: PathBuf) -> Result<()> {
    let mut app = WorktreeMonitorApp::new(project_root)?;
    app.run().await
}
