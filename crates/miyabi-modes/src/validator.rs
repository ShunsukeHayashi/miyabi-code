use crate::error::{ModeError, ModeResult};
use crate::mode::MiyabiMode;

/// Validator for mode definitions
pub struct ModeValidator;

impl ModeValidator {
    /// Validate a mode definition
    pub fn validate(mode: &MiyabiMode) -> ModeResult<()> {
        Self::validate_slug(&mode.slug)?;
        Self::validate_name(&mode.name)?;
        Self::validate_character(&mode.character)?;
        Self::validate_role_definition(&mode.role_definition)?;
        Self::validate_groups(&mode.groups)?;
        Self::validate_source(&mode.source)?;

        if let Some(ref regex) = mode.file_regex {
            Self::validate_regex(regex)?;
        }

        Ok(())
    }

    fn validate_slug(slug: &str) -> ModeResult<()> {
        if slug.is_empty() {
            return Err(ModeError::MissingField("slug".into()));
        }

        // Slug must be URL-safe: lowercase alphanumeric with hyphens
        if !slug.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
            return Err(ModeError::ValidationFailed(
                "Slug must contain only lowercase letters, numbers, and hyphens".into(),
            ));
        }

        if slug.len() > 50 {
            return Err(ModeError::ValidationFailed(
                "Slug must be 50 characters or less".into(),
            ));
        }

        Ok(())
    }

    fn validate_name(name: &str) -> ModeResult<()> {
        if name.is_empty() {
            return Err(ModeError::MissingField("name".into()));
        }

        if name.len() > 100 {
            return Err(ModeError::ValidationFailed(
                "Name must be 100 characters or less".into(),
            ));
        }

        Ok(())
    }

    fn validate_character(character: &str) -> ModeResult<()> {
        if character.is_empty() {
            return Err(ModeError::MissingField("character".into()));
        }

        if character.len() > 50 {
            return Err(ModeError::ValidationFailed(
                "Character name must be 50 characters or less".into(),
            ));
        }

        Ok(())
    }

    fn validate_role_definition(role_def: &str) -> ModeResult<()> {
        if role_def.is_empty() {
            return Err(ModeError::MissingField("roleDefinition".into()));
        }

        if role_def.len() < 10 {
            return Err(ModeError::ValidationFailed(
                "Role definition too short (minimum 10 characters)".into(),
            ));
        }

        Ok(())
    }

    fn validate_groups(groups: &[crate::mode::ToolGroup]) -> ModeResult<()> {
        if groups.is_empty() {
            return Err(ModeError::ValidationFailed(
                "At least one tool group is required".into(),
            ));
        }

        Ok(())
    }

    fn validate_source(source: &str) -> ModeResult<()> {
        if source != "miyabi-core" && source != "user" {
            return Err(ModeError::ValidationFailed(
                "Source must be 'miyabi-core' or 'user'".into(),
            ));
        }

        Ok(())
    }

    fn validate_regex(pattern: &str) -> ModeResult<()> {
        regex::Regex::new(pattern)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mode::ToolGroup;

    fn create_valid_mode() -> MiyabiMode {
        MiyabiMode {
            slug: "test-mode".into(),
            name: "Test Mode".into(),
            character: "てすとん".into(),
            role_definition: "This is a test mode for validation".into(),
            when_to_use: "Use for testing".into(),
            groups: vec![ToolGroup::Read],
            custom_instructions: "Test instructions".into(),
            source: "user".into(),
            file_regex: None,
            description: None,
            system_prompt_args: None,
        }
    }

    #[test]
    fn test_valid_mode() {
        let mode = create_valid_mode();
        assert!(ModeValidator::validate(&mode).is_ok());
    }

    #[test]
    fn test_invalid_slug_uppercase() {
        let mut mode = create_valid_mode();
        mode.slug = "TestMode".into();
        assert!(ModeValidator::validate(&mode).is_err());
    }

    #[test]
    fn test_invalid_slug_special_chars() {
        let mut mode = create_valid_mode();
        mode.slug = "test_mode".into();
        assert!(ModeValidator::validate(&mode).is_err());
    }

    #[test]
    fn test_empty_slug() {
        let mut mode = create_valid_mode();
        mode.slug = "".into();
        assert!(ModeValidator::validate(&mode).is_err());
    }

    #[test]
    fn test_short_role_definition() {
        let mut mode = create_valid_mode();
        mode.role_definition = "Short".into();
        assert!(ModeValidator::validate(&mode).is_err());
    }

    #[test]
    fn test_empty_groups() {
        let mut mode = create_valid_mode();
        mode.groups = vec![];
        assert!(ModeValidator::validate(&mode).is_err());
    }

    #[test]
    fn test_invalid_source() {
        let mut mode = create_valid_mode();
        mode.source = "invalid-source".into();
        assert!(ModeValidator::validate(&mode).is_err());
    }

    #[test]
    fn test_invalid_regex() {
        let mut mode = create_valid_mode();
        mode.file_regex = Some("[invalid".into());
        assert!(ModeValidator::validate(&mode).is_err());
    }

    #[test]
    fn test_valid_regex() {
        let mut mode = create_valid_mode();
        mode.file_regex = Some(r".*\.rs$".into());
        assert!(ModeValidator::validate(&mode).is_ok());
    }
}
