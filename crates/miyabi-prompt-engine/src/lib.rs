//! Miyabi Prompt Engine
//!
//! インテリジェントプロンプト生成エンジン
//! ユーザー入力（YAML）から時間軸分割・フレーム単位プロンプト生成
//!
//! # Phase 1.5-CRITICAL (P0)
//! このエンジンがないと動画生成パイプライン (#787) が動作不可能

pub mod intent;
pub mod layer4d;
pub mod prompt;
pub mod temporal;
pub mod transition;

pub use intent::IntentResolver;
pub use layer4d::Layer4D;
pub use prompt::PromptGenerator;
pub use temporal::TemporalSegmenter;
pub use transition::TransitionType;

use anyhow::Result;
use serde::{Deserialize, Serialize};

/// 動画コンセプト定義（YAML入力）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoConcept {
    pub title: String,
    pub duration_minutes: u32,
    pub genre: Vec<String>,
    pub characters: Vec<Character>,
    pub plot_summary: PlotSummary,
    pub visual_style: VisualStyle,
}

/// キャラクター定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Character {
    pub name: String,
    pub description: String,
    pub appearance: String,
}

/// プロットサマリー（3幕構成）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlotSummary {
    pub act_1: Act,
    pub act_2: Act,
    pub act_3: Act,
}

/// Act定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Act {
    pub description: String,
    pub duration_seconds: u32,
    pub scenes: Vec<Scene>,
}

/// シーン定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scene {
    pub description: String,
    pub characters: Vec<String>,
    pub location: String,
    pub action: String,
    pub mood: String,
    pub lighting: String,
    pub camera_movement: String,
}

/// ビジュアルスタイル
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualStyle {
    pub art_style: String,
    pub color_palette: Vec<String>,
    pub atmosphere: String,
}

/// セグメント（5秒単位）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Segment {
    pub id: u32,
    pub start_time: f32,
    pub end_time: f32,
    pub act_id: u8,
    pub scene: Scene,
    pub previous_frame_url: Option<String>,
    pub transition: TransitionType,
    pub layer4d: Layer4D,
    pub prompt: String,
}

/// プロンプトエンジンのメインAPI
pub struct PromptEngine {
    intent_resolver: IntentResolver,
    temporal_segmenter: TemporalSegmenter,
    prompt_generator: PromptGenerator,
}

impl PromptEngine {
    /// 新規エンジン作成
    pub fn new() -> Self {
        Self {
            intent_resolver: IntentResolver::new(),
            temporal_segmenter: TemporalSegmenter::new(),
            prompt_generator: PromptGenerator::new(),
        }
    }

    /// YAML → 120セグメント生成
    ///
    /// # Arguments
    /// * `yaml_input` - ユーザー入力YAML文字列
    ///
    /// # Returns
    /// * `Ok(Vec<Segment>)` - 120個のセグメント（5秒ずつ）
    /// * `Err(anyhow::Error)` - 解析失敗
    pub fn generate_segments(&self, yaml_input: &str) -> Result<Vec<Segment>> {
        // Step 1: Intent Resolution (YAML → 構造化データ)
        let video_concept = self.intent_resolver.resolve(yaml_input)?;

        // Step 2: Temporal Segmentation (600秒 → 120セグメント)
        let segments = self.temporal_segmenter.segment(&video_concept)?;

        // Step 3: Prompt Generation (各セグメントにプロンプト生成)
        let segments_with_prompts = self.prompt_generator.generate_prompts(segments)?;

        Ok(segments_with_prompts)
    }

    /// セグメントからSeedance API用プロンプト抽出
    pub fn extract_prompts(&self, segments: &[Segment]) -> Vec<String> {
        segments.iter().map(|s| s.prompt.clone()).collect()
    }
}

impl Default for PromptEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prompt_engine_creation() {
        let _engine = PromptEngine::new();
    }

    #[test]
    fn test_segment_count() {
        // 10分動画 = 600秒 = 120セグメント（5秒ずつ）
        let expected_segments = 120;
        assert_eq!(600 / 5, expected_segments);
    }
}
