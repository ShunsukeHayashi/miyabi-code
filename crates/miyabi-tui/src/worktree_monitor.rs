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
    widgets::{Block, Borders, List, ListItem, Paragraph},
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
    fn format_worktree_item(&self, wt: &WorktreeState, is_selected: bool) -> ListItem<'_> {
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    /// Helper to create a test git repository
    fn create_test_repo() -> Result<TempDir> {
        let temp_dir = TempDir::new()?;
        let repo_path = temp_dir.path();

        // Initialize git repository
        std::process::Command::new("git")
            .args(["init"])
            .current_dir(repo_path)
            .output()?;

        // Configure git user
        std::process::Command::new("git")
            .args(["config", "user.name", "Test User"])
            .current_dir(repo_path)
            .output()?;

        std::process::Command::new("git")
            .args(["config", "user.email", "test@example.com"])
            .current_dir(repo_path)
            .output()?;

        // Create .miyabi directory for TaskMetadata
        fs::create_dir_all(repo_path.join(".miyabi/tasks"))?;

        // Create initial commit
        fs::write(repo_path.join("README.md"), "# Test Repository")?;
        std::process::Command::new("git")
            .args(["add", "."])
            .current_dir(repo_path)
            .output()?;

        std::process::Command::new("git")
            .args(["commit", "-m", "Initial commit"])
            .current_dir(repo_path)
            .output()?;

        Ok(temp_dir)
    }

    #[test]
    fn test_worktree_monitor_app_creation() {
        let temp_dir = create_test_repo().expect("Failed to create test repo");
        let repo_path = temp_dir.path().to_path_buf();

        let result = WorktreeMonitorApp::new(repo_path);
        assert!(result.is_ok(), "Should create WorktreeMonitorApp successfully");

        let app = result.unwrap();
        assert_eq!(app.selected_index, 0, "Initial selected index should be 0");
        assert!(!app.should_quit, "Should not be in quit state initially");
        assert_eq!(app.refresh_interval, Duration::from_millis(500), "Refresh interval should be 500ms");
    }

    #[test]
    fn test_worktree_monitor_app_with_no_worktrees() {
        let temp_dir = create_test_repo().expect("Failed to create test repo");
        let repo_path = temp_dir.path().to_path_buf();

        let app = WorktreeMonitorApp::new(repo_path).expect("Failed to create app");
        assert_eq!(app.worktrees.len(), 0, "Should have no worktrees initially");
    }

    #[test]
    fn test_handle_key_event_quit() {
        let temp_dir = create_test_repo().expect("Failed to create test repo");
        let repo_path = temp_dir.path().to_path_buf();

        let mut app = WorktreeMonitorApp::new(repo_path).expect("Failed to create app");
        assert!(!app.should_quit);

        // Test 'q' key
        let key_event = KeyEvent::new(KeyCode::Char('q'), event::KeyModifiers::empty());
        app.handle_key_event(key_event).expect("Failed to handle key event");
        assert!(app.should_quit, "Should quit after pressing 'q'");
    }

    #[test]
    fn test_handle_key_event_esc() {
        let temp_dir = create_test_repo().expect("Failed to create test repo");
        let repo_path = temp_dir.path().to_path_buf();

        let mut app = WorktreeMonitorApp::new(repo_path).expect("Failed to create app");
        assert!(!app.should_quit);

        // Test Esc key
        let key_event = KeyEvent::new(KeyCode::Esc, event::KeyModifiers::empty());
        app.handle_key_event(key_event).expect("Failed to handle key event");
        assert!(app.should_quit, "Should quit after pressing Esc");
    }

    #[test]
    fn test_handle_key_event_navigation() {
        let temp_dir = create_test_repo().expect("Failed to create test repo");
        let repo_path = temp_dir.path().to_path_buf();

        let mut app = WorktreeMonitorApp::new(repo_path).expect("Failed to create app");

        // Add some mock worktrees by manipulating internal state
        // (In real scenario, these would come from WorktreeStateManager)
        app.worktrees = vec![
            WorktreeState {
                path: PathBuf::from("/test/worktree1"),
                branch: "main".to_string(),
                issue_number: Some(123),
                status: WorktreeStatusDetailed::Active,
                last_accessed: Utc::now(),
                is_locked: false,
                has_uncommitted_changes: false,
                disk_usage: 1024 * 1024,
            },
            WorktreeState {
                path: PathBuf::from("/test/worktree2"),
                branch: "feature".to_string(),
                issue_number: Some(124),
                status: WorktreeStatusDetailed::Idle,
                last_accessed: Utc::now(),
                is_locked: false,
                has_uncommitted_changes: false,
                disk_usage: 2048 * 1024,
            },
        ];

        assert_eq!(app.selected_index, 0);

        // Test Down arrow
        let key_event = KeyEvent::new(KeyCode::Down, event::KeyModifiers::empty());
        app.handle_key_event(key_event).expect("Failed to handle key event");
        assert_eq!(app.selected_index, 1, "Should move down to index 1");

        // Test Down arrow at end (should stay at end)
        app.handle_key_event(key_event).expect("Failed to handle key event");
        assert_eq!(app.selected_index, 1, "Should stay at index 1 (end)");

        // Test Up arrow
        let key_event = KeyEvent::new(KeyCode::Up, event::KeyModifiers::empty());
        app.handle_key_event(key_event).expect("Failed to handle key event");
        assert_eq!(app.selected_index, 0, "Should move up to index 0");

        // Test Up arrow at start (should stay at start)
        app.handle_key_event(key_event).expect("Failed to handle key event");
        assert_eq!(app.selected_index, 0, "Should stay at index 0 (start)");
    }

    #[test]
    fn test_handle_key_event_home_end() {
        let temp_dir = create_test_repo().expect("Failed to create test repo");
        let repo_path = temp_dir.path().to_path_buf();

        let mut app = WorktreeMonitorApp::new(repo_path).expect("Failed to create app");

        // Add 5 mock worktrees
        app.worktrees = (0..5)
            .map(|i| WorktreeState {
                path: PathBuf::from(format!("/test/worktree{}", i)),
                branch: format!("branch{}", i),
                issue_number: Some(100 + i),
                status: WorktreeStatusDetailed::Active,
                last_accessed: Utc::now(),
                is_locked: false,
                has_uncommitted_changes: false,
                disk_usage: 1024 * 1024,
            })
            .collect();

        // Test End key
        let key_event = KeyEvent::new(KeyCode::End, event::KeyModifiers::empty());
        app.handle_key_event(key_event).expect("Failed to handle key event");
        assert_eq!(app.selected_index, 4, "Should jump to end (index 4)");

        // Test Home key
        let key_event = KeyEvent::new(KeyCode::Home, event::KeyModifiers::empty());
        app.handle_key_event(key_event).expect("Failed to handle key event");
        assert_eq!(app.selected_index, 0, "Should jump to start (index 0)");
    }

    #[test]
    fn test_handle_key_event_vim_navigation() {
        let temp_dir = create_test_repo().expect("Failed to create test repo");
        let repo_path = temp_dir.path().to_path_buf();

        let mut app = WorktreeMonitorApp::new(repo_path).expect("Failed to create app");

        app.worktrees = vec![
            WorktreeState {
                path: PathBuf::from("/test/worktree1"),
                branch: "main".to_string(),
                issue_number: Some(123),
                status: WorktreeStatusDetailed::Active,
                last_accessed: Utc::now(),
                is_locked: false,
                has_uncommitted_changes: false,
                disk_usage: 1024 * 1024,
            },
            WorktreeState {
                path: PathBuf::from("/test/worktree2"),
                branch: "feature".to_string(),
                issue_number: Some(124),
                status: WorktreeStatusDetailed::Idle,
                last_accessed: Utc::now(),
                is_locked: false,
                has_uncommitted_changes: false,
                disk_usage: 2048 * 1024,
            },
        ];

        assert_eq!(app.selected_index, 0);

        // Test 'j' key (down in vim)
        let key_event = KeyEvent::new(KeyCode::Char('j'), event::KeyModifiers::empty());
        app.handle_key_event(key_event).expect("Failed to handle key event");
        assert_eq!(app.selected_index, 1, "Should move down with 'j'");

        // Test 'k' key (up in vim)
        let key_event = KeyEvent::new(KeyCode::Char('k'), event::KeyModifiers::empty());
        app.handle_key_event(key_event).expect("Failed to handle key event");
        assert_eq!(app.selected_index, 0, "Should move up with 'k'");
    }

    #[test]
    fn test_refresh() {
        let temp_dir = create_test_repo().expect("Failed to create test repo");
        let repo_path = temp_dir.path().to_path_buf();

        let mut app = WorktreeMonitorApp::new(repo_path).expect("Failed to create app");
        let initial_refresh_time = app.last_refresh;

        // Wait a bit to ensure time difference
        std::thread::sleep(Duration::from_millis(10));

        // Refresh
        app.refresh().expect("Failed to refresh");

        assert!(
            app.last_refresh > initial_refresh_time,
            "Refresh time should be updated"
        );
    }

    #[test]
    fn test_format_worktree_item_status_colors() {
        let temp_dir = create_test_repo().expect("Failed to create test repo");
        let repo_path = temp_dir.path().to_path_buf();

        let app = WorktreeMonitorApp::new(repo_path).expect("Failed to create app");

        let statuses = vec![
            WorktreeStatusDetailed::Active,
            WorktreeStatusDetailed::Idle,
            WorktreeStatusDetailed::Stuck,
            WorktreeStatusDetailed::Orphaned,
            WorktreeStatusDetailed::Corrupted,
        ];

        for status in statuses {
            let worktree = WorktreeState {
                path: PathBuf::from("/test/worktree"),
                branch: "main".to_string(),
                issue_number: Some(123),
                status,
                last_accessed: Utc::now(),
                is_locked: false,
                has_uncommitted_changes: false,
                disk_usage: 1024 * 1024,
            };

            // Just verify that formatting doesn't panic
            let item = app.format_worktree_item(&worktree, false);
            assert!(!format!("{:?}", item).is_empty(), "Formatted item should not be empty for {:?}", status);
        }
    }

    #[test]
    fn test_format_worktree_item_disk_usage() {
        let temp_dir = create_test_repo().expect("Failed to create test repo");
        let repo_path = temp_dir.path().to_path_buf();

        let app = WorktreeMonitorApp::new(repo_path).expect("Failed to create app");

        let worktree = WorktreeState {
            path: PathBuf::from("/test/worktree"),
            branch: "main".to_string(),
            issue_number: Some(123),
            status: WorktreeStatusDetailed::Active,
            last_accessed: Utc::now(),
            is_locked: false,
            has_uncommitted_changes: false,
            disk_usage: 10 * 1024 * 1024, // 10 MB
        };

        let item = app.format_worktree_item(&worktree, false);
        let line_text = format!("{:?}", item);

        // Should show "10 MB"
        assert!(line_text.contains("10") || line_text.contains("MB"), "Should display disk usage");
    }

    #[test]
    fn test_format_worktree_item_age_display() {
        let temp_dir = create_test_repo().expect("Failed to create test repo");
        let repo_path = temp_dir.path().to_path_buf();

        let app = WorktreeMonitorApp::new(repo_path).expect("Failed to create app");

        // Test recent access (< 1 hour)
        let worktree = WorktreeState {
            path: PathBuf::from("/test/worktree"),
            branch: "main".to_string(),
            issue_number: Some(123),
            status: WorktreeStatusDetailed::Active,
            last_accessed: Utc::now() - chrono::Duration::minutes(30),
            is_locked: false,
            has_uncommitted_changes: false,
            disk_usage: 1024 * 1024,
        };

        let item = app.format_worktree_item(&worktree, false);
        let line_text = format!("{:?}", item);

        // Should show minutes
        assert!(line_text.contains("m ago") || line_text.contains("30"), "Should display age in minutes");
    }

    #[test]
    fn test_empty_worktree_list_handling() {
        let temp_dir = create_test_repo().expect("Failed to create test repo");
        let repo_path = temp_dir.path().to_path_buf();

        let mut app = WorktreeMonitorApp::new(repo_path).expect("Failed to create app");

        // With empty worktree list, navigation should not panic
        let key_event = KeyEvent::new(KeyCode::Down, event::KeyModifiers::empty());
        let result = app.handle_key_event(key_event);
        assert!(result.is_ok(), "Should handle navigation on empty list");

        assert_eq!(app.selected_index, 0, "Selected index should remain 0");
    }
}
