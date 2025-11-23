//! Temporal Segmentation Module
//!
//! 時間軸分割ロジック: 600秒 → 120セグメント（5秒ずつ）

use crate::{Layer4D, Scene, Segment, TransitionType, VideoConcept};
use anyhow::Result;

/// Temporal Segmenter
///
/// 動画全体を5秒単位の120セグメントに分割
pub struct TemporalSegmenter;

impl TemporalSegmenter {
    pub fn new() -> Self {
        Self
    }

    /// VideoConcept → 120 Segments
    ///
    /// # Arguments
    /// * `concept` - 解析済みの動画コンセプト
    ///
    /// # Returns
    /// * `Ok(Vec<Segment>)` - 120個のセグメント
    /// * `Err(anyhow::Error)` - 時間軸分割失敗
    pub fn segment(&self, concept: &VideoConcept) -> Result<Vec<Segment>> {
        let total_seconds = (concept.duration_minutes * 60) as f32;
        let segment_duration = 5.0; // 5秒ずつ
        let segment_count = (total_seconds / segment_duration) as u32;

        let mut segments = Vec::with_capacity(segment_count as usize);

        // Act別の時間配分
        let act1_segments = 36; // 3分 = 180秒 / 5
        let act2_segments = 60; // 5分 = 300秒 / 5
        let _act3_segments = 24; // 2分 = 120秒 / 5

        for i in 0..segment_count {
            let start_time = i as f32 * segment_duration;
            let end_time = start_time + segment_duration;

            // Act判定
            let (act_id, act_index) = if i < act1_segments {
                (1, i)
            } else if i < act1_segments + act2_segments {
                (2, i - act1_segments)
            } else {
                (3, i - act1_segments - act2_segments)
            };

            // シーン取得（簡易版：Act内の最初のシーン、または空シーン）
            let scene = self.get_scene_for_segment(concept, act_id, act_index);

            // 遷移タイプ（最初はcut、その後はfade_in）
            let transition = if i == 0 {
                TransitionType::Cut
            } else {
                TransitionType::FadeIn
            };

            // 4Dレイヤー（デフォルト構成）
            let layer4d = Layer4D::default();

            segments.push(Segment {
                id: i,
                start_time,
                end_time,
                act_id,
                scene,
                previous_frame_url: None, // 後でpipeline側で設定
                transition,
                layer4d,
                prompt: String::new(), // 後でPromptGeneratorが設定
            });
        }

        Ok(segments)
    }

    /// Act/Segment indexからシーン取得
    fn get_scene_for_segment(
        &self,
        concept: &VideoConcept,
        act_id: u8,
        _segment_index: u32,
    ) -> Scene {
        // 簡易版：Act内の最初のシーンを返す
        let act = match act_id {
            1 => &concept.plot_summary.act_1,
            2 => &concept.plot_summary.act_2,
            3 => &concept.plot_summary.act_3,
            _ => &concept.plot_summary.act_1,
        };

        if let Some(scene) = act.scenes.first() {
            scene.clone()
        } else {
            // 空シーンのフォールバック
            Scene {
                description: act.description.clone(),
                characters: vec![],
                location: "Unknown".to_string(),
                action: "Unknown".to_string(),
                mood: "Neutral".to_string(),
                lighting: "Natural".to_string(),
                camera_movement: "Static".to_string(),
            }
        }
    }
}

impl Default for TemporalSegmenter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Act, PlotSummary, VisualStyle};

    #[test]
    fn test_segment_count() {
        let segmenter = TemporalSegmenter::new();
        let concept = VideoConcept {
            title: "Test".to_string(),
            duration_minutes: 10,
            genre: vec![],
            characters: vec![],
            plot_summary: PlotSummary {
                act_1: Act {
                    description: "Act 1".to_string(),
                    duration_seconds: 180,
                    scenes: vec![],
                },
                act_2: Act {
                    description: "Act 2".to_string(),
                    duration_seconds: 300,
                    scenes: vec![],
                },
                act_3: Act {
                    description: "Act 3".to_string(),
                    duration_seconds: 120,
                    scenes: vec![],
                },
            },
            visual_style: VisualStyle {
                art_style: "Anime".to_string(),
                color_palette: vec![],
                atmosphere: "Light".to_string(),
            },
        };

        let result = segmenter.segment(&concept);
        assert!(result.is_ok());
        let segments = result.unwrap();
        assert_eq!(segments.len(), 120); // 10分 / 5秒 = 120セグメント
    }

    #[test]
    fn test_act_distribution() {
        let segmenter = TemporalSegmenter::new();
        let concept = VideoConcept {
            title: "Test".to_string(),
            duration_minutes: 10,
            genre: vec![],
            characters: vec![],
            plot_summary: PlotSummary {
                act_1: Act {
                    description: "Act 1".to_string(),
                    duration_seconds: 180,
                    scenes: vec![],
                },
                act_2: Act {
                    description: "Act 2".to_string(),
                    duration_seconds: 300,
                    scenes: vec![],
                },
                act_3: Act {
                    description: "Act 3".to_string(),
                    duration_seconds: 120,
                    scenes: vec![],
                },
            },
            visual_style: VisualStyle {
                art_style: "Anime".to_string(),
                color_palette: vec![],
                atmosphere: "Light".to_string(),
            },
        };

        let segments = segmenter.segment(&concept).unwrap();

        // Act分布確認
        let act1_count = segments.iter().filter(|s| s.act_id == 1).count();
        let act2_count = segments.iter().filter(|s| s.act_id == 2).count();
        let act3_count = segments.iter().filter(|s| s.act_id == 3).count();

        assert_eq!(act1_count, 36); // 3分 = 36セグメント
        assert_eq!(act2_count, 60); // 5分 = 60セグメント
        assert_eq!(act3_count, 24); // 2分 = 24セグメント
    }
}
