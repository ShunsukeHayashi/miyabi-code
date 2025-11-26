//! Agent Dashboard View

use crossterm::event::{KeyCode, KeyEvent};
use ratatui::{
    prelude::*,
    widgets::{Block, Borders, Gauge, List, ListItem, ListState, Paragraph},
};

/// Agent status
#[derive(Clone)]
pub struct AgentStatus {
    pub name: String,
    pub status: String,
    pub progress: u16,
    pub last_update: String,
}

/// Agent Dashboard view state
pub struct AgentDashboard {
    /// List of agents
    pub agents: Vec<AgentStatus>,
    /// Selected agent index
    pub selected: ListState,
    /// Logs
    pub logs: Vec<String>,
}

impl Default for AgentDashboard {
    fn default() -> Self {
        Self::new()
    }
}

impl AgentDashboard {
    pub fn new() -> Self {
        let agents = vec![
            AgentStatus {
                name: "CoordinatorAgent".to_string(),
                status: "Idle".to_string(),
                progress: 0,
                last_update: "Ready".to_string(),
            },
            AgentStatus {
                name: "CodeGenAgent".to_string(),
                status: "Idle".to_string(),
                progress: 0,
                last_update: "Ready".to_string(),
            },
            AgentStatus {
                name: "ReviewAgent".to_string(),
                status: "Idle".to_string(),
                progress: 0,
                last_update: "Ready".to_string(),
            },
            AgentStatus {
                name: "IssueAgent".to_string(),
                status: "Idle".to_string(),
                progress: 0,
                last_update: "Ready".to_string(),
            },
            AgentStatus {
                name: "PRAgent".to_string(),
                status: "Idle".to_string(),
                progress: 0,
                last_update: "Ready".to_string(),
            },
            AgentStatus {
                name: "DeploymentAgent".to_string(),
                status: "Idle".to_string(),
                progress: 0,
                last_update: "Ready".to_string(),
            },
            AgentStatus {
                name: "SelfAnalysisAgent".to_string(),
                status: "Idle".to_string(),
                progress: 0,
                last_update: "Ready".to_string(),
            },
        ];

        let mut selected = ListState::default();
        selected.select(Some(0));

        Self {
            agents,
            selected,
            logs: vec!["Dashboard initialized".to_string()],
        }
    }

    pub fn update(&mut self) {
        // Simulate agent activity updates
    }

    pub fn on_key(&mut self, key: KeyEvent) {
        match key.code {
            KeyCode::Up | KeyCode::Char('k') => {
                let i = match self.selected.selected() {
                    Some(i) => {
                        if i == 0 {
                            self.agents.len() - 1
                        } else {
                            i - 1
                        }
                    }
                    None => 0,
                };
                self.selected.select(Some(i));
            }
            KeyCode::Down | KeyCode::Char('j') => {
                let i = match self.selected.selected() {
                    Some(i) => {
                        if i >= self.agents.len() - 1 {
                            0
                        } else {
                            i + 1
                        }
                    }
                    None => 0,
                };
                self.selected.select(Some(i));
            }
            _ => {}
        }
    }

    pub fn draw(&self, f: &mut Frame, area: Rect) {
        let chunks = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(50), Constraint::Percentage(50)])
            .split(area);

        // Agent list
        let items: Vec<ListItem> = self
            .agents
            .iter()
            .map(|agent| {
                let status_color = match agent.status.as_str() {
                    "Running" => Color::Green,
                    "Error" => Color::Red,
                    "Idle" => Color::Gray,
                    _ => Color::Yellow,
                };
                ListItem::new(Line::from(vec![
                    Span::styled(
                        format!("{:<20}", agent.name),
                        Style::default().fg(Color::Cyan),
                    ),
                    Span::styled(
                        format!(" {} ", agent.status),
                        Style::default().fg(status_color),
                    ),
                ]))
            })
            .collect();

        let list = List::new(items)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(" Agents (21) ")
                    .title_style(Style::default().fg(Color::Yellow)),
            )
            .highlight_style(
                Style::default()
                    .bg(Color::DarkGray)
                    .add_modifier(Modifier::BOLD),
            )
            .highlight_symbol(">> ");

        f.render_stateful_widget(list, chunks[0], &mut self.selected.clone());

        // Agent details
        let right_chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([Constraint::Percentage(40), Constraint::Percentage(60)])
            .split(chunks[1]);

        // Selected agent details
        if let Some(idx) = self.selected.selected() {
            if let Some(agent) = self.agents.get(idx) {
                let details = Paragraph::new(vec![
                    Line::from(vec![
                        Span::raw("Name: "),
                        Span::styled(&agent.name, Style::default().fg(Color::Cyan)),
                    ]),
                    Line::from(vec![
                        Span::raw("Status: "),
                        Span::styled(&agent.status, Style::default().fg(Color::Green)),
                    ]),
                    Line::from(vec![
                        Span::raw("Last Update: "),
                        Span::styled(&agent.last_update, Style::default().fg(Color::Yellow)),
                    ]),
                ])
                .block(
                    Block::default()
                        .borders(Borders::ALL)
                        .title(" Agent Details "),
                );
                f.render_widget(details, right_chunks[0]);

                // Progress gauge
                let gauge = Gauge::default()
                    .block(Block::default().borders(Borders::ALL).title(" Progress "))
                    .gauge_style(Style::default().fg(Color::Green).bg(Color::Black))
                    .percent(agent.progress)
                    .label(format!("{}%", agent.progress));
                f.render_widget(gauge, right_chunks[1]);
            }
        }
    }
}
