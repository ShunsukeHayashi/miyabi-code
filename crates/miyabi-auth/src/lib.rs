//! miyabi-auth - OAuth2 Authentication for Miyabi
//!
//! Supports:
//! - GitHub OAuth2
//! - Claude Web (future)
//! - ChatGPT Web (future)

pub mod config;
pub mod db;
pub mod error;
pub mod handlers;
pub mod jwt;
pub mod models;
pub mod oauth;
pub mod sandbox;

pub use config::AuthConfig;
pub use error::AuthError;
pub use models::{User, Session, Project};

/// Initialize the auth system
pub async fn init(config: AuthConfig) -> Result<AuthService, AuthError> {
    AuthService::new(config).await
}

pub struct AuthService {
    config: AuthConfig,
    db: db::Database,
    jwt: jwt::JwtManager,
}

impl AuthService {
    pub async fn new(config: AuthConfig) -> Result<Self, AuthError> {
        let db = db::Database::connect(&config.database_url).await?;
        let jwt = jwt::JwtManager::new(&config.jwt_secret);
        
        Ok(Self { config, db, jwt })
    }
    
    /// Create OAuth2 authorization URL
    pub fn get_auth_url(&self, provider: &str) -> Result<String, AuthError> {
        oauth::get_authorization_url(&self.config, provider)
    }
    
    /// Handle OAuth2 callback
    pub async fn handle_callback(
        &self,
        provider: &str,
        code: &str,
    ) -> Result<(User, String), AuthError> {
        // Exchange code for token
        let token = oauth::exchange_code(&self.config, provider, code).await?;
        
        // Get user info from provider
        let user_info = oauth::get_user_info(provider, &token).await?;
        
        // Create or update user in DB
        let user = self.db.upsert_user(&user_info).await?;
        
        // Generate JWT
        let jwt_token = self.jwt.generate(&user)?;
        
        Ok((user, jwt_token))
    }
    
    /// Verify JWT and get user
    pub async fn verify_token(&self, token: &str) -> Result<User, AuthError> {
        let claims = self.jwt.verify(token)?;
        self.db.get_user_by_id(&claims.sub).await
    }
    
    /// Create sandbox for project
    pub async fn create_sandbox(
        &self,
        user_id: &str,
        project_id: &str,
    ) -> Result<sandbox::Sandbox, AuthError> {
        sandbox::create_sandbox(user_id, project_id).await
    }
}
