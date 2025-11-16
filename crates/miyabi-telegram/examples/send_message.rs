//! Simple example: Send a message to a Telegram chat
//!
//! Usage:
//!   export TELEGRAM_BOT_TOKEN="your_bot_token"
//!   cargo run --example send_message <chat_id>

use miyabi_telegram::TelegramClient;

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
        eprintln!("  cargo run --example send_message 123456789");
        std::process::exit(1);
    }

    let chat_id: i64 = args[1].parse()?;

    // Create Telegram client from environment variable
    let client = TelegramClient::from_env()?;

    // Get bot information
    let bot = client.get_me().await?;
    println!("✅ Connected to bot: @{}", bot.username.unwrap_or_default());
    println!("   Name: {}", bot.first_name);
    println!("   ID: {}", bot.id);

    // Send a simple message
    println!("\n📤 Sending message to chat_id={}...", chat_id);
    let message = client.send_message(chat_id, "Hello from Miyabi! 🤖").await?;

    println!("✅ Message sent successfully!");
    println!("   Message ID: {}", message.message_id);
    println!("   Chat ID: {}", message.chat.id);

    Ok(())
}
