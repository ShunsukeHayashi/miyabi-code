// Detect circular dependencies using DFS
const fs = require('fs');
const adjacencyList = JSON.parse(fs.readFileSync('adjacency-list.json', 'utf8'));
const db = JSON.parse(fs.readFileSync('master-task-db.json', 'utf8'));

// DFS-based cycle detection
function detectCycles(adjList) {
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(node, path = []) {
    if (recursionStack.has(node)) {
      // Cycle detected
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat(node);
      cycles.push(cycle);
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const successors = adjList[node]?.successors || [];
    successors.forEach(successor => {
      dfs(successor, [...path]);
    });

    recursionStack.delete(node);
  }

  // Run DFS from each unvisited node
  Object.keys(adjList).forEach(nodeId => {
    if (!visited.has(parseInt(nodeId))) {
      dfs(parseInt(nodeId));
    }
  });

  return cycles;
}

const cycles = detectCycles(adjacencyList);

if (cycles.length === 0) {
  console.log('✅ No circular dependencies detected');
  fs.writeFileSync('cycles-report.json', JSON.stringify({
    has_cycles: false,
    cycles: []
  }, null, 2));
} else {
  console.log(`⚠️  Found ${cycles.length} circular dependencies:`);

  const report = {
    has_cycles: true,
    cycle_count: cycles.length,
    cycles: cycles.map(cycle => ({
      length: cycle.length,
      tasks: cycle.map(id => {
        const task = db.find(t => t.id === id);
        return {
          id: id,
          title: task?.title || 'Unknown'
        };
      }),
      task_ids: cycle
    }))
  };

  console.log(JSON.stringify(report, null, 2));
  fs.writeFileSync('cycles-report.json', JSON.stringify(report, null, 2));

  console.log('\n⚠️  WARNING: Circular dependencies must be resolved before scheduling');
}
