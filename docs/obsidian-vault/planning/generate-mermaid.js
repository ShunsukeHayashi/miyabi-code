// Generate Mermaid dependency graph
const fs = require('fs');
const graph = JSON.parse(fs.readFileSync('dependency-graph.json', 'utf8'));
const db = JSON.parse(fs.readFileSync('master-task-db.json', 'utf8'));

// Mermaid graph header
let mermaid = `graph TD\n\n`;

// Add nodes with styling based on priority
graph.nodes.forEach(node => {
  const task = db.find(t => t.id === node.id);

  // Truncate long titles
  const shortTitle = task.title.length > 50
    ? task.title.substring(0, 47) + '...'
    : task.title;

  // Escape special characters
  const escapedTitle = shortTitle
    .replace(/"/g, '&quot;')
    .replace(/\[/g, '(')
    .replace(/]/g, ')')
    .replace(/\{/g, '(')
    .replace(/\}/g, ')');

  // Color coding by priority
  let cssClass = '';
  if (task.priority.includes('P0')) cssClass = ':::p0';
  else if (task.priority.includes('P1')) cssClass = ':::p1';
  else if (task.priority.includes('P2')) cssClass = ':::p2';
  else if (task.priority.includes('P3')) cssClass = ':::p3';

  // Epic vs regular task shape
  if (task.is_epic) {
    mermaid += `  I${node.id}[["#${node.id} ${escapedTitle}"]]${cssClass}\n`;
  } else {
    mermaid += `  I${node.id}["#${node.id} ${escapedTitle}"]${cssClass}\n`;
  }
});

mermaid += `\n`;

// Add edges
graph.edges.forEach(edge => {
  const arrowStyle = edge.type === 'child_of' ? '-..->' : '-->';
  mermaid += `  I${edge.from} ${arrowStyle} I${edge.to}\n`;
});

// Add styling
mermaid += `\n`;
mermaid += `classDef p0 fill:#ff6b6b,stroke:#c92a2a,stroke-width:3px,color:#fff\n`;
mermaid += `classDef p1 fill:#ffd93d,stroke:#f08c00,stroke-width:2px\n`;
mermaid += `classDef p2 fill:#6bcf7f,stroke:#37b24d,stroke-width:2px\n`;
mermaid += `classDef p3 fill:#74c0fc,stroke:#339af0,stroke-width:1px\n`;

fs.writeFileSync('dependency-graph.mmd', mermaid);
console.log('✅ Mermaid graph generated');
console.log(`   Nodes: ${graph.nodes.length}`);
console.log(`   Edges: ${graph.edges.length}`);

// Generate EPIC-only simplified version
const epicNodes = graph.nodes.filter(n => {
  const task = db.find(t => t.id === n.id);
  return task.is_epic;
});

const epicEdges = graph.edges.filter(e =>
  epicNodes.some(n => n.id === e.from) && epicNodes.some(n => n.id === e.to)
);

let epicMermaid = `graph TD\n\n`;
epicNodes.forEach(node => {
  const task = db.find(t => t.id === node.id);
  const shortTitle = task.title.substring(0, 50);
  const escapedTitle = shortTitle.replace(/"/g, '&quot;').replace(/\[/g, '(').replace(/]/g, ')');
  epicMermaid += `  I${node.id}[["#${node.id} ${escapedTitle}"]]:::p0\n`;
});

epicMermaid += `\n`;
epicEdges.forEach(edge => {
  epicMermaid += `  I${edge.from} --> I${edge.to}\n`;
});

epicMermaid += `\nclassDef p0 fill:#ff6b6b,stroke:#c92a2a,stroke-width:3px,color:#fff\n`;

fs.writeFileSync('dependency-graph-epics-only.mmd', epicMermaid);
console.log('✅ Simplified EPIC-only graph generated');
console.log(`   EPIC nodes: ${epicNodes.length}`);
