//! 4D Layer Module
//!
//! 空間レイヤー（前景/中景/後景）+ 時間レイヤー（過去/現在/未来）+ エフェクト

use serde::{Deserialize, Serialize};

/// 4Dレイヤー構成
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer4D {
    /// 空間レイヤー（3D）
    pub spatial: SpatialLayers,
    /// 時間レイヤー（1D）
    pub temporal: TemporalLayer,
    /// エフェクトレイヤー
    pub effects: EffectLayers,
}

/// 空間レイヤー（3次元）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpatialLayers {
    pub foreground: Option<String>, // 前景
    pub midground: Option<String>,  // 中景
    pub background: Option<String>, // 後景
}

/// 時間レイヤー（4次元目）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TemporalLayer {
    Past,    // 過去シーン
    Present, // 現在シーン
    Future,  // 未来シーン
}

/// エフェクトレイヤー
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EffectLayers {
    pub vfx: Vec<String>,             // VFXエフェクト
    pub lighting: Vec<String>,        // ライティングエフェクト
    pub post_processing: Vec<String>, // ポストプロセス
}

impl Layer4D {
    /// プロンプトヒント生成
    pub fn to_prompt_hint(&self) -> String {
        let mut hints = vec![];

        // 空間レイヤー
        if let Some(ref fg) = self.spatial.foreground {
            hints.push(format!("Foreground: {}", fg));
        }
        if let Some(ref mg) = self.spatial.midground {
            hints.push(format!("Midground: {}", mg));
        }
        if let Some(ref bg) = self.spatial.background {
            hints.push(format!("Background: {}", bg));
        }

        // 時間レイヤー
        let temporal_hint = match self.temporal {
            TemporalLayer::Past => "Temporal: Past scene (flashback)",
            TemporalLayer::Present => "Temporal: Present scene",
            TemporalLayer::Future => "Temporal: Future scene (flash-forward)",
        };
        hints.push(temporal_hint.to_string());

        // エフェクト
        if !self.effects.vfx.is_empty() {
            hints.push(format!("VFX: {}", self.effects.vfx.join(", ")));
        }
        if !self.effects.lighting.is_empty() {
            hints.push(format!("Lighting: {}", self.effects.lighting.join(", ")));
        }

        hints.join("; ")
    }
}

impl Default for Layer4D {
    fn default() -> Self {
        Self {
            spatial: SpatialLayers {
                foreground: None,
                midground: None,
                background: None,
            },
            temporal: TemporalLayer::Present,
            effects: EffectLayers {
                vfx: vec![],
                lighting: vec![],
                post_processing: vec![],
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_layer4d() {
        let layer = Layer4D::default();
        assert!(layer.spatial.foreground.is_none());
        assert!(matches!(layer.temporal, TemporalLayer::Present));
    }

    #[test]
    fn test_prompt_hint() {
        let layer = Layer4D {
            spatial: SpatialLayers {
                foreground: Some("Character close-up".to_string()),
                midground: Some("Forest trees".to_string()),
                background: Some("Mountains".to_string()),
            },
            temporal: TemporalLayer::Present,
            effects: EffectLayers {
                vfx: vec!["Particle effects".to_string()],
                lighting: vec!["Dawn lighting".to_string()],
                post_processing: vec![],
            },
        };

        let hint = layer.to_prompt_hint();
        assert!(hint.contains("Foreground"));
        assert!(hint.contains("Character close-up"));
        assert!(hint.contains("Temporal: Present"));
    }
}
