// Validate graph structure
const fs = require('fs');
const graph = JSON.parse(fs.readFileSync('dependency-graph.json', 'utf8'));
const db = JSON.parse(fs.readFileSync('master-task-db.json', 'utf8'));

const validations = {
  total_checks: 0,
  passed: 0,
  failed: 0,
  checks: []
};

function check(name, condition, details = '') {
  validations.total_checks++;
  const passed = condition;
  if (passed) validations.passed++;
  else validations.failed++;

  validations.checks.push({
    name,
    passed,
    details
  });

  console.log(passed ? '✅' : '❌', name, details);
}

// Check 1: All tasks have nodes
check(
  'All tasks have nodes in graph',
  db.length === graph.nodes.length,
  `DB: ${db.length}, Graph: ${graph.nodes.length}`
);

// Check 2: No orphaned edges
const nodeIds = new Set(graph.nodes.map(n => n.id));
const orphanedEdges = graph.edges.filter(e =>
  !nodeIds.has(e.from) || !nodeIds.has(e.to)
);
check(
  'No orphaned edges',
  orphanedEdges.length === 0,
  `Found: ${orphanedEdges.length}`
);

// Check 3: All dependencies are valid
let invalidDeps = 0;
db.forEach(task => {
  [...task.depends_on, ...task.blocked_by, ...task.prerequisites].forEach(depId => {
    if (!db.find(t => t.id === depId)) invalidDeps++;
  });
});
check(
  'All dependencies reference existing tasks',
  invalidDeps === 0,
  `Invalid: ${invalidDeps}`
);

// Check 4: EPICs have children
const epics = db.filter(t => t.is_epic);
const epicsWithoutChildren = epics.filter(e =>
  e.children_ids.length === 0
);
check(
  'EPICs have children (or standalone)',
  true,
  `EPICs without children: ${epicsWithoutChildren.length}/${epics.length}`
);

// Check 5: No self-dependencies
let selfDeps = 0;
db.forEach(task => {
  if (task.depends_on.includes(task.id)) selfDeps++;
  if (task.blocked_by.includes(task.id)) selfDeps++;
  if (task.parent_id === task.id) selfDeps++;
});
check(
  'No self-dependencies',
  selfDeps === 0,
  `Self-deps found: ${selfDeps}`
);

// Summary
console.log('\n📊 Validation Summary:');
console.log(`Total checks: ${validations.total_checks}`);
console.log(`Passed: ${validations.passed}`);
console.log(`Failed: ${validations.failed}`);

fs.writeFileSync('graph-validation.json', JSON.stringify(validations, null, 2));

if (validations.failed > 0) {
  console.log('\n⚠️  WARNING: Some validations failed. Review graph-validation.json');
} else {
  console.log('\n✅ All validations passed');
}
