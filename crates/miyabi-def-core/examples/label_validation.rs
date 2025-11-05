//! Label validation example
//!
//! Run with: cargo run --example label_validation

use miyabi_def_core::MiyabiDef;

fn main() -> anyhow::Result<()> {
    println!("🏷️  Miyabi Label Validation Example\n");

    // Load definitions
    let def = MiyabiDef::load_default()?;

    // Test labels (mix of valid and invalid)
    let test_labels = vec![
        "state:pending",
        "state:analyzing",
        "P0-Critical",
        "P1-High",
        "agent:coordinator",
        "invalid-label", // Invalid
        "feature",
        "bug",
        "random-label", // Invalid
    ];

    println!("📝 Validating {} labels...\n", test_labels.len());

    let mut valid_count = 0;
    let mut invalid_labels = Vec::new();

    for label_name in &test_labels {
        if let Some(label_def) = def.label(label_name) {
            valid_count += 1;
            let emoji = label_def.emoji.as_deref().unwrap_or("");
            let color = label_def.color.as_deref().unwrap_or("N/A");
            let category = label_def.category.as_deref().unwrap_or("N/A");

            println!("✅ {} {}", emoji, label_name);
            println!("   Category: {}", category);
            println!("   Color: {}", color);
            println!("   Description: {}", label_def.description);
            println!();
        } else {
            invalid_labels.push(label_name);
            println!("❌ {} - NOT FOUND", label_name);
            println!();
        }
    }

    // Summary
    println!("─────────────────────────────────");
    println!("📊 Summary:");
    println!("   Valid: {}/{}", valid_count, test_labels.len());
    println!("   Invalid: {}/{}", invalid_labels.len(), test_labels.len());

    if !invalid_labels.is_empty() {
        println!("\n⚠️  Invalid labels:");
        for label in invalid_labels {
            println!("   - {}", label);
        }
    }

    // Display available label categories
    println!("\n📚 Available Label Categories:");
    let mut categories: std::collections::HashSet<String> = std::collections::HashSet::new();
    for label in def.labels().values() {
        if let Some(category) = &label.category {
            categories.insert(category.clone());
        }
    }
    let mut categories: Vec<_> = categories.into_iter().collect();
    categories.sort();
    for category in categories {
        let count = def
            .labels()
            .values()
            .filter(|l| l.category.as_deref() == Some(&category))
            .count();
        println!("   {} ({} labels)", category, count);
    }

    Ok(())
}
