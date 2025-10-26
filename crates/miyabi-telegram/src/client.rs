//! Telegram Bot API client

use crate::error::{Result, TelegramError};
use crate::types::*;
use reqwest::Client;
use tracing::{debug, info, warn};

const TELEGRAM_API_BASE: &str = "https://api.telegram.org";

/// Telegram Bot API client
pub struct TelegramClient {
    bot_token: String,
    api_base: String,
    http_client: Client,
}

impl TelegramClient {
    /// Create a new Telegram client with bot token
    pub fn new(bot_token: String) -> Self {
        Self {
            bot_token,
            api_base: TELEGRAM_API_BASE.to_string(),
            http_client: Client::new(),
        }
    }

    /// Create client from environment variable TELEGRAM_BOT_TOKEN
    pub fn from_env() -> Result<Self> {
        let bot_token = std::env::var("TELEGRAM_BOT_TOKEN")
            .map_err(|_| TelegramError::MissingEnvVar("TELEGRAM_BOT_TOKEN".to_string()))?;

        Ok(Self::new(bot_token))
    }

    /// Build API URL for a method
    fn api_url(&self, method: &str) -> String {
        format!("{}/bot{}/{}", self.api_base, self.bot_token, method)
    }

    /// Send a text message
    ///
    /// # Arguments
    /// * `chat_id` - Unique identifier for the target chat
    /// * `text` - Text of the message to be sent
    ///
    /// # Example
    /// ```no_run
    /// # use miyabi_telegram::TelegramClient;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let client = TelegramClient::from_env()?;
    /// client.send_message(123456789, "Hello, World!").await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn send_message(&self, chat_id: i64, text: &str) -> Result<Message> {
        let request = SendMessageRequest {
            chat_id,
            text: text.to_string(),
            parse_mode: Some("Markdown".to_string()),
            reply_markup: None,
        };

        self.send_message_full(request).await
    }

    /// Send a message with full options
    pub async fn send_message_full(&self, request: SendMessageRequest) -> Result<Message> {
        debug!(
            "Sending message to chat_id={}: {}",
            request.chat_id, request.text
        );

        let response: ApiResponse<Message> = self
            .http_client
            .post(self.api_url("sendMessage"))
            .json(&request)
            .send()
            .await?
            .json()
            .await?;

        if response.ok {
            info!("Message sent successfully to chat_id={}", request.chat_id);
            response
                .result
                .ok_or_else(|| TelegramError::ApiError("No result in response".to_string()))
        } else {
            let error_msg = response
                .description
                .unwrap_or_else(|| "Unknown error".to_string());
            warn!("Failed to send message: {}", error_msg);
            Err(TelegramError::ApiError(error_msg))
        }
    }

    /// Send a message with an inline keyboard
    ///
    /// # Example
    /// ```no_run
    /// # use miyabi_telegram::{TelegramClient, InlineKeyboard, InlineKeyboardButton};
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let client = TelegramClient::from_env()?;
    ///
    /// let keyboard = InlineKeyboard::single_row(vec![
    ///     InlineKeyboardButton::callback("✅ Yes", "yes"),
    ///     InlineKeyboardButton::callback("❌ No", "no"),
    /// ]);
    ///
    /// client.send_message_with_keyboard(123456789, "Do you agree?", keyboard).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn send_message_with_keyboard(
        &self,
        chat_id: i64,
        text: &str,
        keyboard: InlineKeyboard,
    ) -> Result<Message> {
        let request = SendMessageRequest {
            chat_id,
            text: text.to_string(),
            parse_mode: Some("Markdown".to_string()),
            reply_markup: Some(keyboard),
        };

        self.send_message_full(request).await
    }

    /// Send a message with buttons (convenience method)
    ///
    /// Creates an inline keyboard from a simple button spec
    ///
    /// # Arguments
    /// * `chat_id` - Target chat ID
    /// * `text` - Message text
    /// * `buttons` - Vector of button rows, each containing (text, callback_data) tuples
    ///
    /// # Example
    /// ```no_run
    /// # use miyabi_telegram::TelegramClient;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let client = TelegramClient::from_env()?;
    ///
    /// let buttons = vec![
    ///     vec![("✅ Yes", "yes"), ("❌ No", "no")],
    ///     vec![("ℹ️ Info", "info")],
    /// ];
    ///
    /// client.send_message_with_buttons(123456789, "Choose an option:", buttons).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn send_message_with_buttons(
        &self,
        chat_id: i64,
        text: &str,
        buttons: Vec<Vec<(&str, &str)>>,
    ) -> Result<Message> {
        let keyboard_buttons: Vec<Vec<InlineKeyboardButton>> = buttons
            .into_iter()
            .map(|row| {
                row.into_iter()
                    .map(|(text, callback_data)| {
                        InlineKeyboardButton::callback(text, callback_data)
                    })
                    .collect()
            })
            .collect();

        let keyboard = InlineKeyboard {
            inline_keyboard: keyboard_buttons,
        };

        self.send_message_with_keyboard(chat_id, text, keyboard)
            .await
    }

    /// Answer a callback query
    ///
    /// This method should be called when the user clicks an inline keyboard button.
    ///
    /// # Arguments
    /// * `callback_query_id` - Unique identifier for the query
    /// * `text` - Optional text to show to the user
    pub async fn answer_callback_query(
        &self,
        callback_query_id: &str,
        text: Option<&str>,
    ) -> Result<bool> {
        debug!("Answering callback query: {}", callback_query_id);

        let mut payload = serde_json::json!({
            "callback_query_id": callback_query_id,
        });

        if let Some(text) = text {
            payload["text"] = serde_json::json!(text);
        }

        let response: ApiResponse<bool> = self
            .http_client
            .post(self.api_url("answerCallbackQuery"))
            .json(&payload)
            .send()
            .await?
            .json()
            .await?;

        if response.ok {
            info!("Callback query answered successfully");
            Ok(response.result.unwrap_or(true))
        } else {
            let error_msg = response
                .description
                .unwrap_or_else(|| "Unknown error".to_string());
            warn!("Failed to answer callback query: {}", error_msg);
            Err(TelegramError::ApiError(error_msg))
        }
    }

    /// Get bot information
    pub async fn get_me(&self) -> Result<User> {
        debug!("Getting bot information");

        let response: ApiResponse<User> = self
            .http_client
            .get(self.api_url("getMe"))
            .send()
            .await?
            .json()
            .await?;

        if response.ok {
            info!("Bot information retrieved");
            response
                .result
                .ok_or_else(|| TelegramError::ApiError("No result in response".to_string()))
        } else {
            let error_msg = response
                .description
                .unwrap_or_else(|| "Unknown error".to_string());
            Err(TelegramError::ApiError(error_msg))
        }
    }

    /// Set webhook URL
    ///
    /// # Arguments
    /// * `url` - HTTPS URL to send updates to
    pub async fn set_webhook(&self, url: &str) -> Result<bool> {
        info!("Setting webhook URL: {}", url);

        let payload = serde_json::json!({
            "url": url,
        });

        let response: ApiResponse<bool> = self
            .http_client
            .post(self.api_url("setWebhook"))
            .json(&payload)
            .send()
            .await?
            .json()
            .await?;

        if response.ok {
            info!("Webhook set successfully");
            Ok(response.result.unwrap_or(true))
        } else {
            let error_msg = response
                .description
                .unwrap_or_else(|| "Unknown error".to_string());
            warn!("Failed to set webhook: {}", error_msg);
            Err(TelegramError::ApiError(error_msg))
        }
    }

    /// Delete webhook
    pub async fn delete_webhook(&self) -> Result<bool> {
        info!("Deleting webhook");

        let response: ApiResponse<bool> = self
            .http_client
            .post(self.api_url("deleteWebhook"))
            .send()
            .await?
            .json()
            .await?;

        if response.ok {
            info!("Webhook deleted successfully");
            Ok(response.result.unwrap_or(true))
        } else {
            let error_msg = response
                .description
                .unwrap_or_else(|| "Unknown error".to_string());
            Err(TelegramError::ApiError(error_msg))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_api_url() {
        let client = TelegramClient::new("test_token".to_string());
        assert_eq!(
            client.api_url("sendMessage"),
            "https://api.telegram.org/bottest_token/sendMessage"
        );
    }

    #[test]
    fn test_inline_keyboard_builder() {
        let keyboard = InlineKeyboard::single_row(vec![
            InlineKeyboardButton::callback("Yes", "yes"),
            InlineKeyboardButton::callback("No", "no"),
        ]);

        assert_eq!(keyboard.inline_keyboard.len(), 1);
        assert_eq!(keyboard.inline_keyboard[0].len(), 2);
        assert_eq!(keyboard.inline_keyboard[0][0].text, "Yes");
        assert_eq!(
            keyboard.inline_keyboard[0][0].callback_data,
            Some("yes".to_string())
        );
    }
}
