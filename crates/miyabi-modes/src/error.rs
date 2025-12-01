use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ModeError {
    #[error("Mode not found: {0}")]
    ModeNotFound(String),

    #[error("Duplicate mode slug: {0}")]
    DuplicateSlug(String),

    #[error("Invalid mode definition: {0}")]
    InvalidDefinition(String),

    #[error("YAML parsing error: {0}")]
    YamlError(#[from] serde_yaml::Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Invalid file regex: {0}")]
    InvalidRegex(#[from] regex::Error),

    #[error("Mode validation failed: {0}")]
    ValidationFailed(String),

    #[error("Missing required field: {0}")]
    MissingField(String),
}

pub type ModeResult<T> = Result<T, ModeError>;

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for ModeError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::ModeNotFound(_) => ErrorCode::FILE_NOT_FOUND,
            Self::DuplicateSlug(_) => ErrorCode::VALIDATION_ERROR,
            Self::InvalidDefinition(_) => ErrorCode::INVALID_CONFIG,
            Self::YamlError(_) => ErrorCode::PARSE_ERROR,
            Self::IoError(e) => match e.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
            Self::InvalidRegex(_) => ErrorCode::REGEX_ERROR,
            Self::ValidationFailed(_) => ErrorCode::VALIDATION_ERROR,
            Self::MissingField(_) => ErrorCode::MISSING_CONFIG,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::ModeNotFound(name) => {
                format!("Mode '{}' was not found. Please check the mode name and ensure it has been registered.", name)
            }
            Self::DuplicateSlug(slug) => {
                format!("A mode with slug '{}' already exists. Please use a different slug for your mode.", slug)
            }
            Self::InvalidDefinition(msg) => {
                format!("Invalid mode definition: {}. Please check your mode configuration.", msg)
            }
            Self::YamlError(e) => format!("Failed to parse YAML configuration: {}. Please check your YAML syntax.", e),
            Self::InvalidRegex(e) => format!("Invalid file pattern regex: {}. Please check your regex syntax.", e),
            Self::ValidationFailed(msg) => {
                format!("Mode validation failed: {}. Please review your mode configuration.", msg)
            }
            Self::MissingField(field) => {
                format!("Required field '{}' is missing from mode configuration. Please add this field.", field)
            }
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::ModeNotFound(name) => Some(name as &dyn Any),
            Self::DuplicateSlug(slug) => Some(slug as &dyn Any),
            Self::InvalidDefinition(msg) => Some(msg as &dyn Any),
            Self::ValidationFailed(msg) => Some(msg as &dyn Any),
            Self::MissingField(field) => Some(field as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_mode_error_codes() {
        let error = ModeError::ModeNotFound("test".to_string());
        assert_eq!(error.code(), ErrorCode::FILE_NOT_FOUND);

        let error = ModeError::DuplicateSlug("test".to_string());
        assert_eq!(error.code(), ErrorCode::VALIDATION_ERROR);

        let error = ModeError::InvalidDefinition("test".to_string());
        assert_eq!(error.code(), ErrorCode::INVALID_CONFIG);

        let error = ModeError::ValidationFailed("test".to_string());
        assert_eq!(error.code(), ErrorCode::VALIDATION_ERROR);

        let error = ModeError::MissingField("name".to_string());
        assert_eq!(error.code(), ErrorCode::MISSING_CONFIG);
    }

    #[test]
    fn test_user_messages() {
        let error = ModeError::ModeNotFound("custom-mode".to_string());
        let msg = error.user_message();
        assert!(msg.contains("custom-mode"));
        assert!(msg.contains("not found"));

        let error = ModeError::DuplicateSlug("my-mode".to_string());
        let msg = error.user_message();
        assert!(msg.contains("my-mode"));
        assert!(msg.contains("already exists"));

        let error = ModeError::MissingField("description".to_string());
        let msg = error.user_message();
        assert!(msg.contains("description"));
        assert!(msg.contains("missing"));
    }

    #[test]
    fn test_context_extraction() {
        let error = ModeError::ModeNotFound("test".to_string());
        assert!(error.context().is_some());

        let error = ModeError::DuplicateSlug("test".to_string());
        assert!(error.context().is_some());

        let error = ModeError::MissingField("name".to_string());
        assert!(error.context().is_some());

        let error = ModeError::IoError(std::io::Error::other("test"));
        assert!(error.context().is_none());
    }
}
