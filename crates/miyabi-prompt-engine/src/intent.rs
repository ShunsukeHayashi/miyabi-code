//! Intent Resolution Module
//!
//! ユーザー入力（YAML）を構造化データに変換

use crate::VideoConcept;
use anyhow::{Context, Result};
use serde_yaml;

/// Intent Resolver
///
/// YAML文字列を解析して VideoConcept に変換
pub struct IntentResolver;

impl IntentResolver {
    pub fn new() -> Self {
        Self
    }

    /// YAML → VideoConcept変換
    ///
    /// # Arguments
    /// * `yaml_input` - YAML形式の動画コンセプト文字列
    ///
    /// # Returns
    /// * `Ok(VideoConcept)` - 解析成功
    /// * `Err(anyhow::Error)` - 解析失敗（不正なYAML、必須フィールド欠落など）
    pub fn resolve(&self, yaml_input: &str) -> Result<VideoConcept> {
        serde_yaml::from_str(yaml_input).context("Failed to parse YAML input into VideoConcept")
    }
}

impl Default for IntentResolver {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_valid_yaml() {
        let resolver = IntentResolver::new();
        let yaml = r#"
title: "テスト動画"
duration_minutes: 10
genre: ["テスト"]
characters:
  - name: "キャラA"
    description: "テストキャラ"
    appearance: "黒髪"
plot_summary:
  act_1:
    description: "Act 1"
    duration_seconds: 180
    scenes: []
  act_2:
    description: "Act 2"
    duration_seconds: 300
    scenes: []
  act_3:
    description: "Act 3"
    duration_seconds: 120
    scenes: []
visual_style:
  art_style: "アニメ"
  color_palette: ["青", "赤"]
  atmosphere: "明るい"
"#;

        let result = resolver.resolve(yaml);
        assert!(result.is_ok());
        let concept = result.unwrap();
        assert_eq!(concept.title, "テスト動画");
        assert_eq!(concept.duration_minutes, 10);
    }

    #[test]
    fn test_resolve_invalid_yaml() {
        let resolver = IntentResolver::new();
        let invalid_yaml = "invalid: yaml: syntax:";

        let result = resolver.resolve(invalid_yaml);
        assert!(result.is_err());
    }
}
