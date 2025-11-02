//! Password Hashing Utilities
//!
//! This module provides secure password hashing using bcrypt.

use bcrypt::{hash, verify, DEFAULT_COST};

/// Hash a password using bcrypt
///
/// # Arguments
/// * `password` - The plain text password to hash
///
/// # Returns
/// * `Result<String, bcrypt::BcryptError>` - The hashed password or an error
///
/// # Example
/// ```no_run
/// use clickfunnels_api::utils::password::hash_password;
///
/// let hashed = hash_password("my_secure_password").unwrap();
/// ```
pub fn hash_password(password: &str) -> Result<String, bcrypt::BcryptError> {
    hash(password, DEFAULT_COST)
}

/// Verify a password against a hash
///
/// # Arguments
/// * `password` - The plain text password to verify
/// * `hash` - The bcrypt hash to verify against
///
/// # Returns
/// * `Result<bool, bcrypt::BcryptError>` - True if password matches, false otherwise
///
/// # Example
/// ```no_run
/// use clickfunnels_api::utils::password::{hash_password, verify_password};
///
/// let hashed = hash_password("my_password").unwrap();
/// let is_valid = verify_password("my_password", &hashed).unwrap();
/// assert!(is_valid);
/// ```
pub fn verify_password(password: &str, hash: &str) -> Result<bool, bcrypt::BcryptError> {
    verify(password, hash)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_password() {
        let password = "test_password_123";
        let hashed = hash_password(password).unwrap();

        // Hash should be different from password
        assert_ne!(password, hashed);

        // Hash should start with bcrypt prefix
        assert!(hashed.starts_with("$2"));
    }

    #[test]
    fn test_verify_password_valid() {
        let password = "correct_password";
        let hashed = hash_password(password).unwrap();

        let is_valid = verify_password(password, &hashed).unwrap();
        assert!(is_valid);
    }

    #[test]
    fn test_verify_password_invalid() {
        let password = "correct_password";
        let hashed = hash_password(password).unwrap();

        let is_valid = verify_password("wrong_password", &hashed).unwrap();
        assert!(!is_valid);
    }

    #[test]
    fn test_hash_same_password_different_hashes() {
        let password = "same_password";
        let hash1 = hash_password(password).unwrap();
        let hash2 = hash_password(password).unwrap();

        // Same password should produce different hashes (due to salt)
        assert_ne!(hash1, hash2);

        // But both should verify correctly
        assert!(verify_password(password, &hash1).unwrap());
        assert!(verify_password(password, &hash2).unwrap());
    }
}
