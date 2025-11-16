//! Transition Module
//!
//! フレーム間遷移タイプ（fade, cut, dissolve, wipe）

use serde::{Deserialize, Serialize};

/// 遷移タイプ
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum TransitionType {
    #[default]
    FadeIn, // フェードイン
    FadeOut,  // フェードアウト
    Cut,      // カット（瞬間切り替え）
    Dissolve, // ディゾルブ（クロスフェード）
    Wipe,     // ワイプ
}

impl TransitionType {
    /// プロンプトヒント生成
    pub fn to_prompt_hint(&self) -> &'static str {
        match self {
            TransitionType::FadeIn => "Smooth fade-in transition from previous frame",
            TransitionType::FadeOut => "Smooth fade-out transition to next frame",
            TransitionType::Cut => "Hard cut transition (instant change)",
            TransitionType::Dissolve => "Cross-dissolve transition (blend with previous frame)",
            TransitionType::Wipe => "Wipe transition effect",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transition_hints() {
        assert_eq!(TransitionType::Cut.to_prompt_hint(), "Hard cut transition (instant change)");
        assert_eq!(
            TransitionType::FadeIn.to_prompt_hint(),
            "Smooth fade-in transition from previous frame"
        );
    }

    #[test]
    fn test_default_transition() {
        let transition = TransitionType::default();
        assert!(matches!(transition, TransitionType::FadeIn));
    }
}
