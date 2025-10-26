# Streaming Implementation Design

**作成日**: 2025-10-26
**ステータス**: 設計フェーズ

---

## 🎯 目標

リアルタイムでLLM応答を表示し、ChatGPT/Claude Web同等のUXを実現する。

---

## 📐 アーキテクチャ

### 現在の実装（非ストリーミング）

```
User Input → LLM API → Complete Response → Display
            (wait 3-5s)
```

**問題点**:
- 長い応答の場合、待ち時間が発生
- ユーザーは "Processing..." 状態で待つだけ

### 新しい実装（ストリーミング）

```
User Input → LLM API (streaming)
                ↓
            Chunk 1 → Display
                ↓
            Chunk 2 → Display
                ↓
            Chunk 3 → Display
                ↓
            Complete
```

**メリット**:
- リアルタイムで応答が見える
- ユーザーエンゲージメント向上
- 長い応答でも待たされない

---

## 🔧 実装計画

### Phase 1: miyabi-llm streaming API追加 (1.5h)

**ファイル**: `crates/miyabi-llm/src/providers/anthropic.rs`

**追加メソッド**:
```rust
impl AnthropicClient {
    /// Chat completion with streaming
    pub async fn chat_stream(
        &self,
        messages: Vec<Message>,
    ) -> Result<impl Stream<Item = Result<String>>> {
        // Anthropic streaming API呼び出し
        // Server-Sent Events (SSE) でストリーミング
    }
}
```

**Anthropic Streaming API仕様**:
```http
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: sk-ant-xxx
  anthropic-version: 2023-06-01
  content-type: application/json
Body:
  {
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 4096,
    "messages": [...],
    "stream": true  // ← ストリーミング有効化
  }

Response (SSE format):
  event: message_start
  data: {"type":"message_start",...}

  event: content_block_delta
  data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}

  event: content_block_delta
  data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" there"}}

  event: message_stop
  data: {"type":"message_stop"}
```

**実装方法**:
1. `stream: true` をリクエストボディに追加
2. `response.bytes_stream()` でSSEを受信
3. SSEフォーマットをパース
4. `content_block_delta` から text を抽出
5. `async_stream::stream!` でStreamを返す

**依存関係**:
```toml
[dependencies]
async-stream = "0.3"
futures = "0.3"
```

---

### Phase 2: TUIストリーミング統合 (1h)

**ファイル**: `crates/miyabi-tui/src/app.rs`

**変更内容**:

**1. `send_to_llm()` を更新**:
```rust
fn send_to_llm(&self, llm_client: Arc<AnthropicClient>, _user_input: String) {
    let event_tx = self.event_tx.clone();
    let messages = self.messages.clone();

    tokio::spawn(async move {
        // Change state to Streaming
        let _ = event_tx.send(AppEvent::StateChange(AppState::Streaming));

        // Convert messages
        let llm_messages: Vec<LlmMessage> = /* ... */;

        // Call streaming API
        match llm_client.chat_stream(llm_messages).await {
            Ok(mut stream) => {
                // Stream chunks
                while let Some(chunk_result) = stream.next().await {
                    match chunk_result {
                        Ok(text) => {
                            let _ = event_tx.send(AppEvent::AssistantChunk(text));
                        }
                        Err(e) => {
                            let _ = event_tx.send(AppEvent::Error(format!("Stream error: {}", e)));
                            break;
                        }
                    }
                }

                // Stream complete
                let _ = event_tx.send(AppEvent::StateChange(AppState::Idle));
            }
            Err(e) => {
                let _ = event_tx.send(AppEvent::Error(format!("Stream start failed: {}", e)));
            }
        }
    });
}
```

**2. `handle_app_event()` を更新**:
```rust
async fn handle_app_event(&mut self, event: AppEvent) -> Result<()> {
    match event {
        AppEvent::AssistantChunk(chunk) => {
            // Append chunk to the last assistant message
            if let Some(last) = self.messages.last_mut() {
                if last.role == MessageRole::Assistant {
                    // Append to existing message
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
                // First message
                self.messages.push(Message {
                    role: MessageRole::Assistant,
                    content: chunk,
                    timestamp: std::time::SystemTime::now(),
                });
            }
        }
        // ... 他のイベント
    }
    Ok(())
}
```

**既存の`AssistantChunk`イベントを活用**できるため、最小限の変更で済みます。

---

### Phase 3: リアルタイムレンダリング (30分)

**既存の実装で動作**:
- `tokio::select!` が既にApp eventsをリアルタイムで処理
- `terminal.draw()` がメインループで毎回呼ばれる
- チャンクが来るたびに自動的に再描画

**追加の最適化（オプション）**:
```rust
// 頻繁な再描画を制御（CPU負荷軽減）
let mut last_render = Instant::now();
const RENDER_INTERVAL: Duration = Duration::from_millis(50); // 20 FPS

if last_render.elapsed() > RENDER_INTERVAL {
    terminal.draw(|frame| self.render(frame))?;
    last_render = Instant::now();
}
```

---

### Phase 4: ビルド & テスト (30分)

**ビルド確認**:
```bash
cargo build --package miyabi-llm
cargo build --package miyabi-tui
cargo build --package miyabi-cli --bin miyabi --features tui --release
```

**動作確認**:
```bash
export ANTHROPIC_API_KEY=sk-ant-xxx
./target/release/miyabi chat --tui

> Write a long story about a programmer learning Rust
[Enter]

# Expected:
# - State: "Streaming..."
# - Text appears gradually, word by word
# - State: "Idle" when complete
```

---

## 📊 SSEフォーマット詳細

### Anthropic SSE Event Types

**1. message_start**
```json
{
  "type": "message_start",
  "message": {
    "id": "msg_xxx",
    "type": "message",
    "role": "assistant",
    "content": [],
    "model": "claude-3-5-sonnet-20241022"
  }
}
```

**2. content_block_start**
```json
{
  "type": "content_block_start",
  "index": 0,
  "content_block": {
    "type": "text",
    "text": ""
  }
}
```

**3. content_block_delta** ← メインデータ
```json
{
  "type": "content_block_delta",
  "index": 0,
  "delta": {
    "type": "text_delta",
    "text": "Hello"  // ← このテキストを抽出
  }
}
```

**4. content_block_stop**
```json
{
  "type": "content_block_stop",
  "index": 0
}
```

**5. message_stop**
```json
{
  "type": "message_stop"
}
```

---

## 🔍 SSEパーサー実装

### 簡易版（MVP）

```rust
use futures::stream::StreamExt;
use serde_json::Value;

async fn parse_sse_stream(
    response: reqwest::Response,
) -> impl Stream<Item = Result<String>> {
    async_stream::stream! {
        let mut stream = response.bytes_stream();
        let mut buffer = Vec::new();

        while let Some(chunk_result) = stream.next().await {
            match chunk_result {
                Ok(chunk) => {
                    buffer.extend_from_slice(&chunk);

                    // Split by newlines
                    let text = String::from_utf8_lossy(&buffer);
                    let lines: Vec<&str> = text.split("\n\n").collect();

                    // Process all complete events
                    for i in 0..lines.len()-1 {
                        if let Some(text_delta) = parse_sse_event(lines[i]) {
                            yield Ok(text_delta);
                        }
                    }

                    // Keep last incomplete event in buffer
                    buffer = lines.last().unwrap_or(&"").as_bytes().to_vec();
                }
                Err(e) => {
                    yield Err(LlmError::ApiError(format!("Stream error: {}", e)));
                    break;
                }
            }
        }
    }
}

fn parse_sse_event(event: &str) -> Option<String> {
    // Extract "data: {...}" line
    for line in event.lines() {
        if let Some(data) = line.strip_prefix("data: ") {
            if let Ok(json) = serde_json::from_str::<Value>(data) {
                // Check if it's a text delta
                if json["type"] == "content_block_delta" {
                    if let Some(text) = json["delta"]["text"].as_str() {
                        return Some(text.to_string());
                    }
                }
            }
        }
    }
    None
}
```

---

## ⏱️ 実装見積もり

| Phase | 内容 | 見積もり |
|-------|------|---------|
| Phase 1 | miyabi-llm streaming API | 1.5h |
| Phase 2 | TUIストリーミング統合 | 1h |
| Phase 3 | リアルタイムレンダリング | 0.5h |
| Phase 4 | ビルド & テスト | 0.5h |
| **合計** | | **3.5h** |

---

## 🎯 成功基準

**動作確認項目**:
1. ✅ ストリーミングAPIが正常に動作
2. ✅ テキストがリアルタイムで表示される
3. ✅ "Streaming..." 状態が表示される
4. ✅ エラーハンドリングが動作
5. ✅ 長い応答でもスムーズに表示

**パフォーマンス**:
- レイテンシ: 最初のチャンクが1秒以内
- FPS: 20 FPS以上で再描画
- CPU: 50%以下

---

## 🚧 既知の課題

### 課題1: SSEパーシングの複雑さ

**解決策**:
- 簡易版パーサーで開始
- 将来: `eventsource-client` crateを使用

### 課題2: ネットワークエラー

**解決策**:
- タイムアウト設定（30秒）
- エラー時の適切なメッセージ表示

### 課題3: 部分的なUTF-8

**解決策**:
- バッファリングで完全なUTF-8文字列を待つ

---

## 📝 次のステップ

1. Phase 1実装開始
2. Anthropic streaming API統合
3. TUI側の更新
4. テスト

---

**作成日**: 2025-10-26
**見積もり**: 3.5時間
**優先度**: ⭐⭐⭐⭐⭐（UX大幅向上）

---

🤖 Generated with [Claude Code](https://claude.com/claude-code) in Miyabi Infinity Mode
