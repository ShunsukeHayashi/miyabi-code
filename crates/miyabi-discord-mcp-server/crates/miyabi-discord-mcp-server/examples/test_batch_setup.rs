//! Example: Test Discord Batch Setup Functionality
//!
//! This example demonstrates how to use the new discord.batch.setup_server MCP method.
//!
//! Usage:
//! ```
//! DISCORD_BOT_TOKEN=xxx cargo run --example test_batch_setup -- \
//!   --guild-id 1234567890123456789
//! ```
//!
//! Note: This example creates a JSON-RPC request structure and validates it.
//! To actually execute the batch setup, you need the MCP server running.

use clap::Parser;
use serde_json;
use miyabi_discord_mcp_server::models::{
    BatchSetupServerRequest, BatchCategoryDef, BatchChannelDef, BatchRoleDef
};

#[derive(Parser)]
struct Args {
    /// Discord Guild ID
    #[arg(long)]
    guild_id: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    println!("🎉 Discord Batch Setup Test");
    println!("Guild ID: {}", args.guild_id);

    // Create the batch setup request matching the format from discord_community.rs
    let setup_request = BatchSetupServerRequest {
        guild_id: args.guild_id.clone(),
        categories: vec![
            BatchCategoryDef {
                name: "📢 WELCOME & RULES".to_string(),
                channels: vec![
                    BatchChannelDef {
                        name: "welcome".to_string(),
                        r#type: "text".to_string(),
                    },
                    BatchChannelDef {
                        name: "rules".to_string(),
                        r#type: "text".to_string(),
                    },
                    BatchChannelDef {
                        name: "faq".to_string(),
                        r#type: "text".to_string(),
                    },
                ],
            },
            BatchCategoryDef {
                name: "💬 GENERAL".to_string(),
                channels: vec![
                    BatchChannelDef {
                        name: "general".to_string(),
                        r#type: "text".to_string(),
                    },
                    BatchChannelDef {
                        name: "introductions".to_string(),
                        r#type: "text".to_string(),
                    },
                    BatchChannelDef {
                        name: "off-topic".to_string(),
                        r#type: "text".to_string(),
                    },
                    BatchChannelDef {
                        name: "voice-chat".to_string(),
                        r#type: "voice".to_string(),
                    },
                ],
            },
            BatchCategoryDef {
                name: "🔧 CODING AGENTS".to_string(),
                channels: vec![
                    BatchChannelDef {
                        name: "coding-general".to_string(),
                        r#type: "text".to_string(),
                    },
                    BatchChannelDef {
                        name: "code-review".to_string(),
                        r#type: "text".to_string(),
                    },
                    BatchChannelDef {
                        name: "agent-showcase".to_string(),
                        r#type: "forum".to_string(),
                    },
                ],
            },
            BatchCategoryDef {
                name: "💼 BUSINESS AGENTS".to_string(),
                channels: vec![
                    BatchChannelDef {
                        name: "business-general".to_string(),
                        r#type: "text".to_string(),
                    },
                    BatchChannelDef {
                        name: "market-research".to_string(),
                        r#type: "text".to_string(),
                    },
                    BatchChannelDef {
                        name: "strategy-discussion".to_string(),
                        r#type: "text".to_string(),
                    },
                ],
            },
            BatchCategoryDef {
                name: "🆘 SUPPORT".to_string(),
                channels: vec![
                    BatchChannelDef {
                        name: "help-general".to_string(),
                        r#type: "text".to_string(),
                    },
                    BatchChannelDef {
                        name: "bug-reports".to_string(),
                        r#type: "forum".to_string(),
                    },
                    BatchChannelDef {
                        name: "feature-requests".to_string(),
                        r#type: "forum".to_string(),
                    },
                ],
            },
            BatchCategoryDef {
                name: "🛠️ DEVELOPMENT".to_string(),
                channels: vec![
                    BatchChannelDef {
                        name: "dev-announcements".to_string(),
                        r#type: "text".to_string(),
                    },
                    BatchChannelDef {
                        name: "github-notifications".to_string(),
                        r#type: "text".to_string(),
                    },
                    BatchChannelDef {
                        name: "dev-voice".to_string(),
                        r#type: "voice".to_string(),
                    },
                ],
            },
        ],
        roles: vec![
            BatchRoleDef {
                name: "Admin".to_string(),
                color: Some(15158332),
                permissions: Some(8),
            },
            BatchRoleDef {
                name: "Moderator".to_string(),
                color: Some(15105570),
                permissions: Some(1099511627775),
            },
            BatchRoleDef {
                name: "Core Contributor".to_string(),
                color: Some(10181046),
                permissions: None,
            },
            BatchRoleDef {
                name: "Contributor".to_string(),
                color: Some(3447003),
                permissions: None,
            },
            BatchRoleDef {
                name: "Active Member".to_string(),
                color: Some(3066993),
                permissions: None,
            },
            BatchRoleDef {
                name: "Member".to_string(),
                color: Some(9807270),
                permissions: None,
            },
        ],
    };

    // Display the setup summary
    println!("\n📋 Batch Setup Request Summary:");
    println!("  • Categories: {}", setup_request.categories.len());

    let total_channels: usize = setup_request.categories.iter()
        .map(|cat| cat.channels.len())
        .sum();
    println!("  • Channels: {}", total_channels);
    println!("  • Roles: {}", setup_request.roles.len());

    // Show detailed breakdown
    println!("\n📂 Categories & Channels:");
    for category in &setup_request.categories {
        println!("  {} ({} channels)", category.name, category.channels.len());
        for channel in &category.channels {
            println!("    • {} ({})", channel.name, channel.r#type);
        }
    }

    println!("\n🎭 Roles:");
    for role in &setup_request.roles {
        let color_str = role.color.map_or("default".to_string(), |c| format!("#{:06X}", c));
        let perms_str = role.permissions.map_or("default".to_string(), |p| p.to_string());
        println!("  • {} (color: {}, permissions: {})", role.name, color_str, perms_str);
    }

    // Serialize the request to JSON for inspection
    let json_request = serde_json::to_string_pretty(&setup_request)?;

    println!("\n📄 JSON-RPC Request Structure (truncated):");
    let lines: Vec<&str> = json_request.lines().take(20).collect();
    for line in lines {
        println!("{}", line);
    }
    if json_request.lines().count() > 20 {
        println!("... (truncated)");
    }

    println!("\n✅ Batch setup request structure is valid!");

    // Create JSON-RPC call format
    let json_rpc_call = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "discord.batch.setup_server",
        "params": setup_request,
        "id": 1
    });

    println!("\n🔌 JSON-RPC Method Call:");
    println!("Method: discord.batch.setup_server");
    println!("Parameters: {} bytes", json_rpc_call.to_string().len());

    println!("\n💡 To actually execute this batch setup:");
    println!("1. Start the Discord MCP server");
    println!("2. Send this JSON-RPC call to the server");
    println!("3. Make sure DISCORD_BOT_TOKEN is set with proper permissions");

    println!("\n🎊 Test completed successfully!");

    Ok(())
}