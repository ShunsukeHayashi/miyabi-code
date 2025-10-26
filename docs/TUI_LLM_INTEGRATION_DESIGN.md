# TUI LLM Integration Design

**作成日**: 2025-10-26
**ステータス**: 設計フェーズ

---

## 🎯 目標

Miyabi TUIにLLM統合を追加し、リアルタイムの対話型AIチャット機能を実現する。

---

## 📐 アーキテクチャ

### コンポーネント構成

```
┌─────────────────────────────────────────────┐
│            miyabi-cli (main)                │
│  └─ miyabi chat --tui                      │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│           miyabi-tui (App)                  │
│  ┌───────────────────────────────────────┐  │
│  │  Event Loop (tokio::select!)          │  │
│  │  ├─ Terminal events (keyboard)        │  │
│  │  └─ App events (LLM responses)        │  │
│  └───────────────────────────────────────┘  │
│                    │                         │
│                    ▼                         │
│  ┌───────────────────────────────────────┐  │
│  │  Message Handler                       │  │
│  │  ├─ handle_submit() → send to LLM     │  │
│  │  └─ handle_assistant_chunk() → render │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│           miyabi-llm (LLMClient)            │
│  ┌───────────────────────────────────────┐  │
│  │  Anthropic API (Claude)               │  │
│  │  ├─ create_message_stream()           │  │
│  │  └─ Stream<MessageChunk>              │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🔧 実装計画

### Phase 1: LLMクライアント統合

**ファイル**: `crates/miyabi-tui/src/app.rs`

**追加フィールド**:
```rust
use miyabi_llm::{LLMClient, LLMConfig};
use tokio::sync::mpsc::UnboundedReceiver;

pub struct App {
    // 既存フィールド
    messages: Vec<Message>,
    input: String,
    state: AppState,
    should_quit: bool,
    event_tx: UnboundedSender<AppEvent>,

    // 新規追加
    event_rx: UnboundedReceiver<AppEvent>,  // イベント受信
    llm_client: LLMClient,                   // LLMクライアント
}
```

**初期化**:
```rust
impl App {
    pub fn new() -> Self {
        let (event_tx, event_rx) = unbounded_channel();

        // LLMクライアント初期化
        let config = LLMConfig::from_env().expect("ANTHROPIC_API_KEY required");
        let llm_client = LLMClient::new(config);

        Self {
            messages: Vec::new(),
            input: String::new(),
            cursor_position: 0,
            scroll_offset: 0,
            state: AppState::Idle,
            should_quit: false,
            event_tx,
            event_rx,
            llm_client,
        }
    }
}
```

---

### Phase 2: メッセージ送信機能

**メソッド追加**: `handle_submit()`

```rust
impl App {
    /// Handle message submission (Enter key)
    async fn handle_submit(&mut self) -> Result<()> {
        if self.input.is_empty() {
            return Ok(());
        }

        // Add user message to history
        let user_message = Message {
            role: MessageRole::User,
            content: self.input.clone(),
            timestamp: std::time::SystemTime::now(),
        };
        self.messages.push(user_message);

        // Clear input
        let input_text = std::mem::take(&mut self.input);
        self.cursor_position = 0;

        // Change state to Processing
        self.state = AppState::Processing;

        // Send to LLM (spawn background task)
        self.send_to_llm(input_text).await?;

        Ok(())
    }

    /// Send message to LLM and stream responses
    async fn send_to_llm(&mut self, user_input: String) -> Result<()> {
        let event_tx = self.event_tx.clone();
        let llm_client = self.llm_client.clone();
        let messages = self.messages.clone();

        // Spawn background task for LLM API call
        tokio::spawn(async move {
            // Convert to API format
            let api_messages: Vec<_> = messages
                .iter()
                .map(|m| miyabi_llm::Message {
                    role: match m.role {
                        MessageRole::User => "user",
                        MessageRole::Assistant => "assistant",
                        _ => "user",
                    },
                    content: m.content.clone(),
                })
                .collect();

            // Create streaming request
            match llm_client.create_message_stream(api_messages).await {
                Ok(mut stream) => {
                    // Change state to Streaming
                    let _ = event_tx.send(AppEvent::StateChange(AppState::Streaming));

                    // Stream responses
                    while let Some(chunk) = stream.next().await {
                        match chunk {
                            Ok(text) => {
                                let _ = event_tx.send(AppEvent::AssistantChunk(text));
                            }
                            Err(e) => {
                                let _ = event_tx.send(AppEvent::Error(format!("LLM error: {}", e)));
                                break;
                            }
                        }
                    }

                    // Change state back to Idle
                    let _ = event_tx.send(AppEvent::StateChange(AppState::Idle));
                }
                Err(e) => {
                    let _ = event_tx.send(AppEvent::Error(format!("LLM request failed: {}", e)));
                }
            }
        });

        Ok(())
    }
}
```

---

### Phase 3: イベントループ統合

**修正**: `run()` メソッドにイベント受信を追加

```rust
pub async fn run(&mut self) -> Result<()> {
    enable_raw_mode()?;
    stdout().execute(EnterAlternateScreen)?;
    let backend = CrosstermBackend::new(stdout());
    let mut terminal = Terminal::new(backend)?;

    while !self.should_quit {
        terminal.draw(|frame| self.render(frame))?;

        // Use tokio::select! to handle both terminal and app events
        tokio::select! {
            // Terminal events (keyboard)
            Ok(true) = self.poll_terminal_events() => {
                // Event handled
            }
            // App events (LLM responses)
            Some(event) = self.event_rx.recv() => {
                self.handle_app_event(event).await?;
            }
        }
    }

    disable_raw_mode()?;
    stdout().execute(LeaveAlternateScreen)?;
    Ok(())
}

/// Poll terminal events (non-blocking)
async fn poll_terminal_events(&mut self) -> Result<bool> {
    if event::poll(std::time::Duration::from_millis(100))? {
        match event::read()? {
            Event::Key(key) => {
                self.handle_key_event(key).await?;
                Ok(true)
            }
            _ => Ok(false),
        }
    } else {
        Ok(false)
    }
}
```

---

### Phase 4: アシスタント応答のレンダリング

**修正**: `handle_app_event()` メソッド

```rust
async fn handle_app_event(&mut self, event: AppEvent) -> Result<()> {
    match event {
        AppEvent::Quit => {
            self.should_quit = true;
        }
        AppEvent::Submit => {
            self.handle_submit().await?;
        }
        AppEvent::AssistantChunk(chunk) => {
            // Append chunk to the last assistant message
            if let Some(last) = self.messages.last_mut() {
                if last.role == MessageRole::Assistant {
                    last.content.push_str(&chunk);
                } else {
                    // Create new assistant message
                    self.messages.push(Message {
                        role: MessageRole::Assistant,
                        content: chunk,
                        timestamp: std::time::SystemTime::now(),
                    });
                }
            } else {
                // First message from assistant
                self.messages.push(Message {
                    role: MessageRole::Assistant,
                    content: chunk,
                    timestamp: std::time::SystemTime::now(),
                });
            }
        }
        AppEvent::StateChange(new_state) => {
            self.state = new_state;
        }
        AppEvent::Error(error) => {
            // Show error message
            self.messages.push(Message {
                role: MessageRole::System,
                content: format!("Error: {}", error),
                timestamp: std::time::SystemTime::now(),
            });
            self.state = AppState::Idle;
        }
        _ => {}
    }
    Ok(())
}
```

---

## 📝 AppEvent拡張

**追加イベント**:
```rust
pub enum AppEvent {
    Quit,
    Submit,
    AssistantChunk(String),
    StateChange(AppState),      // 新規
    Error(String),               // 新規
    ToolStart(String),
    ToolComplete(String),
}
```

---

## 🎨 UI更新

### ステータスバー追加

**Processing状態の表示**:
```rust
fn render_status_bar(&self) -> Paragraph {
    let status_text = match self.state {
        AppState::Idle => "Ready",
        AppState::Processing => "⏳ Processing...",
        AppState::Streaming => "💬 Streaming response...",
        AppState::WaitingForApproval => "⏸ Waiting for approval",
        AppState::ExecutingTool => "🔧 Executing tool...",
    };

    Paragraph::new(status_text)
        .style(Style::default().fg(Color::Cyan))
}
```

---

## 🔐 環境変数

**必須**:
```bash
export ANTHROPIC_API_KEY=sk-ant-xxx
```

**オプション**:
```bash
export MIYABI_LLM_MODEL=claude-sonnet-4  # Default model
export MIYABI_LLM_MAX_TOKENS=4096        # Max response tokens
```

---

## 🧪 テスト計画

### 手動テスト

```bash
# 1. LLMクライアント初期化テスト
export ANTHROPIC_API_KEY=sk-ant-xxx
cargo run --package miyabi-cli --features tui --bin miyabi -- chat --tui

# 2. メッセージ送信テスト
> Hello, how are you?
[Enter]

# Expected: Processing → Streaming → Response rendered

# 3. エラーハンドリングテスト
unset ANTHROPIC_API_KEY
cargo run --package miyabi-cli --features tui --bin miyabi -- chat --tui

# Expected: Error message displayed
```

---

## ⏱️ 実装見積もり

| Phase | 内容 | 見積もり |
|-------|------|---------|
| Phase 1 | LLMクライアント統合 | 30分 |
| Phase 2 | メッセージ送信機能 | 45分 |
| Phase 3 | イベントループ統合 | 30分 |
| Phase 4 | レンダリング実装 | 30分 |
| Phase 5 | テスト & デバッグ | 45分 |

**合計**: 約3時間

---

## 📊 進捗トラッキング

- [ ] Phase 1: LLMクライアント統合
- [ ] Phase 2: メッセージ送信機能
- [ ] Phase 3: イベントループ統合
- [ ] Phase 4: レンダリング実装
- [ ] Phase 5: テスト & デバッグ

---

## 🚀 次のステップ

1. `miyabi-llm` crateのAPI仕様を確認
2. Phase 1から順次実装
3. 各Phaseごとにビルド検証
4. 最終的な統合テスト

---

**作成日**: 2025-10-26
**設計者**: Claude Code (Miyabi Infinity Mode)
