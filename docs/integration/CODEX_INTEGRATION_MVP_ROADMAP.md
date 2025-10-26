# Codex Integration MVP Roadmap

**作成日**: 2025-10-26
**対象**: Miyabi への Codex アーキテクチャ統合 MVP 実装計画
**戦略**: 段階的実装 - MVP → Enhanced → Full

---

## 🎯 MVP 定義

### MVP の原則

**"最小限の機能で、最大限の価値を提供する"**

- **Phase 0 (MVP)**: 1週間 - TUI の基本機能のみ
- **Phase 1 (Enhanced)**: 2週間 - Sandbox 追加
- **Phase 2 (Full)**: 1週間 - Apply-Patch 追加

---

## 📦 Phase 0: MVP - TUI基本機能（1週間）

### 🎯 目標

**"ユーザーが miyabi chat --tui でターミナルUIを起動できる"**

### 実装範囲

#### ✅ 必須機能

1. **基本的なTUI起動**
   - `miyabi chat --tui` コマンド
   - ターミナルの初期化と終了処理
   - Ctrl+C で終了

2. **シンプルなレイアウト**
   - ヘッダー（タイトルのみ）
   - メッセージエリア（テキストのみ）
   - 入力欄（1行のテキスト入力）

3. **基本的な入力処理**
   - テキスト入力
   - Enter で送信
   - Backspace で削除

4. **メッセージ表示**
   - ユーザーメッセージ
   - Assistantメッセージ
   - シンプルなカラーリング

#### ❌ MVP では実装しない

- Markdownレンダリング
- シンタックスハイライト
- スクロール機能
- ファイル検索
- 複雑なウィジェット
- LLM統合（仮のechoで代替）

### ファイル構成（最小限）

```
crates/miyabi-tui/
├── Cargo.toml
├── src/
│   ├── lib.rs              # 公開API
│   ├── main.rs             # バイナリエントリーポイント（オプション）
│   └── app.rs              # アプリケーション本体
└── tests/
    └── basic_test.rs       # 基本テストのみ
```

### Cargo.toml（最小限）

```toml
[package]
name = "miyabi-tui"
version = "0.1.0-mvp"
edition = "2021"

[dependencies]
ratatui = "0.29.0"
crossterm = "0.28.1"
anyhow = "1"

[dev-dependencies]
# テストは後回し
```

### MVP実装コード

#### src/lib.rs

```rust
mod app;
pub use app::App;

pub fn run_tui() -> anyhow::Result<()> {
    let mut app = App::new();
    tokio::runtime::Runtime::new()?.block_on(app.run())
}
```

#### src/app.rs（MVP版 - 約150行）

```rust
use ratatui::{
    backend::CrosstermBackend,
    Terminal,
    layout::{Constraint, Direction, Layout, Rect},
    widgets::{Block, Borders, Paragraph, List, ListItem},
    text::{Line, Span},
    style::{Color, Style},
    Frame,
};
use crossterm::{
    event::{self, Event, KeyCode, KeyEvent},
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
    ExecutableCommand,
};
use std::io::stdout;
use anyhow::Result;

pub struct App {
    messages: Vec<Message>,
    input: String,
    cursor_position: usize,
    should_quit: bool,
}

#[derive(Debug, Clone)]
struct Message {
    role: Role,
    content: String,
}

#[derive(Debug, Clone, PartialEq)]
enum Role {
    User,
    Assistant,
}

impl App {
    pub fn new() -> Self {
        Self {
            messages: vec![
                Message {
                    role: Role::Assistant,
                    content: "Welcome to Miyabi TUI! Type a message and press Enter.".to_string(),
                },
            ],
            input: String::new(),
            cursor_position: 0,
            should_quit: false,
        }
    }

    pub async fn run(&mut self) -> Result<()> {
        // ターミナル初期化
        enable_raw_mode()?;
        stdout().execute(EnterAlternateScreen)?;

        let backend = CrosstermBackend::new(stdout());
        let mut terminal = Terminal::new(backend)?;
        terminal.clear()?;

        // メインループ
        while !self.should_quit {
            terminal.draw(|frame| self.render(frame))?;

            if event::poll(std::time::Duration::from_millis(100))? {
                if let Event::Key(key) = event::read()? {
                    self.handle_key(key)?;
                }
            }
        }

        // クリーンアップ
        disable_raw_mode()?;
        stdout().execute(LeaveAlternateScreen)?;

        Ok(())
    }

    fn render(&self, frame: &mut Frame) {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(3),
                Constraint::Min(0),
                Constraint::Length(3),
            ])
            .split(frame.area());

        // ヘッダー
        let header = Paragraph::new("Miyabi TUI (MVP)")
            .block(Block::default().borders(Borders::ALL));
        frame.render_widget(header, chunks[0]);

        // メッセージリスト
        let items: Vec<ListItem> = self.messages.iter().map(|msg| {
            let (prefix, color) = match msg.role {
                Role::User => ("You: ", Color::Cyan),
                Role::Assistant => ("Miyabi: ", Color::Green),
            };

            let line = Line::from(vec![
                Span::styled(prefix, Style::default().fg(color)),
                Span::raw(&msg.content),
            ]);

            ListItem::new(line)
        }).collect();

        let list = List::new(items)
            .block(Block::default().borders(Borders::ALL).title("Messages"));
        frame.render_widget(list, chunks[1]);

        // 入力欄
        let input = Paragraph::new(self.input.as_str())
            .block(Block::default().borders(Borders::ALL).title("Input (Ctrl+C to quit)"));
        frame.render_widget(input, chunks[2]);

        // カーソル
        frame.set_cursor_position((
            chunks[2].x + self.cursor_position as u16 + 1,
            chunks[2].y + 1,
        ));
    }

    fn handle_key(&mut self, key: KeyEvent) -> Result<()> {
        match key.code {
            KeyCode::Char('c') if key.modifiers.contains(event::KeyModifiers::CONTROL) => {
                self.should_quit = true;
            }
            KeyCode::Enter => {
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
            _ => {}
        }
        Ok(())
    }

    fn submit_message(&mut self) {
        if self.input.is_empty() {
            return;
        }

        // ユーザーメッセージ追加
        let user_msg = Message {
            role: Role::User,
            content: self.input.clone(),
        };
        self.messages.push(user_msg);

        // 仮のエコー応答（MVP）
        let response = Message {
            role: Role::Assistant,
            content: format!("Echo: {}", self.input),
        };
        self.messages.push(response);

        // 入力クリア
        self.input.clear();
        self.cursor_position = 0;
    }
}
```

### miyabi-cli 統合

**crates/miyabi-cli/Cargo.toml** に追加:

```toml
[dependencies]
# 既存の依存関係...
miyabi-tui = { path = "../miyabi-tui", optional = true }

[features]
tui = ["miyabi-tui"]
```

**crates/miyabi-cli/src/main.rs** 修正（最小限）:

```rust
#[cfg(feature = "tui")]
use miyabi_tui;

// main() に追加
match cli.command {
    Commands::Chat { prompt } => {
        #[cfg(feature = "tui")]
        if cli.tui {
            miyabi_tui::run_tui()?;
            return Ok(());
        }

        // 既存のCLIモード
        // ...
    }
    // ...
}
```

### ビルドと実行

```bash
# TUI機能付きでビルド
cd /Users/shunsuke/Dev/miyabi-private
cargo build --features tui

# 実行
cargo run --features tui -- chat --tui
```

### MVP成功基準

✅ **以下ができれば成功:**

1. `cargo run --features tui -- chat --tui` で起動
2. テキストを入力してEnterで送信
3. エコー応答が表示される
4. Ctrl+C で終了
5. ターミナルが正常にクリーンアップされる

---

## 📦 Phase 1: Enhanced - Sandbox追加（2週間）

### MVP完成後に追加

#### Week 2: Linux Sandbox

- miyabi-sandbox クレート作成
- Landlock 実装（ファイルアクセス制限）
- 基本的な Seccomp フィルター（50個のシステムコール）

#### Week 3: macOS Sandbox

- Seatbelt プロファイル生成
- sandbox-exec 統合
- miyabi-core への統合

---

## 📦 Phase 2: Full - Apply-Patch追加（1週間）

### Enhanced完成後に追加

#### Week 4: Patch System

- miyabi-apply-patch クレート作成
- diffy/similar 統合
- safe_replace / replace_all 実装

---

## 🚀 MVP実装手順（詳細）

### Day 1: セットアップ（2時間）

```bash
# 1. クレート作成
cd crates
cargo new --lib miyabi-tui
cd miyabi-tui

# 2. Cargo.toml 編集
cat > Cargo.toml <<'EOF'
[package]
name = "miyabi-tui"
version = "0.1.0-mvp"
edition = "2021"

[lib]
name = "miyabi_tui"
path = "src/lib.rs"

[dependencies]
ratatui = "0.29.0"
crossterm = "0.28.1"
anyhow = "1"
tokio = { version = "1", features = ["rt", "macros"] }
EOF

# 3. ファイル作成
touch src/lib.rs src/app.rs
```

### Day 2-3: MVP実装（12時間）

1. **src/lib.rs** - 5分
2. **src/app.rs** - 6時間
   - App構造体
   - render() メソッド
   - handle_key() メソッド
   - submit_message() メソッド
3. **動作確認** - 2時間
4. **デバッグ** - 4時間

### Day 4: CLI統合（4時間）

1. miyabi-cli/Cargo.toml 修正
2. miyabi-cli/src/main.rs 修正
3. テスト実行

### Day 5: ドキュメント（2時間）

1. README.md 作成
2. 使用例追加
3. スクリーンショット（asciicinema）

---

## 📊 進捗トラッキング

### MVP Checklist

- [ ] **Day 1: セットアップ**
  - [ ] miyabi-tui クレート作成
  - [ ] 依存関係追加
  - [ ] 基本ファイル作成

- [ ] **Day 2-3: 実装**
  - [ ] App 構造体実装
  - [ ] render() 実装
  - [ ] handle_key() 実装
  - [ ] submit_message() 実装
  - [ ] ビルド成功

- [ ] **Day 4: 統合**
  - [ ] miyabi-cli に統合
  - [ ] --tui フラグ追加
  - [ ] 動作確認

- [ ] **Day 5: ドキュメント**
  - [ ] README.md
  - [ ] 使用例
  - [ ] リリースノート

---

## 🎯 次のステップ

**MVP完成後:**

1. **Phase 1 (Enhanced)** へ移行
2. **ユーザーフィードバック**収集
3. **バグ修正**優先
4. **パフォーマンス改善**

**Long-term Vision:**

- Phase 2 (Full) 完成
- Claude Code機能拡張統合
- Codex完全互換達成

---

**Ready to start MVP implementation? 🚀**

コマンド: `cargo new --lib crates/miyabi-tui`
