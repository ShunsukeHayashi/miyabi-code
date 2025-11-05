//! Conditional branching logic for workflow execution
//!
//! Provides condition evaluation for dynamic workflow path selection based on
//! step results and context data.

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::warn;

const MAX_EXPRESSION_OPERATIONS: u64 = 25_000;
const MAX_EXPRESSION_CALL_DEPTH: usize = 32;

/// Condition types for workflow branching
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Condition {
    /// Always evaluates to true (default/fallback branch)
    Always,

    /// Check if a field equals a specific value
    FieldEquals { field: String, value: Value },

    /// Check if a numeric field is greater than a threshold
    FieldGreaterThan { field: String, value: f64 },

    /// Check if a numeric field is less than a threshold
    FieldLessThan { field: String, value: f64 },

    /// Check if a field exists in the context
    FieldExists { field: String },

    /// Evaluate a custom expression against the context
    Expression { expr: String },

    /// Multiple conditions (all must be true)
    And(Vec<Condition>),

    /// Multiple conditions (at least one must be true)
    Or(Vec<Condition>),

    /// Negate a condition
    Not(Box<Condition>),
}

impl Condition {
    /// Evaluate the condition against a JSON context
    ///
    /// # Arguments
    ///
    /// * `context` - JSON value containing step results and data
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_workflow::condition::Condition;
    /// use serde_json::json;
    ///
    /// let cond = Condition::FieldEquals {
    ///     field: "status".to_string(),
    ///     value: json!("success"),
    /// };
    ///
    /// let context = json!({ "status": "success" });
    /// assert!(cond.evaluate(&context));
    /// ```
    pub fn evaluate(&self, context: &Value) -> bool {
        match self {
            Condition::Always => true,

            Condition::FieldEquals { field, value } => Self::get_field_value(context, field)
                .map(|v| v == value)
                .unwrap_or(false),

            Condition::FieldGreaterThan { field, value } => Self::get_field_value(context, field)
                .and_then(|v| v.as_f64())
                .map(|v| v > *value)
                .unwrap_or(false),

            Condition::FieldLessThan { field, value } => Self::get_field_value(context, field)
                .and_then(|v| v.as_f64())
                .map(|v| v < *value)
                .unwrap_or(false),

            Condition::FieldExists { field } => Self::get_field_value(context, field).is_some(),

            Condition::Expression { expr } => evaluate_expression(expr, context),

            Condition::And(conditions) => conditions.iter().all(|c| c.evaluate(context)),

            Condition::Or(conditions) => conditions.iter().any(|c| c.evaluate(context)),

            Condition::Not(condition) => !condition.evaluate(context),
        }
    }

    /// Get a field value from context, supporting nested paths with dot notation
    ///
    /// # Examples
    ///
    /// ```
    /// use miyabi_workflow::condition::Condition;
    /// use serde_json::json;
    ///
    /// let context = json!({
    ///     "result": {
    ///         "success": true,
    ///         "score": 95
    ///     }
    /// });
    ///
    /// let value = Condition::get_field_value(&context, "result.success");
    /// assert_eq!(value, Some(&json!(true)));
    /// ```
    pub fn get_field_value<'a>(context: &'a Value, field: &str) -> Option<&'a Value> {
        let parts: Vec<&str> = field.split('.').collect();
        let mut current = context;

        for part in parts {
            current = current.get(part)?;
        }

        Some(current)
    }

    /// Convenience helper for boolean success conditions (field == true)
    pub fn success(field: impl Into<String>) -> Condition {
        Condition::FieldEquals {
            field: field.into(),
            value: json!(true),
        }
    }

    /// Convenience helper for boolean failure conditions (field == false)
    pub fn failure(field: impl Into<String>) -> Condition {
        Condition::FieldEquals {
            field: field.into(),
            value: json!(false),
        }
    }
}

fn evaluate_expression(expr: &str, context: &Value) -> bool {
    use rhai::{Engine, Scope};

    if expr.trim().is_empty() {
        return false;
    }

    let mut engine = Engine::new();
    engine.set_max_operations(MAX_EXPRESSION_OPERATIONS);
    engine.set_max_call_levels(MAX_EXPRESSION_CALL_DEPTH);

    let mut scope = Scope::new();
    inject_scope(&mut scope, context);

    match engine.eval_with_scope::<bool>(&mut scope, expr) {
        Ok(result) => result,
        Err(err) => {
            warn!(target: "miyabi_workflow::condition", "Failed to evaluate expression '{}': {}", expr, err);
            false
        }
    }
}

fn inject_scope(scope: &mut rhai::Scope<'_>, context: &Value) {
    scope.push_dynamic("context", json_to_dynamic(context));

    if let Some(obj) = context.as_object() {
        for (key, value) in obj {
            scope.push_dynamic(key.as_str(), json_to_dynamic(value));
        }
    }
}

fn json_to_dynamic(value: &Value) -> rhai::Dynamic {
    use rhai::{Array, Dynamic, Map};

    match value {
        Value::Null => Dynamic::UNIT,
        Value::Bool(b) => Dynamic::from_bool(*b),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Dynamic::from_int(i)
            } else if let Some(u) = n.as_u64() {
                Dynamic::from_int(u as i64)
            } else if let Some(f) = n.as_f64() {
                Dynamic::from_float(f)
            } else {
                Dynamic::UNIT
            }
        }
        Value::String(s) => Dynamic::from(s.clone()),
        Value::Array(items) => {
            let array: Array = items.iter().map(json_to_dynamic).collect();
            Dynamic::from_array(array)
        }
        Value::Object(obj) => {
            let mut map = Map::new();
            for (k, v) in obj {
                map.insert(k.into(), json_to_dynamic(v));
            }
            Dynamic::from_map(map)
        }
    }
}

/// Conditional branch specification
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ConditionalBranch {
    /// Branch name (for debugging/logging)
    pub name: String,
    /// Condition to evaluate
    pub condition: Condition,
    /// Next step ID to execute if condition is true
    pub next_step: String,
}

impl ConditionalBranch {
    /// Create a new conditional branch
    pub fn new(
        name: impl Into<String>,
        condition: Condition,
        next_step: impl Into<String>,
    ) -> Self {
        Self {
            name: name.into(),
            condition,
            next_step: next_step.into(),
        }
    }

    /// Evaluate this branch's condition
    pub fn evaluate(&self, context: &Value) -> bool {
        self.condition.evaluate(context)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_condition_always() {
        let cond = Condition::Always;
        let context = json!({});
        assert!(cond.evaluate(&context));
    }

    #[test]
    fn test_field_equals() {
        let cond = Condition::FieldEquals {
            field: "status".to_string(),
            value: json!("success"),
        };

        let context_match = json!({ "status": "success" });
        assert!(cond.evaluate(&context_match));

        let context_no_match = json!({ "status": "failed" });
        assert!(!cond.evaluate(&context_no_match));
    }

    #[test]
    fn test_field_greater_than() {
        let cond = Condition::FieldGreaterThan {
            field: "score".to_string(),
            value: 80.0,
        };

        let context_gt = json!({ "score": 95 });
        assert!(cond.evaluate(&context_gt));

        let context_lt = json!({ "score": 75 });
        assert!(!cond.evaluate(&context_lt));
    }

    #[test]
    fn test_field_less_than() {
        let cond = Condition::FieldLessThan {
            field: "score".to_string(),
            value: 50.0,
        };

        let context_lt = json!({ "score": 30 });
        assert!(cond.evaluate(&context_lt));

        let context_gt = json!({ "score": 60 });
        assert!(!cond.evaluate(&context_gt));
    }

    #[test]
    fn test_field_exists() {
        let cond = Condition::FieldExists {
            field: "result".to_string(),
        };

        let context_exists = json!({ "result": null });
        assert!(cond.evaluate(&context_exists));

        let context_missing = json!({});
        assert!(!cond.evaluate(&context_missing));
    }

    #[test]
    fn test_and_condition() {
        let cond = Condition::And(vec![
            Condition::FieldEquals {
                field: "status".to_string(),
                value: json!("success"),
            },
            Condition::FieldGreaterThan {
                field: "score".to_string(),
                value: 80.0,
            },
        ]);

        let context_both_true = json!({ "status": "success", "score": 95 });
        assert!(cond.evaluate(&context_both_true));

        let context_one_false = json!({ "status": "success", "score": 75 });
        assert!(!cond.evaluate(&context_one_false));
    }

    #[test]
    fn test_or_condition() {
        let cond = Condition::Or(vec![
            Condition::FieldEquals {
                field: "status".to_string(),
                value: json!("success"),
            },
            Condition::FieldEquals {
                field: "status".to_string(),
                value: json!("warning"),
            },
        ]);

        let context_first = json!({ "status": "success" });
        assert!(cond.evaluate(&context_first));

        let context_second = json!({ "status": "warning" });
        assert!(cond.evaluate(&context_second));

        let context_neither = json!({ "status": "failed" });
        assert!(!cond.evaluate(&context_neither));
    }

    #[test]
    fn test_not_condition() {
        let cond = Condition::Not(Box::new(Condition::FieldEquals {
            field: "failed".to_string(),
            value: json!(true),
        }));

        let context_false = json!({ "failed": false });
        assert!(cond.evaluate(&context_false));

        let context_true = json!({ "failed": true });
        assert!(!cond.evaluate(&context_true));
    }

    #[test]
    fn test_nested_field_access() {
        let context = json!({
            "result": {
                "data": {
                    "score": 95
                }
            }
        });

        let value = Condition::get_field_value(&context, "result.data.score");
        assert_eq!(value, Some(&json!(95)));
    }

    #[test]
    fn test_conditional_branch() {
        let branch = ConditionalBranch::new(
            "success-path",
            Condition::FieldEquals {
                field: "success".to_string(),
                value: json!(true),
            },
            "deploy-step",
        );

        let context = json!({ "success": true });
        assert!(branch.evaluate(&context));
        assert_eq!(branch.next_step, "deploy-step");
    }

    #[test]
    fn test_complex_condition() {
        let cond = Condition::And(vec![
            Condition::FieldEquals {
                field: "status".to_string(),
                value: json!("completed"),
            },
            Condition::Or(vec![
                Condition::FieldGreaterThan {
                    field: "quality".to_string(),
                    value: 0.9,
                },
                Condition::FieldExists {
                    field: "manual_approval".to_string(),
                },
            ]),
        ]);

        // High quality, no manual approval
        let context1 = json!({
            "status": "completed",
            "quality": 0.95
        });
        assert!(cond.evaluate(&context1));

        // Low quality, but manual approval exists
        let context2 = json!({
            "status": "completed",
            "quality": 0.7,
            "manual_approval": true
        });
        assert!(cond.evaluate(&context2));

        // Wrong status
        let context3 = json!({
            "status": "pending",
            "quality": 0.95
        });
        assert!(!cond.evaluate(&context3));
    }

    #[test]
    fn test_expression_condition_basic() {
        let cond = Condition::Expression {
            expr: "success && data.score > 0.85".to_string(),
        };

        let passing_context = json!({
            "success": true,
            "data": { "score": 0.9 }
        });
        assert!(cond.evaluate(&passing_context));

        let failing_context = json!({
            "success": true,
            "data": { "score": 0.5 }
        });
        assert!(!cond.evaluate(&failing_context));
    }

    #[test]
    fn test_expression_condition_invalid() {
        let cond = Condition::Expression {
            expr: "unknown_value > 5".to_string(),
        };

        let context = json!({ "value": 10 });
        assert!(!cond.evaluate(&context));
    }
}
