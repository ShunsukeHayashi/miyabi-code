//! Conditional branching for workflows

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Conditions for workflow branching
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Condition {
    /// Always evaluates to true (default/fallback branch)
    Always,

    /// Check if a field equals a specific value
    FieldEquals { field: String, value: Value },

    /// Check if a numeric field is greater than a value
    FieldGreaterThan { field: String, value: f64 },

    /// Check if a numeric field is less than a value
    FieldLessThan { field: String, value: f64 },

    /// Check if a field exists
    FieldExists { field: String },

    /// Logical AND of multiple conditions
    And(Vec<Condition>),

    /// Logical OR of multiple conditions
    Or(Vec<Condition>),

    /// Logical NOT
    Not(Box<Condition>),
}

impl Condition {
    /// Evaluate condition against a JSON context
    pub fn evaluate(&self, context: &Value) -> bool {
        match self {
            Condition::Always => true,

            Condition::FieldEquals { field, value } => {
                Self::get_field(context, field).map(|v| v == value).unwrap_or(false)
            }

            Condition::FieldGreaterThan { field, value } => Self::get_field(context, field)
                .and_then(|v| v.as_f64())
                .map(|v| v > *value)
                .unwrap_or(false),

            Condition::FieldLessThan { field, value } => Self::get_field(context, field)
                .and_then(|v| v.as_f64())
                .map(|v| v < *value)
                .unwrap_or(false),

            Condition::FieldExists { field } => Self::get_field(context, field).is_some(),

            Condition::And(conditions) => conditions.iter().all(|c| c.evaluate(context)),

            Condition::Or(conditions) => conditions.iter().any(|c| c.evaluate(context)),

            Condition::Not(condition) => !condition.evaluate(context),
        }
    }

    /// Get field from JSON context (supports nested fields with dot notation)
    fn get_field<'a>(context: &'a Value, field: &str) -> Option<&'a Value> {
        if field.contains('.') {
            // Handle nested fields: "result.status"
            let parts: Vec<&str> = field.split('.').collect();
            let mut current = context;

            for part in parts {
                current = current.get(part)?;
            }

            Some(current)
        } else {
            context.get(field)
        }
    }

    /// Create a condition that checks if a field equals true
    pub fn success(field: &str) -> Self {
        Condition::FieldEquals { field: field.to_string(), value: Value::Bool(true) }
    }

    /// Create a condition that checks if a field equals false
    pub fn failure(field: &str) -> Self {
        Condition::FieldEquals { field: field.to_string(), value: Value::Bool(false) }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_always_condition() {
        let cond = Condition::Always;
        let context = json!({});

        assert!(cond.evaluate(&context));
    }

    #[test]
    fn test_field_equals() {
        let cond = Condition::FieldEquals { field: "status".to_string(), value: json!("passed") };

        let context_pass = json!({ "status": "passed" });
        let context_fail = json!({ "status": "failed" });

        assert!(cond.evaluate(&context_pass));
        assert!(!cond.evaluate(&context_fail));
    }

    #[test]
    fn test_field_greater_than() {
        let cond = Condition::FieldGreaterThan { field: "score".to_string(), value: 0.8 };

        let context_high = json!({ "score": 0.95 });
        let context_low = json!({ "score": 0.5 });

        assert!(cond.evaluate(&context_high));
        assert!(!cond.evaluate(&context_low));
    }

    #[test]
    fn test_field_less_than() {
        let cond = Condition::FieldLessThan { field: "errors".to_string(), value: 5.0 };

        let context_few = json!({ "errors": 2.0 });
        let context_many = json!({ "errors": 10.0 });

        assert!(cond.evaluate(&context_few));
        assert!(!cond.evaluate(&context_many));
    }

    #[test]
    fn test_field_exists() {
        let cond = Condition::FieldExists { field: "result".to_string() };

        let context_exists = json!({ "result": "data" });
        let context_missing = json!({ "other": "data" });

        assert!(cond.evaluate(&context_exists));
        assert!(!cond.evaluate(&context_missing));
    }

    #[test]
    fn test_nested_field() {
        let cond = Condition::FieldEquals { field: "result.status".to_string(), value: json!("success") };

        let context = json!({
            "result": {
                "status": "success",
                "code": 200
            }
        });

        assert!(cond.evaluate(&context));
    }

    #[test]
    fn test_and_condition() {
        let cond = Condition::And(vec![
            Condition::FieldEquals { field: "status".to_string(), value: json!("passed") },
            Condition::FieldGreaterThan { field: "score".to_string(), value: 0.8 },
        ]);

        let context_both = json!({ "status": "passed", "score": 0.9 });
        let context_one = json!({ "status": "passed", "score": 0.5 });

        assert!(cond.evaluate(&context_both));
        assert!(!cond.evaluate(&context_one));
    }

    #[test]
    fn test_or_condition() {
        let cond = Condition::Or(vec![
            Condition::FieldEquals { field: "status".to_string(), value: json!("passed") },
            Condition::FieldEquals { field: "status".to_string(), value: json!("warning") },
        ]);

        let context_pass = json!({ "status": "passed" });
        let context_warn = json!({ "status": "warning" });
        let context_fail = json!({ "status": "failed" });

        assert!(cond.evaluate(&context_pass));
        assert!(cond.evaluate(&context_warn));
        assert!(!cond.evaluate(&context_fail));
    }

    #[test]
    fn test_not_condition() {
        let cond = Condition::Not(Box::new(Condition::FieldEquals { field: "failed".to_string(), value: json!(true) }));

        let context_ok = json!({ "failed": false });
        let context_failed = json!({ "failed": true });

        assert!(cond.evaluate(&context_ok));
        assert!(!cond.evaluate(&context_failed));
    }

    #[test]
    fn test_success_helper() {
        let cond = Condition::success("passed");
        let context = json!({ "passed": true });

        assert!(cond.evaluate(&context));
    }

    #[test]
    fn test_failure_helper() {
        let cond = Condition::failure("passed");
        let context = json!({ "passed": false });

        assert!(cond.evaluate(&context));
    }
}
