// Tauri用PTYマネージャーのラッパー
//
// miyabi-pty-managerクレートをベースに、Tauri AppHandleとの統合を提供

use miyabi_pty_manager::PtyManager as CorePtyManager;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

// 型を再エクスポート
pub use miyabi_pty_manager::{SessionInfo, TerminalSession};

/// Tauri統合用PTYマネージャー
pub struct PtyManager {
    core: Arc<Mutex<CorePtyManager>>,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            core: Arc::new(Mutex::new(CorePtyManager::new())),
        }
    }

    /// 標準シェルセッションを起動（ユーザー管理）
    pub fn spawn_shell(
        &self,
        cols: u16,
        rows: u16,
        app_handle: AppHandle,
    ) -> Result<TerminalSession, String> {
        self.spawn_shell_with_manager(cols, rows, app_handle, None)
    }

    /// エージェント管理下のシェルセッションを起動
    pub fn spawn_shell_with_manager(
        &self,
        cols: u16,
        rows: u16,
        app_handle: AppHandle,
        managed_by: Option<String>,
    ) -> Result<TerminalSession, String> {
        let core = self.core.lock().unwrap();
        let session = core
            .spawn_shell_with_manager(cols, rows, managed_by)
            .map_err(|e| e.to_string())?;

        // バックグラウンドで出力をTauriイベントとして配信
        let session_id = session.id.clone();
        let core_clone = self.core.clone();

        tokio::spawn(async move {
            // 出力コールバックを登録
            let output_callback = {
                let session_id = session_id.clone();
                let app_handle = app_handle.clone();

                Arc::new(move |data: String| {
                    let _ = app_handle.emit(&format!("terminal-output-{}", session_id), data);
                })
            };

            if let Ok(core) = core_clone.lock() {
                let _ = core.add_output_callback(&session_id, output_callback);
            }
        });

        Ok(session)
    }

    /// PTYにデータを書き込み
    pub fn write_to_pty(&self, session_id: &str, data: &str) -> Result<(), String> {
        let core = self.core.lock().unwrap();
        core.write_to_pty(session_id, data)
            .map_err(|e| e.to_string())
    }

    /// PTYをリサイズ（注: portable-ptyの制限により未実装）
    pub fn resize_pty(&self, session_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let core = self.core.lock().unwrap();
        core.resize_pty(session_id, cols, rows)
            .map_err(|e| e.to_string())
    }

    /// セッションを終了
    pub fn kill_session(&self, session_id: &str) -> Result<(), String> {
        let core = self.core.lock().unwrap();
        core.kill_session(session_id).map_err(|e| e.to_string())
    }

    // ========== Orchestrator Management APIs ==========

    /// 全セッションを一覧表示
    pub fn list_sessions(&self) -> Vec<TerminalSession> {
        let core = self.core.lock().unwrap();
        core.list_sessions()
    }

    /// セッション情報を取得
    pub fn get_session_info(&self, session_id: &str) -> Result<SessionInfo, String> {
        let core = self.core.lock().unwrap();
        core.get_session_info(session_id).map_err(|e| e.to_string())
    }

    /// コマンドを実行
    pub fn execute_command(&self, session_id: &str, command: &str) -> Result<(), String> {
        let core = self.core.lock().unwrap();
        core.execute_command(session_id, command)
            .map_err(|e| e.to_string())
    }

    /// 特定のマネージャーのセッションを一覧表示
    pub fn list_sessions_by_manager(&self, manager_id: &str) -> Vec<TerminalSession> {
        let core = self.core.lock().unwrap();
        core.list_sessions_by_manager(manager_id)
    }

    /// 特定のマネージャーの全セッションを終了
    pub fn kill_sessions_by_manager(&self, manager_id: &str) -> Result<usize, String> {
        let core = self.core.lock().unwrap();
        core.kill_sessions_by_manager(manager_id)
            .map_err(|e| e.to_string())
    }
}

impl Default for PtyManager {
    fn default() -> Self {
        Self::new()
    }
}
