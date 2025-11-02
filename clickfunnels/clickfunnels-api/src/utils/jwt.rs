//! JWT Token Utilities
//!
//! This module provides JWT token generation and validation.

use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// JWT Claims structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: String,
    /// Expiration time (Unix timestamp)
    pub exp: i64,
    /// Issued at (Unix timestamp)
    pub iat: i64,
    /// User email
    pub email: String,
}

lazy_static! {
    /// Lazily load the JWT secret from environment
    static ref JWT_SECRET: String =
        std::env::var("JWT_SECRET").expect("JWT_SECRET environment variable must be set");
}

/// Token expiration duration (7 days)
const TOKEN_EXPIRATION_DAYS: i64 = 7;

impl Claims {
    /// Create new claims for a user
    pub fn new(user_id: Uuid, email: String) -> Self {
        let now = Utc::now();
        let exp = (now + Duration::days(TOKEN_EXPIRATION_DAYS)).timestamp();

        Self {
            sub: user_id.to_string(),
            exp,
            iat: now.timestamp(),
            email,
        }
    }

    /// Get user ID from claims
    pub fn user_id(&self) -> Result<Uuid, uuid::Error> {
        Uuid::parse_str(&self.sub)
    }
}

/// Generate a JWT token for a user
///
/// # Arguments
/// * `user_id` - The user's UUID
/// * `email` - The user's email address
///
/// # Returns
/// * `Result<String, jsonwebtoken::errors::Error>` - The JWT token or an error
pub fn generate_token(user_id: Uuid, email: String) -> Result<String, jsonwebtoken::errors::Error> {
    let claims = Claims::new(user_id, email);
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET.as_bytes()),
    )
}

/// Validate and decode a JWT token
///
/// # Arguments
/// * `token` - The JWT token string
///
/// # Returns
/// * `Result<Claims, jsonwebtoken::errors::Error>` - The decoded claims or an error
pub fn validate_token(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(JWT_SECRET.as_bytes()),
        &Validation::default(),
    )?;
    Ok(token_data.claims)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_token() {
        std::env::set_var("JWT_SECRET", "test-secret");
        let user_id = Uuid::new_v4();
        let email = "test@example.com".to_string();

        let token = generate_token(user_id, email.clone()).unwrap();

        // Token should not be empty
        assert!(!token.is_empty());

        // Token should have 3 parts (header.payload.signature)
        assert_eq!(token.split('.').count(), 3);
    }

    #[test]
    fn test_validate_token_valid() {
        std::env::set_var("JWT_SECRET", "test-secret");
        let user_id = Uuid::new_v4();
        let email = "test@example.com".to_string();

        let token = generate_token(user_id, email.clone()).unwrap();
        let claims = validate_token(&token).unwrap();

        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);
        assert_eq!(claims.user_id().unwrap(), user_id);
    }

    #[test]
    fn test_validate_token_invalid() {
        std::env::set_var("JWT_SECRET", "test-secret");
        let result = validate_token("invalid.token.here");
        assert!(result.is_err());
    }

    #[test]
    fn test_claims_user_id() {
        std::env::set_var("JWT_SECRET", "test-secret");
        let user_id = Uuid::new_v4();
        let claims = Claims::new(user_id, "test@example.com".to_string());

        assert_eq!(claims.user_id().unwrap(), user_id);
    }
}
