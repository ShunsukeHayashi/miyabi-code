use pulldown_cmark::{CodeBlockKind, Event, HeadingLevel, Options, Parser, Tag, TagEnd};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span, Text};

/// Render markdown string to ratatui Text with styling
pub fn render_markdown(input: &str) -> Text<'static> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TABLES);

    let parser = Parser::new_ext(input, options);
    let mut renderer = MarkdownRenderer::new();

    for event in parser {
        renderer.handle_event(event);
    }

    renderer.finish()
}

struct MarkdownRenderer {
    lines: Vec<Line<'static>>,
    current_line: Vec<Span<'static>>,
    style_stack: Vec<Style>,
    in_code_block: bool,
    code_block_lang: Option<String>,
}

impl MarkdownRenderer {
    fn new() -> Self {
        Self {
            lines: Vec::new(),
            current_line: Vec::new(),
            style_stack: vec![Style::default()],
            in_code_block: false,
            code_block_lang: None,
        }
    }

    fn current_style(&self) -> Style {
        self.style_stack.last().copied().unwrap_or_default()
    }

    fn push_style(&mut self, style: Style) {
        let current = self.current_style();
        self.style_stack.push(current.patch(style));
    }

    fn pop_style(&mut self) {
        if self.style_stack.len() > 1 {
            self.style_stack.pop();
        }
    }

    fn handle_event(&mut self, event: Event) {
        match event {
            Event::Start(tag) => self.start_tag(tag),
            Event::End(tag) => self.end_tag(tag),
            Event::Text(text) => {
                let style = self.current_style();
                self.current_line
                    .push(Span::styled(text.to_string(), style));
            }
            Event::Code(code) => {
                let style = Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD);
                self.current_line
                    .push(Span::styled(format!("`{}`", code), style));
            }
            Event::SoftBreak => {
                self.current_line.push(Span::raw(" "));
            }
            Event::HardBreak => {
                self.flush_line();
            }
            Event::Rule => {
                self.flush_line();
                self.lines.push(Line::from(Span::styled(
                    "─".repeat(60),
                    Style::default().fg(Color::DarkGray),
                )));
            }
            _ => {}
        }
    }

    fn start_tag(&mut self, tag: Tag) {
        match tag {
            Tag::Paragraph => {
                // Start new paragraph
            }
            Tag::Heading { level, .. } => {
                let style = match level {
                    HeadingLevel::H1 => Style::default()
                        .fg(Color::Magenta)
                        .add_modifier(Modifier::BOLD),
                    HeadingLevel::H2 => Style::default()
                        .fg(Color::Blue)
                        .add_modifier(Modifier::BOLD),
                    HeadingLevel::H3 => Style::default()
                        .fg(Color::Cyan)
                        .add_modifier(Modifier::BOLD),
                    _ => Style::default()
                        .fg(Color::Green)
                        .add_modifier(Modifier::BOLD),
                };
                self.push_style(style);

                // Add heading prefix
                let prefix = match level {
                    HeadingLevel::H1 => "# ",
                    HeadingLevel::H2 => "## ",
                    HeadingLevel::H3 => "### ",
                    HeadingLevel::H4 => "#### ",
                    HeadingLevel::H5 => "##### ",
                    HeadingLevel::H6 => "###### ",
                };
                self.current_line.push(Span::styled(prefix, style));
            }
            Tag::BlockQuote(_) => {
                self.push_style(
                    Style::default()
                        .fg(Color::DarkGray)
                        .add_modifier(Modifier::ITALIC),
                );
                self.current_line
                    .push(Span::styled("> ", Style::default().fg(Color::DarkGray)));
            }
            Tag::CodeBlock(kind) => {
                self.in_code_block = true;
                self.code_block_lang = match kind {
                    CodeBlockKind::Fenced(lang) => Some(lang.to_string()),
                    CodeBlockKind::Indented => None,
                };

                // Add code block header
                self.flush_line();
                let header = if let Some(ref lang) = self.code_block_lang {
                    format!("```{}", lang)
                } else {
                    "```".to_string()
                };
                self.lines.push(Line::from(Span::styled(
                    header,
                    Style::default().fg(Color::Yellow),
                )));

                self.push_style(
                    Style::default()
                        .fg(Color::Green)
                        .add_modifier(Modifier::DIM),
                );
            }
            Tag::List(_) => {
                // List handling
            }
            Tag::Item => {
                self.current_line.push(Span::raw("• "));
            }
            Tag::Emphasis => {
                self.push_style(Style::default().add_modifier(Modifier::ITALIC));
            }
            Tag::Strong => {
                self.push_style(Style::default().add_modifier(Modifier::BOLD));
            }
            Tag::Strikethrough => {
                self.push_style(Style::default().add_modifier(Modifier::CROSSED_OUT));
            }
            Tag::Link {
                dest_url: _dest_url,
                ..
            } => {
                self.push_style(
                    Style::default()
                        .fg(Color::Blue)
                        .add_modifier(Modifier::UNDERLINED),
                );
                self.current_line
                    .push(Span::styled("[", Style::default().fg(Color::Blue)));
            }
            _ => {}
        }
    }

    fn end_tag(&mut self, tag: TagEnd) {
        match tag {
            TagEnd::Paragraph => {
                self.flush_line();
                self.lines.push(Line::default()); // Blank line after paragraph
            }
            TagEnd::Heading(_) => {
                self.pop_style();
                self.flush_line();
                self.lines.push(Line::default()); // Blank line after heading
            }
            TagEnd::BlockQuote(_) => {
                self.pop_style();
                self.flush_line();
            }
            TagEnd::CodeBlock => {
                self.in_code_block = false;
                self.pop_style();
                self.flush_line();
                self.lines.push(Line::from(Span::styled(
                    "```",
                    Style::default().fg(Color::Yellow),
                )));
                self.code_block_lang = None;
            }
            TagEnd::List(_) => {
                self.flush_line();
            }
            TagEnd::Item => {
                self.flush_line();
            }
            TagEnd::Emphasis | TagEnd::Strong | TagEnd::Strikethrough => {
                self.pop_style();
            }
            TagEnd::Link => {
                self.current_line
                    .push(Span::styled("]", Style::default().fg(Color::Blue)));
                self.pop_style();
            }
            _ => {}
        }
    }

    fn flush_line(&mut self) {
        if !self.current_line.is_empty() {
            let line = std::mem::take(&mut self.current_line);
            self.lines.push(Line::from(line));
        }
    }

    fn finish(mut self) -> Text<'static> {
        self.flush_line();
        Text::from(self.lines)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_markdown() {
        let input = "# Heading 1\n\nThis is **bold** and *italic* text.";
        let text = render_markdown(input);
        assert!(!text.lines.is_empty());
    }

    #[test]
    #[ignore] // TODO: Fix markdown code block line handling
    fn test_code_block() {
        let input = "```rust\nfn main() {\n    println!(\"Hello\");\n}\n```";
        let text = render_markdown(input);
        assert!(text.lines.len() > 3);
    }

    #[test]
    fn test_list() {
        let input = "- Item 1\n- Item 2\n- Item 3";
        let text = render_markdown(input);
        assert!(text.lines.len() >= 3);
    }
}
