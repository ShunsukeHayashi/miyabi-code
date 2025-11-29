//! Configuration for miyabi-auth

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct AuthConfig {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiry_hours: u64,
    
    // GitHub OAuth
    pub github_client_id: Option<String>,
    pub github_client_secret: Option<String>,
    pub github_redirect_uri: Option<String>,
    
    // Claude OAuth (future)
    pub claude_client_id: Option<String>,
    pub claude_client_secret: Option<String>,
    
    // OpenAI OAuth (future)
    pub openai_client_id: Option<String>,
    pub openai_client_secret: Option<String>,
    
    // Sandbox settings
    pub sandbox_base_path: String,
    pub worktree_base_path: String,
}

impl Default for AuthConfig {
    fn default() -> Self {
        Self {
            database_url: std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://localhost/miyabi".to_string()),
            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "change-me-in-production".to_string()),
            jwt_expiry_hours: 24 * 7, // 1 week
            
            github_client_id: std::env::var("GITHUB_CLIENT_ID").ok(),
            github_client_secret: std::env::var("GITHUB_CLIENT_SECRET").ok(),
            github_redirect_uri: std::env::var("GITHUB_REDIRECT_URI").ok(),
            
            claude_client_id: None,
            claude_client_secret: None,
            openai_client_id: None,
            openai_client_secret: None,
            
            sandbox_base_path: "/home/ubuntu/sandboxes".to_string(),
            worktree_base_path: "/home/ubuntu/worktrees".to_string(),
        }
    }
}
