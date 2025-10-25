use std::fs;
use std::path::Path;

use crate::character::HistoricalCharacter;
use crate::error::HistoricalAiError;

/// Prompt builder for historical AI characters
pub struct PromptBuilder {
    character: HistoricalCharacter,
    template: String,
}

impl PromptBuilder {
    /// Create a new prompt builder for a specific character
    pub fn new(character_name: &str) -> Result<Self, HistoricalAiError> {
        let character = HistoricalCharacter::load(character_name)?;
        let template = Self::load_template()?;

        Ok(Self { character, template })
    }

    /// Create from an existing character
    pub fn from_character(character: HistoricalCharacter) -> Result<Self, HistoricalAiError> {
        let template = Self::load_template()?;
        Ok(Self { character, template })
    }

    /// Load the system prompt template
    fn load_template() -> Result<String, HistoricalAiError> {
        let crate_root = env!("CARGO_MANIFEST_DIR");
        let template_path = format!("{}/prompts/system_prompt_template.txt", crate_root);

        if !Path::new(&template_path).exists() {
            return Err(HistoricalAiError::TemplateError(
                "System prompt template not found".to_string(),
            ));
        }

        Ok(fs::read_to_string(template_path)?)
    }

    /// Build the system prompt with optional RAG context
    pub fn build_system_prompt(&self, rag_context: Option<&str>) -> Result<String, HistoricalAiError> {
        let mut prompt = self.template.clone();

        // Replace placeholders
        prompt = prompt.replace("{name}", &self.character.name);
        prompt = prompt.replace("{english_name}", &self.character.english_name);
        prompt = prompt.replace("{era}", &self.character.era);
        prompt = prompt.replace("{title}", &self.character.title);
        prompt = prompt.replace("{core_personality}", &self.character.format_personality());
        prompt = prompt.replace(
            "{personality_traits}",
            &self.character.format_personality(),
        );
        prompt = prompt.replace("{speaking_style}", &self.character.format_speaking_style());
        prompt = prompt.replace("{tone_examples}", &self.character.format_tone_examples());
        prompt = prompt.replace("{specialties}", &self.character.format_specialties());
        prompt = prompt.replace(
            "{historical_episodes}",
            &self.character.format_historical_episodes(),
        );
        prompt = prompt.replace(
            "{advice_approach}",
            &self.character.format_advice_approach(),
        );
        prompt = prompt.replace("{constraints}", &self.character.format_constraints());

        // Add RAG context if provided
        let rag_text = rag_context.unwrap_or("（関連する追加情報はありません）");
        prompt = prompt.replace("{rag_context}", rag_text);

        Ok(prompt)
    }

    /// Build a user prompt with query and optional context documents
    pub fn build_user_prompt(&self, query: &str, context_docs: &[String]) -> String {
        let mut prompt = String::new();

        // Add context documents if available
        if !context_docs.is_empty() {
            prompt.push_str("# 関連情報（ナレッジベースより）\n\n");
            for (i, doc) in context_docs.iter().enumerate() {
                prompt.push_str(&format!("## 参考資料 {}\n", i + 1));
                prompt.push_str(doc);
                prompt.push_str("\n\n");
            }
            prompt.push_str("---\n\n");
        }

        // Add the user's query
        prompt.push_str("# 相談内容\n\n");
        prompt.push_str(query);

        prompt
    }

    /// Build a complete prompt pair (system + user)
    pub fn build_prompt_pair(
        &self,
        query: &str,
        rag_context: Option<&str>,
        context_docs: &[String],
    ) -> Result<(String, String), HistoricalAiError> {
        let system_prompt = self.build_system_prompt(rag_context)?;
        let user_prompt = self.build_user_prompt(query, context_docs);

        Ok((system_prompt, user_prompt))
    }

    /// Get the character reference
    pub fn character(&self) -> &HistoricalCharacter {
        &self.character
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prompt_builder_creation() {
        let builder = PromptBuilder::new("oda_nobunaga");
        assert!(builder.is_ok());

        let builder = builder.unwrap();
        assert_eq!(builder.character.name, "織田信長");
    }

    #[test]
    fn test_build_system_prompt() {
        let builder = PromptBuilder::new("oda_nobunaga").unwrap();
        let prompt = builder.build_system_prompt(None);

        assert!(prompt.is_ok());
        let prompt = prompt.unwrap();

        assert!(prompt.contains("織田信長"));
        assert!(prompt.contains("Oda Nobunaga"));
        assert!(prompt.contains("戦国時代"));
        assert!(!prompt.contains("{name}"));
        assert!(!prompt.contains("{era}"));
    }

    #[test]
    fn test_build_system_prompt_with_rag() {
        let builder = PromptBuilder::new("sakamoto_ryoma").unwrap();
        let rag_context = "薩長同盟に関する詳細な歴史的背景...";
        let prompt = builder.build_system_prompt(Some(rag_context));

        assert!(prompt.is_ok());
        let prompt = prompt.unwrap();

        assert!(prompt.contains(rag_context));
    }

    #[test]
    fn test_build_user_prompt() {
        let builder = PromptBuilder::new("tokugawa_ieyasu").unwrap();
        let query = "新規事業を立ち上げるべきか、既存事業を強化すべきか迷っています。";
        let context_docs = vec![
            "江戸幕府の設立過程について...".to_string(),
            "徳川家康の経営戦略...".to_string(),
        ];

        let user_prompt = builder.build_user_prompt(query, &context_docs);

        assert!(user_prompt.contains(query));
        assert!(user_prompt.contains("参考資料"));
        assert!(user_prompt.contains("江戸幕府"));
    }

    #[test]
    fn test_build_prompt_pair() {
        let builder = PromptBuilder::new("oda_nobunaga").unwrap();
        let query = "組織改革に抵抗する古参社員にどう対処すべきでしょうか？";
        let rag_context = "織田信長の組織改革事例...";
        let context_docs = vec!["比叡山焼き討ちの歴史的背景...".to_string()];

        let result = builder.build_prompt_pair(query, Some(rag_context), &context_docs);

        assert!(result.is_ok());
        let (system_prompt, user_prompt) = result.unwrap();

        assert!(system_prompt.contains("織田信長"));
        assert!(system_prompt.contains(rag_context));
        assert!(user_prompt.contains(query));
        assert!(user_prompt.contains("比叡山"));
    }

    #[test]
    fn test_all_characters() {
        for character_name in &["oda_nobunaga", "sakamoto_ryoma", "tokugawa_ieyasu"] {
            let builder = PromptBuilder::new(character_name);
            assert!(builder.is_ok(), "Failed to create builder for {}", character_name);

            let builder = builder.unwrap();
            let prompt = builder.build_system_prompt(None);
            assert!(prompt.is_ok(), "Failed to build prompt for {}", character_name);
        }
    }
}
