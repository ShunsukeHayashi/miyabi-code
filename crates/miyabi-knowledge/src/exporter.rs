//! Export functionality for knowledge base entries
//!
//! Export knowledge base to CSV, JSON, and Markdown formats.

use crate::error::Result;
use crate::searcher::{KnowledgeSearcher, SearchFilter};
use crate::types::KnowledgeResult;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::Path;
use tokio::fs;
use tokio::io::AsyncWriteExt;
use tracing::info;

/// Export format
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    /// CSV format (RFC 4180)
    Csv,
    /// JSON array format
    Json,
    /// Markdown document format
    Markdown,
}

impl std::str::FromStr for ExportFormat {
    type Err = String;

    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "csv" => Ok(ExportFormat::Csv),
            "json" => Ok(ExportFormat::Json),
            "markdown" | "md" => Ok(ExportFormat::Markdown),
            _ => Err(format!("Unknown export format: {}", s)),
        }
    }
}

/// Export filter options
#[derive(Debug, Clone, Default)]
pub struct ExportFilter {
    /// Filter by agent name
    pub agent: Option<String>,

    /// Filter by issue number
    pub issue_number: Option<u32>,

    /// Filter by task type
    pub task_type: Option<String>,

    /// Filter by outcome
    pub outcome: Option<String>,

    /// Filter by workspace
    pub workspace: Option<String>,

    /// Date range start
    pub date_from: Option<DateTime<Utc>>,

    /// Date range end
    pub date_to: Option<DateTime<Utc>>,

    /// Maximum number of entries to export (0 = unlimited)
    pub limit: usize,
}

impl From<ExportFilter> for SearchFilter {
    fn from(filter: ExportFilter) -> Self {
        let mut search_filter = SearchFilter::new();

        if let Some(agent) = filter.agent {
            search_filter = search_filter.with_agent(&agent);
        }
        if let Some(issue) = filter.issue_number {
            search_filter = search_filter.with_issue_number(issue);
        }
        if let Some(task_type) = filter.task_type {
            search_filter = search_filter.with_task_type(&task_type);
        }
        if let Some(outcome) = filter.outcome {
            search_filter = search_filter.with_outcome(&outcome);
        }
        if let Some(workspace) = filter.workspace {
            search_filter = search_filter.with_workspace(&workspace);
        }

        search_filter
    }
}

/// Knowledge exporter
pub struct KnowledgeExporter<S: KnowledgeSearcher> {
    searcher: S,
}

impl<S: KnowledgeSearcher> KnowledgeExporter<S> {
    /// Create a new exporter
    pub fn new(searcher: S) -> Self {
        Self { searcher }
    }

    /// Export knowledge base to a file
    ///
    /// # Arguments
    ///
    /// * `format` - Export format (CSV, JSON, Markdown)
    /// * `output_path` - Output file path
    /// * `filter` - Optional filter to limit exported entries
    pub async fn export<P: AsRef<Path>>(
        &self,
        format: ExportFormat,
        output_path: P,
        filter: Option<ExportFilter>,
    ) -> Result<usize> {
        let output_path_ref = output_path.as_ref();
        info!("Exporting knowledge base to {:?}", output_path_ref);

        // Fetch entries with filter
        let entries = self.fetch_entries(filter.clone()).await?;
        let count = entries.len();

        info!("Fetched {} entries for export", count);

        // Apply limit if specified
        let entries_to_export = if let Some(ref f) = filter {
            if f.limit > 0 && entries.len() > f.limit {
                &entries[..f.limit]
            } else {
                &entries
            }
        } else {
            &entries
        };

        // Export based on format
        match format {
            ExportFormat::Csv => self.export_csv(output_path_ref, entries_to_export).await?,
            ExportFormat::Json => self.export_json(output_path_ref, entries_to_export).await?,
            ExportFormat::Markdown => {
                self.export_markdown(output_path_ref, entries_to_export).await?
            },
        }

        info!(
            "Export completed: {} entries written to {:?}",
            entries_to_export.len(),
            output_path_ref
        );

        Ok(entries_to_export.len())
    }

    /// Fetch entries with optional filter
    async fn fetch_entries(&self, filter: Option<ExportFilter>) -> Result<Vec<KnowledgeResult>> {
        if let Some(f) = filter {
            // Use search with filter
            let search_filter: SearchFilter = f.into();
            self.searcher.search_filtered("", search_filter).await
        } else {
            // Fetch all entries
            self.searcher.search("").await
        }
    }

    /// Export to CSV format
    async fn export_csv(&self, output_path: &Path, entries: &[KnowledgeResult]) -> Result<()> {
        let mut file = fs::File::create(output_path).await?;

        // Write CSV header
        let header = "id,content,agent,issue_number,task_type,outcome,workspace,timestamp\n";
        file.write_all(header.as_bytes()).await?;

        // Write rows
        for entry in entries {
            let row = format!(
                "{},{},{},{},{},{},{},{}\n",
                Self::escape_csv(&entry.id.to_string()),
                Self::escape_csv(&entry.content),
                Self::escape_csv(entry.metadata.agent.as_ref().unwrap_or(&"".to_string())),
                entry.metadata.issue_number.unwrap_or(0),
                Self::escape_csv(entry.metadata.task_type.as_ref().unwrap_or(&"".to_string())),
                Self::escape_csv(entry.metadata.outcome.as_ref().unwrap_or(&"".to_string())),
                Self::escape_csv(&entry.metadata.workspace),
                entry.timestamp.to_rfc3339()
            );
            file.write_all(row.as_bytes()).await?;
        }

        file.flush().await?;
        Ok(())
    }

    /// Export to JSON format
    async fn export_json(&self, output_path: &Path, entries: &[KnowledgeResult]) -> Result<()> {
        let json = serde_json::to_string_pretty(entries)?;
        fs::write(output_path, json).await?;
        Ok(())
    }

    /// Export to Markdown format
    async fn export_markdown(&self, output_path: &Path, entries: &[KnowledgeResult]) -> Result<()> {
        let mut file = fs::File::create(output_path).await?;

        // Write header
        let header = format!(
            "# Knowledge Base Export\n\n\
             **Exported**: {}\n\
             **Total Entries**: {}\n\n\
             ---\n\n",
            Utc::now().to_rfc3339(),
            entries.len()
        );
        file.write_all(header.as_bytes()).await?;

        // Write entries
        for (i, entry) in entries.iter().enumerate() {
            let section = format!(
                "## Entry {} - {}\n\n\
                 **ID**: {}\n\
                 **Timestamp**: {}\n\
                 **Agent**: {}\n\
                 **Issue**: {}\n\
                 **Task Type**: {}\n\
                 **Outcome**: {}\n\
                 **Workspace**: {}\n\
                 **Score**: {:.2}\n\n\
                 ### Content\n\n\
                 {}\n\n\
                 ---\n\n",
                i + 1,
                entry.metadata.agent.as_ref().unwrap_or(&"Unknown".to_string()),
                entry.id,
                entry.timestamp.to_rfc3339(),
                entry.metadata.agent.as_ref().unwrap_or(&"N/A".to_string()),
                entry
                    .metadata
                    .issue_number
                    .map(|n| n.to_string())
                    .unwrap_or_else(|| "N/A".to_string()),
                entry.metadata.task_type.as_ref().unwrap_or(&"N/A".to_string()),
                entry.metadata.outcome.as_ref().unwrap_or(&"N/A".to_string()),
                entry.metadata.workspace,
                entry.score,
                entry.content
            );
            file.write_all(section.as_bytes()).await?;
        }

        file.flush().await?;
        Ok(())
    }

    /// Escape CSV field (RFC 4180)
    fn escape_csv(field: &str) -> String {
        if field.contains(',') || field.contains('"') || field.contains('\n') {
            format!("\"{}\"", field.replace('"', "\"\""))
        } else {
            field.to_string()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{KnowledgeId, KnowledgeMetadata};
    use async_trait::async_trait;

    struct MockSearcher {
        entries: Vec<KnowledgeResult>,
    }

    #[async_trait]
    impl KnowledgeSearcher for MockSearcher {
        async fn search(&self, _query: &str) -> Result<Vec<KnowledgeResult>> {
            Ok(self.entries.clone())
        }

        async fn search_filtered(
            &self,
            _query: &str,
            _filter: SearchFilter,
        ) -> Result<Vec<KnowledgeResult>> {
            Ok(self.entries.clone())
        }

        async fn find_similar(
            &self,
            _entry_id: &KnowledgeId,
            _limit: usize,
        ) -> Result<Vec<KnowledgeResult>> {
            Ok(Vec::new())
        }
    }

    fn create_test_entry(id: &str, content: &str) -> KnowledgeResult {
        KnowledgeResult {
            id: KnowledgeId::from_string(id).unwrap_or_else(|_| KnowledgeId::new()),
            content: content.to_string(),
            score: 0.95,
            metadata: KnowledgeMetadata {
                workspace: "test-workspace".to_string(),
                worktree: None,
                agent: Some("CodeGenAgent".to_string()),
                issue_number: Some(123),
                task_type: Some("feature".to_string()),
                outcome: Some("success".to_string()),
                tools_used: Some(Vec::new()),
                files_changed: None,
                extra: serde_json::Map::new(),
            },
            timestamp: Utc::now(),
        }
    }

    #[tokio::test]
    async fn test_export_csv() {
        use tempfile::tempdir;

        let temp_dir = tempdir().unwrap();
        let output_path = temp_dir.path().join("export.csv");

        let entries = vec![
            create_test_entry("id1", "Test content 1"),
            create_test_entry("id2", "Test content 2"),
        ];

        let searcher = MockSearcher {
            entries: entries.clone(),
        };
        let exporter = KnowledgeExporter::new(searcher);

        let count = exporter.export(ExportFormat::Csv, &output_path, None).await.unwrap();

        assert_eq!(count, 2);
        assert!(output_path.exists());

        let content = fs::read_to_string(&output_path).await.unwrap();
        assert!(content.contains("id,content,agent"));
        assert!(content.contains("Test content 1"));
        assert!(content.contains("CodeGenAgent"));
    }

    #[tokio::test]
    async fn test_export_json() {
        use tempfile::tempdir;

        let temp_dir = tempdir().unwrap();
        let output_path = temp_dir.path().join("export.json");

        let entries = vec![create_test_entry("id1", "Test content")];

        let searcher = MockSearcher {
            entries: entries.clone(),
        };
        let exporter = KnowledgeExporter::new(searcher);

        let count = exporter.export(ExportFormat::Json, &output_path, None).await.unwrap();

        assert_eq!(count, 1);
        assert!(output_path.exists());

        let content = fs::read_to_string(&output_path).await.unwrap();
        let json: Vec<KnowledgeResult> = serde_json::from_str(&content).unwrap();
        assert_eq!(json.len(), 1);
        assert_eq!(json[0].content, "Test content");
    }

    #[tokio::test]
    async fn test_export_markdown() {
        use tempfile::tempdir;

        let temp_dir = tempdir().unwrap();
        let output_path = temp_dir.path().join("export.md");

        let entries = vec![create_test_entry("id1", "Test content for markdown")];

        let searcher = MockSearcher {
            entries: entries.clone(),
        };
        let exporter = KnowledgeExporter::new(searcher);

        let count = exporter.export(ExportFormat::Markdown, &output_path, None).await.unwrap();

        assert_eq!(count, 1);
        assert!(output_path.exists());

        let content = fs::read_to_string(&output_path).await.unwrap();
        assert!(content.contains("# Knowledge Base Export"));
        assert!(content.contains("Test content for markdown"));
        assert!(content.contains("**Agent**: CodeGenAgent"));
    }

    #[test]
    fn test_escape_csv() {
        assert_eq!(KnowledgeExporter::<MockSearcher>::escape_csv("simple"), "simple");
        assert_eq!(KnowledgeExporter::<MockSearcher>::escape_csv("has,comma"), "\"has,comma\"");
        assert_eq!(KnowledgeExporter::<MockSearcher>::escape_csv("has\"quote"), "\"has\"\"quote\"");
        assert_eq!(
            KnowledgeExporter::<MockSearcher>::escape_csv("has\nnewline"),
            "\"has\nnewline\""
        );
    }

    #[test]
    fn test_export_format_from_str() {
        assert!(matches!("csv".parse::<ExportFormat>().unwrap(), ExportFormat::Csv));
        assert!(matches!("json".parse::<ExportFormat>().unwrap(), ExportFormat::Json));
        assert!(matches!("markdown".parse::<ExportFormat>().unwrap(), ExportFormat::Markdown));
        assert!(matches!("md".parse::<ExportFormat>().unwrap(), ExportFormat::Markdown));
        assert!("invalid".parse::<ExportFormat>().is_err());
    }
}
