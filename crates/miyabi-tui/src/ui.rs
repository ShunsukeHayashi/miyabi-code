//! UI rendering

use crate::app::{App, Tab};
use ratatui::{
    prelude::*,
    widgets::{Block, Borders, Paragraph, Tabs},
};

/// Draw the entire UI
pub fn draw(f: &mut Frame, app: &mut App) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),  // Tabs
            Constraint::Min(0),     // Content
            Constraint::Length(3),  // Status bar
        ])
        .split(f.area());

    // Draw tabs
    draw_tabs(f, app, chunks[0]);

    // Draw active view
    match app.active_tab {
        Tab::Dashboard => app.dashboard.draw(f, chunks[1]),
        Tab::A2ABridge => app.a2a_bridge.draw(f, chunks[1]),
        Tab::Chat => app.chat.draw(f, chunks[1]),
        Tab::Monitor => app.monitor.draw(f, chunks[1]),
    }

    // Draw status bar
    draw_status_bar(f, app, chunks[2]);
}

/// Draw tab bar
fn draw_tabs(f: &mut Frame, app: &App, area: Rect) {
    let titles: Vec<Line> = Tab::all()
        .iter()
        .enumerate()
        .map(|(i, tab)| {
            let style = if *tab == app.active_tab {
                Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD)
            } else {
                Style::default().fg(Color::Gray)
            };
            Line::from(format!(" {} {} ", i + 1, tab.title())).style(style)
        })
        .collect();

    let selected = Tab::all()
        .iter()
        .position(|t| *t == app.active_tab)
        .unwrap_or(0);

    let tabs = Tabs::new(titles)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .title(" Miyabi TUI ")
                .title_style(Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)),
        )
        .select(selected)
        .style(Style::default())
        .highlight_style(Style::default().fg(Color::Yellow));

    f.render_widget(tabs, area);
}

/// Draw status bar
fn draw_status_bar(f: &mut Frame, app: &App, area: Rect) {
    let status = Paragraph::new(app.status.clone())
        .style(Style::default().fg(Color::White))
        .block(
            Block::default()
                .borders(Borders::ALL)
                .title(" Status ")
                .border_style(Style::default().fg(Color::DarkGray)),
        );
    f.render_widget(status, area);
}
