// Topological sort using Kahn's algorithm
const fs = require('fs');
const adjacencyList = JSON.parse(fs.readFileSync('adjacency-list.json', 'utf8'));
const db = JSON.parse(fs.readFileSync('master-task-db.json', 'utf8'));
const cyclesReport = JSON.parse(fs.readFileSync('cycles-report.json', 'utf8'));

if (cyclesReport.has_cycles) {
  console.log('❌ Cannot perform topological sort: circular dependencies exist');
  process.exit(1);
}

// Kahn's algorithm
function topologicalSort(adjList) {
  const inDegree = {};
  const sortedOrder = [];
  const queue = [];

  // Initialize in-degree
  Object.keys(adjList).forEach(node => {
    inDegree[node] = adjList[node].predecessors.length;
  });

  // Find nodes with no predecessors
  Object.keys(inDegree).forEach(node => {
    if (inDegree[node] === 0) {
      queue.push(parseInt(node));
    }
  });

  // Process queue
  while (queue.length > 0) {
    const current = queue.shift();
    sortedOrder.push(current);

    const successors = adjacencyList[current]?.successors || [];
    successors.forEach(successor => {
      inDegree[successor]--;
      if (inDegree[successor] === 0) {
        queue.push(successor);
      }
    });
  }

  return sortedOrder;
}

const sortedOrder = topologicalSort(adjacencyList);

if (sortedOrder.length !== Object.keys(adjacencyList).length) {
  console.log('⚠️  Warning: Not all tasks included in sorted order');
  console.log(`Sorted: ${sortedOrder.length}, Total: ${Object.keys(adjacencyList).length}`);
}

// Enrich with task details
const executionOrder = sortedOrder.map((taskId, index) => {
  const task = db.find(t => t.id === taskId);
  return {
    order: index + 1,
    id: taskId,
    title: task?.title || 'Unknown',
    priority: task?.priority,
    estimated_hours: task?.estimated_hours,
    depends_on: task?.depends_on || [],
    blocks: task?.blocks || []
  };
});

fs.writeFileSync('execution-order.json', JSON.stringify(executionOrder, null, 2));
console.log(`✅ Topological sort complete: ${executionOrder.length} tasks ordered`);

// Group by execution level
const levels = [];
let currentLevel = 0;
const processed = new Set();

while (processed.size < executionOrder.length) {
  const levelTasks = executionOrder.filter(task => {
    if (processed.has(task.id)) return false;
    const taskData = db.find(t => t.id === task.id);
    const allDeps = [...(taskData.depends_on || []), ...(taskData.blocked_by || []), ...(taskData.prerequisites || [])];
    if (taskData.parent_id) allDeps.push(taskData.parent_id);
    return allDeps.every(depId => processed.has(depId));
  });

  if (levelTasks.length === 0) break;

  levels.push({
    level: currentLevel,
    task_count: levelTasks.length,
    total_hours: levelTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0),
    tasks: levelTasks.map(t => t.id)
  });

  levelTasks.forEach(t => processed.add(t.id));
  currentLevel++;
}

fs.writeFileSync('execution-levels.json', JSON.stringify(levels, null, 2));
console.log(`✅ Execution levels: ${levels.length} levels`);
levels.forEach(level => {
  console.log(`  Level ${level.level}: ${level.task_count} tasks, ${level.total_hours}h`);
});
