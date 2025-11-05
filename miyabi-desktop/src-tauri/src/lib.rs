mod agent;
mod ai_naming;
mod automation;
mod config;
mod events;
mod github;
mod worktree_graph;
mod pty;
mod tmux;
mod voicevox;
mod worktree;

use agent::{execute_agent, AgentExecutionRequest, AgentExecutionResult};
use ai_naming::suggest_worktree_name;
use automation::{AutomationConfig, AutomationManager, AutomationReadiness, AutomationSession};
<<<<<<< HEAD
use serde_json::Value;
use config::{
    clear_config, get_github_repository, get_github_token, save_github_repository,
    save_github_token, AgentConfig, AgentsConfig,
};
=======
use config::{AgentConfig, AgentsConfig};
use events::EventEmitter;
use github::{get_issue, list_issues, update_issue, GitHubIssue, IssueState, UpdateIssueRequest};
use pty::{PtyManager, SessionInfo, TerminalSession};
use std::env;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, State};
use tmux::{TmuxManager, TmuxSession};
use tokio::sync::Mutex as TokioMutex;
>>>>>>> origin/main
use voicevox::{
    check_voicevox_engine, generate_narration, get_speakers, start_voicevox_engine,
    NarrationRequest, NarrationResult, SpeakerConfig,
};
use worktree::{
    cleanup_worktrees, create_worktree, get_worktree_status, list_worktrees, remove_worktree,
    WorktreeManagerState,
};

struct AppState {
    pty_manager: Mutex<PtyManager>,
    event_emitter: Arc<EventEmitter>,
}

// Initialize WorktreeManagerState from repository root
fn init_worktree_manager() -> Result<WorktreeManagerState, String> {
    // Find repository root
    let mut current_dir = env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?;

    loop {
        if current_dir.join(".git").exists() {
            return WorktreeManagerState::new(&current_dir)
                .map_err(|e| format!("Failed to initialize WorktreeManager: {}", e));
        }

        match current_dir.parent() {
            Some(parent) => current_dir = parent.to_path_buf(),
            None => {
                return Err("Failed to locate repository root (no .git directory found)".to_string())
            }
        }
    }
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

// ========== Worktree Graph Commands ==========

#[tauri::command(name = "worktrees:graph")]
async fn worktrees_graph_command() -> Result<worktree_graph::WorktreeGraph, String> {
    worktree_graph::build_worktree_graph().await
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

#[tauri::command]
async fn tmux_orchestra_status(session_name: Option<String>) -> Result<Value, String> {
    let config_path = resolve_agents_config_path()?;
    let repo_root = resolve_repo_root(&config_path)?;
    let script_path = repo_root.join("scripts").join("miyabi_orchestra_status_exporter.py");

    if !script_path.exists() {
        return Err(format!(
            "Status exporter script not found: {:?}",
            script_path
        ));
    }

    let session = session_name.unwrap_or_else(|| DEFAULT_ORCHESTRA_SESSION.to_string());
    let output = Command::new(&script_path)
        .arg("--session")
        .arg(&session)
        .output()
        .await
        .map_err(|e| format!("Failed to execute exporter script: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Exporter script failed: {}", stderr.trim()));
    }

    serde_json::from_slice::<Value>(&output.stdout)
        .map_err(|e| format!("Invalid JSON from exporter: {}", e))
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

// ========== Worktree Management Commands ==========

#[tauri::command]
async fn worktree_list(state: State<'_, AppState>) -> Result<Vec<Worktree>, String> {
    // Clone manager to avoid holding lock across await
    let manager = {
        let mut manager_guard = state.worktree_manager.lock().await;

        // Lazy initialize manager
        if manager_guard.is_none() {
            *manager_guard = Some(WorktreeManager::new().map_err(|e| e.to_string())?);
        }

        manager_guard.as_ref().unwrap().clone()
    }; // Lock dropped here

    manager.list_worktrees().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn worktree_create_with_tmux(
    issue_number: u64,
    create_tmux: bool,
    state: State<'_, AppState>,
) -> Result<Worktree, String> {
    // Clone manager to avoid holding lock across await
    let manager = {
        let mut manager_guard = state.worktree_manager.lock().await;

        // Lazy initialize manager
        if manager_guard.is_none() {
            *manager_guard = Some(WorktreeManager::new().map_err(|e| e.to_string())?);
        }

        manager_guard.as_ref().unwrap().clone()
    }; // Lock dropped here

    manager
        .create_worktree(issue_number, create_tmux)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn worktree_delete(worktree_id: String, state: State<'_, AppState>) -> Result<(), String> {
    // Clone manager to avoid holding lock across await
    let manager = {
        let manager_guard = state.worktree_manager.lock().await;
        manager_guard
            .as_ref()
            .ok_or_else(|| "Worktree manager not initialized".to_string())?
            .clone()
    }; // Lock dropped here

    manager
        .delete_worktree(&worktree_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn worktree_get_git_status(
    worktree_id: String,
    state: State<'_, AppState>,
) -> Result<GitStatus, String> {
    // Clone manager to avoid holding lock across await
    let manager = {
        let manager_guard = state.worktree_manager.lock().await;
        manager_guard
            .as_ref()
            .ok_or_else(|| "Worktree manager not initialized".to_string())?
            .clone()
    }; // Lock dropped here

    manager
        .get_git_status(&worktree_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn ai_generate_name(
    issue_title: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    // Clone client to avoid holding lock across await
    let client = {
        let mut client_guard = state.ai_client.lock().await;

        // Lazy initialize client
        if client_guard.is_none() {
            *client_guard = Some(AnthropicClient::default());
        }

        let client = client_guard.as_ref().unwrap();

        if !client.is_configured() {
            return Err("Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable.".to_string());
        }

        client.clone()
    }; // Lock dropped here

    client
        .generate_worktree_name(&issue_title)
        .await
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize worktree manager (log error but don't fail app startup)
    let worktree_manager = match init_worktree_manager() {
        Ok(manager) => manager,
        Err(e) => {
            eprintln!("Warning: Failed to initialize WorktreeManager: {}", e);
            eprintln!("Worktree functionality will be disabled.");
            // Create a dummy manager or handle gracefully
            // For now, we'll panic to force proper setup
            panic!("WorktreeManager initialization failed: {}", e);
        }
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize EventEmitter with AppHandle
            let event_emitter = Arc::new(EventEmitter::new(app.handle().clone()));

            // Manage AppState with EventEmitter
            app.manage(AppState {
                pty_manager: Mutex::new(PtyManager::new()),
                event_emitter: event_emitter.clone(),
            });

            Ok(())
        })
        .manage(worktree_manager)
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
            // App config commands
            save_github_token,
            get_github_token,
            save_github_repository,
            get_github_repository,
            clear_config,
            // Tmux commands
            tmux_start_agent,
            tmux_list_sessions,
            tmux_kill_session,
            tmux_load_config,
            tmux_get_session_output,
            tmux_check_session_exists,
            tmux_orchestra_status,
            // Automation commands
            get_automation_readiness,
            start_full_automation,
            stop_full_automation,
            get_automation_status,
            load_automation_config_from_env,
            // Worktree commands
            list_worktrees,
            worktrees_graph_command,
            create_worktree,
            remove_worktree,
            get_worktree_status,
            cleanup_worktrees,
            // AI Naming commands
            suggest_worktree_name,
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
