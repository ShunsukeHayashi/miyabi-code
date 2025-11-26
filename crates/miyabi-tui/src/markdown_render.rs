//! Markdown to Terminal Renderer
//!
//! Converts markdown text to styled ratatui Lines/Spans
//! following the OpenAI Codex TUI styling conventions.

use ratatui::{
    style::{Color, Modifier, Style},
    text::{Line, Span},
};

/// Markdown styling configuration
pub struct MarkdownStyles {
    pub h1: Style,
    pub h2: Style,
    pub h3: Style,
    pub bold: Style,
    pub italic: Style,
    pub code: Style,
    pub code_block: Style,
    pub link: Style,
    pub list_marker: Style,
    pub blockquote: Style,
    pub strikethrough: Style,
}

impl Default for MarkdownStyles {
    fn default() -> Self {
        Self {
            h1: Style::default()
                .fg(Color::Rgb(224, 175, 104)) // MIYABI_GOLD
                .add_modifier(Modifier::BOLD | Modifier::UNDERLINED),
            h2: Style::default()
                .fg(Color::Rgb(224, 175, 104))
                .add_modifier(Modifier::BOLD),
            h3: Style::default()
                .fg(Color::Rgb(192, 202, 245)) // MIYABI_FG
                .add_modifier(Modifier::ITALIC),
            bold: Style::default().add_modifier(Modifier::BOLD),
            italic: Style::default().add_modifier(Modifier::ITALIC),
            code: Style::default().fg(Color::Rgb(125, 207, 255)), // MIYABI_CYAN
            code_block: Style::default().fg(Color::Rgb(125, 207, 255)),
            link: Style::default()
                .fg(Color::Rgb(125, 207, 255))
                .add_modifier(Modifier::UNDERLINED),
            list_marker: Style::default().fg(Color::Rgb(158, 206, 106)), // MIYABI_GREEN
            blockquote: Style::default().fg(Color::Rgb(158, 206, 106)),
            strikethrough: Style::default().add_modifier(Modifier::CROSSED_OUT),
        }
    }
}

/// Simple markdown renderer
pub struct MarkdownRenderer {
    styles: MarkdownStyles,
}

impl MarkdownRenderer {
    pub fn new() -> Self {
        Self {
            styles: MarkdownStyles::default(),
        }
    }

    pub fn with_styles(styles: MarkdownStyles) -> Self {
        Self { styles }
    }

    /// Render markdown text to styled Lines
    pub fn render(&self, text: &str) -> Vec<Line<'static>> {
        let mut lines = Vec::new();
        let mut in_code_block = false;
        let mut code_block_content: Vec<String> = Vec::new();

        for line in text.lines() {
            // Handle code blocks
            if line.trim().starts_with("```") {
                if in_code_block {
                    // End code block
                    lines.push(Line::from(Span::styled(
                        "┌─────────────────────────────────────────────────────────────┐",
                        Style::default().fg(Color::Rgb(86, 95, 137)),
                    )));
                    for code_line in &code_block_content {
                        lines.push(Line::from(vec![
                            Span::styled("│ ", Style::default().fg(Color::Rgb(86, 95, 137))),
                            Span::styled(code_line.clone(), self.styles.code_block),
                        ]));
                    }
                    lines.push(Line::from(Span::styled(
                        "└─────────────────────────────────────────────────────────────┘",
                        Style::default().fg(Color::Rgb(86, 95, 137)),
                    )));
                    code_block_content.clear();
                    in_code_block = false;
                } else {
                    // Start code block
                    in_code_block = true;
                }
                continue;
            }

            if in_code_block {
                code_block_content.push(line.to_string());
                continue;
            }

            // Handle different markdown elements
            let rendered = self.render_line(line);
            lines.push(rendered);
        }

        lines
    }

    /// Render a single markdown line
    fn render_line(&self, line: &str) -> Line<'static> {
        let trimmed = line.trim();

        // Headers
        if trimmed.starts_with("### ") {
            return Line::from(vec![
                Span::styled("   ", Style::default()),
                Span::styled(trimmed[4..].to_string(), self.styles.h3),
            ]);
        }
        if trimmed.starts_with("## ") {
            return Line::from(vec![
                Span::styled("  ", Style::default()),
                Span::styled(trimmed[3..].to_string(), self.styles.h2),
            ]);
        }
        if trimmed.starts_with("# ") {
            return Line::from(vec![
                Span::styled(" ", Style::default()),
                Span::styled(trimmed[2..].to_string(), self.styles.h1),
            ]);
        }

        // Blockquotes
        if trimmed.starts_with("> ") {
            return Line::from(vec![
                Span::styled("  > ", self.styles.blockquote),
                Span::styled(
                    trimmed[2..].to_string(),
                    Style::default().fg(Color::Rgb(192, 202, 245)),
                ),
            ]);
        }

        // Unordered lists
        if trimmed.starts_with("- ") || trimmed.starts_with("* ") {
            let indent = line.len() - line.trim_start().len();
            let prefix = "  ".repeat(indent / 2);
            return Line::from(vec![
                Span::raw(prefix),
                Span::styled("• ", self.styles.list_marker),
                Span::styled(self.render_inline(&trimmed[2..]), Style::default()),
            ]);
        }

        // Ordered lists
        if let Some(rest) = self.parse_ordered_list(trimmed) {
            let indent = line.len() - line.trim_start().len();
            let prefix = "  ".repeat(indent / 2);
            return Line::from(vec![
                Span::raw(prefix),
                Span::styled(rest.0, self.styles.list_marker),
                Span::styled(self.render_inline(&rest.1), Style::default()),
            ]);
        }

        // Horizontal rule
        if trimmed == "---" || trimmed == "***" || trimmed == "___" {
            return Line::from(Span::styled(
                "────────────────────────────────────────────────────────────",
                Style::default().fg(Color::Rgb(86, 95, 137)),
            ));
        }

        // Regular paragraph with inline formatting
        self.render_inline_line(line)
    }

    /// Parse ordered list item
    fn parse_ordered_list<'a>(&self, line: &'a str) -> Option<(String, &'a str)> {
        let mut chars = line.chars().peekable();
        let mut num = String::new();

        while let Some(&c) = chars.peek() {
            if c.is_ascii_digit() {
                num.push(c);
                chars.next();
            } else {
                break;
            }
        }

        if !num.is_empty() && chars.next() == Some('.') && chars.next() == Some(' ') {
            let rest: String = chars.collect();
            Some((format!("{}. ", num), rest.leak()))
        } else {
            None
        }
    }

    /// Render inline formatting (bold, italic, code, links)
    fn render_inline(&self, text: &str) -> String {
        // For simplicity, just return the text
        // A full implementation would parse **bold**, *italic*, `code`, [links](url)
        text.to_string()
    }

    /// Render a line with inline formatting to spans
    fn render_inline_line(&self, line: &str) -> Line<'static> {
        let mut spans = Vec::new();
        let mut current = String::new();
        let mut chars = line.chars().peekable();
        let mut in_bold = false;
        let mut in_italic = false;
        let mut in_code = false;

        while let Some(c) = chars.next() {
            match c {
                '`' if !in_bold && !in_italic => {
                    if !current.is_empty() {
                        spans.push(Span::styled(
                            current.clone(),
                            if in_code {
                                self.styles.code
                            } else {
                                Style::default().fg(Color::Rgb(192, 202, 245))
                            },
                        ));
                        current.clear();
                    }
                    in_code = !in_code;
                }
                '*' if chars.peek() == Some(&'*') && !in_code => {
                    chars.next(); // consume second *
                    if !current.is_empty() {
                        let style = if in_bold {
                            self.styles.bold
                        } else if in_italic {
                            self.styles.italic
                        } else {
                            Style::default().fg(Color::Rgb(192, 202, 245))
                        };
                        spans.push(Span::styled(current.clone(), style));
                        current.clear();
                    }
                    in_bold = !in_bold;
                }
                '*' | '_' if !in_code && !in_bold => {
                    if !current.is_empty() {
                        let style = if in_italic {
                            self.styles.italic
                        } else {
                            Style::default().fg(Color::Rgb(192, 202, 245))
                        };
                        spans.push(Span::styled(current.clone(), style));
                        current.clear();
                    }
                    in_italic = !in_italic;
                }
                _ => {
                    current.push(c);
                }
            }
        }

        // Push remaining text
        if !current.is_empty() {
            let style = if in_code {
                self.styles.code
            } else if in_bold {
                self.styles.bold
            } else if in_italic {
                self.styles.italic
            } else {
                Style::default().fg(Color::Rgb(192, 202, 245))
            };
            spans.push(Span::styled(current, style));
        }

        if spans.is_empty() {
            Line::from("")
        } else {
            Line::from(spans)
        }
    }
}

impl Default for MarkdownRenderer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_render_header() {
        let renderer = MarkdownRenderer::new();
        let lines = renderer.render("# Header 1\n## Header 2");
        assert_eq!(lines.len(), 2);
    }

    #[test]
    fn test_render_list() {
        let renderer = MarkdownRenderer::new();
        let lines = renderer.render("- Item 1\n- Item 2");
        assert_eq!(lines.len(), 2);
    }

    #[test]
    fn test_render_code_block() {
        let renderer = MarkdownRenderer::new();
        let lines = renderer.render("```\ncode here\n```");
        assert!(lines.len() >= 3); // top border, content, bottom border
    }
}
