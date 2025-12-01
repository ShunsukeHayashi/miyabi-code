//! Interactive example: Send a message with inline keyboard
//!
//! Usage:
//!   export TELEGRAM_BOT_TOKEN="your_bot_token"
//!   cargo run --example interactive_menu <chat_id>

use miyabi_telegram::{InlineKeyboard, InlineKeyboardButton, TelegramClient};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Get chat_id from command line arguments
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: {} <chat_id>", args[0]);
        eprintln!("\nExample:");
        eprintln!("  export TELEGRAM_BOT_TOKEN=\"your_bot_token\"");
        eprintln!("  cargo run --example interactive_menu 123456789");
        std::process::exit(1);
    }

    let chat_id: i64 = args[1].parse()?;

    // Create Telegram client
    let client = TelegramClient::from_env()?;

    // Get bot information
    let bot = client.get_me().await?;
    println!("✅ Connected to bot: @{}", bot.username.unwrap_or_default());

    // Create an inline keyboard with multiple rows
    let keyboard = InlineKeyboard::new(vec![
        // Row 1: Agent selection
        vec![
            InlineKeyboardButton::callback("🤖 Coordinator", "agent:coordinator"),
            InlineKeyboardButton::callback("💻 CodeGen", "agent:codegen"),
        ],
        // Row 2: Actions
        vec![
            InlineKeyboardButton::callback("📊 Status", "action:status"),
            InlineKeyboardButton::callback("⚙️ Settings", "action:settings"),
        ],
        // Row 3: External link
        vec![InlineKeyboardButton::url(
            "📚 Documentation",
            "https://github.com/customer-cloud/miyabi-private",
        )],
    ]);

    // Send message with keyboard
    let text = r#"
🌸 *Miyabi Bot - Main Menu*

Choose an action:
- Select an agent to run
- Check execution status
- Configure settings

Click a button below to get started!
"#;

    println!("\n📤 Sending interactive menu to chat_id={}...", chat_id);
    let message = client.send_message_with_keyboard(chat_id, text, keyboard).await?;

    println!("✅ Interactive menu sent!");
    println!("   Message ID: {}", message.message_id);
    println!("\n💡 Tip: Click the buttons in Telegram to see them in action!");
    println!("   (You'll need to implement a webhook handler to receive the callbacks)");

    Ok(())
}
