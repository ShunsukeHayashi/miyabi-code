use thiserror::Error;
use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;

#[derive(Debug, Error)]
pub enum HistoricalAiError {
    #[error("Character file not found: {0}")]
    CharacterNotFound(String),

    #[error("Failed to parse YAML: {0}")]
    YamlParseError(#[from] serde_yaml::Error),

    #[error("Failed to read file: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Invalid character name: {0}")]
    InvalidCharacterName(String),

    #[error("Template rendering error: {0}")]
    TemplateError(String),

    #[error("Missing required field: {0}")]
    MissingField(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<anyhow::Error> for HistoricalAiError {
    fn from(err: anyhow::Error) -> Self {
        HistoricalAiError::Unknown(err.to_string())
    }
}

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for HistoricalAiError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::CharacterNotFound(_) => ErrorCode::FILE_NOT_FOUND,
            Self::YamlParseError(_) => ErrorCode::PARSE_ERROR,
            Self::IoError(e) => match e.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
            Self::InvalidCharacterName(_) => ErrorCode::VALIDATION_ERROR,
            Self::TemplateError(_) => ErrorCode::PARSE_ERROR,
            Self::MissingField(_) => ErrorCode::MISSING_CONFIG,
            Self::Unknown(_) => ErrorCode::UNKNOWN_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::CharacterNotFound(name) => format!(
                "Historical AI character '{}' not found. Please check the character name or create a new character definition.",
                name
            ),
            Self::InvalidCharacterName(name) => format!(
                "Invalid character name: '{}'. Character names must follow naming conventions.",
                name
            ),
            Self::TemplateError(msg) => format!(
                "Template rendering error: {}. Please check your template syntax.",
                msg
            ),
            Self::MissingField(field) => format!(
                "Required field '{}' is missing from character definition. Please add this field.",
                field
            ),
            Self::Unknown(msg) => format!(
                "An unknown historical AI error occurred: {}. Please check logs for more details.",
                msg
            ),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::CharacterNotFound(name) => Some(name as &dyn Any),
            Self::InvalidCharacterName(name) => Some(name as &dyn Any),
            Self::TemplateError(msg) => Some(msg as &dyn Any),
            Self::MissingField(field) => Some(field as &dyn Any),
            Self::Unknown(msg) => Some(msg as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_historical_ai_error_codes() {
        let error = HistoricalAiError::CharacterNotFound("oda-nobunaga".to_string());
        assert_eq!(error.code(), ErrorCode::FILE_NOT_FOUND);

        let error = HistoricalAiError::InvalidCharacterName("invalid/name".to_string());
        assert_eq!(error.code(), ErrorCode::VALIDATION_ERROR);

        let error = HistoricalAiError::TemplateError("syntax error".to_string());
        assert_eq!(error.code(), ErrorCode::PARSE_ERROR);

        let error = HistoricalAiError::MissingField("personality".to_string());
        assert_eq!(error.code(), ErrorCode::MISSING_CONFIG);

        let error = HistoricalAiError::Unknown("unknown".to_string());
        assert_eq!(error.code(), ErrorCode::UNKNOWN_ERROR);
    }

    #[test]
    fn test_user_messages() {
        let error = HistoricalAiError::CharacterNotFound("tokugawa-ieyasu".to_string());
        let msg = error.user_message();
        assert!(msg.contains("tokugawa-ieyasu"));
        assert!(msg.contains("not found"));

        let error = HistoricalAiError::MissingField("era".to_string());
        let msg = error.user_message();
        assert!(msg.contains("era"));
        assert!(msg.contains("missing"));

        let error = HistoricalAiError::TemplateError("unclosed tag".to_string());
        let msg = error.user_message();
        assert!(msg.contains("Template"));
        assert!(msg.contains("unclosed tag"));
    }

    #[test]
    fn test_context_extraction() {
        let error = HistoricalAiError::CharacterNotFound("character".to_string());
        assert!(error.context().is_some());

        let error = HistoricalAiError::MissingField("field".to_string());
        assert!(error.context().is_some());

        let error = HistoricalAiError::IoError(std::io::Error::new(std::io::ErrorKind::Other, "test"));
        assert!(error.context().is_none());
    }
}
