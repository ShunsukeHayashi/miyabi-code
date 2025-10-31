mod agent;
mod config;
mod github;
mod pty;
mod voicevox;

use agent::{execute_agent, AgentExecutionRequest, AgentExecutionResult};
use config::{
    clear_config, get_github_repository, get_github_token, save_github_repository,
    save_github_token,
};
use github::{get_issue, list_issues, update_issue, GitHubIssue, IssueState, UpdateIssueRequest};
use pty::{PtyManager, SessionInfo, TerminalSession};
use voicevox::{
    check_voicevox_engine, generate_narration, get_speakers, start_voicevox_engine,
    NarrationRequest, NarrationResult, SpeakerConfig,
};
use std::sync::Mutex;
use tauri::{AppHandle, State};

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
async fn list_terminal_sessions(state: State<'_, AppState>) -> Result<Vec<TerminalSession>, String> {
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
            // Config commands
            save_github_token,
            get_github_token,
            save_github_repository,
            get_github_repository,
            clear_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
