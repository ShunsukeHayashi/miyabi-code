//! ドキュメント生成ユーティリティ
//!
//! コード生成後の Rustdoc と README の作成を担当する。

use crate::codegen::CodeGenerationResult;
use miyabi_core::documentation::{
    generate_readme, generate_rustdoc, CodeExample, DocumentationConfig, ReadmeTemplate,
};
use miyabi_types::error::MiyabiError;
use std::path::Path;

/// ドキュメント生成結果
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DocumentationGenerationResult {
    /// Rustdoc の出力パス
    pub rustdoc_path: String,
    /// README を生成した場合のパス
    pub readme_path: Option<String>,
    /// 生成時の警告
    pub warnings: Vec<String>,
    /// 生成が成功したか
    pub success: bool,
}

/// Rustdoc/README を生成する
pub async fn generate_documentation(
    project_path: &Path,
    result: &CodeGenerationResult,
) -> Result<DocumentationGenerationResult, MiyabiError> {
    tracing::info!("Generating documentation for {:?}", project_path);

    let doc_config = DocumentationConfig::new(project_path).with_private_items();
    let rustdoc_result = generate_rustdoc(&doc_config).await?;

    let readme_path = if !result.files_created.is_empty() {
        let readme = build_readme_for_files(&result.files_created)?;
        let readme_path = project_path.join("README.md");

        tokio::fs::write(&readme_path, readme)
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Failed to write README.md: {}", e)))?;

        Some(readme_path.to_string_lossy().to_string())
    } else {
        None
    };

    Ok(DocumentationGenerationResult {
        rustdoc_path: rustdoc_result.doc_path,
        readme_path,
        warnings: rustdoc_result.warnings,
        success: rustdoc_result.success,
    })
}

pub(crate) fn build_readme_for_files(files: &[String]) -> Result<String, MiyabiError> {
    let project_name = files
        .first()
        .and_then(|f| Path::new(f).file_stem())
        .and_then(|s| s.to_str())
        .unwrap_or("Project")
        .to_string();

    let template = ReadmeTemplate {
        project_name: project_name.clone(),
        description: format!("Auto-generated documentation for {}", project_name),
        installation: Some(format!("```bash\ncargo add {}\n```", project_name.to_lowercase())),
        usage_examples: vec![CodeExample::new(
            "Basic Usage",
            format!("use {};\n\nfn main() {{\n    // Your code here\n}}", project_name),
        )
        .with_description("A simple usage example")],
        api_docs_link: Some(format!("https://docs.rs/{}", project_name.to_lowercase())),
        license: Some("MIT OR Apache-2.0".to_string()),
    };

    Ok(generate_readme(&template))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn readme_includes_metadata_for_single_file() {
        let readme = build_readme_for_files(&["src/my_module.rs".to_string()]).unwrap();

        assert!(readme.contains("# my_module"));
        assert!(readme.contains("Auto-generated documentation for my_module"));
        assert!(readme.contains("cargo add my_module"));
        assert!(readme.contains("```rust"));
        assert!(readme.contains("use my_module;"));
        assert!(readme.contains("https://docs.rs/my_module"));
        assert!(readme.contains("MIT OR Apache-2.0"));
    }

    #[test]
    fn readme_uses_first_file_as_project_name() {
        let readme = build_readme_for_files(&[
            "src/parser.rs".to_string(),
            "src/lexer.rs".to_string(),
            "src/ast.rs".to_string(),
        ])
        .unwrap();

        assert!(readme.contains("# parser"));
        assert!(readme.contains("Auto-generated documentation for parser"));
    }

    #[test]
    fn documentation_generation_result_serializes() {
        let result = DocumentationGenerationResult {
            rustdoc_path: "target/doc".to_string(),
            readme_path: Some("README.md".to_string()),
            warnings: vec!["missing docs".to_string()],
            success: true,
        };

        let json = serde_json::to_value(&result).expect("serialize");
        assert_eq!(json["rustdoc_path"], "target/doc");
        assert_eq!(json["readme_path"], "README.md");
        assert_eq!(json["success"], true);

        let deserialized: DocumentationGenerationResult =
            serde_json::from_value(json).expect("deserialize");
        assert_eq!(deserialized.rustdoc_path, "target/doc");
        assert_eq!(deserialized.readme_path, Some("README.md".to_string()));
        assert_eq!(deserialized.warnings.len(), 1);
        assert!(deserialized.success);
    }
}
