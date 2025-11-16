//! Demo example showing mode system usage

use miyabi_modes::{ModeLoader, ModeRegistry};
use std::env;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let current_dir = env::current_dir()?;
    let loader = ModeLoader::new(&current_dir);
    let registry = ModeRegistry::new();

    println!("📋 Loading modes from {:?}\n", loader.modes_dir());

    match loader.load_all() {
        Ok(modes) => {
            println!("✅ Loaded {} modes", modes.len());
            registry.register_all(modes)?;
        },
        Err(e) => {
            eprintln!("❌ Failed to load modes: {}", e);
            return Ok(());
        },
    }

    println!("\n🎯 Registered Modes:\n");

    for mode in registry.list() {
        println!("  {} {} ({})", mode.name, mode.slug, mode.character);
    }

    println!("\n🔍 Mode Details:\n");

    if let Some(codegen) = registry.get("codegen") {
        println!("Mode: {}", codegen.name);
        println!("Character: {}", codegen.character);
        println!("Source: {}", codegen.source);
        println!("Tools: {:?}", codegen.groups);
        println!("\nDescription:\n{}\n", codegen.short_description());
    }

    Ok(())
}
