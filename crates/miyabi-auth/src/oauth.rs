//! OAuth2 provider implementations

use crate::{config::AuthConfig, error::AuthError, models::UserInfo};

pub fn get_authorization_url(config: &AuthConfig, provider: &str) -> Result<String, AuthError> {
    match provider {
        "github" => {
            let client_id = config.github_client_id.as_ref()
                .ok_or_else(|| AuthError::ProviderNotConfigured("github".to_string()))?;
            let redirect_uri = config.github_redirect_uri.as_ref()
                .ok_or_else(|| AuthError::ProviderNotConfigured("github".to_string()))?;
            
            Ok(format!(
                "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&scope=user:email,repo",
                client_id, redirect_uri
            ))
        }
        _ => Err(AuthError::ProviderNotConfigured(provider.to_string())),
    }
}

pub async fn exchange_code(config: &AuthConfig, provider: &str, code: &str) -> Result<String, AuthError> {
    match provider {
        "github" => exchange_github_code(config, code).await,
        _ => Err(AuthError::ProviderNotConfigured(provider.to_string())),
    }
}

async fn exchange_github_code(config: &AuthConfig, code: &str) -> Result<String, AuthError> {
    let client_id = config.github_client_id.as_ref()
        .ok_or_else(|| AuthError::ProviderNotConfigured("github".to_string()))?;
    let client_secret = config.github_client_secret.as_ref()
        .ok_or_else(|| AuthError::ProviderNotConfigured("github".to_string()))?;
    
    let client = reqwest::Client::new();
    let resp = client.post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("code", code),
        ])
        .send()
        .await
        .map_err(|e| AuthError::OAuth(e.to_string()))?;
    
    #[derive(serde::Deserialize)]
    struct TokenResponse { access_token: String }
    
    let token_resp: TokenResponse = resp.json().await
        .map_err(|e| AuthError::OAuth(e.to_string()))?;
    
    Ok(token_resp.access_token)
}

pub async fn get_user_info(provider: &str, token: &str) -> Result<UserInfo, AuthError> {
    match provider {
        "github" => get_github_user_info(token).await,
        _ => Err(AuthError::ProviderNotConfigured(provider.to_string())),
    }
}

async fn get_github_user_info(token: &str) -> Result<UserInfo, AuthError> {
    let client = reqwest::Client::new();
    let resp = client.get("https://api.github.com/user")
        .header("Authorization", format!("Bearer {}", token))
        .header("User-Agent", "miyabi-auth")
        .send()
        .await
        .map_err(|e| AuthError::OAuth(e.to_string()))?;
    
    #[derive(serde::Deserialize)]
    struct GitHubUser { id: i64, email: Option<String>, name: Option<String>, avatar_url: Option<String>, login: String }
    
    let user: GitHubUser = resp.json().await
        .map_err(|e| AuthError::OAuth(e.to_string()))?;
    
    Ok(UserInfo {
        email: user.email.unwrap_or_else(|| format!("{}@github.local", user.login)),
        name: user.name,
        avatar_url: user.avatar_url,
        provider: "github".to_string(),
        provider_id: user.id.to_string(),
    })
}
