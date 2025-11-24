// Final validation of all deliverables
const fs = require('fs');

console.log('🔍 Validating all deliverables...\n');

const requiredFiles = [
  // Phase 1: Data Collection
  { file: 'issues-raw-20251119.json', phase: 'Phase 1', desc: 'Raw GitHub Issues export' },
  { file: 'tasks-structured.json', phase: 'Phase 1', desc: 'Parsed task metadata' },
  { file: 'master-task-db.json', phase: 'Phase 1', desc: 'Master task database' },
  { file: 'master-task-db.csv', phase: 'Phase 1', desc: 'CSV export' },

  // Phase 2: Dependency Graph
  { file: 'task-hierarchy.json', phase: 'Phase 2', desc: 'EPIC hierarchy' },
  { file: 'dependency-graph.json', phase: 'Phase 2', desc: 'Dependency graph' },
  { file: 'execution-order.json', phase: 'Phase 2', desc: 'Topological sort' },
  { file: 'dependency-graph.mermaid', phase: 'Phase 2', desc: 'Mermaid diagram (full)' },
  { file: 'dependency-graph-epics-only.mermaid', phase: 'Phase 2', desc: 'Mermaid diagram (EPICs)' },
  { file: 'graph-validation-report.json', phase: 'Phase 2', desc: 'Graph validation' },

  // Phase 3-5: Gantt Generation
  { file: 'gantt-chart.puml', phase: 'Phase 3-5', desc: 'PlantUML Gantt (full)' },
  { file: 'gantt-chart-epics-only.puml', phase: 'Phase 3-5', desc: 'PlantUML Gantt (EPICs)' },
  { file: 'gantt-summary.json', phase: 'Phase 3-5', desc: 'Gantt statistics' },

  // Phase 6: Sprint Planning
  { file: 'sprint-plan.json', phase: 'Phase 6', desc: 'Sprint allocation data' },
  { file: 'sprint-plan.md', phase: 'Phase 6', desc: 'Sprint board markdown' },
  { file: 'sprint-summary.json', phase: 'Phase 6', desc: 'Sprint statistics' },

  // Phase 4: Critical Path
  { file: 'critical-path.json', phase: 'Phase 4', desc: 'Critical path data' },
  { file: 'tasks-with-timing.json', phase: 'Phase 4', desc: 'Task timing analysis' },
  { file: 'slack-distribution.json', phase: 'Phase 4', desc: 'Slack distribution' },
  { file: 'critical-path-report.md', phase: 'Phase 4', desc: 'CPM report' },

  // Phase 7: Final Documentation
  { file: 'MASTER_PROJECT_PLAN_2025-11-19.md', phase: 'Phase 7', desc: 'Master project plan' }
];

let allValid = true;
let totalSize = 0;
const validationResults = {};

requiredFiles.forEach(({ file, phase, desc }) => {
  const exists = fs.existsSync(file);
  const size = exists ? fs.statSync(file).size : 0;

  validationResults[phase] = validationResults[phase] || [];
  validationResults[phase].push({
    file,
    desc,
    exists,
    size,
    sizeKB: Math.round(size / 1024 * 10) / 10
  });

  if (exists) {
    console.log(`✅ ${file} (${Math.round(size / 1024 * 10) / 10} KB)`);
    totalSize += size;
  } else {
    console.log(`❌ MISSING: ${file}`);
    allValid = false;
  }
});

console.log(`\n${'='.repeat(60)}\n`);

// Summary by phase
Object.keys(validationResults).forEach(phase => {
  const phaseFiles = validationResults[phase];
  const existingCount = phaseFiles.filter(f => f.exists).length;
  const totalCount = phaseFiles.length;
  const status = existingCount === totalCount ? '✅' : '❌';

  console.log(`${status} ${phase}: ${existingCount}/${totalCount} files`);
});

console.log(`\n${'='.repeat(60)}\n`);

// Overall summary
const totalFiles = requiredFiles.length;
const existingFiles = requiredFiles.filter(f => fs.existsSync(f.file)).length;

console.log(`📊 VALIDATION SUMMARY:`);
console.log(`   Total Files: ${existingFiles}/${totalFiles}`);
console.log(`   Total Size: ${Math.round(totalSize / 1024 / 1024 * 10) / 10} MB`);
console.log(`   Status: ${allValid ? '✅ ALL DELIVERABLES PRESENT' : '❌ MISSING FILES'}`);

// Save validation report
const report = {
  generated: new Date().toISOString(),
  total_files: totalFiles,
  existing_files: existingFiles,
  total_size_mb: Math.round(totalSize / 1024 / 1024 * 10) / 10,
  all_valid: allValid,
  by_phase: validationResults
};

fs.writeFileSync('validation-report.json', JSON.stringify(report, null, 2));
console.log(`\n✅ Validation report saved: validation-report.json`);

if (allValid) {
  console.log('\n🎉 ALL PHASES COMPLETE! All deliverables validated successfully.\n');
} else {
  console.log('\n⚠️  Some files are missing. Please review the list above.\n');
}

process.exit(allValid ? 0 : 1);
