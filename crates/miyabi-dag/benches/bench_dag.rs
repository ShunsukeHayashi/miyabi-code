//! Benchmarks for miyabi-dag performance
//!
//! Tests performance with large graphs (>100 nodes) as specified in Issue #721

use criterion::{black_box, criterion_group, criterion_main, Criterion};
use miyabi_dag::{DAGBuilder, GeneratedCode};
use miyabi_dag::types::{CodeFile, ModulePath};
use std::path::PathBuf;

/// Generate a large code graph with specified number of nodes
fn generate_large_graph(num_nodes: usize) -> GeneratedCode {
    let mut files = Vec::new();

    // Create base layer (no dependencies) - 20% of nodes
    let base_count = num_nodes / 5;
    for i in 0..base_count {
        files.push(CodeFile::new(
            PathBuf::from(format!("src/base{}.rs", i)),
            String::new(),
            ModulePath::new(format!("crate::base{}", i)),
            vec![],
        ));
    }

    // Create middle layers with dependencies
    let remaining = num_nodes - base_count;
    let layers = 4; // Create 4 layers
    let nodes_per_layer = remaining / layers;

    for layer in 0..layers {
        for i in 0..nodes_per_layer {
            let node_idx = base_count + layer * nodes_per_layer + i;
            
            // Each node depends on 2-3 nodes from previous layer
            let mut imports = Vec::new();
            if layer == 0 {
                // First layer depends on base
                for dep_idx in 0..2.min(base_count) {
                    imports.push(ModulePath::new(format!("crate::base{}", dep_idx)));
                }
            } else {
                // Other layers depend on previous layer
                let prev_start = base_count + (layer - 1) * nodes_per_layer;
                for dep_idx in 0..2.min(nodes_per_layer) {
                    imports.push(ModulePath::new(format!("crate::node{}", prev_start + dep_idx)));
                }
            }

            let content = imports
                .iter()
                .map(|m| format!("use {};\n", m.as_str()))
                .collect::<String>();

            files.push(CodeFile::new(
                PathBuf::from(format!("src/node{}.rs", node_idx)),
                content.clone(),
                ModulePath::new(format!("crate::node{}", node_idx)),
                CodeFile::parse_imports(&content),
            ));
        }
    }

    GeneratedCode::from_files(files)
}

fn benchmark_dag_build_small(c: &mut Criterion) {
    c.bench_function("dag_build_50_nodes", |b| {
        let code = generate_large_graph(50);
        let builder = DAGBuilder::new(10);
        b.iter(|| {
            black_box(builder.build(black_box(&code)).unwrap())
        });
    });
}

fn benchmark_dag_build_medium(c: &mut Criterion) {
    c.bench_function("dag_build_100_nodes", |b| {
        let code = generate_large_graph(100);
        let builder = DAGBuilder::new(20);
        b.iter(|| {
            black_box(builder.build(black_box(&code)).unwrap())
        });
    });
}

fn benchmark_dag_build_large(c: &mut Criterion) {
    c.bench_function("dag_build_200_nodes", |b| {
        let code = generate_large_graph(200);
        let builder = DAGBuilder::new(40);
        b.iter(|| {
            black_box(builder.build(black_box(&code)).unwrap())
        });
    });
}

fn benchmark_dependency_analysis(c: &mut Criterion) {
    c.bench_function("dependency_analysis_100_nodes", |b| {
        let code = generate_large_graph(100);
        b.iter(|| {
            black_box(miyabi_dag::dependency::DependencyAnalyzer::analyze(black_box(&code)).unwrap())
        });
    });
}

fn benchmark_topological_sort(c: &mut Criterion) {
    c.bench_function("topological_sort_100_nodes", |b| {
        let code = generate_large_graph(100);
        let dep_graph = miyabi_dag::dependency::DependencyAnalyzer::analyze(&code).unwrap();
        b.iter(|| {
            black_box(miyabi_dag::topological::TopologicalSorter::group_into_levels_optimized(black_box(&dep_graph)).unwrap())
        });
    });
}

criterion_group!(
    benches,
    benchmark_dag_build_small,
    benchmark_dag_build_medium,
    benchmark_dag_build_large,
    benchmark_dependency_analysis,
    benchmark_topological_sort
);
criterion_main!(benches);


