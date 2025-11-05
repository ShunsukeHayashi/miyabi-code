//! Integration tests for miyabi-dag

use crate::builder::DAGBuilder;
use crate::types::{CodeFile, GeneratedCode, ModulePath};
use std::path::PathBuf;

#[test]
fn test_end_to_end_simple() {
    // Create simple code with linear dependencies: a -> b -> c
    let files = vec![
        CodeFile::new(
            PathBuf::from("src/a.rs"),
            "use crate::b;\n".to_string(),
            ModulePath::new("crate::a"),
            vec![ModulePath::new("crate::b")],
        ),
        CodeFile::new(
            PathBuf::from("src/b.rs"),
            "use crate::c;\n".to_string(),
            ModulePath::new("crate::b"),
            vec![ModulePath::new("crate::c")],
        ),
        CodeFile::new(
            PathBuf::from("src/c.rs"),
            "".to_string(),
            ModulePath::new("crate::c"),
            vec![],
        ),
    ];

    let code = GeneratedCode::from_files(files);
    let builder = DAGBuilder::new(4);
    let graph = builder.build(&code).unwrap();

    // Verify graph structure
    assert_eq!(graph.level_count(), 3);
    assert_eq!(graph.task_count(), 3);

    // Verify execution order: c (0), b (1), a (2)
    assert_eq!(graph.levels[0].task_count(), 1);
    assert_eq!(graph.levels[1].task_count(), 1);
    assert_eq!(graph.levels[2].task_count(), 1);

    // Verify graph is valid
    assert!(graph.validate().is_ok());
}

#[test]
fn test_end_to_end_diamond() {
    // Create diamond pattern: a -> b,c -> d
    let files = vec![
        CodeFile::new(
            PathBuf::from("src/a.rs"),
            "use crate::b;\nuse crate::c;\n".to_string(),
            ModulePath::new("crate::a"),
            vec![ModulePath::new("crate::b"), ModulePath::new("crate::c")],
        ),
        CodeFile::new(
            PathBuf::from("src/b.rs"),
            "use crate::d;\n".to_string(),
            ModulePath::new("crate::b"),
            vec![ModulePath::new("crate::d")],
        ),
        CodeFile::new(
            PathBuf::from("src/c.rs"),
            "use crate::d;\n".to_string(),
            ModulePath::new("crate::c"),
            vec![ModulePath::new("crate::d")],
        ),
        CodeFile::new(
            PathBuf::from("src/d.rs"),
            "".to_string(),
            ModulePath::new("crate::d"),
            vec![],
        ),
    ];

    let code = GeneratedCode::from_files(files);
    let builder = DAGBuilder::new(4);
    let graph = builder.build(&code).unwrap();

    // Verify graph structure
    // Levels: d (0), b,c (1), a (2)
    assert_eq!(graph.level_count(), 3);
    assert_eq!(graph.task_count(), 4);

    // Level 0: d
    assert_eq!(graph.levels[0].task_count(), 1);

    // Level 1: b, c (parallel)
    assert_eq!(graph.levels[1].task_count(), 2);

    // Level 2: a
    assert_eq!(graph.levels[2].task_count(), 1);

    // Verify max parallelism
    assert_eq!(graph.max_parallel_tasks(), 2);
}

#[test]
fn test_end_to_end_parallel() {
    // Create completely parallel tasks (no dependencies)
    let files = (0..10)
        .map(|i| {
            CodeFile::new(
                PathBuf::from(format!("src/file{}.rs", i)),
                "".to_string(),
                ModulePath::new(format!("crate::file{}", i)),
                vec![],
            )
        })
        .collect();

    let code = GeneratedCode::from_files(files);
    let builder = DAGBuilder::new(10); // Increase max_parallelism to accommodate 10 tasks
    let graph = builder.build(&code).unwrap();

    // All tasks should be in level 0
    assert_eq!(graph.level_count(), 1);
    assert_eq!(graph.task_count(), 10);
    assert_eq!(graph.levels[0].task_count(), 10);

    // Max parallelism should be 10
    assert_eq!(graph.max_parallel_tasks(), 10);
}

#[test]
fn test_end_to_end_large_graph() {
    // Create a larger graph with mixed dependencies
    let mut files = vec![];

    // Base layer (no dependencies)
    for i in 0..20 {
        files.push(CodeFile::new(
            PathBuf::from(format!("src/base{}.rs", i)),
            "".to_string(),
            ModulePath::new(format!("crate::base{}", i)),
            vec![],
        ));
    }

    // Middle layer (depends on base)
    for i in 0..10 {
        let imports = vec![
            ModulePath::new(format!("crate::base{}", i * 2)),
            ModulePath::new(format!("crate::base{}", i * 2 + 1)),
        ];
        let content = imports
            .iter()
            .map(|m| format!("use {};\n", m.as_str()))
            .collect::<String>();

        files.push(CodeFile::new(
            PathBuf::from(format!("src/mid{}.rs", i)),
            content.clone(),
            ModulePath::new(format!("crate::mid{}", i)),
            CodeFile::parse_imports(&content),
        ));
    }

    // Top layer (depends on middle)
    for i in 0..5 {
        let imports = vec![
            ModulePath::new(format!("crate::mid{}", i * 2)),
            ModulePath::new(format!("crate::mid{}", i * 2 + 1)),
        ];
        let content = imports
            .iter()
            .map(|m| format!("use {};\n", m.as_str()))
            .collect::<String>();

        files.push(CodeFile::new(
            PathBuf::from(format!("src/top{}.rs", i)),
            content.clone(),
            ModulePath::new(format!("crate::top{}", i)),
            CodeFile::parse_imports(&content),
        ));
    }

    let code = GeneratedCode::from_files(files);
    let builder = DAGBuilder::new(20); // Increase max_parallelism to accommodate 20 base tasks
    let graph = builder.build(&code).unwrap();

    // Verify graph structure
    assert_eq!(graph.task_count(), 35); // 20 + 10 + 5

    // Should have 3 levels
    assert_eq!(graph.level_count(), 3);

    // Level 0: 20 base files
    assert_eq!(graph.levels[0].task_count(), 20);

    // Level 1: 10 middle files
    assert_eq!(graph.levels[1].task_count(), 10);

    // Level 2: 5 top files
    assert_eq!(graph.levels[2].task_count(), 5);

    // Max parallelism should be 20
    assert_eq!(graph.max_parallel_tasks(), 20);
}

#[test]
fn test_execution_summary() {
    let files = vec![
        CodeFile::new(
            PathBuf::from("src/a.rs"),
            "".to_string(),
            ModulePath::new("crate::a"),
            vec![],
        ),
        CodeFile::new(
            PathBuf::from("src/b.rs"),
            "".to_string(),
            ModulePath::new("crate::b"),
            vec![],
        ),
    ];

    let code = GeneratedCode::from_files(files);
    let builder = DAGBuilder::new(4);
    let graph = builder.build(&code).unwrap();

    let summary = graph.execution_summary();
    assert!(summary.contains("Total Tasks: 2"));
    assert!(summary.contains("Total Levels: 1"));
}

#[test]
fn test_find_task() {
    let files = vec![CodeFile::new(
        PathBuf::from("src/a.rs"),
        "".to_string(),
        ModulePath::new("crate::a"),
        vec![],
    )];

    let code = GeneratedCode::from_files(files);
    let builder = DAGBuilder::new(4);
    let graph = builder.build(&code).unwrap();

    let task_id = crate::types::TaskId::from_path(&PathBuf::from("src/a.rs"));
    let found = graph.find_task(&task_id);
    assert!(found.is_some());
}

#[test]
fn test_builder_config() {
    let builder = crate::builder::DAGBuilderConfig::new()
        .max_parallelism(8)
        .command_template("cargo test --package {package}")
        .build();

    assert_eq!(builder.max_parallelism(), 8);
}
