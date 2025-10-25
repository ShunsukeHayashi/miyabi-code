# 🤖 miyabi-line

**LINE Bot Integration for Miyabi - Messaging API, Webhooks, GPT-4 NLP**

LINE Messaging API統合、自然言語処理、自動Issue作成を提供する Rustクレート。

---

## 📋 Features

- **LINE Messaging API Client**: メッセージ送信、リプライ、プッシュ通知
- **Webhook Handler**: LINE署名検証、イベント処理
- **GPT-4 NLP**: 自然言語からGitHub Issue自動生成
- **Rich Message Support**: Flex Message、リッチメニュー対応

---

## 🚀 Quick Start

### Installation

```toml
[dependencies]
miyabi-line = "0.1.0"
```

### Usage

```rust
use miyabi_line::{LineClient, WebhookHandler, NlpProcessor};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // LINE Client
    let client = LineClient::from_env()?;
    client.reply_text("reply_token", "Hello from Miyabi!").await?;

    // Webhook Handler
    let handler = WebhookHandler::from_env()?;
    let verified = handler.verify_signature(body, signature)?;

    // NLP Processor
    let nlp = NlpProcessor::new();
    let issue = nlp.process_message("ログイン機能にGoogle OAuth追加して").await?;

    Ok(())
}
```

---

## 📦 Modules

### `client` - LINE Messaging API Client

```rust
let client = LineClient::new(channel_access_token);

// Send reply
client.reply_text(reply_token, "Hello!").await?;

// Send push message
client.push_text(user_id, "Notification").await?;

// Send Flex Message
client.reply_flex(reply_token, "Alt text", flex_container).await?;
```

### `webhook` - Webhook Handler

```rust
let handler = WebhookHandler::new(channel_secret);

// Verify LINE signature
let verified = handler.verify_signature(body, signature)?;

// Parse webhook request
let request = handler.parse_request(body_str)?;

// Handle events
for event in request.events {
    handler.handle_event(&event).await?;
}
```

### `nlp` - GPT-4 Natural Language Processing

```rust
let nlp = NlpProcessor::new();

// Generate Issue from natural language
let issue_request = nlp.process_message("ユーザープロフィール編集画面を作成").await?;

println!("Title: {}", issue_request.title);
println!("Agent: {}", issue_request.agent);
println!("Priority: {}", issue_request.priority);
```

### `types` - LINE API Types

- `WebhookRequest`, `Event`, `Message`
- `ReplyMessage`, `PushRequest`
- `FlexContainer`, `FlexBubble`, `FlexComponent`

---

## 🔐 Environment Variables

```bash
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret

# OpenAI API (for NLP)
OPENAI_API_KEY=sk-xxxxx
```

---

## 🧪 Testing

```bash
cargo test --package miyabi-line
```

---

## 📚 Examples

### Full Bot Example

```rust
use miyabi_line::*;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let client = LineClient::from_env()?;
    let handler = WebhookHandler::from_env()?;
    let nlp = NlpProcessor::new();

    // Webhook endpoint handler
    let request = handler.parse_request(&body)?;

    for event in request.events {
        if let Event::Message(msg_event) = event {
            if let Message::Text { text, .. } = msg_event.message {
                // Process with GPT-4
                let issue = nlp.process_message(&text).await?;

                // Reply with confirmation
                client.reply_text(
                    &msg_event.reply_token,
                    &format!("✅ Issue作成: {}\nAgent: {}", issue.title, issue.agent)
                ).await?;
            }
        }
    }

    Ok(())
}
```

---

## 🎯 Use Cases

### Issue #431: LINE Bot統合

**User Flow:**
1. ユーザーがLINEでメッセージ送信: 「ログイン機能にGoogle OAuth追加して」
2. GPT-4が解析してIssue作成
3. Miyabi AgentがIssue処理（CodeGenAgent実行）
4. 進捗通知（開始、50%, 100%）
5. 完了通知（PR番号、品質スコア）

---

## 📊 API Coverage

| Feature | Status |
|---------|--------|
| Reply Message | ✅ |
| Push Message | ✅ |
| Flex Message | ✅ |
| Signature Verification | ✅ |
| Text Message | ✅ |
| Image Message | 🔜 |
| Sticker Message | 🔜 |
| Rich Menu | 🔜 |
| LIFF | 🔜 |

---

## 🔗 Related Documentation

- [LINE Messaging API Reference](https://developers.line.biz/en/reference/messaging-api/)
- [Issue #431: LINE Bot統合](https://github.com/customer-cloud/miyabi-private/issues/431)

---

## 📝 License

MIT License

---

## 👥 Author

**Miyabi Development Team**
- Created with: Claude Code + Infinity Mode 🚀

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**
