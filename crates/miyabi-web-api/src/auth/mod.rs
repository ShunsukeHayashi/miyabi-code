//! Authentication and JWT token management

pub mod blacklist;

pub use blacklist::{BlacklistError, MemoryTokenBlacklist, TokenBlacklist};
#[cfg(feature = "redis")]
pub use blacklist::RedisTokenBlacklist;

use crate::{
    error::{AppError, Result},
    models::Claims,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};

/// JWT token manager
pub struct JwtManager {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    expiration: i64,
}

impl JwtManager {
    /// Creates a new JWT manager
    pub fn new(secret: &str, expiration: i64) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret.as_bytes()),
            decoding_key: DecodingKey::from_secret(secret.as_bytes()),
            expiration,
        }
    }

    /// Creates a JWT token for a user
    ///
    /// # Arguments
    ///
    /// * `user_id` - User UUID
    /// * `github_id` - GitHub user ID
    ///
    /// # Errors
    ///
    /// Returns error if token creation fails
    pub fn create_token(&self, user_id: &str, github_id: i64) -> Result<String> {
        self.create_token_with_org(user_id, github_id, None, None)
    }

    /// Creates a JWT token with organization context
    ///
    /// Phase 1.5: Extended token creation with org_id and org_role
    ///
    /// # Arguments
    ///
    /// * `user_id` - User UUID
    /// * `github_id` - GitHub user ID
    /// * `org_id` - Optional organization UUID
    /// * `org_role` - Optional organization role
    ///
    /// # Errors
    ///
    /// Returns error if token creation fails
    pub fn create_token_with_org(
        &self,
        user_id: &str,
        github_id: i64,
        org_id: Option<&str>,
        org_role: Option<&str>,
    ) -> Result<String> {
        let now = chrono::Utc::now().timestamp();
        let claims = Claims {
            sub: user_id.to_string(),
            exp: now + self.expiration,
            iat: now,
            github_id,
            org_id: org_id.map(|s| s.to_string()),
            org_role: org_role.map(|s| s.to_string()),
        };

        encode(&Header::default(), &claims, &self.encoding_key).map_err(AppError::Jwt)
    }

    /// Validates a JWT token and returns the claims
    ///
    /// # Arguments
    ///
    /// * `token` - JWT token string
    ///
    /// # Errors
    ///
    /// Returns error if token is invalid or expired
    pub fn validate_token(&self, token: &str) -> Result<Claims> {
        decode::<Claims>(token, &self.decoding_key, &Validation::default())
            .map(|data| data.claims)
            .map_err(AppError::Jwt)
    }
}

/// Extracts bearer token from Authorization header
///
/// # Arguments
///
/// * `auth_header` - Authorization header value
///
/// # Errors
///
/// Returns error if header format is invalid
pub fn extract_bearer_token(auth_header: &str) -> Result<&str> {
    let parts: Vec<&str> = auth_header.split_whitespace().collect();

    if parts.len() != 2 || parts[0] != "Bearer" {
        return Err(AppError::Authentication(
            "Invalid Authorization header format".to_string(),
        ));
    }

    Ok(parts[1])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jwt_token_creation_and_validation() {
        let manager = JwtManager::new("test-secret", 3600);
        let user_id = "123e4567-e89b-12d3-a456-426614174000";
        let github_id = 12345;

        let token = manager.create_token(user_id, github_id).unwrap();
        let claims = manager.validate_token(&token).unwrap();

        assert_eq!(claims.sub, user_id);
        assert_eq!(claims.github_id, github_id);
    }

    #[test]
    fn test_extract_bearer_token() {
        let header = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
        let token = extract_bearer_token(header).unwrap();
        assert_eq!(token, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    }

    #[test]
    fn test_extract_bearer_token_invalid() {
        let header = "InvalidFormat";
        let result = extract_bearer_token(header);
        assert!(result.is_err());
    }

    #[test]
    fn test_jwt_token_validation_expired() {
        // Create a token that is already expired and ensure validation fails
        // Use -120 seconds to exceed JWT library's default 60-second leeway for clock skew
        let manager = JwtManager::new("expired-secret", -120);
        let token = manager
            .create_token("123e4567-e89b-12d3-a456-426614174000", 42)
            .unwrap();

        let result = manager.validate_token(&token);
        assert!(result.is_err(), "Expired tokens should not validate");
    }
}
