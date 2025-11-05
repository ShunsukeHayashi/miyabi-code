//! Tool definitions for Function Calling

use serde::{Deserialize, Serialize};

/// Tool definition for LLM Function Calling
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

/// Tool call from LLM
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: serde_json::Value,
}

impl ToolDefinition {
    /// Create a new tool definition
    pub fn new(name: impl Into<String>, description: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            description: description.into(),
            parameters: serde_json::json!({
                "type": "object",
                "properties": {},
                "required": []
            }),
        }
    }

    /// Set parameters for the tool
    pub fn with_parameters(mut self, parameters: serde_json::Value) -> Self {
        self.parameters = parameters;
        self
    }

    /// Add a parameter to the tool
    pub fn with_parameter(
        mut self,
        name: impl Into<String>,
        param_type: impl Into<String>,
        description: impl Into<String>,
        required: bool,
    ) -> Self {
        let name = name.into();
        let param_type = param_type.into();
        let description = description.into();

        // Add to properties
        if let Some(properties) = self.parameters.get_mut("properties") {
            properties[&name] = serde_json::json!({
                "type": param_type,
                "description": description
            });
        }

        // Add to required array if needed
        if required {
            if let Some(required_arr) = self.parameters.get_mut("required") {
                if let Some(arr) = required_arr.as_array_mut() {
                    arr.push(serde_json::json!(name));
                }
            }
        }

        self
    }
}

impl ToolCall {
    /// Create a new tool call
    pub fn new(
        id: impl Into<String>,
        name: impl Into<String>,
        arguments: serde_json::Value,
    ) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            arguments,
        }
    }

    /// Parse arguments as a specific type
    pub fn parse_arguments<T: for<'de> Deserialize<'de>>(&self) -> serde_json::Result<T> {
        serde_json::from_value(self.arguments.clone())
    }
}
