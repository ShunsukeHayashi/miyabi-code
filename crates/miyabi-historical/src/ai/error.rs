use thiserror::Error;

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
