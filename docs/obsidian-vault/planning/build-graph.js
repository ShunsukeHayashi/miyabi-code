// Build dependency graph - adjacency list
const fs = require('fs');
const db = JSON.parse(fs.readFileSync('master-task-db.json', 'utf8'));

// Build adjacency list
const graph = {
  nodes: [],
  edges: []
};

// Add all tasks as nodes
db.forEach(task => {
  graph.nodes.push({
    id: task.id,
    title: task.title,
    priority: task.priority,
    type: task.type,
    is_epic: task.is_epic,
    estimated_hours: task.estimated_hours
  });
});

// Add edges (dependencies)
db.forEach(task => {
  const tid = task.id;

  // depends_on: task depends on another (arrow: dependency -> task)
  task.depends_on.forEach(depId => {
    graph.edges.push({
      from: depId,
      to: tid,
      type: 'depends_on'
    });
  });

  // blocked_by: task is blocked by another (arrow: blocker -> task)
  task.blocked_by.forEach(blockerId => {
    graph.edges.push({
      from: blockerId,
      to: tid,
      type: 'blocked_by'
    });
  });

  // prerequisites: must complete prerequisite first
  task.prerequisites.forEach(preId => {
    graph.edges.push({
      from: preId,
      to: tid,
      type: 'prerequisite'
    });
  });

  // parent-child (EPIC hierarchy)
  if (task.parent_id) {
    graph.edges.push({
      from: task.parent_id,
      to: tid,
      type: 'child_of'
    });
  }
});

// Remove duplicate edges
const edgeSet = new Set();
graph.edges = graph.edges.filter(edge => {
  const key = `${edge.from}-${edge.to}-${edge.type}`;
  if (edgeSet.has(key)) return false;
  edgeSet.add(key);
  return true;
});

fs.writeFileSync('dependency-graph.json', JSON.stringify(graph, null, 2));
console.log(`✅ Graph built: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

// Build adjacency list for algorithms
const adjacencyList = {};
graph.nodes.forEach(node => {
  adjacencyList[node.id] = {
    successors: [],  // Tasks that depend on this
    predecessors: [] // Tasks this depends on
  };
});

graph.edges.forEach(edge => {
  if (['depends_on', 'blocked_by', 'prerequisite', 'child_of'].includes(edge.type)) {
    if (!adjacencyList[edge.from].successors.includes(edge.to)) {
      adjacencyList[edge.from].successors.push(edge.to);
    }
    if (!adjacencyList[edge.to].predecessors.includes(edge.from)) {
      adjacencyList[edge.to].predecessors.push(edge.from);
    }
  }
});

fs.writeFileSync('adjacency-list.json', JSON.stringify(adjacencyList, null, 2));
console.log('✅ Adjacency list created');

// Stats
const edgesByType = {};
graph.edges.forEach(e => {
  edgesByType[e.type] = (edgesByType[e.type] || 0) + 1;
});

console.log('\n📊 Graph Statistics:');
console.log(`   Nodes: ${graph.nodes.length}`);
console.log(`   Edges: ${graph.edges.length}`);
console.log(`   By type:`, edgesByType);
