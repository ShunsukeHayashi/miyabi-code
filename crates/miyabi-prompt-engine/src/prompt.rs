//! Prompt Generation Module
//!
//! 各セグメントにSeedance API用プロンプトを生成

use crate::Segment;
use anyhow::Result;

/// Prompt Generator
///
/// セグメント情報から高品質なプロンプトを生成
pub struct PromptGenerator;

impl PromptGenerator {
    pub fn new() -> Self {
        Self
    }

    /// セグメント配列にプロンプト追加
    ///
    /// # Arguments
    /// * `segments` - プロンプトなしのセグメント配列
    ///
    /// # Returns
    /// * `Ok(Vec<Segment>)` - プロンプト追加済みセグメント
    pub fn generate_prompts(&self, mut segments: Vec<Segment>) -> Result<Vec<Segment>> {
        for segment in segments.iter_mut() {
            segment.prompt = self.generate_segment_prompt(segment);
        }
        Ok(segments)
    }

    /// 単一セグメントのプロンプト生成
    fn generate_segment_prompt(&self, segment: &Segment) -> String {
        let scene = &segment.scene;

        // 基本プロンプト構成
        let mut prompt_parts = vec![
            format!("Scene {}, Segment {}", segment.act_id, segment.id),
            format!("Description: {}", scene.description),
        ];

        // キャラクター情報
        if !scene.characters.is_empty() {
            prompt_parts.push(format!("Characters: {}", scene.characters.join(", ")));
        }

        // 場所・アクション
        prompt_parts.push(format!("Location: {}", scene.location));
        prompt_parts.push(format!("Action: {}", scene.action));

        // ムード・雰囲気
        prompt_parts.push(format!("Mood: {}", scene.mood));
        prompt_parts.push(format!("Lighting: {}", scene.lighting));

        // カメラムーブメント
        prompt_parts.push(format!("Camera: {}", scene.camera_movement));

        // 遷移ヒント
        let transition_hint = segment.transition.to_prompt_hint();
        if !transition_hint.is_empty() {
            prompt_parts.push(format!("Transition: {}", transition_hint));
        }

        // 4Dレイヤー情報
        let layer4d_hint = segment.layer4d.to_prompt_hint();
        if !layer4d_hint.is_empty() {
            prompt_parts.push(format!("Layers: {}", layer4d_hint));
        }

        // 前フレーム参照（temporal coherence）
        if segment.previous_frame_url.is_some() {
            prompt_parts.push("Reference previous frame for continuity".to_string());
        }

        // Seedance API用パラメータ
        prompt_parts.push("--resolution 1080p --duration 5 --camerafixed false".to_string());

        // 全パーツを結合
        prompt_parts.join("\n")
    }
}

impl Default for PromptGenerator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Layer4D, Scene, TransitionType};

    #[test]
    fn test_generate_prompt() {
        let generator = PromptGenerator::new();
        let mut segment = Segment {
            id: 0,
            start_time: 0.0,
            end_time: 5.0,
            act_id: 1,
            scene: Scene {
                description: "Opening scene".to_string(),
                characters: vec!["Hero".to_string()],
                location: "Forest".to_string(),
                action: "Walking".to_string(),
                mood: "Mysterious".to_string(),
                lighting: "Dawn light".to_string(),
                camera_movement: "Tracking shot".to_string(),
            },
            previous_frame_url: None,
            transition: TransitionType::Cut,
            layer4d: Layer4D::default(),
            prompt: String::new(),
        };

        let prompt = generator.generate_segment_prompt(&segment);
        assert!(prompt.contains("Scene 1"));
        assert!(prompt.contains("Opening scene"));
        assert!(prompt.contains("Hero"));
        assert!(prompt.contains("Forest"));
        assert!(prompt.contains("--resolution 1080p"));
    }
}
