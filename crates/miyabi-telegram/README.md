# miyabi-telegram

Telegram Bot API client for Miyabi - enabling natural language interaction and real-time notifications.

## Features

- ✅ Full Telegram Bot API support
- ✅ Type-safe with Serde serialization
- ✅ Async/await with Tokio
- ✅ Inline keyboard support
- ✅ Webhook management
- ✅ Comprehensive error handling

## Quick Start

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the instructions
3. Choose a name and username for your bot
4. BotFather will give you a **bot token** - save it!

Example:
```
Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 2. Get Your Chat ID

You need your chat ID to send messages to yourself:

1. Send any message to your bot in Telegram
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":123456789}` - that's your chat ID

Or use this helper:
```bash
curl -s "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates" | jq '.result[0].message.chat.id'
```

### 3. Set Environment Variable

```bash
export TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
```

### 4. Run Examples

```bash
# Send a simple message
cargo run --example send_message <your_chat_id>

# Send an interactive menu with buttons
cargo run --example interactive_menu <your_chat_id>
```

## Usage

### Basic Message

```rust
use miyabi_telegram::TelegramClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create client from environment variable
    let client = TelegramClient::from_env()?;

    // Send a message
    client.send_message(123456789, "Hello from Miyabi!").await?;

    Ok(())
}
```

### Message with Inline Keyboard

```rust
use miyabi_telegram::{TelegramClient, InlineKeyboard, InlineKeyboardButton};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = TelegramClient::from_env()?;

    // Create keyboard
    let keyboard = InlineKeyboard::single_row(vec![
        InlineKeyboardButton::callback("✅ Yes", "yes"),
        InlineKeyboardButton::callback("❌ No", "no"),
    ]);

    // Send with keyboard
    client.send_message_with_keyboard(
        123456789,
        "Do you agree?",
        keyboard
    ).await?;

    Ok(())
}
```

### Handling Callbacks (Webhook)

When users click inline keyboard buttons, Telegram sends a callback query to your webhook:

```rust
use miyabi_telegram::{TelegramClient, Update};

async fn handle_update(update: Update) -> Result<(), Box<dyn std::error::Error>> {
    let client = TelegramClient::from_env()?;

    if let Some(callback) = update.callback_query {
        // Answer the callback query
        client.answer_callback_query(&callback.id, Some("Processing...")).await?;

        // Handle the callback data
        match callback.data.as_deref() {
            Some("yes") => {
                // User clicked "Yes"
                println!("User agreed!");
            }
            Some("no") => {
                // User clicked "No"
                println!("User declined!");
            }
            _ => {}
        }
    }

    Ok(())
}
```

## API Methods

| Method | Description |
|--------|-------------|
| `send_message(chat_id, text)` | Send a text message |
| `send_message_with_keyboard(chat_id, text, keyboard)` | Send message with inline keyboard |
| `answer_callback_query(id, text)` | Respond to button click |
| `get_me()` | Get bot information |
| `set_webhook(url)` | Set webhook URL |
| `delete_webhook()` | Delete webhook |

## Types

### Core Types

- `Update` - Incoming updates from Telegram
- `Message` - Message object
- `User` - User information
- `Chat` - Chat information
- `CallbackQuery` - Button click event

### Keyboard Types

- `InlineKeyboard` - Inline keyboard markup
- `InlineKeyboardButton` - Individual button

## Advanced: Multi-row Keyboard

```rust
let keyboard = InlineKeyboard::new(vec![
    // Row 1
    vec![
        InlineKeyboardButton::callback("Option 1", "opt1"),
        InlineKeyboardButton::callback("Option 2", "opt2"),
    ],
    // Row 2
    vec![
        InlineKeyboardButton::callback("Option 3", "opt3"),
    ],
    // Row 3 with URL
    vec![
        InlineKeyboardButton::url("Visit Website", "https://example.com"),
    ],
]);
```

## Markdown Formatting

Messages support Markdown formatting:

```rust
let text = r#"
*Bold text*
_Italic text_
[Link](https://example.com)
`Code`
```rust
fn hello() {
    println!("Hello!");
}
```
"#;

client.send_message(chat_id, text).await?;
```

## Error Handling

```rust
use miyabi_telegram::{TelegramClient, TelegramError};

match client.send_message(chat_id, "Hello").await {
    Ok(message) => {
        println!("Message sent! ID: {}", message.message_id);
    }
    Err(TelegramError::ApiError(msg)) => {
        eprintln!("Telegram API error: {}", msg);
    }
    Err(e) => {
        eprintln!("Other error: {}", e);
    }
}
```

## Testing

```bash
# Run all tests
cargo test --package miyabi-telegram

# Run specific test
cargo test --package miyabi-telegram test_api_url
```

## Dependencies

```toml
[dependencies]
miyabi-telegram = { path = "../miyabi-telegram" }
tokio = { version = "1", features = ["full"] }
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather | Yes |

## Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather](https://t.me/BotFather) - Create and manage bots
- [Telegram Inline Keyboards](https://core.telegram.org/bots/features#inline-keyboards)

## License

Same as Miyabi project.

## Miyabi Bot Server

This crate also includes a complete bot server binary for Miyabi integration:

### Quick Start (Bot Server)

```bash
# 1. Configure environment
cp ../../.env.telegram.example ../../.env.telegram
# Edit with your tokens

# 2. Build bot server
cargo build --release --bin miyabi-telegram-bot --features bot-server

# 3. Setup ngrok (local development)
ngrok http 3000

# 4. Update WEBHOOK_URL in .env.telegram with ngrok URL

# 5. Run bot
set -a && source ../../.env.telegram && set +a
../../target/release/miyabi-telegram-bot
```

### Bot Features

- 🤖 Natural language input → GitHub Issue creation
- 📡 Real-time progress notifications
- ⚡ Agent execution integration (pending)
- 🔐 Secure webhook handling

See [TELEGRAM_BOT_SETUP.md](../../docs/TELEGRAM_BOT_SETUP.md) for complete documentation.

## Related

- Issue #563: Telegram Bot Integration
- Replaced LINE Bot (#431, #538, #539, #540)
