//! Integration tests for Claude Agent SDK modules
//! Tests the interaction between Sandbox, Checkpoint, and Subagent systems

use miyabi_agent_core::{
    sandbox::{SandboxConfig, PermissionLevel, NetworkPolicy, FilesystemPolicy, ResourceLimits},
    checkpoint::{AutoSaveConfig, CheckpointState},
    subagent::{SubagentConfig, AgentType, ResourceAllocation, SubagentStatus},
};
use std::path::PathBuf;
use std::collections::HashMap;

/// Test basic sandbox configuration
#[test]
fn test_sandbox_config() {
    let config = SandboxConfig {
        id: uuid::Uuid::new_v4().to_string(),
        agent_name: "test-agent".to_string(),
        permission_level: PermissionLevel::Standard,
        network_policy: NetworkPolicy::AllowList(vec!["api.anthropic.com".to_string()]),
        filesystem_policy: FilesystemPolicy {
            read_paths: vec![PathBuf::from("/tmp/test")],
            write_paths: vec![PathBuf::from("/tmp/test")],
            denied_paths: vec![PathBuf::from("/etc")],
            allow_create: true,
            allow_delete: false,
            allow_execute: false,
        },
        resource_limits: ResourceLimits {
            max_cpu_time: Some(300),
            max_memory_mb: Some(512),
            max_duration: Some(std::time::Duration::from_secs(300)),
            max_file_size_mb: Some(100),
            max_open_files: Some(256),
            max_processes: Some(10),
        },
        working_dir: PathBuf::from("/tmp/sandbox"),
        env_allowlist: vec!["RUST_LOG".to_string()],
        env_vars: HashMap::new(),
        audit_enabled: true,
    };

    assert_eq!(config.agent_name, "test-agent");
    assert!(matches!(config.permission_level, PermissionLevel::Standard));
    assert!(config.audit_enabled);
}

/// Test sandbox with standard preset
#[test]
fn test_sandbox_standard_preset() {
    let config = SandboxConfig::standard("my-agent", PathBuf::from("/tmp/work"));
    
    assert_eq!(config.agent_name, "my-agent");
    assert!(matches!(config.permission_level, PermissionLevel::Standard));
}

/// Test network policy variants
#[test]
fn test_network_policies() {
    let allow_all = NetworkPolicy::AllowAll;
    let deny_all = NetworkPolicy::DenyAll;
    let allow_list = NetworkPolicy::AllowList(vec!["github.com".to_string()]);
    let deny_list = NetworkPolicy::DenyList(vec!["malware.com".to_string()]);
    
    assert!(matches!(allow_all, NetworkPolicy::AllowAll));
    assert!(matches!(deny_all, NetworkPolicy::DenyAll));
    
    if let NetworkPolicy::AllowList(hosts) = allow_list {
        assert_eq!(hosts.len(), 1);
        assert_eq!(hosts[0], "github.com");
    }
    
    if let NetworkPolicy::DenyList(hosts) = deny_list {
        assert_eq!(hosts.len(), 1);
    }
}

/// Test filesystem policy
#[test]
fn test_filesystem_policy() {
    let policy = FilesystemPolicy {
        read_paths: vec![PathBuf::from("/home/user"), PathBuf::from("/tmp")],
        write_paths: vec![PathBuf::from("/tmp")],
        denied_paths: vec![PathBuf::from("/etc"), PathBuf::from("/root")],
        allow_create: true,
        allow_delete: false,
        allow_execute: false,
    };
    
    assert_eq!(policy.read_paths.len(), 2);
    assert_eq!(policy.write_paths.len(), 1);
    assert_eq!(policy.denied_paths.len(), 2);
    assert!(policy.allow_create);
    assert!(!policy.allow_delete);
}

/// Test resource limits with defaults
#[test]
fn test_resource_limits_default() {
    let limits = ResourceLimits::default();
    
    assert!(limits.max_cpu_time.is_some());
    assert!(limits.max_memory_mb.is_some());
    assert!(limits.max_duration.is_some());
}

/// Test auto-save configuration
#[test]
fn test_auto_save_config() {
    let config = AutoSaveConfig {
        enabled: true,
        interval_seconds: 60,
        max_auto_saves: 10,
        on_file_change: true,
        before_risky_ops: true,
    };
    
    assert!(config.enabled);
    assert_eq!(config.interval_seconds, 60);
    assert_eq!(config.max_auto_saves, 10);
}

/// Test auto-save default config
#[test]
fn test_auto_save_default() {
    let config = AutoSaveConfig::default();
    
    assert!(config.enabled);
    assert!(config.on_file_change);
    assert!(config.before_risky_ops);
}

/// Test subagent configuration
#[test]
fn test_subagent_config() {
    let config = SubagentConfig {
        name: "codegen-agent".to_string(),
        agent_type: AgentType::CodeGen,
        timeout_seconds: 120,
        max_retries: 3,
        resources: ResourceAllocation {
            cpu_cores: 2.0,
            memory_mb: 1024,
            disk_mb: 2048,
            network_access: true,
        },
        environment: HashMap::from([
            ("RUST_LOG".to_string(), "debug".to_string()),
        ]),
        working_directory: Some("/tmp/agent".to_string()),
        depends_on: vec![],
    };
    
    assert_eq!(config.name, "codegen-agent");
    assert!(matches!(config.agent_type, AgentType::CodeGen));
    assert_eq!(config.timeout_seconds, 120);
    assert_eq!(config.max_retries, 3);
}

/// Test all agent types
#[test]
fn test_agent_types() {
    let types = vec![
        AgentType::CodeGen,
        AgentType::Reviewer,
        AgentType::Tester,
        AgentType::Deployer,
        AgentType::Coordinator,
        AgentType::Researcher,
        AgentType::Documenter,
        AgentType::Custom("custom-agent".to_string()),
    ];
    
    assert_eq!(types.len(), 8);
    
    // Test display trait
    assert_eq!(AgentType::CodeGen.to_string(), "codegen");
    assert_eq!(AgentType::Reviewer.to_string(), "reviewer");
    assert_eq!(AgentType::Tester.to_string(), "tester");
}

/// Test resource allocation defaults
#[test]
fn test_resource_allocation_default() {
    let resources = ResourceAllocation::default();
    
    assert_eq!(resources.cpu_cores, 1.0);
    assert_eq!(resources.memory_mb, 512);
    assert_eq!(resources.disk_mb, 1024);
    assert!(resources.network_access);
}

/// Test subagent status variants
#[test]
fn test_subagent_status() {
    let statuses = vec![
        SubagentStatus::Initializing,
        SubagentStatus::Idle,
        SubagentStatus::Running,
        SubagentStatus::Paused,
        SubagentStatus::Completed,
        SubagentStatus::Failed,
        SubagentStatus::Terminated,
    ];
    
    assert_eq!(statuses.len(), 7);
    assert!(matches!(statuses[0], SubagentStatus::Initializing));
    assert!(matches!(statuses[4], SubagentStatus::Completed));
}

/// Test checkpoint state structure
#[test]
fn test_checkpoint_state() {
    let state = CheckpointState {
        files: HashMap::new(),
        environment: HashMap::from([
            ("PATH".to_string(), "/usr/bin".to_string()),
        ]),
        working_directory: PathBuf::from("/home/user/project"),
        git_state: None,
        metadata: HashMap::new(),
    };
    
    assert!(state.files.is_empty());
    assert_eq!(state.environment.len(), 1);
    assert_eq!(state.working_directory, PathBuf::from("/home/user/project"));
}

/// Integration test: Sandbox + Subagent configs
#[test]
fn test_sandbox_subagent_integration() {
    // Create sandbox config for agent isolation
    let sandbox = SandboxConfig::standard("integration-agent", PathBuf::from("/tmp/integration"));
    
    // Create matching subagent config
    let subagent = SubagentConfig {
        name: sandbox.agent_name.clone(),
        agent_type: AgentType::CodeGen,
        timeout_seconds: 300,
        max_retries: 2,
        resources: ResourceAllocation::default(),
        environment: HashMap::new(),
        working_directory: Some(sandbox.working_dir.to_string_lossy().to_string()),
        depends_on: vec![],
    };
    
    // Verify configs are compatible
    assert_eq!(sandbox.agent_name, subagent.name);
    assert_eq!(
        sandbox.working_dir.to_string_lossy().to_string(),
        *subagent.working_directory.as_ref().unwrap()
    );
}

/// Test multi-agent workflow configuration
#[test]
fn test_multi_agent_workflow() {
    let agents: Vec<SubagentConfig> = vec![
        SubagentConfig {
            name: "researcher".to_string(),
            agent_type: AgentType::Researcher,
            timeout_seconds: 60,
            max_retries: 1,
            resources: ResourceAllocation::default(),
            environment: HashMap::new(),
            working_directory: None,
            depends_on: vec![],
        },
        SubagentConfig {
            name: "coder".to_string(),
            agent_type: AgentType::CodeGen,
            timeout_seconds: 120,
            max_retries: 2,
            resources: ResourceAllocation::default(),
            environment: HashMap::new(),
            working_directory: None,
            depends_on: vec![], // Would reference researcher ID in production
        },
        SubagentConfig {
            name: "reviewer".to_string(),
            agent_type: AgentType::Reviewer,
            timeout_seconds: 60,
            max_retries: 1,
            resources: ResourceAllocation::default(),
            environment: HashMap::new(),
            working_directory: None,
            depends_on: vec![], // Would reference coder ID in production
        },
        SubagentConfig {
            name: "tester".to_string(),
            agent_type: AgentType::Tester,
            timeout_seconds: 180,
            max_retries: 3,
            resources: ResourceAllocation::default(),
            environment: HashMap::new(),
            working_directory: None,
            depends_on: vec![], // Would reference reviewer ID in production
        },
    ];
    
    assert_eq!(agents.len(), 4);
    assert!(matches!(agents[0].agent_type, AgentType::Researcher));
    assert!(matches!(agents[1].agent_type, AgentType::CodeGen));
    assert!(matches!(agents[2].agent_type, AgentType::Reviewer));
    assert!(matches!(agents[3].agent_type, AgentType::Tester));
}
