mod agent;
mod automation;
mod config;
mod github;
mod pty;
mod tmux;
mod voicevox;

use agent::{execute_agent, AgentExecutionRequest, AgentExecutionResult};
use automation::{AutomationConfig, AutomationManager, AutomationReadiness, AutomationSession};
use config::{AgentConfig, AgentsConfig};
use github::{get_issue, list_issues, update_issue, GitHubIssue, IssueState, UpdateIssueRequest};
use pty::{PtyManager, SessionInfo, TerminalSession};
use std::env;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, State};
use tmux::{TmuxManager, TmuxSession};
use voicevox::{
    check_voicevox_engine, generate_narration, get_speakers, start_voicevox_engine,
    NarrationRequest, NarrationResult, SpeakerConfig,
};

struct AppState {
    pty_manager: Mutex<PtyManager>,
}

#[tauri::command]
async fn spawn_terminal(
    cols: u16,
    rows: u16,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<TerminalSession, String> {
    let pty_manager = state.pty_manager.lock().unwrap();
    pty_manager.spawn_shell(cols, rows, app_handle)
}

#[tauri::command]
async fn spawn_terminal_managed(
    cols: u16,
    rows: u16,
    managed_by: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<TerminalSession, String> {
    let pty_manager = state.pty_manager.lock().unwrap();
    pty_manager.spawn_shell_with_manager(cols, rows, app_handle, Some(managed_by))
}

#[tauri::command]
async fn write_to_terminal(
    session_id: String,
    data: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let pty_manager = state.pty_manager.lock().unwrap();
    pty_manager.write_to_pty(&session_id, &data)
}

#[tauri::command]
async fn resize_terminal(
    session_id: String,
    cols: u16,
    rows: u16,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let pty_manager = state.pty_manager.lock().unwrap();
    pty_manager.resize_pty(&session_id, cols, rows)
}

#[tauri::command]
async fn kill_terminal(session_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let pty_manager = state.pty_manager.lock().unwrap();
    pty_manager.kill_session(&session_id)
}

// ========== Orchestrator Management Commands ==========

#[tauri::command]
async fn list_terminal_sessions(
    state: State<'_, AppState>,
) -> Result<Vec<TerminalSession>, String> {
    let pty_manager = state.pty_manager.lock().unwrap();
    Ok(pty_manager.list_sessions())
}

#[tauri::command]
async fn get_terminal_session_info(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<SessionInfo, String> {
    let pty_manager = state.pty_manager.lock().unwrap();
    pty_manager.get_session_info(&session_id)
}

#[tauri::command]
async fn execute_terminal_command(
    session_id: String,
    command: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let pty_manager = state.pty_manager.lock().unwrap();
    pty_manager.execute_command(&session_id, &command)
}

#[tauri::command]
async fn list_sessions_by_manager(
    manager_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<TerminalSession>, String> {
    let pty_manager = state.pty_manager.lock().unwrap();
    Ok(pty_manager.list_sessions_by_manager(&manager_id))
}

#[tauri::command]
async fn kill_sessions_by_manager(
    manager_id: String,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    let pty_manager = state.pty_manager.lock().unwrap();
    pty_manager.kill_sessions_by_manager(&manager_id)
}

// ========== Agent Execution Commands ==========

#[tauri::command]
async fn execute_agent_command(
    request: AgentExecutionRequest,
    app_handle: AppHandle,
) -> Result<AgentExecutionResult, String> {
    execute_agent(request, app_handle).await
}

// ========== VOICEVOX Commands ==========

#[tauri::command]
async fn check_voicevox_engine_command() -> Result<bool, String> {
    check_voicevox_engine().await
}

#[tauri::command]
async fn start_voicevox_engine_command() -> Result<bool, String> {
    start_voicevox_engine().await
}

#[tauri::command]
async fn generate_narration_command(
    request: NarrationRequest,
    app_handle: AppHandle,
) -> Result<NarrationResult, String> {
    generate_narration(request, app_handle).await
}

#[tauri::command]
async fn get_speakers_command() -> Result<Vec<SpeakerConfig>, String> {
    get_speakers().await
}

// ========== GitHub Commands ==========

#[tauri::command]
async fn list_issues_command(
    state: Option<IssueState>,
    labels: Vec<String>,
    app_handle: AppHandle,
) -> Result<Vec<GitHubIssue>, String> {
    list_issues(state, labels, app_handle).await
}

#[tauri::command]
async fn get_issue_command(number: u64) -> Result<GitHubIssue, String> {
    get_issue(number).await
}

#[tauri::command]
async fn update_issue_command(
    request: UpdateIssueRequest,
    app_handle: AppHandle,
) -> Result<GitHubIssue, String> {
    update_issue(request, app_handle).await
}

// ========== Tmux Commands ==========

#[tauri::command]
async fn tmux_start_agent(agent_name: String, issue_number: Option<u64>) -> Result<String, String> {
    // Resolve and load agent configuration
    let config_path = resolve_agents_config_path()?;
    let config = AgentsConfig::load_from_file(&config_path)?;

    // Find the agent
    let agent = config
        .get_agent(&agent_name)
        .ok_or_else(|| format!("Agent '{}' not found in configuration", agent_name))?;

    // Determine session name (dynamic if issue_number provided, otherwise static)
    let session_name = if let Some(issue_num) = issue_number {
        // Generate context-aware session name: issue-{number}-{agent_type}
        let agent_type = agent_name
            .to_lowercase()
            .replace("agent", "")
            .replace("mode", "")
            .trim()
            .to_string();
        format!("issue-{}-{}", issue_num, agent_type)
    } else {
        agent.session_name.clone()
    };

    // Render the command with runtime context (paths, issue number, etc.)
    let repo_root = resolve_repo_root(&config_path)?;
    let desktop_dir = env::current_dir()
        .map_err(|e| format!("Failed to determine current working directory: {}", e))?;
    let command = render_agent_command(
        &agent.command,
        CommandContext {
            repo_root: &repo_root,
            desktop_dir: &desktop_dir,
            issue_number,
            home_dir: env::var("HOME").ok().map(PathBuf::from),
        },
    )?;

    // Create tmux session
    TmuxManager::create_session(&session_name, &command).await?;

    Ok(session_name)
}

#[tauri::command]
async fn tmux_list_sessions() -> Result<Vec<TmuxSession>, String> {
    TmuxManager::list_sessions().await
}

#[tauri::command]
async fn tmux_kill_session(session_name: String) -> Result<(), String> {
    TmuxManager::kill_session(&session_name).await
}

#[tauri::command]
async fn tmux_load_config() -> Result<AgentsConfig, String> {
    let config_path = resolve_agents_config_path()?;
    AgentsConfig::load_from_file(config_path)
}

#[tauri::command]
async fn tmux_get_session_output(
    session_name: String,
    lines: Option<usize>,
) -> Result<String, String> {
    TmuxManager::get_session_output(&session_name, lines.unwrap_or(50)).await
}

#[tauri::command]
async fn tmux_check_session_exists(session_name: String) -> Result<bool, String> {
    TmuxManager::check_session_exists(&session_name).await
}

// ========== Automation Commands (Claude Code + Codex + Orchestrator) ==========

#[tauri::command]
async fn get_automation_readiness() -> AutomationReadiness {
    AutomationManager::get_readiness().await
}

#[tauri::command]
async fn start_full_automation(config: AutomationConfig) -> Result<AutomationSession, String> {
    AutomationManager::start_automation(config).await
}

#[tauri::command]
async fn stop_full_automation(session_name: String) -> Result<(), String> {
    AutomationManager::stop_automation(&session_name).await
}

#[tauri::command]
async fn get_automation_status(session_name: String) -> Result<AutomationSession, String> {
    AutomationManager::get_session_status(&session_name).await
}

#[tauri::command]
async fn load_automation_config_from_env() -> Result<AutomationConfig, String> {
    AutomationManager::load_config_from_env()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            pty_manager: Mutex::new(PtyManager::new()),
        })
        .invoke_handler(tauri::generate_handler![
            spawn_terminal,
            spawn_terminal_managed,
            write_to_terminal,
            resize_terminal,
            kill_terminal,
            // Orchestrator management commands
            list_terminal_sessions,
            get_terminal_session_info,
            execute_terminal_command,
            list_sessions_by_manager,
            kill_sessions_by_manager,
            // Agent execution commands
            execute_agent_command,
            // VOICEVOX commands
            check_voicevox_engine_command,
            start_voicevox_engine_command,
            generate_narration_command,
            get_speakers_command,
            // GitHub commands
            list_issues_command,
            get_issue_command,
            update_issue_command,
            // Tmux commands
            tmux_start_agent,
            tmux_list_sessions,
            tmux_kill_session,
            tmux_load_config,
            tmux_get_session_output,
            tmux_check_session_exists,
            // Automation commands
            get_automation_readiness,
            start_full_automation,
            stop_full_automation,
            get_automation_status,
            load_automation_config_from_env,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Context values used to render agent command templates.
struct CommandContext<'a> {
    repo_root: &'a Path,
    desktop_dir: &'a Path,
    issue_number: Option<u64>,
    home_dir: Option<PathBuf>,
}

/// Resolve the absolute path to the agents configuration file.
fn resolve_agents_config_path() -> Result<PathBuf, String> {
    let current_dir = env::current_dir()
        .map_err(|e| format!("Failed to determine current working directory: {}", e))?;
    // Walk up the directory tree and look for `.miyabi/agents.yaml`
    let mut dir = Some(current_dir.as_path());
    while let Some(path) = dir {
        let candidate = path.join(".miyabi/agents.yaml");
        if candidate.exists() {
            return candidate.canonicalize().map_err(|e| {
                format!(
                    "Failed to canonicalize agents.yaml at {:?}: {}",
                    candidate, e
                )
            });
        }
        dir = path.parent();
    }

    Err("Failed to locate .miyabi/agents.yaml in current or ancestor directories".to_string())
}

/// Determine the repository root directory based on the agents configuration path.
fn resolve_repo_root(config_path: &Path) -> Result<PathBuf, String> {
    let mut current_dir = config_path
        .parent()
        .ok_or_else(|| format!("Config path has no parent directory: {:?}", config_path))?;

    loop {
        if current_dir.join(".git").exists() {
            return Ok(current_dir.to_path_buf());
        }

        match current_dir.parent() {
            Some(parent) => current_dir = parent,
            None => {
                return Err(format!(
                    "Failed to locate repository root (no .git directory found starting from {:?})",
                    config_path
                ));
            }
        }
    }
}

/// Render a command template with runtime values.
fn render_agent_command(template: &str, context: CommandContext<'_>) -> Result<String, String> {
    let CommandContext {
        repo_root,
        desktop_dir,
        issue_number,
        home_dir,
    } = context;

    let mut rendered = template.to_string();

    let repo_root_str = repo_root.to_string_lossy();
    let desktop_dir_str = desktop_dir.to_string_lossy();
    rendered = rendered.replace("{{repo_root}}", repo_root_str.as_ref());
    rendered = rendered.replace("{{desktop_dir}}", desktop_dir_str.as_ref());

    if let Some(home_dir) = home_dir {
        rendered = rendered.replace("{{home_dir}}", home_dir.to_string_lossy().as_ref());
    }

    if let Some(issue) = issue_number {
        rendered = rendered.replace("{{issue_number}}", &issue.to_string());
    } else if rendered.contains("{{issue_number}}") {
        return Err("This agent requires an issue number, but none was provided.".to_string());
    }

    // Ensure no unreplaced placeholders remain
    if let Some(start) = rendered.find("{{") {
        let snippet_end = rendered[start..]
            .find("}}")
            .map(|end| start + end + 2)
            .unwrap_or(rendered.len());
        let snippet = &rendered[start..snippet_end];
        return Err(format!(
            "Command contains unresolved template placeholder: {}",
            snippet
        ));
    }

    Ok(rendered)
}
