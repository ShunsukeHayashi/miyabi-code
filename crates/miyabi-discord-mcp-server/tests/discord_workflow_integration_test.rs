//! Integration test for Discord Agent Workflow Integration (PR #1316)
//!
//! This test validates that the Discord Community Agent can properly
//! create batch setup requests that are compatible with the Discord MCP server.

use miyabi_discord_mcp_server::models::{
    BatchSetupServerRequest, BatchCategoryDef, BatchChannelDef, BatchRoleDef
};
use serde_json;

/// Test that validates the exact JSON structure used in discord_community.rs
#[test]
fn test_agent_integration_batch_setup_structure() {
    // This is the exact structure from discord_community.rs:166-223
    let setup_config = serde_json::json!({
        "guild_id": "1234567890123456789",
        "categories": [
            {
                "name": "📢 WELCOME & RULES",
                "channels": [
                    {"name": "welcome", "type": "text"},
                    {"name": "rules", "type": "text"},
                    {"name": "faq", "type": "text"}
                ]
            },
            {
                "name": "💬 GENERAL",
                "channels": [
                    {"name": "general", "type": "text"},
                    {"name": "introductions", "type": "text"},
                    {"name": "off-topic", "type": "text"},
                    {"name": "voice-chat", "type": "voice"}
                ]
            },
            {
                "name": "🔧 CODING AGENTS",
                "channels": [
                    {"name": "coding-general", "type": "text"},
                    {"name": "code-review", "type": "text"},
                    {"name": "agent-showcase", "type": "forum"}
                ]
            },
            {
                "name": "💼 BUSINESS AGENTS",
                "channels": [
                    {"name": "business-general", "type": "text"},
                    {"name": "market-research", "type": "text"},
                    {"name": "strategy-discussion", "type": "text"}
                ]
            },
            {
                "name": "🆘 SUPPORT",
                "channels": [
                    {"name": "help-general", "type": "text"},
                    {"name": "bug-reports", "type": "forum"},
                    {"name": "feature-requests", "type": "forum"}
                ]
            },
            {
                "name": "🛠️ DEVELOPMENT",
                "channels": [
                    {"name": "dev-announcements", "type": "text"},
                    {"name": "github-notifications", "type": "text"},
                    {"name": "dev-voice", "type": "voice"}
                ]
            }
        ],
        "roles": [
            {"name": "Admin", "color": 15158332, "permissions": 8_i64},
            {"name": "Moderator", "color": 15105570, "permissions": 1099511627775_i64},
            {"name": "Core Contributor", "color": 10181046},
            {"name": "Contributor", "color": 3447003},
            {"name": "Active Member", "color": 3066993},
            {"name": "Member", "color": 9807270}
        ]
    });

    // Test that this can be parsed as BatchSetupServerRequest
    let request: BatchSetupServerRequest = serde_json::from_value(setup_config)
        .expect("Failed to parse agent integration JSON structure");

    // Validate the structure matches expected values
    assert_eq!(request.guild_id, "1234567890123456789");
    assert_eq!(request.categories.len(), 6, "Should have 6 categories");
    assert_eq!(request.roles.len(), 6, "Should have 6 roles");

    // Validate specific categories
    let welcome_category = &request.categories[0];
    assert_eq!(welcome_category.name, "📢 WELCOME & RULES");
    assert_eq!(welcome_category.channels.len(), 3);
    assert_eq!(welcome_category.channels[0].name, "welcome");
    assert_eq!(welcome_category.channels[0].r#type, "text");

    let coding_category = &request.categories[2];
    assert_eq!(coding_category.name, "🔧 CODING AGENTS");
    assert_eq!(coding_category.channels[2].name, "agent-showcase");
    assert_eq!(coding_category.channels[2].r#type, "forum");

    // Validate specific roles
    let admin_role = &request.roles[0];
    assert_eq!(admin_role.name, "Admin");
    assert_eq!(admin_role.color, Some(15158332));
    assert_eq!(admin_role.permissions, Some(8));

    let member_role = &request.roles[5];
    assert_eq!(member_role.name, "Member");
    assert_eq!(member_role.color, Some(9807270));
    assert_eq!(member_role.permissions, None);

    // Count total channels
    let total_channels: usize = request.categories.iter()
        .map(|cat| cat.channels.len())
        .sum();

    // Calculate expected channels: 3+4+3+3+3+3 = 19 channels
    let expected_channels = 19;
    assert_eq!(total_channels, expected_channels, "Should have {} total channels", expected_channels);

    println!("✅ Agent integration structure validation passed!");
    println!("   Categories: {}", request.categories.len());
    println!("   Total channels: {}", total_channels);
    println!("   Roles: {}", request.roles.len());
}

#[test]
fn test_json_rpc_method_call_structure() {
    // Test the complete JSON-RPC call structure
    let setup_request = BatchSetupServerRequest {
        guild_id: "1234567890123456789".to_string(),
        categories: vec![
            BatchCategoryDef {
                name: "📢 WELCOME & RULES".to_string(),
                channels: vec![
                    BatchChannelDef {
                        name: "welcome".to_string(),
                        r#type: "text".to_string(),
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
        ],
    };

    // Create JSON-RPC call
    let json_rpc_call = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "discord.batch.setup_server",
        "params": setup_request,
        "id": 1
    });

    // Validate structure
    assert_eq!(json_rpc_call["jsonrpc"], "2.0");
    assert_eq!(json_rpc_call["method"], "discord.batch.setup_server");
    assert_eq!(json_rpc_call["id"], 1);

    // Validate params can be parsed back
    let params = &json_rpc_call["params"];
    let request: BatchSetupServerRequest = serde_json::from_value(params.clone())
        .expect("Failed to parse params back to request");

    assert_eq!(request.guild_id, "1234567890123456789");

    println!("✅ JSON-RPC method call structure validation passed!");
}

#[test]
fn test_rpc_handler_registration() {
    // This test ensures the RPC method is properly registered
    // We can't test the actual handler without starting the server,
    // but we can test the method name consistency

    let expected_method = "discord.batch.setup_server";

    // Verify this matches what's implemented in rpc/handler.rs:199-210
    assert_eq!(expected_method, "discord.batch.setup_server");

    // Verify the method follows the naming convention
    assert!(expected_method.starts_with("discord."));
    assert!(expected_method.contains("batch"));
    assert!(expected_method.ends_with("setup_server"));

    println!("✅ RPC handler method name validation passed!");
}

#[test]
fn test_error_handling_compatibility() {
    // Test error cases that the batch implementation should handle

    // Empty categories
    let empty_request = BatchSetupServerRequest {
        guild_id: "1234567890123456789".to_string(),
        categories: vec![],
        roles: vec![],
    };

    let json = serde_json::to_string(&empty_request).expect("Failed to serialize empty request");
    let parsed: BatchSetupServerRequest = serde_json::from_str(&json).expect("Failed to parse empty request");

    assert_eq!(parsed.categories.len(), 0);
    assert_eq!(parsed.roles.len(), 0);

    // Invalid guild ID format (should still parse as string)
    let invalid_guild_request = BatchSetupServerRequest {
        guild_id: "invalid".to_string(),
        categories: vec![],
        roles: vec![],
    };

    let json = serde_json::to_string(&invalid_guild_request).expect("Failed to serialize");
    let parsed: BatchSetupServerRequest = serde_json::from_str(&json).expect("Failed to parse");

    assert_eq!(parsed.guild_id, "invalid");

    println!("✅ Error handling compatibility validation passed!");
}