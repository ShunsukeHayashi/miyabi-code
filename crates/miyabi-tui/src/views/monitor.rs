//! System Monitor View

use crossterm::event::{KeyCode, KeyEvent};
use ratatui::{
    prelude::*,
    widgets::{Block, Borders, Gauge, Paragraph, Sparkline},
};
use sysinfo::{System, Pid};

/// System Monitor view state
pub struct MonitorView {
    /// System info
    sys: System,
    /// CPU history
    cpu_history: Vec<u64>,
    /// Memory history
    mem_history: Vec<u64>,
    /// Update counter
    tick: usize,
}

impl MonitorView {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();

        Self {
            sys,
            cpu_history: vec![0; 60],
            mem_history: vec![0; 60],
            tick: 0,
        }
    }

    pub fn update(&mut self) {
        self.tick += 1;
        if self.tick % 10 == 0 {
            self.sys.refresh_all();

            // Update CPU history
            let cpu_usage = self.sys.global_cpu_usage() as u64;
            self.cpu_history.push(cpu_usage);
            if self.cpu_history.len() > 60 {
                self.cpu_history.remove(0);
            }

            // Update memory history
            let mem_usage = ((self.sys.used_memory() as f64 / self.sys.total_memory() as f64) * 100.0) as u64;
            self.mem_history.push(mem_usage);
            if self.mem_history.len() > 60 {
                self.mem_history.remove(0);
            }
        }
    }

    pub fn on_key(&mut self, key: KeyEvent) {
        match key.code {
            KeyCode::Char('r') => {
                self.sys.refresh_all();
            }
            _ => {}
        }
    }

    pub fn draw(&self, f: &mut Frame, area: Rect) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(6),  // CPU
                Constraint::Length(6),  // Memory
                Constraint::Length(6),  // Disk
                Constraint::Min(0),     // Processes
            ])
            .split(area);

        // CPU Usage
        let cpu_usage = self.sys.global_cpu_usage() as u16;
        let cpu_chunk = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(30), Constraint::Percentage(70)])
            .split(chunks[0]);

        let cpu_gauge = Gauge::default()
            .block(Block::default().borders(Borders::ALL).title(" CPU "))
            .gauge_style(Style::default().fg(if cpu_usage > 80 {
                Color::Red
            } else if cpu_usage > 50 {
                Color::Yellow
            } else {
                Color::Green
            }))
            .percent(cpu_usage)
            .label(format!("{}%", cpu_usage));
        f.render_widget(cpu_gauge, cpu_chunk[0]);

        let cpu_spark = Sparkline::default()
            .block(Block::default().borders(Borders::ALL).title(" CPU History "))
            .data(&self.cpu_history)
            .style(Style::default().fg(Color::Cyan));
        f.render_widget(cpu_spark, cpu_chunk[1]);

        // Memory Usage
        let mem_used = self.sys.used_memory();
        let mem_total = self.sys.total_memory();
        let mem_percent = if mem_total > 0 {
            ((mem_used as f64 / mem_total as f64) * 100.0) as u16
        } else {
            0
        };

        let mem_chunk = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(30), Constraint::Percentage(70)])
            .split(chunks[1]);

        let mem_gauge = Gauge::default()
            .block(Block::default().borders(Borders::ALL).title(" Memory "))
            .gauge_style(Style::default().fg(if mem_percent > 80 {
                Color::Red
            } else if mem_percent > 50 {
                Color::Yellow
            } else {
                Color::Green
            }))
            .percent(mem_percent)
            .label(format!(
                "{:.1}G / {:.1}G ({}%)",
                mem_used as f64 / 1_073_741_824.0,
                mem_total as f64 / 1_073_741_824.0,
                mem_percent
            ));
        f.render_widget(mem_gauge, mem_chunk[0]);

        let mem_spark = Sparkline::default()
            .block(Block::default().borders(Borders::ALL).title(" Memory History "))
            .data(&self.mem_history)
            .style(Style::default().fg(Color::Magenta));
        f.render_widget(mem_spark, mem_chunk[1]);

        // Disk info
        let disk_info = Paragraph::new(vec![
            Line::from(vec![
                Span::raw("Swap: "),
                Span::styled(
                    format!(
                        "{:.1}G / {:.1}G",
                        self.sys.used_swap() as f64 / 1_073_741_824.0,
                        self.sys.total_swap() as f64 / 1_073_741_824.0
                    ),
                    Style::default().fg(Color::Yellow),
                ),
            ]),
            Line::from(vec![
                Span::raw("Uptime: "),
                Span::styled(
                    format!("{}s", System::uptime()),
                    Style::default().fg(Color::Cyan),
                ),
            ]),
        ])
        .block(
            Block::default()
                .borders(Borders::ALL)
                .title(" System Info "),
        );
        f.render_widget(disk_info, chunks[2]);

        // Process list
        let mut processes: Vec<(&Pid, &sysinfo::Process)> = self.sys.processes().iter().collect();
        processes.sort_by(|a, b| {
            b.1.cpu_usage()
                .partial_cmp(&a.1.cpu_usage())
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        let process_lines: Vec<Line> = processes
            .iter()
            .take(15)
            .map(|(pid, proc)| {
                Line::from(vec![
                    Span::styled(
                        format!("{:>6} ", pid.as_u32()),
                        Style::default().fg(Color::DarkGray),
                    ),
                    Span::styled(
                        format!("{:<20} ", proc.name().to_string_lossy()),
                        Style::default().fg(Color::Cyan),
                    ),
                    Span::styled(
                        format!("{:>5.1}% ", proc.cpu_usage()),
                        Style::default().fg(if proc.cpu_usage() > 50.0 {
                            Color::Red
                        } else {
                            Color::Green
                        }),
                    ),
                    Span::styled(
                        format!("{:>6.1}M", proc.memory() as f64 / 1_048_576.0),
                        Style::default().fg(Color::Yellow),
                    ),
                ])
            })
            .collect();

        let processes_widget = Paragraph::new(process_lines).block(
            Block::default()
                .borders(Borders::ALL)
                .title(" Top Processes (by CPU) - Press 'r' to refresh "),
        );
        f.render_widget(processes_widget, chunks[3]);
    }
}
