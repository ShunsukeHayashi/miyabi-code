//! Plugin system example
//!
//! This example demonstrates how to create and use plugins with the Miyabi plugin system.
//!
//! Run this example with:
//! ```bash
//! cargo run --example plugin_example
//! ```

use anyhow::Result;
use miyabi_core::plugin::{Plugin, PluginContext, PluginManager, PluginMetadata, PluginResult};
use serde_json::json;
use std::collections::HashMap;

/// A simple logging plugin
struct LoggerPlugin {
    log_count: std::sync::atomic::AtomicUsize,
}

impl LoggerPlugin {
    fn new() -> Self {
        Self {
            log_count: std::sync::atomic::AtomicUsize::new(0),
        }
    }
}

impl Plugin for LoggerPlugin {
    fn metadata(&self) -> PluginMetadata {
        PluginMetadata {
            name: "logger".to_string(),
            version: "1.0.0".to_string(),
            description: Some("Simple logging plugin".to_string()),
            author: Some("Miyabi Team".to_string()),
        }
    }

    fn init(&mut self) -> Result<()> {
        println!("🔌 Logger plugin initialized");
        Ok(())
    }

    fn execute(&self, context: &PluginContext) -> Result<PluginResult> {
        let count = self.log_count.fetch_add(1, std::sync::atomic::Ordering::SeqCst);

        let message =
            context.params.get("message").and_then(|v| v.as_str()).unwrap_or("No message");

        println!("📝 [Log #{}] {}", count + 1, message);

        Ok(PluginResult {
            success: true,
            message: Some(format!("Logged message #{}", count + 1)),
            data: Some(json!({
                "count": count + 1,
                "message": message
            })),
        })
    }

    fn shutdown(&mut self) -> Result<()> {
        let count = self.log_count.load(std::sync::atomic::Ordering::SeqCst);
        println!("🔌 Logger plugin shutting down (logged {} messages)", count);
        Ok(())
    }
}

/// A calculator plugin
struct CalculatorPlugin;

impl Plugin for CalculatorPlugin {
    fn metadata(&self) -> PluginMetadata {
        PluginMetadata {
            name: "calculator".to_string(),
            version: "1.0.0".to_string(),
            description: Some("Simple calculator plugin".to_string()),
            author: Some("Miyabi Team".to_string()),
        }
    }

    fn init(&mut self) -> Result<()> {
        println!("🔌 Calculator plugin initialized");
        Ok(())
    }

    fn execute(&self, context: &PluginContext) -> Result<PluginResult> {
        let a = context.params.get("a").and_then(|v| v.as_f64()).unwrap_or(0.0);

        let b = context.params.get("b").and_then(|v| v.as_f64()).unwrap_or(0.0);

        let operation = context.params.get("operation").and_then(|v| v.as_str()).unwrap_or("add");

        let result = match operation {
            "add" => a + b,
            "subtract" => a - b,
            "multiply" => a * b,
            "divide" => {
                if b == 0.0 {
                    return Ok(PluginResult {
                        success: false,
                        message: Some("Division by zero".to_string()),
                        data: None,
                    });
                }
                a / b
            },
            _ => {
                return Ok(PluginResult {
                    success: false,
                    message: Some(format!("Unknown operation: {}", operation)),
                    data: None,
                })
            },
        };

        println!("🧮 {} {} {} = {}", a, operation, b, result);

        Ok(PluginResult {
            success: true,
            message: Some(format!("{} {} {} = {}", a, operation, b, result)),
            data: Some(json!({
                "a": a,
                "b": b,
                "operation": operation,
                "result": result
            })),
        })
    }
}

fn main() -> Result<()> {
    println!("🚀 Miyabi Plugin System Example\n");

    // Create plugin manager
    let manager = PluginManager::new();

    // Register plugins
    println!("📦 Registering plugins...");
    manager.register(Box::new(LoggerPlugin::new()))?;
    manager.register(Box::new(CalculatorPlugin))?;

    // List registered plugins
    println!("\n📋 Registered plugins:");
    for metadata in manager.list_plugins() {
        println!(
            "  - {} v{} - {}",
            metadata.name,
            metadata.version,
            metadata.description.unwrap_or_default()
        );
    }

    // Execute logger plugin
    println!("\n🔄 Executing logger plugin...");
    for i in 1..=3 {
        let mut params = HashMap::new();
        params.insert("message".to_string(), json!(format!("Test message {}", i)));

        let context = PluginContext {
            params,
            ..Default::default()
        };

        let result = manager.execute("logger", &context)?;
        println!("  Result: {}", result.message.unwrap_or_default());
    }

    // Execute calculator plugin
    println!("\n🔄 Executing calculator plugin...");
    let operations = vec![
        ("add", 10.0, 5.0),
        ("subtract", 10.0, 5.0),
        ("multiply", 10.0, 5.0),
        ("divide", 10.0, 2.0),
    ];

    for (op, a, b) in operations {
        let mut params = HashMap::new();
        params.insert("operation".to_string(), json!(op));
        params.insert("a".to_string(), json!(a));
        params.insert("b".to_string(), json!(b));

        let context = PluginContext {
            params,
            ..Default::default()
        };

        let result = manager.execute("calculator", &context)?;
        println!("  Result: {}", result.message.unwrap_or_default());
    }

    // Test error handling
    println!("\n🔄 Testing error handling...");
    let mut params = HashMap::new();
    params.insert("operation".to_string(), json!("divide"));
    params.insert("a".to_string(), json!(10.0));
    params.insert("b".to_string(), json!(0.0));

    let context = PluginContext {
        params,
        ..Default::default()
    };

    let result = manager.execute("calculator", &context)?;
    if result.success {
        println!("  Success: {}", result.message.unwrap_or_default());
    } else {
        println!("  Error: {}", result.message.unwrap_or_default());
    }

    // Unregister plugins
    println!("\n📦 Unregistering plugins...");
    manager.unregister("logger")?;
    manager.unregister("calculator")?;

    println!("\n✅ Example completed successfully!");

    Ok(())
}
