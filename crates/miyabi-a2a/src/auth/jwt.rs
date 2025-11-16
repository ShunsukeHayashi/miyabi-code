//! JWT validation for A2A Protocol gRPC endpoints.

use crate::error::{A2AError, A2AResult};
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};

/// JWT Claims for A2A Protocol authentication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: String,

    /// Issued at timestamp
    pub iat: i64,

    /// Expiration timestamp
    pub exp: i64,

    /// Optional email
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,

    /// Optional character ID (for agent context)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub character_id: Option<String>,
}

/// JWT validator for A2A Protocol
#[derive(Clone)]
pub struct JwtValidator {
    secret: String,
}

impl JwtValidator {
    /// Create a new JWT validator with the given secret
    pub fn new(secret: impl Into<String>) -> Self {
        Self {
            secret: secret.into(),
        }
    }

    /// Validate a JWT token and return the claims
    pub fn validate(&self, token: &str) -> A2AResult<Claims> {
        let decoding_key = DecodingKey::from_secret(self.secret.as_bytes());
        let mut validation = Validation::new(Algorithm::HS256);
        validation.validate_exp = true;

        decode::<Claims>(token, &decoding_key, &validation)
            .map(|data| data.claims)
            .map_err(|e| A2AError::InvalidRequest(format!("Invalid JWT token: {}", e)))
    }

    /// Extract bearer token from Authorization header
    pub fn extract_bearer_token(auth_header: &str) -> A2AResult<&str> {
        if !auth_header.starts_with("Bearer ") {
            return Err(A2AError::InvalidRequest(
                "Authorization header must start with 'Bearer '".to_string(),
            ));
        }

        Ok(&auth_header[7..]) // Skip "Bearer "
    }

    /// Validate token from Authorization header
    pub fn validate_from_header(&self, auth_header: &str) -> A2AResult<Claims> {
        let token = Self::extract_bearer_token(auth_header)?;
        self.validate(token)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use jsonwebtoken::{encode, EncodingKey, Header};

    fn create_test_token(secret: &str, sub: &str, exp_offset: i64) -> String {
        let claims = Claims {
            sub: sub.to_string(),
            iat: chrono::Utc::now().timestamp(),
            exp: chrono::Utc::now().timestamp() + exp_offset,
            email: Some("test@example.com".to_string()),
            character_id: Some("test-character".to_string()),
        };

        encode(
            &Header::new(Algorithm::HS256),
            &claims,
            &EncodingKey::from_secret(secret.as_bytes()),
        )
        .unwrap()
    }

    #[test]
    fn test_validate_valid_token() {
        let secret = "test-secret-key";
        let validator = JwtValidator::new(secret);

        let token = create_test_token(secret, "user123", 3600);
        let claims = validator.validate(&token).unwrap();

        assert_eq!(claims.sub, "user123");
        assert_eq!(claims.email, Some("test@example.com".to_string()));
        assert_eq!(claims.character_id, Some("test-character".to_string()));
    }

    #[test]
    fn test_validate_expired_token() {
        let secret = "test-secret-key";
        let validator = JwtValidator::new(secret);

        // Token expired 1 hour ago
        let token = create_test_token(secret, "user123", -3600);
        let result = validator.validate(&token);

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Invalid JWT token"));
    }

    #[test]
    fn test_validate_wrong_secret() {
        let validator = JwtValidator::new("correct-secret");

        let token = create_test_token("wrong-secret", "user123", 3600);
        let result = validator.validate(&token);

        assert!(result.is_err());
    }

    #[test]
    fn test_extract_bearer_token() {
        let auth_header = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
        let token = JwtValidator::extract_bearer_token(auth_header).unwrap();

        assert_eq!(token, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test");
    }

    #[test]
    fn test_extract_bearer_token_invalid_format() {
        let auth_header = "InvalidFormat token";
        let result = JwtValidator::extract_bearer_token(auth_header);

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Bearer"));
    }

    #[test]
    fn test_validate_from_header() {
        let secret = "test-secret-key";
        let validator = JwtValidator::new(secret);

        let token = create_test_token(secret, "user123", 3600);
        let auth_header = format!("Bearer {}", token);

        let claims = validator.validate_from_header(&auth_header).unwrap();
        assert_eq!(claims.sub, "user123");
    }
}
