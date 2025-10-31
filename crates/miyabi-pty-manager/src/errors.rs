use thiserror::Error;

#[derive(Error, Debug)]
pub enum PtyError {
    #[error("Failed to open PTY: {0}")]
    OpenPtyFailed(String),

    #[error("Failed to spawn shell: {0}")]
    SpawnShellFailed(String),

    #[error("Failed to clone reader: {0}")]
    CloneReaderFailed(String),

    #[error("Failed to get writer: {0}")]
    GetWriterFailed(String),

    #[error("Failed to write to PTY: {0}")]
    WriteFailed(String),

    #[error("Failed to flush PTY: {0}")]
    FlushFailed(String),

    #[error("Session not found: {0}")]
    SessionNotFound(String),

    #[error("Session already exists: {0}")]
    SessionExists(String),

    #[error("Process not alive")]
    ProcessNotAlive,

    #[error("Timeout waiting for output")]
    OutputTimeout,

    #[error("Invalid UTF-8 in output")]
    InvalidUtf8,

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

pub type Result<T> = std::result::Result<T, PtyError>;
