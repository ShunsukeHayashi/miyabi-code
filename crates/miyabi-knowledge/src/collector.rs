//! ログ収集機能

use crate::config::KnowledgeConfig;
use crate::error::{KnowledgeError, Result};
use crate::types::{KnowledgeEntry, KnowledgeMetadata};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use pulldown_cmark::{Event, Parser, Tag};
use std::path::{Path, PathBuf};
use tracing::{debug, info, warn};
use walkdir::WalkDir;

/// ログ収集トレイト
#[async_trait]
pub trait KnowledgeCollector: Send + Sync {
    /// 指定ディレクトリからログを収集
    async fn collect(&self, path: &Path) -> Result<Vec<KnowledgeEntry>>;

    /// 特定のWorktreeからログを収集
    async fn collect_worktree(&self, worktree: &str) -> Result<Vec<KnowledgeEntry>>;

    /// 特定のAgentからログを収集
    async fn collect_agent(&self, agent: &str) -> Result<Vec<KnowledgeEntry>>;
}

/// ログ収集実装
pub struct LogCollector {
    config: KnowledgeConfig,
}

impl LogCollector {
    /// 新しいLogCollectorを作成
    pub fn new(config: KnowledgeConfig) -> Result<Self> {
        Ok(Self { config })
    }

    /// Markdownファイルをパース
    fn parse_markdown(&self, content: &str, file_path: &Path) -> Result<Vec<KnowledgeEntry>> {
        let mut entries = Vec::new();
        let mut current_section = String::new();
        let mut current_heading = String::new();
        let mut in_code_block = false;

        let parser = Parser::new(content);

        for event in parser {
            match event {
                Event::Start(Tag::Heading(_, _, _)) => {
                    // Save previous section if it exists
                    if !current_section.is_empty() {
                        if let Some(entry) = self.create_entry_from_section(
                            &current_heading,
                            &current_section,
                            file_path,
                        ) {
                            entries.push(entry);
                        }
                    }
                    current_section.clear();
                    current_heading.clear();
                }
                Event::Text(text) => {
                    if current_heading.is_empty() {
                        current_heading = text.to_string();
                    }
                    current_section.push_str(&text);
                }
                Event::Start(Tag::CodeBlock(_)) => {
                    in_code_block = true;
                }
                Event::End(Tag::CodeBlock(_)) => {
                    in_code_block = false;
                }
                Event::Code(code) | Event::Html(code) => {
                    current_section.push_str(&code);
                }
                _ => {}
            }
        }

        // Save last section
        if !current_section.is_empty() {
            if let Some(entry) =
                self.create_entry_from_section(&current_heading, &current_section, file_path)
            {
                entries.push(entry);
            }
        }

        Ok(entries)
    }

    /// セクションからエントリを作成
    fn create_entry_from_section(
        &self,
        heading: &str,
        content: &str,
        file_path: &Path,
    ) -> Option<KnowledgeEntry> {
        // 最小コンテンツ長チェック（スパム防止）
        if content.len() < 50 {
            return None;
        }

        let metadata = self.extract_metadata_from_content(heading, content, file_path);
        Some(KnowledgeEntry::new(content.to_string(), metadata))
    }

    /// コンテンツからメタデータを抽出
    fn extract_metadata_from_content(
        &self,
        heading: &str,
        content: &str,
        file_path: &Path,
    ) -> KnowledgeMetadata {
        let mut metadata = KnowledgeMetadata {
            workspace: self.config.workspace.name.clone(),
            ..Default::default()
        };

        // Worktree検出
        if let Some(worktree) = self.detect_worktree(file_path) {
            metadata.worktree = Some(worktree);
        }

        // Agent検出
        if let Some(agent) = self.detect_agent(heading, content) {
            metadata.agent = Some(agent);
        }

        // Issue番号検出
        if let Some(issue_number) = self.extract_issue_number(heading, content) {
            metadata.issue_number = Some(issue_number);
        }

        // Task種別検出
        if let Some(task_type) = self.detect_task_type(heading, content) {
            metadata.task_type = Some(task_type);
        }

        // ツール使用検出
        if let Some(tools) = self.detect_tools_used(content) {
            metadata.tools_used = Some(tools);
        }

        // 結果検出
        if let Some(outcome) = self.detect_outcome(content) {
            metadata.outcome = Some(outcome);
        }

        metadata
    }

    /// Worktreeを検出
    fn detect_worktree(&self, file_path: &Path) -> Option<String> {
        for component in file_path.components() {
            let comp_str = component.as_os_str().to_str()?;
            if comp_str.starts_with(".worktrees/") || comp_str.starts_with("issue-") {
                return Some(comp_str.to_string());
            }
        }
        None
    }

    /// Agentを検出
    fn detect_agent(&self, heading: &str, content: &str) -> Option<String> {
        let agents = vec![
            "CoordinatorAgent",
            "CodeGenAgent",
            "ReviewAgent",
            "DeploymentAgent",
            "PRAgent",
            "IssueAgent",
        ];

        for agent in agents {
            if heading.contains(agent) || content.contains(agent) {
                return Some(agent.to_string());
            }
        }

        None
    }

    /// Issue番号を抽出
    fn extract_issue_number(&self, heading: &str, content: &str) -> Option<u32> {
        let text = format!("{} {}", heading, content);
        let re = regex::Regex::new(r"#(\d+)").ok()?;
        re.captures(&text)
            .and_then(|cap| cap.get(1))
            .and_then(|m| m.as_str().parse().ok())
    }

    /// Task種別を検出
    fn detect_task_type(&self, heading: &str, content: &str) -> Option<String> {
        let text = format!("{} {}", heading, content);
        let types = vec!["feature", "bug", "refactor", "docs", "test", "chore"];

        for task_type in types {
            if text.to_lowercase().contains(task_type) {
                return Some(task_type.to_string());
            }
        }

        None
    }

    /// 使用ツールを検出
    fn detect_tools_used(&self, content: &str) -> Option<Vec<String>> {
        let tools = vec!["cargo", "git", "docker", "npm", "rust", "clippy", "rustfmt"];
        let mut found_tools = Vec::new();

        for tool in tools {
            if content.to_lowercase().contains(tool) {
                found_tools.push(tool.to_string());
            }
        }

        if found_tools.is_empty() {
            None
        } else {
            Some(found_tools)
        }
    }

    /// 結果を検出（成功/失敗）
    fn detect_outcome(&self, content: &str) -> Option<String> {
        let lower = content.to_lowercase();
        if lower.contains("success") || lower.contains("完了") || lower.contains("✅") {
            Some("success".to_string())
        } else if lower.contains("failed") || lower.contains("失敗") || lower.contains("❌") {
            Some("failed".to_string())
        } else {
            None
        }
    }
}

#[async_trait]
impl KnowledgeCollector for LogCollector {
    async fn collect(&self, path: &Path) -> Result<Vec<KnowledgeEntry>> {
        info!("Collecting logs from: {:?}", path);
        let mut all_entries = Vec::new();

        for entry in WalkDir::new(path)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
                debug!("Processing file: {:?}", path);

                match std::fs::read_to_string(path) {
                    Ok(content) => match self.parse_markdown(&content, path) {
                        Ok(mut entries) => {
                            all_entries.append(&mut entries);
                        }
                        Err(e) => {
                            warn!("Failed to parse markdown from {:?}: {}", path, e);
                        }
                    },
                    Err(e) => {
                        warn!("Failed to read file {:?}: {}", path, e);
                    }
                }
            }
        }

        info!("Collected {} entries", all_entries.len());
        Ok(all_entries)
    }

    async fn collect_worktree(&self, worktree: &str) -> Result<Vec<KnowledgeEntry>> {
        let worktree_path = self.config.collection.worktree_dir.join(worktree);
        self.collect(&worktree_path).await
    }

    async fn collect_agent(&self, agent: &str) -> Result<Vec<KnowledgeEntry>> {
        let all_entries = self.collect(&self.config.collection.log_dir).await?;
        Ok(all_entries
            .into_iter()
            .filter(|entry| {
                entry
                    .metadata
                    .agent
                    .as_ref()
                    .map(|a| a == agent)
                    .unwrap_or(false)
            })
            .collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_detect_agent() {
        let config = KnowledgeConfig::default();
        let collector = LogCollector::new(config).unwrap();

        let content = "CodeGenAgent executed successfully";
        let agent = collector.detect_agent("Test", content);
        assert_eq!(agent, Some("CodeGenAgent".to_string()));
    }

    #[test]
    fn test_extract_issue_number() {
        let config = KnowledgeConfig::default();
        let collector = LogCollector::new(config).unwrap();

        let content = "Fixed issue #270";
        let issue = collector.extract_issue_number("Test", content);
        assert_eq!(issue, Some(270));
    }

    #[test]
    fn test_detect_outcome() {
        let config = KnowledgeConfig::default();
        let collector = LogCollector::new(config).unwrap();

        let content = "Task completed successfully ✅";
        let outcome = collector.detect_outcome(content);
        assert_eq!(outcome, Some("success".to_string()));
    }

    #[tokio::test]
    async fn test_collect_empty_directory() {
        let dir = tempdir().unwrap();
        let config = KnowledgeConfig::default();
        let collector = LogCollector::new(config).unwrap();

        let entries = collector.collect(dir.path()).await.unwrap();
        assert_eq!(entries.len(), 0);
    }
}
