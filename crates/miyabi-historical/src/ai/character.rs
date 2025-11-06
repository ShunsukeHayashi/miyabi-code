use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

use super::error::HistoricalAiError;

/// Historical figure character definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoricalCharacter {
    /// Japanese name
    pub name: String,

    /// English name
    pub english_name: String,

    /// Historical era
    pub era: String,

    /// Title/role
    pub title: String,

    /// Personality traits
    pub personality: Personality,

    /// Speaking tone and style
    pub tone: Tone,

    /// Areas of expertise
    pub specialties: Vec<String>,

    /// Historical episodes and lessons
    pub historical_episodes: Vec<HistoricalEpisode>,

    /// Advice giving style
    pub advice_style: AdviceStyle,

    /// Constraints and guidelines
    pub constraints: Vec<String>,
}

/// Personality traits
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Personality {
    /// Core personality traits
    pub core: Vec<String>,

    /// Detailed traits
    pub traits: Vec<String>,
}

/// Speaking tone and style
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tone {
    /// Speaking style patterns
    pub speaking_style: Vec<String>,

    /// Example phrases
    pub examples: Vec<String>,
}

/// Historical episode with lesson
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoricalEpisode {
    /// Title of the episode
    pub title: String,

    /// The lesson or takeaway
    pub lesson: String,

    /// Historical context
    #[serde(default)]
    pub context: Option<String>,

    /// Modern application
    #[serde(default)]
    pub application: Option<String>,
}

/// Advice giving style
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdviceStyle {
    /// Approach to giving advice
    pub approach: Vec<String>,

    /// Structure of advice
    #[serde(default)]
    pub structure: Option<Vec<String>>,
}

impl HistoricalCharacter {
    /// Load a character from a YAML file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, HistoricalAiError> {
        let content = fs::read_to_string(path.as_ref())?;
        let character: HistoricalCharacter = serde_yaml::from_str(&content)?;
        Ok(character)
    }

    /// Load a character by name (searches in default prompts directory)
    pub fn load(name: &str) -> Result<Self, HistoricalAiError> {
        // Try to find the character file in the prompts directory
        let crate_root = env!("CARGO_MANIFEST_DIR");
        let file_path = format!("{}/prompts/{}.yaml", crate_root, name);

        if !Path::new(&file_path).exists() {
            return Err(HistoricalAiError::CharacterNotFound(name.to_string()));
        }

        Self::from_file(file_path)
    }

    /// Get available character names
    pub fn available_characters() -> Vec<String> {
        vec![
            "oda_nobunaga".to_string(),
            "sakamoto_ryoma".to_string(),
            "tokugawa_ieyasu".to_string(),
        ]
    }

    /// Format personality for prompt
    pub fn format_personality(&self) -> String {
        let mut result = String::new();

        result.push_str("## Core Personality\n");
        for trait_item in &self.personality.core {
            result.push_str(&format!("- {}\n", trait_item));
        }

        result.push_str("\n## Detailed Traits\n");
        for trait_item in &self.personality.traits {
            result.push_str(&format!("- {}\n", trait_item));
        }

        result
    }

    /// Format tone examples for prompt
    pub fn format_tone_examples(&self) -> String {
        let mut result = String::new();

        for (i, example) in self.tone.examples.iter().enumerate() {
            result.push_str(&format!("{}. {}\n", i + 1, example));
        }

        result
    }

    /// Format speaking style for prompt
    pub fn format_speaking_style(&self) -> String {
        let mut result = String::new();

        for style in &self.tone.speaking_style {
            result.push_str(&format!("- {}\n", style));
        }

        result
    }

    /// Format historical episodes for prompt
    pub fn format_historical_episodes(&self) -> String {
        let mut result = String::new();

        for (i, episode) in self.historical_episodes.iter().enumerate() {
            result.push_str(&format!("\n## Episode {}: {}\n\n", i + 1, episode.title));
            result.push_str(&format!("**Lesson**: {}\n\n", episode.lesson));

            if let Some(context) = &episode.context {
                result.push_str(&format!("**Context**: {}\n\n", context));
            }

            if let Some(application) = &episode.application {
                result.push_str(&format!("**Application**: {}\n\n", application));
            }
        }

        result
    }

    /// Format specialties for prompt
    pub fn format_specialties(&self) -> String {
        let mut result = String::new();

        for specialty in &self.specialties {
            result.push_str(&format!("- {}\n", specialty));
        }

        result
    }

    /// Format advice approach for prompt
    pub fn format_advice_approach(&self) -> String {
        let mut result = String::new();

        for approach in &self.advice_style.approach {
            result.push_str(&format!("- {}\n", approach));
        }

        result
    }

    /// Format constraints for prompt
    pub fn format_constraints(&self) -> String {
        let mut result = String::new();

        for constraint in &self.constraints {
            result.push_str(&format!("- {}\n", constraint));
        }

        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_oda_nobunaga() {
        let character = HistoricalCharacter::load("oda_nobunaga");
        assert!(character.is_ok());

        let character = character.unwrap();
        assert!(!character.personality.core.is_empty());
        assert!(!character.historical_episodes.is_empty());
    }

    #[test]
    fn test_load_sakamoto_ryoma() {
        let character = HistoricalCharacter::load("sakamoto_ryoma");
        assert!(character.is_ok());
    }

    #[test]
    fn test_load_tokugawa_ieyasu() {
        let character = HistoricalCharacter::load("tokugawa_ieyasu");
        assert!(character.is_ok());
    }

    #[test]
    fn test_format_methods() {
        let character = HistoricalCharacter::load("oda_nobunaga").unwrap();

        assert!(!character.format_personality().is_empty());
        assert!(!character.format_tone_examples().is_empty());
        assert!(!character.format_historical_episodes().is_empty());
        assert!(!character.format_specialties().is_empty());
    }

    #[test]
    fn test_available_characters() {
        let characters = HistoricalCharacter::available_characters();
        assert_eq!(characters.len(), 3);
        assert!(characters.contains(&"oda_nobunaga".to_string()));
        assert!(characters.contains(&"sakamoto_ryoma".to_string()));
        assert!(characters.contains(&"tokugawa_ieyasu".to_string()));
    }
}
