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
