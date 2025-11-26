// Reporter for SWE-bench Pro evaluation results
//!
//! This module provides functionality to generate evaluation reports in various formats.

use anyhow::{Context, Result};
use miyabi_types::benchmark::{BenchmarkSummary, EvaluationResult, SWEBenchInstance};
use std::fs;
use std::path::Path;
use tracing::{debug, info};

/// Reporter for generating evaluation result reports
pub struct EvaluationReporter {
    results: Vec<EvaluationResult>,
    instances: Vec<SWEBenchInstance>,
    model_name: String,
}

impl EvaluationReporter {
    /// Creates a new reporter with evaluation results
    pub fn new(
        results: Vec<EvaluationResult>,
        instances: Vec<SWEBenchInstance>,
        model_name: String,
    ) -> Self {
        Self {
            results,
            instances,
            model_name,
        }
    }

    /// Generates a benchmark summary
    pub fn generate_summary(&self) -> BenchmarkSummary {
        BenchmarkSummary::from_results(
            self.model_name.clone(),
            "SWE-bench Pro".to_string(),
            "test".to_string(),
            &self.results,
            &self.instances,
        )
    }

    /// Saves evaluation results as JSON
    pub fn save_json(&self, output_path: &Path) -> Result<()> {
        info!("Saving evaluation results to JSON: {:?}", output_path);

        let json =
            serde_json::to_string_pretty(&self.results).context("Failed to serialize results")?;

        fs::write(output_path, json).context("Failed to write JSON file")?;

        debug!("JSON report saved: {:?}", output_path);
        Ok(())
    }

    /// Generates a Markdown report
    pub fn generate_markdown(&self) -> String {
        let summary = self.generate_summary();

        let mut md = String::new();

        // Header
        md.push_str("# SWE-bench Pro Evaluation Report\n\n");
        md.push_str(&format!(
            "**Date**: {}\n\n",
            chrono::Local::now().format("%Y-%m-%d %H:%M:%S")
        ));
        md.push_str(&format!("**Model**: {}\n", summary.model));
        md.push_str(&format!("**Dataset**: {}\n", summary.dataset));
        md.push_str(&format!("**Split**: {}\n\n", summary.split));

        // Summary statistics
        md.push_str("## Summary\n\n");
        md.push_str(&format!(
            "- **Total Instances**: {}\n",
            summary.total_instances
        ));
        md.push_str(&format!(
            "- **Resolved**: {} ({:.2}%)\n",
            summary.resolved_count,
            summary.resolve_rate * 100.0
        ));
        md.push_str(&format!(
            "- **Failed**: {}\n",
            summary.total_instances - summary.resolved_count
        ));
        md.push_str(&format!("- **Errors**: {}\n", summary.errors));
        md.push_str(&format!(
            "- **Average Execution Time**: {:.2}s\n\n",
            summary.avg_execution_time
        ));

        // Test statistics
        md.push_str("## Test Results\n\n");
        md.push_str(&format!(
            "- **fail_to_pass**: {} tests passed\n",
            summary.fail_to_pass_total
        ));
        md.push_str(&format!(
            "- **pass_to_pass**: {} tests passed\n\n",
            summary.pass_to_pass_total
        ));

        // Language breakdown
        if !summary.by_language.is_empty() {
            md.push_str("## By Language\n\n");
            md.push_str("| Language | Total | Resolved | Rate |\n");
            md.push_str("|----------|-------|----------|------|\n");
            for (lang, stats) in &summary.by_language {
                md.push_str(&format!(
                    "| {} | {} | {} | {:.2}% |\n",
                    lang,
                    stats.total,
                    stats.resolved,
                    stats.resolve_rate * 100.0
                ));
            }
            md.push('\n');
        }

        // Repository breakdown
        if !summary.by_repository.is_empty() {
            md.push_str("## By Repository\n\n");
            md.push_str("| Repository | Total | Resolved | Rate |\n");
            md.push_str("|------------|-------|----------|------|\n");
            for (repo, stats) in &summary.by_repository {
                md.push_str(&format!(
                    "| {} | {} | {} | {:.2}% |\n",
                    repo,
                    stats.total,
                    stats.resolved,
                    stats.resolve_rate * 100.0
                ));
            }
            md.push('\n');
        }

        // Detailed results table
        md.push_str("## Detailed Results\n\n");
        md.push_str("| Instance ID | Resolved | fail_to_pass | pass_to_pass | Time (s) |\n");
        md.push_str("|-------------|----------|--------------|--------------|----------|\n");

        for result in &self.results {
            md.push_str(&format!(
                "| {} | {} | {}/{} | {}/{} | {:.2} |\n",
                result.instance_id,
                if result.resolved { "✅" } else { "❌" },
                result.fail_to_pass_count,
                result.fail_to_pass_total,
                result.pass_to_pass_count,
                result.pass_to_pass_total,
                result.execution_time
            ));
        }

        md.push('\n');

        // Failed instances
        let failed: Vec<_> = self.results.iter().filter(|r| !r.resolved).collect();

        if !failed.is_empty() {
            md.push_str("## Failed Instances\n\n");
            for result in failed {
                md.push_str(&format!("### {}\n\n", result.instance_id));
                if let Some(error) = &result.error {
                    md.push_str(&format!("**Error**: {}\n\n", error));
                }
                md.push_str(&format!(
                    "- fail_to_pass: {}/{}\n",
                    result.fail_to_pass_count, result.fail_to_pass_total
                ));
                md.push_str(&format!(
                    "- pass_to_pass: {}/{}\n\n",
                    result.pass_to_pass_count, result.pass_to_pass_total
                ));
            }
        }

        md
    }

    /// Saves Markdown report to file
    pub fn save_markdown(&self, output_path: &Path) -> Result<()> {
        info!("Saving Markdown report to: {:?}", output_path);

        let markdown = self.generate_markdown();
        fs::write(output_path, markdown).context("Failed to write Markdown file")?;

        debug!("Markdown report saved: {:?}", output_path);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_instance(instance_id: &str, language: &str) -> SWEBenchInstance {
        SWEBenchInstance {
            instance_id: instance_id.to_string(),
            repo: "test/test".to_string(),
            base_commit: "abc123".to_string(),
            problem_statement: "Test problem".to_string(),
            patch: "diff".to_string(),
            test_patch: "test diff".to_string(),
            fail_to_pass: vec!["test1".to_string(), "test2".to_string()],
            pass_to_pass: vec!["test3".to_string(), "test4".to_string()],
            repo_language: Some(language.to_string()),
            requirements: None,
        }
    }

    fn create_test_result(instance_id: &str, resolved: bool) -> EvaluationResult {
        if resolved {
            EvaluationResult::success(instance_id.to_string(), 2, 2, 2, 2, 10.0)
        } else {
            EvaluationResult::failure(instance_id.to_string(), "Test failed".to_string(), 10.0)
        }
    }

    #[test]
    fn test_reporter_summary() {
        let instances = vec![
            create_test_instance("test1", "python"),
            create_test_instance("test2", "python"),
            create_test_instance("test3", "go"),
        ];

        let results = vec![
            create_test_result("test1", true),
            create_test_result("test2", false),
            create_test_result("test3", true),
        ];

        let reporter = EvaluationReporter::new(results, instances, "test-model".to_string());
        let summary = reporter.generate_summary();

        assert_eq!(summary.total_instances, 3);
        assert_eq!(summary.resolved_count, 2);
        assert!((summary.resolve_rate - 0.6667).abs() < 0.01);
        assert_eq!(summary.model, "test-model");
        assert_eq!(summary.dataset, "SWE-bench Pro");
    }

    #[test]
    fn test_markdown_generation() {
        let instances = vec![create_test_instance("test1", "python")];
        let results = vec![create_test_result("test1", true)];

        let reporter = EvaluationReporter::new(results, instances, "test-model".to_string());
        let markdown = reporter.generate_markdown();

        assert!(markdown.contains("# SWE-bench Pro Evaluation Report"));
        assert!(markdown.contains("## Summary"));
        assert!(markdown.contains("## Detailed Results"));
        assert!(markdown.contains("**Model**: test-model"));
        assert!(markdown.contains("**Dataset**: SWE-bench Pro"));
    }
}
