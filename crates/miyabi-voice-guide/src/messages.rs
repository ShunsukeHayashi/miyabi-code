//! Voice message definitions and scripts

use serde::{Deserialize, Serialize};

/// Voice message types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VoiceMessage {
    /// Welcome message (first run)
    Welcome,

    /// GitHub token error
    ErrorGitHubToken,

    /// VOICEVOX Engine not running
    ErrorVoicevoxNotRunning,

    /// Docker not found
    ErrorDockerNotFound,

    /// Project already exists
    ErrorProjectExists { project_name: String },

    /// Issue not found
    ErrorIssueNotFound { issue_number: u64 },

    /// Success: PR created
    SuccessPrCreated { pr_number: u64 },

    /// Success: Project created
    SuccessProjectCreated { project_name: String },

    /// Success: Issue processed
    SuccessIssueProcessed { issue_number: u64 },

    /// Next step: init command
    NextStepInit,

    /// Next step: work-on command
    NextStepWorkOn,

    /// Next step: GitHub auth
    NextStepGitHubAuth,

    /// Tip: Random helpful tip
    Tip { tip_number: usize },

    /// Processing started
    ProcessingStarted { task_name: String },

    /// Processing completed
    ProcessingCompleted { task_name: String },

    /// Custom message
    Custom { text: String },
}

impl VoiceMessage {
    /// Get the script text for this message
    pub fn script(&self) -> String {
        match self {
            VoiceMessage::Welcome => {
                "やぁやぁ！miyabiへようこそなのだ！\n\
                自律型AI開発フレームワークなのだ！\n\
                \n\
                まず最初に、GitHubに接続する必要があるのだ。\n\
                GitHub CLIを使う場合は `gh auth login` を実行するのだ！\n\
                または、GitHub Personal Access Tokenを設定するのだ！\n\
                \n\
                準備ができたら `miyabi init プロジェクト名` を\n\
                実行してプロジェクトを作るのだ！".to_string()
            }

            VoiceMessage::ErrorGitHubToken => {
                "あれれ、GitHub tokenが見つからないのだ！\n\
                \n\
                解決方法は2つあるのだ：\n\
                \n\
                1つ目: GitHub CLIを使う方法（推奨なのだ！）\n\
                    `gh auth login` を実行するのだ！\n\
                \n\
                2つ目: 環境変数で設定する方法\n\
                    `export GITHUB_TOKEN=ghp_xxx` なのだ！\n\
                \n\
                どっちか好きな方を選ぶのだ！".to_string()
            }

            VoiceMessage::ErrorVoicevoxNotRunning => {
                "VOICEVOX Engineが起動していないのだ！\n\
                \n\
                Dockerで起動するのだ：\n\
                `docker run -p 50021:50021 voicevox/voicevox_engine:cpu-latest`\n\
                \n\
                または、音声ガイドを無効にしたい場合は\n\
                `export MIYABI_VOICE_GUIDE=false` を設定するのだ！".to_string()
            }

            VoiceMessage::ErrorDockerNotFound => {
                "Dockerが見つからないのだ！\n\
                \n\
                音声ガイドを使うには、Dockerが必要なのだ。\n\
                Dockerをインストールするか、または\n\
                `export MIYABI_VOICE_GUIDE=false` で\n\
                音声ガイドを無効にできるのだ！".to_string()
            }

            VoiceMessage::ErrorProjectExists { project_name } => {
                format!(
                    "あれれ、プロジェクト「{}」はすでに存在するのだ！\n\
                    \n\
                    別の名前を使うか、既存のプロジェクトを削除してから\n\
                    もう一度実行するのだ！",
                    project_name
                )
            }

            VoiceMessage::ErrorIssueNotFound { issue_number } => {
                format!(
                    "あれれ、Issue #{}が見つからないのだ！\n\
                    \n\
                    Issue番号を確認してから、もう一度実行するのだ！",
                    issue_number
                )
            }

            VoiceMessage::SuccessPrCreated { pr_number } => {
                format!(
                    "やったのだ！PR #{}が完成したのだ！🎉\n\
                    \n\
                    次は GitHub で確認して、レビューして、\n\
                    マージするだけなのだ！\n\
                    \n\
                    もっとIssueを処理したい場合は\n\
                    `miyabi work-on 番号` を実行するのだ！",
                    pr_number
                )
            }

            VoiceMessage::SuccessProjectCreated { project_name } => {
                format!(
                    "やったのだ！プロジェクト「{}」が完成したのだ！🎉\n\
                    \n\
                    次は、GitHubでIssueを作成して、\n\
                    `miyabi work-on 1` でIssue処理を始めるのだ！\n\
                    \n\
                    Issueを自動的に処理して、PRを作ってくれるのだ！",
                    project_name
                )
            }

            VoiceMessage::SuccessIssueProcessed { issue_number } => {
                format!(
                    "やったのだ！Issue #{}の処理が完了したのだ！🎉\n\
                    \n\
                    次のIssueを処理したい場合は\n\
                    `miyabi work-on 番号` を実行するのだ！",
                    issue_number
                )
            }

            VoiceMessage::NextStepInit => {
                "`miyabi init プロジェクト名` を実行して\n\
                新しいプロジェクトを作るのだ！".to_string()
            }

            VoiceMessage::NextStepWorkOn => {
                "`miyabi work-on 番号` を実行して\n\
                Issueを処理するのだ！".to_string()
            }

            VoiceMessage::NextStepGitHubAuth => {
                "`gh auth login` を実行して\n\
                GitHubに接続するのだ！".to_string()
            }

            VoiceMessage::Tip { tip_number } => {
                let tips = [
                    "豆知識なのだ！`miyabi --help` で\n全コマンドを確認できるのだ！",
                    "豆知識なのだ！複数のIssueを並列処理できるのだ！\n`miyabi work-on 1,2,3 --concurrency 3` を試すのだ！",
                    "豆知識なのだ！VOICEVOX_SPEAKER環境変数で\n話者を変更できるのだ！デフォルトはずんだもん（ID=3）なのだ！",
                    "豆知識なのだ！`miyabi knowledge search クエリ` で\n過去のAgent実行ログを検索できるのだ！",
                    "豆知識なのだ！14個のビジネスAgentが使えるのだ！\nマーケティングから営業まで自動化できるのだ！",
                ];
                tips.get(*tip_number % tips.len())
                    .unwrap_or(&tips[0])
                    .to_string()
            }

            VoiceMessage::ProcessingStarted { task_name } => {
                format!("{}の処理を開始するのだ！", task_name)
            }

            VoiceMessage::ProcessingCompleted { task_name } => {
                format!("{}の処理が完了したのだ！", task_name)
            }

            VoiceMessage::Custom { text } => text.clone(),
        }
    }

    /// Get a short summary for logging
    pub fn summary(&self) -> String {
        match self {
            VoiceMessage::Welcome => "Welcome".to_string(),
            VoiceMessage::ErrorGitHubToken => "Error: GitHub Token".to_string(),
            VoiceMessage::ErrorVoicevoxNotRunning => "Error: VOICEVOX".to_string(),
            VoiceMessage::ErrorDockerNotFound => "Error: Docker".to_string(),
            VoiceMessage::ErrorProjectExists { .. } => "Error: Project Exists".to_string(),
            VoiceMessage::ErrorIssueNotFound { .. } => "Error: Issue Not Found".to_string(),
            VoiceMessage::SuccessPrCreated { pr_number } => {
                format!("Success: PR #{}", pr_number)
            }
            VoiceMessage::SuccessProjectCreated { project_name } => {
                format!("Success: Project '{}'", project_name)
            }
            VoiceMessage::SuccessIssueProcessed { issue_number } => {
                format!("Success: Issue #{}", issue_number)
            }
            VoiceMessage::NextStepInit => "Next: Init".to_string(),
            VoiceMessage::NextStepWorkOn => "Next: Work On".to_string(),
            VoiceMessage::NextStepGitHubAuth => "Next: GitHub Auth".to_string(),
            VoiceMessage::Tip { .. } => "Tip".to_string(),
            VoiceMessage::ProcessingStarted { .. } => "Processing Started".to_string(),
            VoiceMessage::ProcessingCompleted { .. } => "Processing Completed".to_string(),
            VoiceMessage::Custom { .. } => "Custom".to_string(),
        }
    }
}

/// Voice script with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceScript {
    /// Message type
    pub message: VoiceMessage,
    /// Script text
    pub text: String,
    /// Timestamp
    pub timestamp: String,
}

impl VoiceScript {
    /// Create a new voice script
    pub fn new(message: VoiceMessage) -> Self {
        let text = message.script();
        let timestamp = chrono::Utc::now().to_rfc3339();

        Self {
            message,
            text,
            timestamp,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_welcome_message() {
        let msg = VoiceMessage::Welcome;
        let script = msg.script();
        assert!(script.contains("miyabiへようこそ"));
        assert!(script.contains("自律型AI開発フレームワーク"));
    }

    #[test]
    fn test_success_pr_created() {
        let msg = VoiceMessage::SuccessPrCreated { pr_number: 42 };
        let script = msg.script();
        assert!(script.contains("PR #42"));
        assert!(script.contains("完成した"));
    }

    #[test]
    fn test_message_summary() {
        let msg = VoiceMessage::Welcome;
        assert_eq!(msg.summary(), "Welcome");

        let msg = VoiceMessage::SuccessPrCreated { pr_number: 42 };
        assert_eq!(msg.summary(), "Success: PR #42");
    }
}
