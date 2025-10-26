//! VOICEVOX Speaker definitions

use serde::{Deserialize, Serialize};

/// VOICEVOX Speaker
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum Speaker {
    /// 四国めたん (ID: 2)
    ShikokuMetan = 2,
    /// ずんだもん (ID: 3) - Default
    #[default]
    Zundamon = 3,
    /// 春日部つむぎ (ID: 8)
    KasukabeTsumugi = 8,
    /// 波音リツ (ID: 9)
    NamineRitsu = 9,
}

impl Speaker {
    /// Get speaker ID
    pub fn id(self) -> u32 {
        self as u32
    }

    /// Get speaker name
    pub fn name(self) -> &'static str {
        match self {
            Speaker::ShikokuMetan => "四国めたん",
            Speaker::Zundamon => "ずんだもん",
            Speaker::KasukabeTsumugi => "春日部つむぎ",
            Speaker::NamineRitsu => "波音リツ",
        }
    }

    /// Get speaker description
    pub fn description(self) -> &'static str {
        match self {
            Speaker::ShikokuMetan => "女性、かわいい",
            Speaker::Zundamon => "女性、元気",
            Speaker::KasukabeTsumugi => "女性、明るい",
            Speaker::NamineRitsu => "女性、落ち着き",
        }
    }
}

/// Voice configuration for speaking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeakerVoice {
    /// Speaker to use
    pub speaker: Speaker,
    /// Speed multiplier (0.5 - 2.0)
    pub speed: f32,
    /// Pitch adjustment (-0.15 - 0.15)
    #[serde(default)]
    pub pitch: f32,
    /// Intonation scale (0.0 - 2.0)
    #[serde(default = "default_intonation")]
    pub intonation: f32,
}

fn default_intonation() -> f32 {
    1.0
}

impl Default for SpeakerVoice {
    fn default() -> Self {
        Self {
            speaker: Speaker::default(),
            speed: 1.2,
            pitch: 0.0,
            intonation: 1.0,
        }
    }
}

impl SpeakerVoice {
    /// Create a new voice configuration
    pub fn new(speaker: Speaker) -> Self {
        Self {
            speaker,
            ..Default::default()
        }
    }

    /// Set speed
    pub fn with_speed(mut self, speed: f32) -> Self {
        self.speed = speed.clamp(0.5, 2.0);
        self
    }

    /// Set pitch
    pub fn with_pitch(mut self, pitch: f32) -> Self {
        self.pitch = pitch.clamp(-0.15, 0.15);
        self
    }

    /// Set intonation
    pub fn with_intonation(mut self, intonation: f32) -> Self {
        self.intonation = intonation.clamp(0.0, 2.0);
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_speaker_id() {
        assert_eq!(Speaker::Zundamon.id(), 3);
        assert_eq!(Speaker::ShikokuMetan.id(), 2);
    }

    #[test]
    fn test_speaker_voice_clamp() {
        let voice = SpeakerVoice::default()
            .with_speed(5.0)
            .with_pitch(1.0)
            .with_intonation(10.0);

        assert_eq!(voice.speed, 2.0);
        assert_eq!(voice.pitch, 0.15);
        assert_eq!(voice.intonation, 2.0);
    }
}
