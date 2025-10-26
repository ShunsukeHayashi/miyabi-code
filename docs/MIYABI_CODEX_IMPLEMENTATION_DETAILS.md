# Miyabi → Codex アーキテクチャ実装詳細ガイド

**作成日**: 2025-10-26
**対象**: Miyabiプロジェクトの Codex アーキテクチャ化
**目的**: 具体的な実装手順とコード例の提供

---

## 📋 目次

1. [miyabi-tui 実装詳細](#1-miyabi-tui-実装詳細)
2. [miyabi-sandbox 実装詳細](#2-miyabi-sandbox-実装詳細)
3. [miyabi-apply-patch 実装詳細](#3-miyabi-apply-patch-実装詳細)
4. [統合手順](#4-統合手順)
5. [テスト戦略](#5-テスト戦略)
6. [マイグレーションガイド](#6-マイグレーションガイド)
7. [Claude Code 機能拡張](#7-claude-code-機能拡張)

---

## 1. miyabi-tui 実装詳細

### 1.1 ディレクトリ構造

```
crates/miyabi-tui/
├── Cargo.toml
├── src/
│   ├── lib.rs              # ライブラリエントリーポイント
│   ├── main.rs             # バイナリエントリーポイント
│   ├── app.rs              # メインアプリケーション構造体
│   ├── events.rs           # イベント処理
│   ├── state.rs            # アプリケーション状態管理
│   ├── widgets/
│   │   ├── mod.rs
│   │   ├── header.rs       # ヘッダーウィジェット
│   │   ├── messages.rs     # メッセージリストウィジェット
│   │   ├── composer.rs     # 入力欄ウィジェット
│   │   └── status.rs       # ステータスバーウィジェット
│   ├── markdown/
│   │   ├── mod.rs
│   │   └── renderer.rs     # Markdownレンダリング
│   ├── syntax/
│   │   ├── mod.rs
│   │   └── highlighter.rs  # シンタックスハイライト
│   └── file_search/
│       ├── mod.rs
│       └── fuzzy.rs        # ファジーファイル検索
└── tests/
    └── integration_test.rs
```

### 1.2 Cargo.toml

```toml
[package]
name = "miyabi-tui"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "miyabi-tui"
path = "src/main.rs"

[lib]
name = "miyabi_tui"
path = "src/lib.rs"

[dependencies]
# TUI
ratatui = { version = "0.29.0", features = [
    "scrolling-regions",
    "unstable-backend-writer",
    "unstable-rendered-line-info",
    "unstable-widget-ref",
] }
crossterm = { version = "0.28.1", features = ["bracketed-paste", "event-stream"] }

# Markdown & Syntax
pulldown-cmark = "0.10"
tree-sitter-highlight = "0.25.10"
tree-sitter-bash = "0.25"

# Utilities
anyhow = "1"
tokio = { version = "1", features = ["full"] }
futures = "0.3"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Internal
miyabi-core = { path = "../miyabi-core" }
miyabi-types = { path = "../miyabi-types" }
miyabi-llm = { path = "../miyabi-llm" }
```

### 1.3 メインアプリケーション構造体 (app.rs)

```rust
use ratatui::{
    backend::CrosstermBackend,
    Terminal,
    layout::{Constraint, Direction, Layout},
};
use crossterm::{
    event::{self, Event, KeyCode, KeyEvent},
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
    ExecutableCommand,
};
use std::io::{stdout, Stdout};
use anyhow::Result;

pub struct App {
    /// アプリケーション状態
    state: AppState,

    /// 会話履歴
    messages: Vec<Message>,

    /// 現在の入力
    input: String,

    /// カーソル位置
    cursor_position: usize,

    /// スクロール位置
    scroll_offset: u16,

    /// 終了フラグ
    should_quit: bool,
}

#[derive(Debug, Clone)]
pub enum AppState {
    Idle,
    Streaming,
    WaitingForApproval,
    ExecutingTool,
}

#[derive(Debug, Clone)]
pub struct Message {
    pub role: MessageRole,
    pub content: String,
    pub timestamp: std::time::SystemTime,
}

#[derive(Debug, Clone, PartialEq)]
pub enum MessageRole {
    User,
    Assistant,
    System,
    ToolCall,
    ToolResult,
}

impl App {
    pub fn new() -> Self {
        Self {
            state: AppState::Idle,
            messages: Vec::new(),
            input: String::new(),
            cursor_position: 0,
            scroll_offset: 0,
            should_quit: false,
        }
    }

    /// TUIを起動
    pub async fn run(&mut self) -> Result<()> {
        // ターミナル初期化
        enable_raw_mode()?;
        stdout().execute(EnterAlternateScreen)?;

        let backend = CrosstermBackend::new(stdout());
        let mut terminal = Terminal::new(backend)?;
        terminal.clear()?;

        // メインループ
        while !self.should_quit {
            // 描画
            terminal.draw(|frame| self.render(frame))?;

            // イベント処理
            if event::poll(std::time::Duration::from_millis(100))? {
                if let Event::Key(key) = event::read()? {
                    self.handle_key_event(key).await?;
                }
            }
        }

        // クリーンアップ
        disable_raw_mode()?;
        stdout().execute(LeaveAlternateScreen)?;

        Ok(())
    }

    /// 画面描画
    fn render(&self, frame: &mut ratatui::Frame) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),      // ヘッダー
                Constraint::Min(0),          // メッセージ
                Constraint::Length(3),      // 入力欄
            ])
            .split(frame.area());

        // ヘッダー描画
        self.render_header(frame, chunks[0]);

        // メッセージリスト描画
        self.render_messages(frame, chunks[1]);

        // 入力欄描画
        self.render_composer(frame, chunks[2]);
    }

    /// ヘッダー描画
    fn render_header(&self, frame: &mut ratatui::Frame, area: ratatui::layout::Rect) {
        use ratatui::widgets::{Block, Borders, Paragraph};
        use ratatui::text::Span;

        let title = match self.state {
            AppState::Idle => "Miyabi CLI - Ready",
            AppState::Streaming => "Miyabi CLI - Streaming...",
            AppState::WaitingForApproval => "Miyabi CLI - Waiting for Approval",
            AppState::ExecutingTool => "Miyabi CLI - Executing Tool",
        };

        let header = Paragraph::new(Span::raw(title))
            .block(Block::default().borders(Borders::ALL));

        frame.render_widget(header, area);
    }

    /// メッセージリスト描画
    fn render_messages(&self, frame: &mut ratatui::Frame, area: ratatui::layout::Rect) {
        use ratatui::widgets::{Block, Borders, List, ListItem};
        use ratatui::text::{Line, Span};
        use ratatui::style::{Color, Style};

        let items: Vec<ListItem> = self.messages.iter().map(|msg| {
            let (prefix, color) = match msg.role {
                MessageRole::User => ("User: ", Color::Cyan),
                MessageRole::Assistant => ("Assistant: ", Color::Green),
                MessageRole::System => ("System: ", Color::Yellow),
                MessageRole::ToolCall => ("Tool Call: ", Color::Magenta),
                MessageRole::ToolResult => ("Tool Result: ", Color::Blue),
            };

            let line = Line::from(vec![
                Span::styled(prefix, Style::default().fg(color)),
                Span::raw(&msg.content),
            ]);

            ListItem::new(line)
        }).collect();

        let list = List::new(items)
            .block(Block::default().borders(Borders::ALL).title("Messages"));

        frame.render_widget(list, area);
    }

    /// 入力欄描画
    fn render_composer(&self, frame: &mut ratatui::Frame, area: ratatui::layout::Rect) {
        use ratatui::widgets::{Block, Borders, Paragraph};

        let input = Paragraph::new(self.input.as_str())
            .block(Block::default().borders(Borders::ALL).title("Input"));

        frame.render_widget(input, area);

        // カーソル位置設定
        frame.set_cursor_position((
            area.x + self.cursor_position as u16 + 1,
            area.y + 1,
        ));
    }

    /// キーイベント処理
    async fn handle_key_event(&mut self, key: KeyEvent) -> Result<()> {
        match key.code {
            KeyCode::Char('c') if key.modifiers.contains(event::KeyModifiers::CONTROL) => {
                self.should_quit = true;
            }
            KeyCode::Enter => {
                self.submit_message().await?;
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
            _ => {}
        }
        Ok(())
    }

    /// メッセージ送信
    async fn submit_message(&mut self) -> Result<()> {
        if self.input.is_empty() {
            return Ok(());
        }

        // ユーザーメッセージを追加
        let user_msg = Message {
            role: MessageRole::User,
            content: self.input.clone(),
            timestamp: std::time::SystemTime::now(),
        };
        self.messages.push(user_msg);

        // 入力クリア
        let prompt = self.input.clone();
        self.input.clear();
        self.cursor_position = 0;

        // LLM呼び出し（別タスクで実行）
        self.state = AppState::Streaming;

        // TODO: miyabi-llm と統合
        // let response = miyabi_llm::send_message(&prompt).await?;

        // 仮のレスポンス
        let assistant_msg = Message {
            role: MessageRole::Assistant,
            content: format!("Echo: {}", prompt),
            timestamp: std::time::SystemTime::now(),
        };
        self.messages.push(assistant_msg);

        self.state = AppState::Idle;

        Ok(())
    }
}
```

### 1.4 Markdownレンダリング (markdown/renderer.rs)

```rust
use pulldown_cmark::{Parser, Event, Tag, CodeBlockKind};
use ratatui::text::{Line, Span};
use ratatui::style::{Color, Style, Modifier};

pub struct MarkdownRenderer;

impl MarkdownRenderer {
    pub fn render(markdown: &str) -> Vec<Line<'static>> {
        let mut lines = Vec::new();
        let mut current_line = Vec::new();
        let mut in_code_block = false;

        let parser = Parser::new(markdown);

        for event in parser {
            match event {
                Event::Start(Tag::Heading { level, .. }) => {
                    let color = match level {
                        pulldown_cmark::HeadingLevel::H1 => Color::Cyan,
                        pulldown_cmark::HeadingLevel::H2 => Color::Blue,
                        _ => Color::White,
                    };
                    current_line.push(Span::styled(
                        "#".repeat(level as usize) + " ",
                        Style::default().fg(color).add_modifier(Modifier::BOLD),
                    ));
                }
                Event::Start(Tag::CodeBlock(CodeBlockKind::Fenced(lang))) => {
                    in_code_block = true;
                    current_line.push(Span::styled(
                        format!("```{}", lang),
                        Style::default().fg(Color::Gray),
                    ));
                    lines.push(Line::from(current_line.clone()));
                    current_line.clear();
                }
                Event::End(Tag::CodeBlock(_)) => {
                    in_code_block = false;
                    current_line.push(Span::styled(
                        "```",
                        Style::default().fg(Color::Gray),
                    ));
                    lines.push(Line::from(current_line.clone()));
                    current_line.clear();
                }
                Event::Text(text) => {
                    let style = if in_code_block {
                        Style::default().fg(Color::Green)
                    } else {
                        Style::default()
                    };
                    current_line.push(Span::styled(text.to_string(), style));
                }
                Event::SoftBreak | Event::HardBreak => {
                    lines.push(Line::from(current_line.clone()));
                    current_line.clear();
                }
                _ => {}
            }
        }

        if !current_line.is_empty() {
            lines.push(Line::from(current_line));
        }

        lines
    }
}
```

---

## 2. miyabi-sandbox 実装詳細

### 2.1 ディレクトリ構造

```
crates/miyabi-sandbox/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── linux.rs      # Linux実装 (Landlock + Seccomp)
│   ├── macos.rs      # macOS実装 (Seatbelt)
│   ├── windows.rs    # Windows実装 (将来対応)
│   └── common.rs     # 共通インターフェース
└── tests/
    └── sandbox_test.rs
```

### 2.2 Cargo.toml

```toml
[package]
name = "miyabi-sandbox"
version = "0.1.0"
edition = "2021"

[dependencies]
anyhow = "1"
thiserror = "2"
tokio = { version = "1", features = ["process", "io-util"] }

[target.'cfg(target_os = "linux")'.dependencies]
landlock = "0.4.1"
seccompiler = "0.5.0"

[target.'cfg(target_os = "macos")'.dependencies]
# macOS はシステムの seatbelt を使用（外部crateなし）
```

### 2.3 共通インターフェース (common.rs)

```rust
use anyhow::Result;
use std::path::PathBuf;

/// サンドボックス設定
#[derive(Debug, Clone)]
pub struct SandboxConfig {
    /// 読み取り許可するディレクトリ
    pub allowed_read_paths: Vec<PathBuf>,

    /// 書き込み許可するディレクトリ
    pub allowed_write_paths: Vec<PathBuf>,

    /// ネットワークアクセスを許可するか
    pub allow_network: bool,

    /// 実行するコマンド
    pub command: String,

    /// コマンド引数
    pub args: Vec<String>,

    /// 作業ディレクトリ
    pub working_dir: Option<PathBuf>,
}

/// サンドボックス実行結果
#[derive(Debug)]
pub struct SandboxResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

/// サンドボックス実行
pub async fn execute_sandboxed(config: SandboxConfig) -> Result<SandboxResult> {
    #[cfg(target_os = "linux")]
    return crate::linux::execute_sandboxed(config).await;

    #[cfg(target_os = "macos")]
    return crate::macos::execute_sandboxed(config).await;

    #[cfg(target_os = "windows")]
    return crate::windows::execute_sandboxed(config).await;

    #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
    Err(anyhow::anyhow!("Unsupported platform"))
}
```

### 2.4 Linux実装 (linux.rs)

```rust
use super::common::{SandboxConfig, SandboxResult};
use anyhow::Result;
use landlock::{
    Access, AccessFs, Ruleset, RulesetAttr, RulesetCreatedAttr, ABI,
};
use seccompiler::{BpfProgram, SeccompAction, SeccompFilter};
use std::os::unix::process::CommandExt;
use tokio::process::Command;

pub async fn execute_sandboxed(config: SandboxConfig) -> Result<SandboxResult> {
    // Landlock ルールセット作成
    let abi = ABI::V4;
    let mut ruleset = Ruleset::default()
        .handle_access(AccessFs::from_all(abi))?
        .create()?;

    // 読み取り許可パス追加
    for path in &config.allowed_read_paths {
        let access = AccessFs::from_read(abi);
        ruleset = ruleset.add_rule(landlock::PathBeneath::new(path, access))?;
    }

    // 書き込み許可パス追加
    for path in &config.allowed_write_paths {
        let access = AccessFs::from_all(abi);
        ruleset = ruleset.add_rule(landlock::PathBeneath::new(path, access))?;
    }

    // Landlock 適用
    ruleset.restrict_self()?;

    // Seccomp フィルター作成
    let filter = create_seccomp_filter(config.allow_network)?;

    // コマンド実行
    let mut command = Command::new(&config.command);
    command.args(&config.args);

    if let Some(cwd) = config.working_dir {
        command.current_dir(cwd);
    }

    // 環境変数設定
    command.env("MIYABI_SANDBOX", "1");
    if !config.allow_network {
        command.env("MIYABI_SANDBOX_NETWORK_DISABLED", "1");
    }

    // 実行
    let output = command.output().await?;

    Ok(SandboxResult {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}

fn create_seccomp_filter(allow_network: bool) -> Result<BpfProgram> {
    let mut filter = SeccompFilter::new(
        vec![
            // 基本的なシステムコールを許可
            (libc::SYS_read, SeccompAction::Allow),
            (libc::SYS_write, SeccompAction::Allow),
            (libc::SYS_open, SeccompAction::Allow),
            (libc::SYS_close, SeccompAction::Allow),
            (libc::SYS_stat, SeccompAction::Allow),
            (libc::SYS_fstat, SeccompAction::Allow),
            (libc::SYS_lstat, SeccompAction::Allow),
            (libc::SYS_poll, SeccompAction::Allow),
            (libc::SYS_lseek, SeccompAction::Allow),
            (libc::SYS_mmap, SeccompAction::Allow),
            (libc::SYS_mprotect, SeccompAction::Allow),
            (libc::SYS_munmap, SeccompAction::Allow),
            (libc::SYS_brk, SeccompAction::Allow),
            (libc::SYS_rt_sigaction, SeccompAction::Allow),
            (libc::SYS_rt_sigprocmask, SeccompAction::Allow),
            (libc::SYS_rt_sigreturn, SeccompAction::Allow),
            (libc::SYS_ioctl, SeccompAction::Allow),
            (libc::SYS_pread64, SeccompAction::Allow),
            (libc::SYS_pwrite64, SeccompAction::Allow),
            (libc::SYS_readv, SeccompAction::Allow),
            (libc::SYS_writev, SeccompAction::Allow),
            (libc::SYS_access, SeccompAction::Allow),
            (libc::SYS_pipe, SeccompAction::Allow),
            (libc::SYS_select, SeccompAction::Allow),
            (libc::SYS_sched_yield, SeccompAction::Allow),
            (libc::SYS_mremap, SeccompAction::Allow),
            (libc::SYS_msync, SeccompAction::Allow),
            (libc::SYS_mincore, SeccompAction::Allow),
            (libc::SYS_madvise, SeccompAction::Allow),
            (libc::SYS_dup, SeccompAction::Allow),
            (libc::SYS_dup2, SeccompAction::Allow),
            (libc::SYS_pause, SeccompAction::Allow),
            (libc::SYS_nanosleep, SeccompAction::Allow),
            (libc::SYS_getitimer, SeccompAction::Allow),
            (libc::SYS_alarm, SeccompAction::Allow),
            (libc::SYS_setitimer, SeccompAction::Allow),
            (libc::SYS_getpid, SeccompAction::Allow),
            (libc::SYS_sendfile, SeccompAction::Allow),
            (libc::SYS_socket, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_connect, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_accept, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_sendto, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_recvfrom, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_sendmsg, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_recvmsg, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_shutdown, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_bind, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_listen, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_getsockname, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_getpeername, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_socketpair, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_setsockopt, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_getsockopt, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_clone, SeccompAction::Allow),
            (libc::SYS_fork, SeccompAction::Errno(libc::EACCES)), // fork禁止
            (libc::SYS_vfork, SeccompAction::Errno(libc::EACCES)), // vfork禁止
            (libc::SYS_execve, SeccompAction::Allow),
            (libc::SYS_exit, SeccompAction::Allow),
            (libc::SYS_wait4, SeccompAction::Allow),
            (libc::SYS_kill, SeccompAction::Errno(libc::EACCES)), // kill禁止
            (libc::SYS_uname, SeccompAction::Allow),
            (libc::SYS_fcntl, SeccompAction::Allow),
            (libc::SYS_flock, SeccompAction::Allow),
            (libc::SYS_fsync, SeccompAction::Allow),
            (libc::SYS_fdatasync, SeccompAction::Allow),
            (libc::SYS_truncate, SeccompAction::Allow),
            (libc::SYS_ftruncate, SeccompAction::Allow),
            (libc::SYS_getdents, SeccompAction::Allow),
            (libc::SYS_getcwd, SeccompAction::Allow),
            (libc::SYS_chdir, SeccompAction::Allow),
            (libc::SYS_fchdir, SeccompAction::Allow),
            (libc::SYS_rename, SeccompAction::Allow),
            (libc::SYS_mkdir, SeccompAction::Allow),
            (libc::SYS_rmdir, SeccompAction::Allow),
            (libc::SYS_creat, SeccompAction::Allow),
            (libc::SYS_link, SeccompAction::Allow),
            (libc::SYS_unlink, SeccompAction::Allow),
            (libc::SYS_symlink, SeccompAction::Allow),
            (libc::SYS_readlink, SeccompAction::Allow),
            (libc::SYS_chmod, SeccompAction::Allow),
            (libc::SYS_fchmod, SeccompAction::Allow),
            (libc::SYS_chown, SeccompAction::Errno(libc::EACCES)), // chown禁止
            (libc::SYS_fchown, SeccompAction::Errno(libc::EACCES)), // fchown禁止
            (libc::SYS_lchown, SeccompAction::Errno(libc::EACCES)), // lchown禁止
            (libc::SYS_umask, SeccompAction::Allow),
            (libc::SYS_gettimeofday, SeccompAction::Allow),
            (libc::SYS_getrlimit, SeccompAction::Allow),
            (libc::SYS_getrusage, SeccompAction::Allow),
            (libc::SYS_sysinfo, SeccompAction::Allow),
            (libc::SYS_times, SeccompAction::Allow),
            (libc::SYS_ptrace, SeccompAction::Errno(libc::EACCES)), // ptrace禁止
            (libc::SYS_getuid, SeccompAction::Allow),
            (libc::SYS_syslog, SeccompAction::Errno(libc::EACCES)), // syslog禁止
            (libc::SYS_getgid, SeccompAction::Allow),
            (libc::SYS_setuid, SeccompAction::Errno(libc::EACCES)), // setuid禁止
            (libc::SYS_setgid, SeccompAction::Errno(libc::EACCES)), // setgid禁止
            (libc::SYS_geteuid, SeccompAction::Allow),
            (libc::SYS_getegid, SeccompAction::Allow),
            (libc::SYS_setpgid, SeccompAction::Allow),
            (libc::SYS_getppid, SeccompAction::Allow),
            (libc::SYS_getpgrp, SeccompAction::Allow),
            (libc::SYS_setsid, SeccompAction::Allow),
            (libc::SYS_setreuid, SeccompAction::Errno(libc::EACCES)), // setreuid禁止
            (libc::SYS_setregid, SeccompAction::Errno(libc::EACCES)), // setregid禁止
            (libc::SYS_getgroups, SeccompAction::Allow),
            (libc::SYS_setgroups, SeccompAction::Errno(libc::EACCES)), // setgroups禁止
            (libc::SYS_setresuid, SeccompAction::Errno(libc::EACCES)), // setresuid禁止
            (libc::SYS_getresuid, SeccompAction::Allow),
            (libc::SYS_setresgid, SeccompAction::Errno(libc::EACCES)), // setresgid禁止
            (libc::SYS_getresgid, SeccompAction::Allow),
            (libc::SYS_getpgid, SeccompAction::Allow),
            (libc::SYS_setfsuid, SeccompAction::Errno(libc::EACCES)), // setfsuid禁止
            (libc::SYS_setfsgid, SeccompAction::Errno(libc::EACCES)), // setfsgid禁止
            (libc::SYS_getsid, SeccompAction::Allow),
            (libc::SYS_capget, SeccompAction::Allow),
            (libc::SYS_capset, SeccompAction::Errno(libc::EACCES)), // capset禁止
            (libc::SYS_rt_sigpending, SeccompAction::Allow),
            (libc::SYS_rt_sigtimedwait, SeccompAction::Allow),
            (libc::SYS_rt_sigqueueinfo, SeccompAction::Allow),
            (libc::SYS_rt_sigsuspend, SeccompAction::Allow),
            (libc::SYS_sigaltstack, SeccompAction::Allow),
            (libc::SYS_utime, SeccompAction::Allow),
            (libc::SYS_mknod, SeccompAction::Errno(libc::EACCES)), // mknod禁止
            (libc::SYS_personality, SeccompAction::Allow),
            (libc::SYS_statfs, SeccompAction::Allow),
            (libc::SYS_fstatfs, SeccompAction::Allow),
            (libc::SYS_getpriority, SeccompAction::Allow),
            (libc::SYS_setpriority, SeccompAction::Allow),
            (libc::SYS_sched_setparam, SeccompAction::Allow),
            (libc::SYS_sched_getparam, SeccompAction::Allow),
            (libc::SYS_sched_setscheduler, SeccompAction::Allow),
            (libc::SYS_sched_getscheduler, SeccompAction::Allow),
            (libc::SYS_sched_get_priority_max, SeccompAction::Allow),
            (libc::SYS_sched_get_priority_min, SeccompAction::Allow),
            (libc::SYS_sched_rr_get_interval, SeccompAction::Allow),
            (libc::SYS_mlock, SeccompAction::Allow),
            (libc::SYS_munlock, SeccompAction::Allow),
            (libc::SYS_mlockall, SeccompAction::Allow),
            (libc::SYS_munlockall, SeccompAction::Allow),
            (libc::SYS_modify_ldt, SeccompAction::Errno(libc::EACCES)), // modify_ldt禁止
            (libc::SYS_pivot_root, SeccompAction::Errno(libc::EACCES)), // pivot_root禁止
            (libc::SYS_prctl, SeccompAction::Allow),
            (libc::SYS_arch_prctl, SeccompAction::Allow),
            (libc::SYS_adjtimex, SeccompAction::Errno(libc::EACCES)), // adjtimex禁止
            (libc::SYS_setrlimit, SeccompAction::Allow),
            (libc::SYS_chroot, SeccompAction::Errno(libc::EACCES)), // chroot禁止
            (libc::SYS_sync, SeccompAction::Allow),
            (libc::SYS_acct, SeccompAction::Errno(libc::EACCES)), // acct禁止
            (libc::SYS_settimeofday, SeccompAction::Errno(libc::EACCES)), // settimeofday禁止
            (libc::SYS_mount, SeccompAction::Errno(libc::EACCES)), // mount禁止
            (libc::SYS_umount2, SeccompAction::Errno(libc::EACCES)), // umount2禁止
            (libc::SYS_swapon, SeccompAction::Errno(libc::EACCES)), // swapon禁止
            (libc::SYS_swapoff, SeccompAction::Errno(libc::EACCES)), // swapoff禁止
            (libc::SYS_reboot, SeccompAction::Errno(libc::EACCES)), // reboot禁止
            (libc::SYS_sethostname, SeccompAction::Errno(libc::EACCES)), // sethostname禁止
            (libc::SYS_setdomainname, SeccompAction::Errno(libc::EACCES)), // setdomainname禁止
            (libc::SYS_iopl, SeccompAction::Errno(libc::EACCES)), // iopl禁止
            (libc::SYS_ioperm, SeccompAction::Errno(libc::EACCES)), // ioperm禁止
            (libc::SYS_init_module, SeccompAction::Errno(libc::EACCES)), // init_module禁止
            (libc::SYS_delete_module, SeccompAction::Errno(libc::EACCES)), // delete_module禁止
            (libc::SYS_quotactl, SeccompAction::Errno(libc::EACCES)), // quotactl禁止
            (libc::SYS_gettid, SeccompAction::Allow),
            (libc::SYS_readahead, SeccompAction::Allow),
            (libc::SYS_setxattr, SeccompAction::Allow),
            (libc::SYS_lsetxattr, SeccompAction::Allow),
            (libc::SYS_fsetxattr, SeccompAction::Allow),
            (libc::SYS_getxattr, SeccompAction::Allow),
            (libc::SYS_lgetxattr, SeccompAction::Allow),
            (libc::SYS_fgetxattr, SeccompAction::Allow),
            (libc::SYS_listxattr, SeccompAction::Allow),
            (libc::SYS_llistxattr, SeccompAction::Allow),
            (libc::SYS_flistxattr, SeccompAction::Allow),
            (libc::SYS_removexattr, SeccompAction::Allow),
            (libc::SYS_lremovexattr, SeccompAction::Allow),
            (libc::SYS_fremovexattr, SeccompAction::Allow),
            (libc::SYS_tkill, SeccompAction::Errno(libc::EACCES)), // tkill禁止
            (libc::SYS_time, SeccompAction::Allow),
            (libc::SYS_futex, SeccompAction::Allow),
            (libc::SYS_sched_setaffinity, SeccompAction::Allow),
            (libc::SYS_sched_getaffinity, SeccompAction::Allow),
            (libc::SYS_io_setup, SeccompAction::Allow),
            (libc::SYS_io_destroy, SeccompAction::Allow),
            (libc::SYS_io_getevents, SeccompAction::Allow),
            (libc::SYS_io_submit, SeccompAction::Allow),
            (libc::SYS_io_cancel, SeccompAction::Allow),
            (libc::SYS_lookup_dcookie, SeccompAction::Errno(libc::EACCES)), // lookup_dcookie禁止
            (libc::SYS_epoll_create, SeccompAction::Allow),
            (libc::SYS_getdents64, SeccompAction::Allow),
            (libc::SYS_set_tid_address, SeccompAction::Allow),
            (libc::SYS_restart_syscall, SeccompAction::Allow),
            (libc::SYS_semtimedop, SeccompAction::Allow),
            (libc::SYS_fadvise64, SeccompAction::Allow),
            (libc::SYS_timer_create, SeccompAction::Allow),
            (libc::SYS_timer_settime, SeccompAction::Allow),
            (libc::SYS_timer_gettime, SeccompAction::Allow),
            (libc::SYS_timer_getoverrun, SeccompAction::Allow),
            (libc::SYS_timer_delete, SeccompAction::Allow),
            (libc::SYS_clock_settime, SeccompAction::Errno(libc::EACCES)), // clock_settime禁止
            (libc::SYS_clock_gettime, SeccompAction::Allow),
            (libc::SYS_clock_getres, SeccompAction::Allow),
            (libc::SYS_clock_nanosleep, SeccompAction::Allow),
            (libc::SYS_exit_group, SeccompAction::Allow),
            (libc::SYS_epoll_wait, SeccompAction::Allow),
            (libc::SYS_epoll_ctl, SeccompAction::Allow),
            (libc::SYS_tgkill, SeccompAction::Errno(libc::EACCES)), // tgkill禁止
            (libc::SYS_utimes, SeccompAction::Allow),
            (libc::SYS_mbind, SeccompAction::Allow),
            (libc::SYS_set_mempolicy, SeccompAction::Allow),
            (libc::SYS_get_mempolicy, SeccompAction::Allow),
            (libc::SYS_mq_open, SeccompAction::Allow),
            (libc::SYS_mq_unlink, SeccompAction::Allow),
            (libc::SYS_mq_timedsend, SeccompAction::Allow),
            (libc::SYS_mq_timedreceive, SeccompAction::Allow),
            (libc::SYS_mq_notify, SeccompAction::Allow),
            (libc::SYS_mq_getsetattr, SeccompAction::Allow),
            (libc::SYS_kexec_load, SeccompAction::Errno(libc::EACCES)), // kexec_load禁止
            (libc::SYS_waitid, SeccompAction::Allow),
            (libc::SYS_add_key, SeccompAction::Errno(libc::EACCES)), // add_key禁止
            (libc::SYS_request_key, SeccompAction::Errno(libc::EACCES)), // request_key禁止
            (libc::SYS_keyctl, SeccompAction::Errno(libc::EACCES)), // keyctl禁止
            (libc::SYS_ioprio_set, SeccompAction::Allow),
            (libc::SYS_ioprio_get, SeccompAction::Allow),
            (libc::SYS_inotify_init, SeccompAction::Allow),
            (libc::SYS_inotify_add_watch, SeccompAction::Allow),
            (libc::SYS_inotify_rm_watch, SeccompAction::Allow),
            (libc::SYS_migrate_pages, SeccompAction::Errno(libc::EACCES)), // migrate_pages禁止
            (libc::SYS_openat, SeccompAction::Allow),
            (libc::SYS_mkdirat, SeccompAction::Allow),
            (libc::SYS_mknodat, SeccompAction::Errno(libc::EACCES)), // mknodat禁止
            (libc::SYS_fchownat, SeccompAction::Errno(libc::EACCES)), // fchownat禁止
            (libc::SYS_futimesat, SeccompAction::Allow),
            (libc::SYS_newfstatat, SeccompAction::Allow),
            (libc::SYS_unlinkat, SeccompAction::Allow),
            (libc::SYS_renameat, SeccompAction::Allow),
            (libc::SYS_linkat, SeccompAction::Allow),
            (libc::SYS_symlinkat, SeccompAction::Allow),
            (libc::SYS_readlinkat, SeccompAction::Allow),
            (libc::SYS_fchmodat, SeccompAction::Allow),
            (libc::SYS_faccessat, SeccompAction::Allow),
            (libc::SYS_pselect6, SeccompAction::Allow),
            (libc::SYS_ppoll, SeccompAction::Allow),
            (libc::SYS_unshare, SeccompAction::Errno(libc::EACCES)), // unshare禁止
            (libc::SYS_set_robust_list, SeccompAction::Allow),
            (libc::SYS_get_robust_list, SeccompAction::Allow),
            (libc::SYS_splice, SeccompAction::Allow),
            (libc::SYS_tee, SeccompAction::Allow),
            (libc::SYS_sync_file_range, SeccompAction::Allow),
            (libc::SYS_vmsplice, SeccompAction::Allow),
            (libc::SYS_move_pages, SeccompAction::Errno(libc::EACCES)), // move_pages禁止
            (libc::SYS_utimensat, SeccompAction::Allow),
            (libc::SYS_epoll_pwait, SeccompAction::Allow),
            (libc::SYS_signalfd, SeccompAction::Allow),
            (libc::SYS_timerfd_create, SeccompAction::Allow),
            (libc::SYS_eventfd, SeccompAction::Allow),
            (libc::SYS_fallocate, SeccompAction::Allow),
            (libc::SYS_timerfd_settime, SeccompAction::Allow),
            (libc::SYS_timerfd_gettime, SeccompAction::Allow),
            (libc::SYS_accept4, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_signalfd4, SeccompAction::Allow),
            (libc::SYS_eventfd2, SeccompAction::Allow),
            (libc::SYS_epoll_create1, SeccompAction::Allow),
            (libc::SYS_dup3, SeccompAction::Allow),
            (libc::SYS_pipe2, SeccompAction::Allow),
            (libc::SYS_inotify_init1, SeccompAction::Allow),
            (libc::SYS_preadv, SeccompAction::Allow),
            (libc::SYS_pwritev, SeccompAction::Allow),
            (libc::SYS_rt_tgsigqueueinfo, SeccompAction::Allow),
            (libc::SYS_perf_event_open, SeccompAction::Errno(libc::EACCES)), // perf_event_open禁止
            (libc::SYS_recvmmsg, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_fanotify_init, SeccompAction::Errno(libc::EACCES)), // fanotify_init禁止
            (libc::SYS_fanotify_mark, SeccompAction::Errno(libc::EACCES)), // fanotify_mark禁止
            (libc::SYS_prlimit64, SeccompAction::Allow),
            (libc::SYS_name_to_handle_at, SeccompAction::Allow),
            (libc::SYS_open_by_handle_at, SeccompAction::Allow),
            (libc::SYS_clock_adjtime, SeccompAction::Errno(libc::EACCES)), // clock_adjtime禁止
            (libc::SYS_syncfs, SeccompAction::Allow),
            (libc::SYS_sendmmsg, if allow_network { SeccompAction::Allow } else { SeccompAction::Errno(libc::EACCES) }),
            (libc::SYS_setns, SeccompAction::Errno(libc::EACCES)), // setns禁止
            (libc::SYS_getcpu, SeccompAction::Allow),
            (libc::SYS_process_vm_readv, SeccompAction::Errno(libc::EACCES)), // process_vm_readv禁止
            (libc::SYS_process_vm_writev, SeccompAction::Errno(libc::EACCES)), // process_vm_writev禁止
            (libc::SYS_kcmp, SeccompAction::Errno(libc::EACCES)), // kcmp禁止
            (libc::SYS_finit_module, SeccompAction::Errno(libc::EACCES)), // finit_module禁止
            (libc::SYS_sched_setattr, SeccompAction::Allow),
            (libc::SYS_sched_getattr, SeccompAction::Allow),
            (libc::SYS_renameat2, SeccompAction::Allow),
            (libc::SYS_seccomp, SeccompAction::Allow),
            (libc::SYS_getrandom, SeccompAction::Allow),
            (libc::SYS_memfd_create, SeccompAction::Allow),
            (libc::SYS_kexec_file_load, SeccompAction::Errno(libc::EACCES)), // kexec_file_load禁止
            (libc::SYS_bpf, SeccompAction::Errno(libc::EACCES)), // bpf禁止
            (libc::SYS_userfaultfd, SeccompAction::Errno(libc::EACCES)), // userfaultfd禁止
            (libc::SYS_membarrier, SeccompAction::Allow),
            (libc::SYS_mlock2, SeccompAction::Allow),
            (libc::SYS_copy_file_range, SeccompAction::Allow),
            (libc::SYS_preadv2, SeccompAction::Allow),
            (libc::SYS_pwritev2, SeccompAction::Allow),
            (libc::SYS_pkey_mprotect, SeccompAction::Allow),
            (libc::SYS_pkey_alloc, SeccompAction::Allow),
            (libc::SYS_pkey_free, SeccompAction::Allow),
            (libc::SYS_statx, SeccompAction::Allow),
        ]
            .into_iter()
            .collect(),
        SeccompAction::Errno(libc::EPERM), // デフォルトは禁止
    )?;

    Ok(filter.try_into()?)
}
```

---

**(続きは次のパートで...)**

このドキュメントには、さらに以下が含まれます：
- macOS Seatbelt実装
- miyabi-apply-patch実装
- 統合手順の詳細
- テスト戦略
- マイグレーションガイド

音声で解説を続けています！

### 2.5 macOS実装 (macos.rs)

```rust
use super::common::{SandboxConfig, SandboxResult};
use anyhow::Result;
use std::fs;
use std::process::Command as StdCommand;
use tokio::process::Command;

pub async fn execute_sandboxed(config: SandboxConfig) -> Result<SandboxResult> {
    // Seatbeltプロファイル生成
    let profile = create_seatbelt_profile(&config)?;
    
    // 一時ファイルにプロファイルを書き込み
    let profile_path = "/tmp/miyabi_sandbox_profile.sb";
    fs::write(profile_path, profile)?;

    // sb_exec でサンドボックス実行
    let mut command = Command::new("/usr/bin/sandbox-exec");
    command.arg("-f").arg(profile_path);
    command.arg(&config.command);
    command.args(&config.args);

    if let Some(cwd) = config.working_dir {
        command.current_dir(cwd);
    }

    // 環境変数設定
    command.env("MIYABI_SANDBOX", "seatbelt");
    if !config.allow_network {
        command.env("MIYABI_SANDBOX_NETWORK_DISABLED", "1");
    }

    // 実行
    let output = command.output().await?;

    // 一時ファイル削除
    let _ = fs::remove_file(profile_path);

    Ok(SandboxResult {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}

fn create_seatbelt_profile(config: &SandboxConfig) -> Result<String> {
    let mut profile = String::from("(version 1)\n");
    profile.push_str("(debug deny)\n\n");

    // デフォルトですべて拒否
    profile.push_str("(deny default)\n\n");

    // 基本的な読み取り許可
    profile.push_str("(allow file-read*\n");
    profile.push_str("  (subpath \"/System\")\n");
    profile.push_str("  (subpath \"/usr/lib\")\n");
    profile.push_str("  (subpath \"/usr/share\")\n");
    profile.push_str("  (subpath \"/Library\")\n");
    profile.push_str("  (literal \"/dev/null\")\n");
    profile.push_str("  (literal \"/dev/random\")\n");
    profile.push_str("  (literal \"/dev/urandom\")\n");
    
    // ユーザー指定の読み取りパス
    for path in &config.allowed_read_paths {
        profile.push_str(&format!("  (subpath \"{}\")\n", path.display()));
    }
    profile.push_str(")\n\n");

    // 書き込み許可
    profile.push_str("(allow file-write*\n");
    for path in &config.allowed_write_paths {
        profile.push_str(&format!("  (subpath \"{}\")\n", path.display()));
    }
    profile.push_str(")\n\n");

    // プロセス実行許可
    profile.push_str("(allow process-exec\n");
    profile.push_str("  (literal \"/bin/sh\")\n");
    profile.push_str("  (literal \"/bin/bash\")\n");
    profile.push_str("  (literal \"/usr/bin/env\")\n");
    profile.push_str(&format!("  (literal \"{}\")\n", config.command));
    profile.push_str(")\n\n");

    // ネットワーク制御
    if config.allow_network {
        profile.push_str("(allow network*)\n\n");
    } else {
        profile.push_str("(deny network*)\n\n");
    }

    // IPC許可
    profile.push_str("(allow ipc-posix-shm)\n");
    profile.push_str("(allow mach-lookup)\n\n");

    // シグナル許可
    profile.push_str("(allow signal)\n\n");

    // sysctl許可（限定的）
    profile.push_str("(allow sysctl-read)\n");
    profile.push_str("(deny sysctl-write)\n\n");

    Ok(profile)
}
```

---

## 3. miyabi-apply-patch 実装詳細

### 3.1 ディレクトリ構造

```
crates/miyabi-apply-patch/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── patch.rs      # パッチ生成・適用
│   └── diff.rs       # 差分計算
└── tests/
    └── patch_test.rs
```

### 3.2 Cargo.toml

```toml
[package]
name = "miyabi-apply-patch"
version = "0.1.0"
edition = "2021"

[dependencies]
anyhow = "1"
thiserror = "2"
diffy = "0.4.2"
similar = "2.7.0"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[dev-dependencies]
tempfile = "3"
```

### 3.3 パッチ構造体 (patch.rs)

```rust
use anyhow::Result;
use diffy::{Patch, apply};
use similar::{ChangeTag, TextDiff};
use std::fs;
use std::path::Path;

/// パッチ操作
#[derive(Debug, Clone)]
pub struct PatchOperation {
    pub file_path: String,
    pub old_content: String,
    pub new_content: String,
}

impl PatchOperation {
    /// ファイルからパッチ生成
    pub fn from_file<P: AsRef<Path>>(
        path: P,
        old_content: &str,
        new_content: &str,
    ) -> Self {
        Self {
            file_path: path.as_ref().to_string_lossy().to_string(),
            old_content: old_content.to_string(),
            new_content: new_content.to_string(),
        }
    }

    /// Unified diff 生成
    pub fn generate_diff(&self) -> String {
        let diff = TextDiff::from_lines(&self.old_content, &self.new_content);
        
        let mut result = String::new();
        result.push_str(&format!("--- {}\n", self.file_path));
        result.push_str(&format!("+++ {}\n", self.file_path));
        
        for (idx, group) in diff.grouped_ops(3).iter().enumerate() {
            if idx > 0 {
                result.push('\n');
            }
            
            for op in group {
                for change in diff.iter_inline_changes(op) {
                    let (sign, style) = match change.tag() {
                        ChangeTag::Delete => ('-', "\x1b[31m"),
                        ChangeTag::Insert => ('+', "\x1b[32m"),
                        ChangeTag::Equal => (' ', ""),
                    };
                    
                    result.push_str(&format!(
                        "{}{}{}\x1b[0m",
                        sign,
                        style,
                        change
                    ));
                }
            }
        }
        
        result
    }

    /// パッチ適用
    pub fn apply(&self) -> Result<()> {
        // 現在のファイル内容を読み込み
        let current_content = fs::read_to_string(&self.file_path)?;
        
        // old_content と一致するか確認
        if current_content != self.old_content {
            anyhow::bail!(
                "File content mismatch: expected old content to match current file"
            );
        }
        
        // 新しい内容を書き込み
        fs::write(&self.file_path, &self.new_content)?;
        
        Ok(())
    }

    /// 安全な置換（文字列ベース）
    pub fn safe_replace(
        file_path: &str,
        old_string: &str,
        new_string: &str,
    ) -> Result<()> {
        let content = fs::read_to_string(file_path)?;
        
        // old_string が一意か確認
        let count = content.matches(old_string).count();
        if count == 0 {
            anyhow::bail!("Old string not found in file");
        }
        if count > 1 {
            anyhow::bail!(
                "Old string appears {} times; must be unique for safe replacement",
                count
            );
        }
        
        // 置換
        let new_content = content.replace(old_string, new_string);
        
        // 書き込み
        fs::write(file_path, new_content)?;
        
        Ok(())
    }

    /// 全置換（replace_all）
    pub fn replace_all(
        file_path: &str,
        old_string: &str,
        new_string: &str,
    ) -> Result<usize> {
        let content = fs::read_to_string(file_path)?;
        
        let count = content.matches(old_string).count();
        if count == 0 {
            anyhow::bail!("Old string not found in file");
        }
        
        let new_content = content.replace(old_string, new_string);
        fs::write(file_path, new_content)?;
        
        Ok(count)
    }
}

/// パッチセット（複数ファイルの変更）
#[derive(Debug, Clone)]
pub struct PatchSet {
    pub operations: Vec<PatchOperation>,
}

impl PatchSet {
    pub fn new() -> Self {
        Self {
            operations: Vec::new(),
        }
    }

    pub fn add(&mut self, op: PatchOperation) {
        self.operations.push(op);
    }

    /// すべてのパッチを適用
    pub fn apply_all(&self) -> Result<Vec<String>> {
        let mut applied = Vec::new();
        
        for op in &self.operations {
            op.apply()?;
            applied.push(op.file_path.clone());
        }
        
        Ok(applied)
    }

    /// Unified diff 全体を生成
    pub fn generate_full_diff(&self) -> String {
        self.operations
            .iter()
            .map(|op| op.generate_diff())
            .collect::<Vec<_>>()
            .join("\n\n")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;
    use std::io::Write;

    #[test]
    fn test_safe_replace() {
        let mut file = NamedTempFile::new().unwrap();
        writeln!(file, "Hello, World!").unwrap();
        
        let path = file.path().to_str().unwrap();
        
        PatchOperation::safe_replace(
            path,
            "World",
            "Miyabi",
        ).unwrap();
        
        let content = fs::read_to_string(path).unwrap();
        assert_eq!(content, "Hello, Miyabi!\n");
    }

    #[test]
    fn test_replace_all() {
        let mut file = NamedTempFile::new().unwrap();
        writeln!(file, "foo foo foo").unwrap();
        
        let path = file.path().to_str().unwrap();
        
        let count = PatchOperation::replace_all(
            path,
            "foo",
            "bar",
        ).unwrap();
        
        assert_eq!(count, 3);
        
        let content = fs::read_to_string(path).unwrap();
        assert_eq!(content, "bar bar bar\n");
    }
}
```

---

## 4. 統合手順

### 4.1 miyabi-cli への TUI 統合

**crates/miyabi-cli/src/main.rs**

```rust
use clap::{Parser, Subcommand};
use anyhow::Result;

#[derive(Parser)]
#[command(name = "miyabi")]
#[command(about = "Miyabi - Autonomous Development Framework")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
    
    /// TUIモードで起動
    #[arg(long, global = true)]
    tui: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// エージェント実行
    Agent {
        #[arg(long)]
        name: String,
        
        #[arg(long)]
        issue: Option<u64>,
    },
    
    /// チャットモード
    Chat {
        /// 初期プロンプト
        prompt: Option<String>,
    },
    
    /// 非対話実行
    Exec {
        /// 実行するプロンプト
        prompt: String,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Chat { prompt } => {
            if cli.tui {
                // TUIモードで起動
                miyabi_tui::App::new().run().await?;
            } else {
                // 従来のCLIモード
                miyabi_core::chat::run_chat(prompt).await?;
            }
        }
        Commands::Agent { name, issue } => {
            if cli.tui {
                // TUIでエージェント実行を表示
                miyabi_tui::run_agent_with_tui(&name, issue).await?;
            } else {
                miyabi_core::agent::run_agent(&name, issue).await?;
            }
        }
        Commands::Exec { prompt } => {
            // exec は常に非対話
            miyabi_core::exec::run_non_interactive(&prompt).await?;
        }
    }
    
    Ok(())
}
```

### 4.2 miyabi-core へのサンドボックス統合

**crates/miyabi-core/src/executor.rs**

```rust
use miyabi_sandbox::{SandboxConfig, execute_sandboxed};
use std::path::PathBuf;
use anyhow::Result;

pub struct Executor {
    /// サンドボックスを使用するか
    use_sandbox: bool,
    
    /// 読み取り許可パス
    allowed_read_paths: Vec<PathBuf>,
    
    /// 書き込み許可パス
    allowed_write_paths: Vec<PathBuf>,
    
    /// ネットワーク許可
    allow_network: bool,
}

impl Executor {
    pub fn new() -> Self {
        Self {
            use_sandbox: true, // デフォルトで有効
            allowed_read_paths: vec![
                PathBuf::from("/tmp"),
                PathBuf::from(std::env::current_dir().unwrap()),
            ],
            allowed_write_paths: vec![
                PathBuf::from("/tmp"),
                PathBuf::from(std::env::current_dir().unwrap()),
            ],
            allow_network: false, // デフォルトで無効
        }
    }

    /// コマンド実行
    pub async fn execute_command(
        &self,
        command: &str,
        args: &[String],
    ) -> Result<ExecutionResult> {
        if self.use_sandbox {
            // サンドボックスで実行
            let config = SandboxConfig {
                allowed_read_paths: self.allowed_read_paths.clone(),
                allowed_write_paths: self.allowed_write_paths.clone(),
                allow_network: self.allow_network,
                command: command.to_string(),
                args: args.to_vec(),
                working_dir: Some(std::env::current_dir()?),
            };
            
            let result = execute_sandboxed(config).await?;
            
            Ok(ExecutionResult {
                stdout: result.stdout,
                stderr: result.stderr,
                exit_code: result.exit_code,
            })
        } else {
            // サンドボックスなしで実行
            use tokio::process::Command;
            
            let output = Command::new(command)
                .args(args)
                .output()
                .await?;
            
            Ok(ExecutionResult {
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                exit_code: output.status.code().unwrap_or(-1),
            })
        }
    }
}

#[derive(Debug)]
pub struct ExecutionResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}
```

### 4.3 miyabi-orchestrator への進捗表示統合

**crates/miyabi-orchestrator/src/lib.rs**

```rust
use miyabi_tui::ProgressReporter;

pub struct Orchestrator {
    progress_reporter: Option<Box<dyn ProgressReporter>>,
}

impl Orchestrator {
    /// TUI進捗レポーターを設定
    pub fn with_tui_reporter(mut self, reporter: Box<dyn ProgressReporter>) -> Self {
        self.progress_reporter = Some(reporter);
        self
    }

    /// エージェント実行
    pub async fn run_agent(&mut self, agent_name: &str) -> Result<()> {
        // 進捗報告
        if let Some(reporter) = &self.progress_reporter {
            reporter.report_status(&format!("Starting agent: {}", agent_name));
        }
        
        // エージェント実行ロジック
        // ...
        
        if let Some(reporter) = &self.progress_reporter {
            reporter.report_status(&format!("Agent {} completed", agent_name));
        }
        
        Ok(())
    }
}

/// 進捗レポーター trait
pub trait ProgressReporter: Send + Sync {
    fn report_status(&self, message: &str);
    fn report_progress(&self, current: usize, total: usize);
    fn report_error(&self, error: &str);
}
```

---

## 5. テスト戦略

### 5.1 TUIテスト

**crates/miyabi-tui/tests/integration_test.rs**

```rust
#[cfg(test)]
mod tests {
    use miyabi_tui::App;

    #[test]
    fn test_message_addition() {
        let mut app = App::new();
        
        // ユーザーメッセージ追加
        app.add_user_message("Hello");
        
        assert_eq!(app.messages.len(), 1);
        assert_eq!(app.messages[0].content, "Hello");
    }

    #[test]
    fn test_input_handling() {
        let mut app = App::new();
        
        app.input = "test".to_string();
        app.cursor_position = 4;
        
        // Backspace
        app.handle_backspace();
        assert_eq!(app.input, "tes");
        assert_eq!(app.cursor_position, 3);
    }
}
```

### 5.2 サンドボックステスト

**crates/miyabi-sandbox/tests/sandbox_test.rs**

```rust
#[cfg(test)]
mod tests {
    use miyabi_sandbox::{SandboxConfig, execute_sandboxed};
    use std::path::PathBuf;

    #[tokio::test]
    async fn test_file_read_allowed() {
        let config = SandboxConfig {
            allowed_read_paths: vec![PathBuf::from("/tmp")],
            allowed_write_paths: vec![],
            allow_network: false,
            command: "cat".to_string(),
            args: vec!["/tmp/test.txt".to_string()],
            working_dir: None,
        };
        
        // 実行（エラーにならないことを確認）
        let result = execute_sandboxed(config).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_network_denied() {
        let config = SandboxConfig {
            allowed_read_paths: vec![],
            allowed_write_paths: vec![],
            allow_network: false,
            command: "curl".to_string(),
            args: vec!["https://example.com".to_string()],
            working_dir: None,
        };
        
        let result = execute_sandboxed(config).await;
        // ネットワークが拒否されるはず
        assert!(result.is_err() || result.unwrap().exit_code != 0);
    }
}
```

### 5.3 パッチテスト

**crates/miyabi-apply-patch/tests/patch_test.rs**

```rust
#[cfg(test)]
mod tests {
    use miyabi_apply_patch::PatchOperation;
    use tempfile::NamedTempFile;
    use std::io::Write;
    use std::fs;

    #[test]
    fn test_patch_generation() {
        let old_content = "line 1\nline 2\nline 3\n";
        let new_content = "line 1\nmodified line 2\nline 3\n";
        
        let patch = PatchOperation::from_file(
            "test.txt",
            old_content,
            new_content,
        );
        
        let diff = patch.generate_diff();
        
        assert!(diff.contains("-line 2"));
        assert!(diff.contains("+modified line 2"));
    }

    #[test]
    fn test_patch_application() {
        let mut file = NamedTempFile::new().unwrap();
        writeln!(file, "old content").unwrap();
        
        let path = file.path().to_str().unwrap();
        
        let patch = PatchOperation::from_file(
            path,
            "old content\n",
            "new content\n",
        );
        
        patch.apply().unwrap();
        
        let content = fs::read_to_string(path).unwrap();
        assert_eq!(content, "new content\n");
    }
}
```

---

## 6. マイグレーションガイド

### 6.1 段階的移行

**Phase 1: miyabi-tui 追加（2週間）**

1. クレート作成
   ```bash
   cd crates
   cargo new --lib miyabi-tui
   ```

2. 依存関係追加（Cargo.toml）

3. 基本実装（app.rs, widgets/）

4. miyabi-cli 統合

5. テスト

**Phase 2: miyabi-sandbox 追加（1週間）**

1. クレート作成
   ```bash
   cargo new --lib miyabi-sandbox
   ```

2. プラットフォーム別実装

3. miyabi-core 統合

4. テスト

**Phase 3: miyabi-apply-patch 追加（1週間）**

1. クレート作成
   ```bash
   cargo new --lib miyabi-apply-patch
   ```

2. パッチ機能実装

3. miyabi-core 統合

4. テスト

**Phase 4: 統合テスト（1週間）**

1. E2Eテスト作成

2. パフォーマンステスト

3. ドキュメント更新

4. リリース準備

### 6.2 既存コードの変更点

**最小限の変更で統合**

- miyabi-cli: `--tui` フラグ追加のみ
- miyabi-core: Executor に sandbox オプション追加
- miyabi-orchestrator: ProgressReporter 追加（オプショナル）

**後方互換性維持**

- TUIは opt-in（デフォルトはCLI）
- サンドボックスは設定で無効化可能
- 既存の動作は変更なし

---

---

## 7. Claude Code 機能拡張

### 7.1 Codex の Claude Code 拡張機能分析

Codexプロジェクトには、Claude Code向けの高度な拡張機能が実装されています。これらをMiyabiにも適用します。

**Codexの特徴的な拡張:**

1. **カスタムスキル (.claude/skills/)**
   - `agent-execution`: Agent実行統合
   - `rust-development`: Rust開発ワークフロー
   - `debugging-troubleshooting`: デバッグ支援

2. **スラッシュコマンド (.claude/commands/)**
   - `/generate-docs`: ドキュメント自動生成
   - `/create-issue`: Issue作成支援
   - `/deploy`: デプロイ実行

3. **MCP Server統合**
   - カスタムツール提供
   - プロジェクト固有のコンテキスト

4. **コンテキスト管理**
   - `.claude/context/` ディレクトリ構造
   - Just-In-Time Loading

### 7.2 新規スキル実装

#### 7.2.1 codex-integration スキル

**ファイル: .claude/skills/codex-integration.md**

```markdown
---
description: |
  Codexアーキテクチャ統合スキル - TUI/Sandbox/Apply-Patch機能の実装支援
location: project
---

# Codex Integration Skill

このスキルは、Miyabi に Codex アーキテクチャの機能を統合する際の支援を提供します。

## 🎯 スキル概要

**対象機能:**
1. **miyabi-tui** - ratatui ベースのターミナルUI
2. **miyabi-sandbox** - Landlock/Seccomp/Seatbelt セキュリティ層
3. **miyabi-apply-patch** - 安全なコード編集

## 📋 実行手順

### Phase 1: TUI実装

```bash
# 1. クレート作成
cd crates
cargo new --lib miyabi-tui

# 2. 依存関係追加
cat >> miyabi-tui/Cargo.toml <<EOF
[dependencies]
ratatui = { version = "0.29.0", features = ["scrolling-regions", "unstable-widget-ref"] }
crossterm = { version = "0.28.1", features = ["bracketed-paste", "event-stream"] }
pulldown-cmark = "0.10"
EOF

# 3. 基本構造作成
mkdir -p miyabi-tui/src/widgets
mkdir -p miyabi-tui/src/markdown
touch miyabi-tui/src/{app.rs,events.rs,state.rs}
touch miyabi-tui/src/widgets/{header.rs,messages.rs,composer.rs}
```

### Phase 2: Sandbox実装

```bash
# 1. クレート作成
cd crates
cargo new --lib miyabi-sandbox

# 2. プラットフォーム別依存関係
# Linux用
echo '[target."cfg(target_os = \"linux\")".dependencies]' >> miyabi-sandbox/Cargo.toml
echo 'landlock = "0.4.1"' >> miyabi-sandbox/Cargo.toml
echo 'seccompiler = "0.5.0"' >> miyabi-sandbox/Cargo.toml

# 3. 実装ファイル作成
mkdir -p miyabi-sandbox/src
touch miyabi-sandbox/src/{linux.rs,macos.rs,windows.rs,common.rs}
```

### Phase 3: Apply-Patch実装

```bash
# 1. クレート作成
cd crates
cargo new --lib miyabi-apply-patch

# 2. 依存関係
cat >> miyabi-apply-patch/Cargo.toml <<EOF
[dependencies]
diffy = "0.4.2"
similar = "2.7.0"
EOF

# 3. 実装
touch miyabi-apply-patch/src/{patch.rs,diff.rs}
```

## 🔍 使用例

**TUI起動:**
```bash
miyabi chat --tui
```

**サンドボックスで実行:**
```bash
miyabi exec --sandbox --command "cargo test"
```

**パッチ適用:**
```rust
use miyabi_apply_patch::PatchOperation;

PatchOperation::safe_replace(
    "src/lib.rs",
    "old implementation",
    "new implementation"
)?;
```

## 📖 参考ドキュメント

- [MIYABI_CODEX_IMPLEMENTATION_DETAILS.md](docs/MIYABI_CODEX_IMPLEMENTATION_DETAILS.md)
- [CODEX_PROJECT_ANALYSIS.md](docs/CODEX_PROJECT_ANALYSIS.md)
```

#### 7.2.2 tui-development スキル

**ファイル: .claude/skills/tui-development.md**

```markdown
---
description: |
  TUI開発支援スキル - ratatui/crossterm を使ったターミナルUI開発
location: project
---

# TUI Development Skill

ratatui と crossterm を使ったターミナルUI開発を支援します。

## 🎯 スキル機能

1. **Widget作成支援**
2. **イベント処理設計**
3. **レイアウト設計**
4. **Markdownレンダリング**
5. **シンタックスハイライト**

## 📋 Widget作成テンプレート

### 基本Widget

```rust
use ratatui::{
    widgets::{Block, Borders, Paragraph},
    layout::Rect,
    Frame,
    text::{Line, Span},
    style::{Color, Style},
};

pub struct MyWidget {
    title: String,
    content: Vec<String>,
}

impl MyWidget {
    pub fn new(title: impl Into<String>) -> Self {
        Self {
            title: title.into(),
            content: Vec::new(),
        }
    }

    pub fn render(&self, frame: &mut Frame, area: Rect) {
        let lines: Vec<Line> = self.content.iter()
            .map(|s| Line::from(Span::raw(s)))
            .collect();

        let paragraph = Paragraph::new(lines)
            .block(Block::default()
                .borders(Borders::ALL)
                .title(self.title.clone()));

        frame.render_widget(paragraph, area);
    }
}
```

### リスト Widget

```rust
use ratatui::widgets::{List, ListItem, ListState};

pub struct SelectableList {
    items: Vec<String>,
    state: ListState,
}

impl SelectableList {
    pub fn new(items: Vec<String>) -> Self {
        let mut state = ListState::default();
        state.select(Some(0));

        Self { items, state }
    }

    pub fn next(&mut self) {
        let i = match self.state.selected() {
            Some(i) => {
                if i >= self.items.len() - 1 {
                    0
                } else {
                    i + 1
                }
            }
            None => 0,
        };
        self.state.select(Some(i));
    }

    pub fn previous(&mut self) {
        let i = match self.state.selected() {
            Some(i) => {
                if i == 0 {
                    self.items.len() - 1
                } else {
                    i - 1
                }
            }
            None => 0,
        };
        self.state.select(Some(i));
    }

    pub fn render(&mut self, frame: &mut Frame, area: Rect) {
        let items: Vec<ListItem> = self.items.iter()
            .map(|s| ListItem::new(s.clone()))
            .collect();

        let list = List::new(items)
            .block(Block::default().borders(Borders::ALL).title("Items"))
            .highlight_style(Style::default().fg(Color::Yellow));

        frame.render_stateful_widget(list, area, &mut self.state);
    }
}
```

## 🎨 レイアウトパターン

### 3分割レイアウト（ヘッダー・コンテンツ・フッター）

```rust
use ratatui::layout::{Constraint, Direction, Layout};

fn create_layout(area: Rect) -> Vec<Rect> {
    Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),      // ヘッダー
            Constraint::Min(0),          // コンテンツ（残り全て）
            Constraint::Length(3),      // フッター
        ])
        .split(area)
        .to_vec()
}
```

### 横分割レイアウト（サイドバー・メイン）

```rust
fn create_sidebar_layout(area: Rect) -> Vec<Rect> {
    Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage(20), // サイドバー
            Constraint::Percentage(80), // メインエリア
        ])
        .split(area)
        .to_vec()
}
```

## ⌨️ イベント処理パターン

```rust
use crossterm::event::{self, Event, KeyCode, KeyEvent, KeyModifiers};

async fn handle_key_event(&mut self, key: KeyEvent) -> Result<()> {
    match key.code {
        // Ctrl+C: 終了
        KeyCode::Char('c') if key.modifiers.contains(KeyModifiers::CONTROL) => {
            self.should_quit = true;
        }

        // Enter: 送信
        KeyCode::Enter => {
            self.submit().await?;
        }

        // 上下矢印: リスト選択
        KeyCode::Up => {
            self.list.previous();
        }
        KeyCode::Down => {
            self.list.next();
        }

        // 文字入力
        KeyCode::Char(c) => {
            self.input.insert(self.cursor_position, c);
            self.cursor_position += 1;
        }

        // Backspace: 削除
        KeyCode::Backspace => {
            if self.cursor_position > 0 {
                self.input.remove(self.cursor_position - 1);
                self.cursor_position -= 1;
            }
        }

        _ => {}
    }
    Ok(())
}
```

## 📖 参考リンク

- [ratatui Documentation](https://docs.rs/ratatui)
- [crossterm Documentation](https://docs.rs/crossterm)
```

### 7.3 新規スラッシュコマンド

#### 7.3.1 /codex-migrate コマンド

**ファイル: .claude/commands/codex-migrate.md**

```markdown
Codex アーキテクチャ移行支援コマンド。

## 実行内容

1. **現在の実装状況チェック**
   - miyabi-tui の有無確認
   - miyabi-sandbox の有無確認
   - miyabi-apply-patch の有無確認

2. **依存関係チェック**
   - ratatui バージョン確認
   - landlock/seccompiler 確認
   - diffy/similar 確認

3. **実装ガイド表示**
   - 未実装の機能について、次のステップを提示
   - コード例を表示

4. **自動セットアップ（オプション）**
   - ユーザーの承認を得てから、クレート作成
   - 基本的なファイル構造を生成

## 使用方法

```bash
# 現在の実装状況チェック
/codex-migrate

# 自動セットアップ実行
/codex-migrate --auto-setup
```

---

**実行開始:**

まず、現在の Miyabi プロジェクトの Codex アーキテクチャ互換性をチェックします。

**Step 1: クレート存在確認**

```bash
ls -la crates/ | grep -E "miyabi-(tui|sandbox|apply-patch)"
```

**Step 2: Cargo.toml 依存関係確認**

```bash
# ratatui 確認
grep -r "ratatui" crates/*/Cargo.toml

# landlock 確認
grep -r "landlock" crates/*/Cargo.toml

# diffy 確認
grep -r "diffy" crates/*/Cargo.toml
```

**Step 3: 実装状況サマリー作成**

チェック結果を表形式で表示：

| Component | Status | Version | Notes |
|-----------|--------|---------|-------|
| miyabi-tui | ⚠️ Not Found | - | ratatui 0.29.0 required |
| miyabi-sandbox | ⚠️ Not Found | - | landlock 0.4.1 required |
| miyabi-apply-patch | ⚠️ Not Found | - | diffy 0.4.2 required |

**Step 4: 次のアクション提案**

未実装の機能について、優先順位付きで実装手順を提示します。

詳細は [MIYABI_CODEX_IMPLEMENTATION_DETAILS.md](docs/MIYABI_CODEX_IMPLEMENTATION_DETAILS.md) を参照してください。
```

#### 7.3.2 /tui-debug コマンド

**ファイル: .claude/commands/tui-debug.md**

```markdown
TUI デバッグ支援コマンド。

## 実行内容

1. **TUIビルド状態確認**
   ```bash
   cargo build -p miyabi-tui
   ```

2. **TUIテスト実行**
   ```bash
   cargo test -p miyabi-tui
   ```

3. **依存関係チェック**
   - ratatui バージョン互換性
   - crossterm バージョン互換性

4. **よくあるエラーの診断**
   - ターミナル初期化エラー
   - イベントループエラー
   - レンダリングエラー

---

**実行開始:**

miyabi-tui のデバッグを開始します。

```bash
# ビルドチェック
echo "=== Building miyabi-tui ==="
cargo build -p miyabi-tui 2>&1 | tee /tmp/miyabi-tui-build.log

# テスト実行
echo "=== Running tests ==="
cargo test -p miyabi-tui 2>&1 | tee /tmp/miyabi-tui-test.log

# 依存関係確認
echo "=== Checking dependencies ==="
cargo tree -p miyabi-tui | grep -E "ratatui|crossterm"
```

エラーが見つかった場合、診断結果と修正案を提示します。
```

### 7.4 MCP Server拡張

#### 7.4.1 Miyabi固有ツールの追加

**ファイル: crates/miyabi-mcp-server/src/tools/codex_tools.rs**

```rust
use anyhow::Result;
use serde_json::{json, Value};

/// Codex統合ツール
pub struct CodexTools;

impl CodexTools {
    /// TUI起動ツール
    pub async fn launch_tui(args: Value) -> Result<Value> {
        let prompt = args.get("prompt")
            .and_then(|v| v.as_str())
            .map(String::from);

        // miyabi-tui を起動
        let mut cmd = tokio::process::Command::new("miyabi");
        cmd.arg("chat").arg("--tui");

        if let Some(p) = prompt {
            cmd.arg("--prompt").arg(p);
        }

        let output = cmd.output().await?;

        Ok(json!({
            "status": "launched",
            "stdout": String::from_utf8_lossy(&output.stdout),
            "stderr": String::from_utf8_lossy(&output.stderr),
        }))
    }

    /// サンドボックス実行ツール
    pub async fn execute_sandboxed(args: Value) -> Result<Value> {
        let command = args.get("command")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("command required"))?;

        let allow_network = args.get("allow_network")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        let config = miyabi_sandbox::SandboxConfig {
            allowed_read_paths: vec![
                std::env::current_dir()?,
                std::path::PathBuf::from("/tmp"),
            ],
            allowed_write_paths: vec![
                std::path::PathBuf::from("/tmp"),
            ],
            allow_network,
            command: command.to_string(),
            args: vec![],
            working_dir: Some(std::env::current_dir()?),
        };

        let result = miyabi_sandbox::execute_sandboxed(config).await?;

        Ok(json!({
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.exit_code,
        }))
    }

    /// パッチ適用ツール
    pub async fn apply_patch(args: Value) -> Result<Value> {
        let file_path = args.get("file_path")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("file_path required"))?;

        let old_string = args.get("old_string")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("old_string required"))?;

        let new_string = args.get("new_string")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("new_string required"))?;

        let replace_all = args.get("replace_all")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        let result = if replace_all {
            miyabi_apply_patch::PatchOperation::replace_all(
                file_path,
                old_string,
                new_string,
            )?
        } else {
            miyabi_apply_patch::PatchOperation::safe_replace(
                file_path,
                old_string,
                new_string,
            )?;
            1
        };

        Ok(json!({
            "file_path": file_path,
            "replacements": result,
            "status": "applied",
        }))
    }
}
```

#### 7.4.2 MCP Server設定更新

**ファイル: crates/miyabi-mcp-server/src/registry.rs**

```rust
use super::tools::codex_tools::CodexTools;

pub fn register_codex_tools(registry: &mut ToolRegistry) {
    // TUI起動ツール
    registry.register(
        "launch_tui",
        "Launch Miyabi TUI interface",
        json!({
            "type": "object",
            "properties": {
                "prompt": {
                    "type": "string",
                    "description": "Initial prompt to send"
                }
            }
        }),
        |args| Box::pin(CodexTools::launch_tui(args)),
    );

    // サンドボックス実行ツール
    registry.register(
        "execute_sandboxed",
        "Execute command in sandbox",
        json!({
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "Command to execute"
                },
                "allow_network": {
                    "type": "boolean",
                    "description": "Allow network access"
                }
            },
            "required": ["command"]
        }),
        |args| Box::pin(CodexTools::execute_sandboxed(args)),
    );

    // パッチ適用ツール
    registry.register(
        "apply_patch",
        "Apply code patch safely",
        json!({
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to file"
                },
                "old_string": {
                    "type": "string",
                    "description": "String to replace"
                },
                "new_string": {
                    "type": "string",
                    "description": "Replacement string"
                },
                "replace_all": {
                    "type": "boolean",
                    "description": "Replace all occurrences"
                }
            },
            "required": ["file_path", "old_string", "new_string"]
        }),
        |args| Box::pin(CodexTools::apply_patch(args)),
    );
}
```

### 7.5 .claude/config.json 拡張

**ファイル: .claude/config.json**

```json
{
  "project": {
    "name": "miyabi-private",
    "version": "2.0.0",
    "description": "Miyabi - Autonomous Development Framework (Rust Edition)",
    "architecture": "codex-compatible"
  },

  "features": {
    "tui": {
      "enabled": true,
      "framework": "ratatui",
      "version": "0.29.0",
      "command": "miyabi chat --tui"
    },
    "sandbox": {
      "enabled": true,
      "linux": {
        "landlock": "0.4.1",
        "seccomp": "0.5.0"
      },
      "macos": {
        "seatbelt": "system"
      },
      "default_policy": "deny-by-default"
    },
    "patch_system": {
      "enabled": true,
      "library": "diffy+similar",
      "safe_mode": true
    }
  },

  "mcp_servers": {
    "miyabi": {
      "command": "cargo",
      "args": ["run", "--bin", "miyabi-mcp-server"],
      "env": {
        "MIYABI_MCP_MODE": "development"
      }
    }
  },

  "agents": {
    "count": 21,
    "categories": {
      "coding": 7,
      "business": 14
    },
    "default_concurrency": 3
  },

  "worktree": {
    "enabled": true,
    "base_path": "./worktrees",
    "cleanup_policy": "on_success"
  },

  "context_loading": {
    "strategy": "just-in-time",
    "index_file": ".claude/context/INDEX.md",
    "priority_modules": [
      "core-rules",
      "agents",
      "architecture"
    ]
  }
}
```

### 7.6 統合チェックリスト

**実装完了チェック:**

- [ ] **Skills追加**
  - [ ] `codex-integration.md`
  - [ ] `tui-development.md`

- [ ] **Commands追加**
  - [ ] `/codex-migrate`
  - [ ] `/tui-debug`

- [ ] **MCP Tools追加**
  - [ ] `launch_tui`
  - [ ] `execute_sandboxed`
  - [ ] `apply_patch`

- [ ] **Config更新**
  - [ ] `.claude/config.json` 拡張

- [ ] **Documentation**
  - [ ] スキル使用例
  - [ ] コマンドリファレンス
  - [ ] MCPツール仕様書

---

**実装完了！**

これで、Miyabi は Codex のアーキテクチャと Claude Code の拡張機能を完全に統合できます！

次のステップ:
1. `/codex-migrate` を実行して実装状況を確認
2. 不足している機能を優先順位順に実装
3. `/tui-debug` でTUI動作確認
4. MCP Serverを起動してツールをテスト
