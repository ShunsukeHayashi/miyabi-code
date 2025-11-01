//! SWML Space Definitions
//!
//! Re-exports and convenience types for the three mathematical spaces:
//! - Intent Space (I)
//! - World Space (W)
//! - Result Space (R)

// Re-export all SWML types from miyabi-types
pub use miyabi_types::swml::*;

/// Type alias for Intent Space (I)
pub type IntentSpace = Intent;

/// Type alias for World Space (W)
pub type WorldSpace = World;

/// Type alias for Result Space (R)
pub type ResultSpace = SWMLResult;

/// Helper trait for SWML space validation
pub trait SWMLSpace {
    /// Validate the space element
    fn validate(&self) -> Result<(), miyabi_types::MiyabiError>;
}

impl SWMLSpace for Intent {
    fn validate(&self) -> Result<(), miyabi_types::MiyabiError> {
        self.validate()
    }
}

impl SWMLSpace for World {
    fn validate(&self) -> Result<(), miyabi_types::MiyabiError> {
        self.validate()
    }
}

impl SWMLSpace for SWMLResult {
    fn validate(&self) -> Result<(), miyabi_types::MiyabiError> {
        self.validate()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_intent_space_alias() {
        let intent: IntentSpace = Intent::from_description("Test");
        assert_eq!(intent.description, "Test");
    }

    #[test]
    fn test_world_space_alias() {
        let world: WorldSpace = World::current().unwrap();
        assert!(world.validate().is_ok());
    }

    #[test]
    fn test_result_space_alias() {
        let result: ResultSpace = SWMLResult::new(Output::empty(), 0.85);
        assert!(result.validate().is_ok());
    }

    #[test]
    fn test_swml_space_trait() {
        let intent = Intent::from_description("Test");
        assert!(intent.validate().is_ok());

        let world = World::current().unwrap();
        assert!(world.validate().is_ok());

        let result = SWMLResult::new(Output::empty(), 0.85);
        assert!(result.validate().is_ok());
    }
}
