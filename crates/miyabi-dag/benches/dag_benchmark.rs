//! Benchmarks for miyabi-dag
//!
//! Tests performance with:
//! - Small graphs (10 nodes)
//! - Medium graphs (50 nodes)
//! - Large graphs (100, 200 nodes)
//! - Complex dependency patterns

use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use miyabi_dag::{CodeFile, DAGBuilder, GeneratedCode, ModulePath};
use std::path::PathBuf;
use std::str::FromStr;

/// Generate test code files with dependencies
fn generate_test_files(count: usize, dependencies_per_file: usize) -> Vec<CodeFile> {
    let mut files = Vec::new();

    for i in 0..count {
        let mut content = format!("// Module {}\n", i);

        // Add dependencies to previous modules
        for dep_idx in i.saturating_sub(dependencies_per_file)..i {
            content.push_str(&format!("use crate::module_{};\n", dep_idx));
        }

        content.push_str(&format!("\npub fn function_{}() {{}}\n", i));

        let file = CodeFile::new(
            PathBuf::from(format!("module_{}.rs", i)),
            content,
            ModulePath::from_str(&format!("crate::module_{}", i)).unwrap(),
        );

        files.push(file);
    }

    files
}

/// Benchmark DAG construction
fn bench_dag_construction(c: &mut Criterion) {
    let mut group = c.benchmark_group("dag_construction");

    for size in [10, 50, 100, 200].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(size), size, |b, &size| {
            let files = generate_test_files(size, 2);
            let code = GeneratedCode::from_files(files);
            let builder = DAGBuilder::new(4);

            b.iter(|| {
                let graph = builder.build(black_box(code.clone())).unwrap();
                black_box(graph);
            });
        });
    }

    group.finish();
}

/// Benchmark topological sort
fn bench_topological_sort(c: &mut Criterion) {
    let mut group = c.benchmark_group("topological_sort");

    for size in [10, 50, 100, 200].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(size), size, |b, &size| {
            let files = generate_test_files(size, 2);
            let code = GeneratedCode::from_files(files);
            let builder = DAGBuilder::new(4);
            let graph = builder.build(code).unwrap();

            b.iter(|| {
                let sorted = graph.topological_sort().unwrap();
                black_box(sorted);
            });
        });
    }

    group.finish();
}

/// Benchmark dependency analysis
fn bench_dependency_analysis(c: &mut Criterion) {
    let mut group = c.benchmark_group("dependency_analysis");

    for size in [10, 50, 100, 200].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(size), size, |b, &size| {
            let files = generate_test_files(size, 2);
            let code = GeneratedCode::from_files(files);

            b.iter(|| {
                let analyzer = miyabi_dag::DependencyAnalyzer::new();
                let dep_graph = analyzer.analyze(black_box(&code)).unwrap();
                black_box(dep_graph);
            });
        });
    }

    group.finish();
}

/// Benchmark level building (parallelization)
fn bench_level_building(c: &mut Criterion) {
    let mut group = c.benchmark_group("level_building");

    for size in [10, 50, 100, 200].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(size), size, |b, &size| {
            let files = generate_test_files(size, 2);
            let code = GeneratedCode::from_files(files);
            let builder = DAGBuilder::new(4);

            b.iter(|| {
                let mut graph = builder.build(black_box(code.clone())).unwrap();
                graph.build_levels().unwrap();
                black_box(graph);
            });
        });
    }

    group.finish();
}

/// Benchmark with different parallelism levels
fn bench_parallelism_levels(c: &mut Criterion) {
    let mut group = c.benchmark_group("parallelism_levels");

    let files = generate_test_files(100, 3);
    let code = GeneratedCode::from_files(files);

    for max_parallelism in [1, 2, 4, 8, 16].iter() {
        group.bench_with_input(
            BenchmarkId::from_parameter(max_parallelism),
            max_parallelism,
            |b, &max_parallelism| {
                let builder = DAGBuilder::new(max_parallelism);

                b.iter(|| {
                    let graph = builder.build(black_box(code.clone())).unwrap();
                    black_box(graph);
                });
            },
        );
    }

    group.finish();
}

/// Benchmark complex dependency patterns
fn bench_complex_dependencies(c: &mut Criterion) {
    let mut group = c.benchmark_group("complex_dependencies");

    // Diamond pattern
    group.bench_function("diamond_pattern", |b| {
        let files = vec![
            CodeFile::new(
                PathBuf::from("a.rs"),
                "pub fn a() {}".to_string(),
                ModulePath::from_str("crate::a").unwrap(),
            ),
            CodeFile::new(
                PathBuf::from("b.rs"),
                "use crate::a;\npub fn b() {}".to_string(),
                ModulePath::from_str("crate::b").unwrap(),
            ),
            CodeFile::new(
                PathBuf::from("c.rs"),
                "use crate::a;\npub fn c() {}".to_string(),
                ModulePath::from_str("crate::c").unwrap(),
            ),
            CodeFile::new(
                PathBuf::from("d.rs"),
                "use crate::b;\nuse crate::c;\npub fn d() {}".to_string(),
                ModulePath::from_str("crate::d").unwrap(),
            ),
        ];

        let code = GeneratedCode::from_files(files);
        let builder = DAGBuilder::new(4);

        b.iter(|| {
            let graph = builder.build(black_box(code.clone())).unwrap();
            black_box(graph);
        });
    });

    // Chain pattern
    group.bench_function("chain_pattern", |b| {
        let files = generate_test_files(20, 1); // Each depends on previous one
        let code = GeneratedCode::from_files(files);
        let builder = DAGBuilder::new(4);

        b.iter(|| {
            let graph = builder.build(black_box(code.clone())).unwrap();
            black_box(graph);
        });
    });

    // Independent pattern
    group.bench_function("independent_pattern", |b| {
        let files = generate_test_files(20, 0); // No dependencies
        let code = GeneratedCode::from_files(files);
        let builder = DAGBuilder::new(4);

        b.iter(|| {
            let graph = builder.build(black_box(code.clone())).unwrap();
            black_box(graph);
        });
    });

    group.finish();
}

criterion_group!(
    benches,
    bench_dag_construction,
    bench_topological_sort,
    bench_dependency_analysis,
    bench_level_building,
    bench_parallelism_levels,
    bench_complex_dependencies
);
criterion_main!(benches);
