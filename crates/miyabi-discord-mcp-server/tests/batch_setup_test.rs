//! Integration test for Discord batch setup functionality
//!
//! This test validates the batch setup API contract and data structures
//! without requiring actual Discord bot credentials.

use miyabi_discord_mcp_server::models::{
    BatchSetupServerRequest, BatchCategoryDef, BatchChannelDef, BatchRoleDef,
    BatchSetupServerResponse
};
use serde_json;

#[test]
fn test_batch_setup_request_serialization() {
    // Create a test batch setup request similar to the one used in the agent integration
    let request = BatchSetupServerRequest {
        guild_id: "1234567890123456789".to_string(),
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
                        name: "voice-chat".to_string(),
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
        ],
    };

    // Test serialization
    let json = serde_json::to_string(&request).expect("Failed to serialize request");
    println!("Serialized request: {}", json);

    // Test deserialization
    let deserialized: BatchSetupServerRequest =
        serde_json::from_str(&json).expect("Failed to deserialize request");

    // Validate structure
    assert_eq!(deserialized.guild_id, "1234567890123456789");
    assert_eq!(deserialized.categories.len(), 2);
    assert_eq!(deserialized.roles.len(), 2);

    // Validate first category
    let first_category = &deserialized.categories[0];
    assert_eq!(first_category.name, "📢 WELCOME & RULES");
    assert_eq!(first_category.channels.len(), 2);
    assert_eq!(first_category.channels[0].name, "welcome");
    assert_eq!(first_category.channels[0].r#type, "text");

    // Validate first role
    let first_role = &deserialized.roles[0];
    assert_eq!(first_role.name, "Admin");
    assert_eq!(first_role.color, Some(15158332));
    assert_eq!(first_role.permissions, Some(8));
}

#[test]
fn test_batch_setup_json_rpc_format() {
    // Test the JSON-RPC format that would be sent to the MCP server
    let params = serde_json::json!({
        "guild_id": "1234567890123456789",
        "categories": [
            {
                "name": "📢 WELCOME & RULES",
                "channels": [
                    {"name": "welcome", "type": "text"},
                    {"name": "rules", "type": "text"}
                ]
            }
        ],
        "roles": [
            {
                "name": "Admin",
                "color": 15158332,
                "permissions": 8
            }
        ]
    });

    // Verify it can be parsed as BatchSetupServerRequest
    let request: BatchSetupServerRequest =
        serde_json::from_value(params).expect("Failed to parse JSON-RPC params");

    assert_eq!(request.guild_id, "1234567890123456789");
    assert_eq!(request.categories[0].name, "📢 WELCOME & RULES");
    assert_eq!(request.roles[0].name, "Admin");
}

#[test]
fn test_batch_setup_response_structure() {
    // Mock response structure validation
    let response = serde_json::json!({
        "categories": [
            {
                "channel_id": "1234567890123456789",
                "name": "📢 WELCOME & RULES",
                "type": "category",
                "parent_id": null
            }
        ],
        "channels": [
            {
                "channel_id": "1234567890123456790",
                "name": "welcome",
                "type": "text",
                "parent_id": "1234567890123456789"
            }
        ],
        "roles": [
            {
                "role_id": "1234567890123456791",
                "name": "Admin",
                "color": 15158332,
                "permissions": 8
            }
        ]
    });

    // Verify response can be parsed
    let parsed_response: BatchSetupServerResponse =
        serde_json::from_value(response).expect("Failed to parse response");

    assert_eq!(parsed_response.categories.len(), 1);
    assert_eq!(parsed_response.channels.len(), 1);
    assert_eq!(parsed_response.roles.len(), 1);

    assert_eq!(parsed_response.categories[0].name, "📢 WELCOME & RULES");
    assert_eq!(parsed_response.channels[0].name, "welcome");
    assert_eq!(parsed_response.roles[0].name, "Admin");
}

#[test]
fn test_channel_types_validation() {
    // Test different channel types
    let valid_types = vec!["text", "voice", "forum"];

    for channel_type in valid_types {
        let channel = BatchChannelDef {
            name: format!("test-{}", channel_type),
            r#type: channel_type.to_string(),
        };

        let json = serde_json::to_string(&channel).expect("Failed to serialize channel");
        let parsed: BatchChannelDef =
            serde_json::from_str(&json).expect("Failed to deserialize channel");

        assert_eq!(parsed.r#type, channel_type);
    }
}

#[test]
fn test_role_permissions_validation() {
    // Test role with different permission levels
    let roles = vec![
        BatchRoleDef {
            name: "Admin".to_string(),
            color: Some(15158332),
            permissions: Some(8), // Administrator
        },
        BatchRoleDef {
            name: "Member".to_string(),
            color: None,
            permissions: None,
        },
    ];

    for role in roles {
        let json = serde_json::to_string(&role).expect("Failed to serialize role");
        let parsed: BatchRoleDef =
            serde_json::from_str(&json).expect("Failed to deserialize role");

        assert_eq!(parsed.name, role.name);
        assert_eq!(parsed.color, role.color);
        assert_eq!(parsed.permissions, role.permissions);
    }
}