//! Database Error Types

use thiserror::Error;

/// Database operation result type
pub type Result<T> = std::result::Result<T, DatabaseError>;

/// Database error types
#[derive(Error, Debug)]
pub enum DatabaseError {
    /// SQLx database error
    #[error("Database error: {0}")]
    Sqlx(sqlx::Error),

    /// Entity not found
    #[error("Entity not found: {entity_type} with {field}={value}")]
    NotFound {
        entity_type: String,
        field: String,
        value: String,
    },

    /// Duplicate entity (unique constraint violation)
    #[error("Duplicate {entity_type}: {field}={value} already exists")]
    Duplicate {
        entity_type: String,
        field: String,
        value: String,
    },

    /// Foreign key constraint violation
    #[error("Foreign key constraint violation: {0}")]
    ForeignKeyViolation(String),

    /// Invalid input data
    #[error("Invalid input: {0}")]
    InvalidInput(String),

    /// Serialization/Deserialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// Generic error
    #[error("Database operation failed: {0}")]
    Operation(String),
}

impl DatabaseError {
    /// Create a NotFound error
    pub fn not_found(
        entity_type: impl Into<String>,
        field: impl Into<String>,
        value: impl Into<String>,
    ) -> Self {
        Self::NotFound {
            entity_type: entity_type.into(),
            field: field.into(),
            value: value.into(),
        }
    }

    /// Create a Duplicate error
    pub fn duplicate(
        entity_type: impl Into<String>,
        field: impl Into<String>,
        value: impl Into<String>,
    ) -> Self {
        Self::Duplicate {
            entity_type: entity_type.into(),
            field: field.into(),
            value: value.into(),
        }
    }

    /// Check if this is a NotFound error
    pub fn is_not_found(&self) -> bool {
        matches!(self, Self::NotFound { .. })
    }

    /// Check if this is a Duplicate error
    pub fn is_duplicate(&self) -> bool {
        matches!(self, Self::Duplicate { .. })
    }
}

/// Convert SQLx errors to our domain errors
impl From<sqlx::Error> for DatabaseError {
    fn from(err: sqlx::Error) -> Self {
        match &err {
            sqlx::Error::RowNotFound => Self::NotFound {
                entity_type: "Unknown".to_string(),
                field: "id".to_string(),
                value: "unknown".to_string(),
            },
            sqlx::Error::Database(db_err) => {
                // Check for unique constraint violation (PostgreSQL error code 23505)
                if db_err.code().as_deref() == Some("23505") {
                    Self::Duplicate {
                        entity_type: "Unknown".to_string(),
                        field: "unknown".to_string(),
                        value: "unknown".to_string(),
                    }
                }
                // Check for foreign key violation (PostgreSQL error code 23503)
                else if db_err.code().as_deref() == Some("23503") {
                    Self::ForeignKeyViolation(db_err.message().to_string())
                } else {
                    Self::Sqlx(err)
                }
            }
            _ => Self::Sqlx(err),
        }
    }
}
