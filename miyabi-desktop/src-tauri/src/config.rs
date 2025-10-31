use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub github_token: Option<String>,
    pub github_repository: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            github_token: None,
            github_repository: None,
        }
    }
}

/// Get the path to the config file
fn get_config_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config dir: {}", e))?;

    // Ensure the directory exists
    fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create config dir: {}", e))?;

    Ok(app_dir.join("config.json"))
}

/// Load configuration from disk
pub fn load_config(app_handle: &AppHandle) -> Result<AppConfig, String> {
    let config_path = get_config_path(app_handle)?;

    if !config_path.exists() {
        return Ok(AppConfig::default());
    }

    let content =
        fs::read_to_string(&config_path).map_err(|e| format!("Failed to read config: {}", e))?;

    serde_json::from_str(&content).map_err(|e| format!("Failed to parse config: {}", e))
}

/// Save configuration to disk
pub fn save_config(app_handle: &AppHandle, config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path(app_handle)?;

    let content =
        serde_json::to_string_pretty(config).map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, content).map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}

/// Save GitHub token to secure storage
#[tauri::command]
pub async fn save_github_token(token: String, app_handle: AppHandle) -> Result<(), String> {
    let mut config = load_config(&app_handle)?;
    config.github_token = Some(token);
    save_config(&app_handle, &config)?;
    Ok(())
}

/// Get GitHub token from secure storage
#[tauri::command]
pub async fn get_github_token(app_handle: AppHandle) -> Result<Option<String>, String> {
    let config = load_config(&app_handle)?;
    Ok(config.github_token)
}

/// Save GitHub repository
#[tauri::command]
pub async fn save_github_repository(repository: String, app_handle: AppHandle) -> Result<(), String> {
    let mut config = load_config(&app_handle)?;
    config.github_repository = Some(repository);
    save_config(&app_handle, &config)?;
    Ok(())
}

/// Get GitHub repository
#[tauri::command]
pub async fn get_github_repository(app_handle: AppHandle) -> Result<Option<String>, String> {
    let config = load_config(&app_handle)?;
    Ok(config.github_repository)
}

/// Clear all configuration
#[tauri::command]
pub async fn clear_config(app_handle: AppHandle) -> Result<(), String> {
    let config = AppConfig::default();
    save_config(&app_handle, &config)?;
    Ok(())
}
