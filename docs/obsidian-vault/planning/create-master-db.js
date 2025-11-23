// Create master task database - Merge all data
const fs = require('fs');

const tasks = JSON.parse(fs.readFileSync('tasks-structured.json', 'utf8'));
const hierarchy = JSON.parse(fs.readFileSync('task-hierarchy.json', 'utf8'));
const dependencies = JSON.parse(fs.readFileSync('task-dependencies.json', 'utf8'));

// Merge all data
const masterDB = tasks.map(task => {
  const tid = task.id;

  // Check if it's an EPIC
  const isEpic = hierarchy[tid] !== undefined;
  const children = isEpic ? hierarchy[tid].children : [];

  // Get parent (if it's a child of an EPIC)
  let parent = null;
  Object.keys(hierarchy).forEach(epicId => {
    if (hierarchy[epicId].children && hierarchy[epicId].children.includes(tid)) {
      parent = parseInt(epicId);
    }
  });

  // Get dependencies
  const deps = dependencies[tid] || {
    depends_on: [],
    blocked_by: [],
    blocks: [],
    prerequisites: []
  };

  // Estimate duration if not present
  let estimatedHours = null;
  const bodyMatch = task.body?.match(/(\d+)\s*-?\s*(\d+)?\s*h/i);
  if (bodyMatch) {
    const low = parseInt(bodyMatch[1]);
    const high = bodyMatch[2] ? parseInt(bodyMatch[2]) : low;
    estimatedHours = (low + high) / 2;
  } else {
    // Auto-estimate based on priority and type
    if (task.priority.includes('P0')) estimatedHours = 40;
    else if (task.priority.includes('P1')) estimatedHours = 8;
    else if (task.priority.includes('P2')) estimatedHours = 4;
    else if (task.priority.includes('P3')) estimatedHours = 2;
    else estimatedHours = 4;
  }

  return {
    id: tid,
    title: task.title,
    state: task.state,
    priority: task.priority,
    type: task.type,
    phase: task.phase,
    is_epic: isEpic,
    parent_id: parent,
    children_ids: children,
    depends_on: deps.depends_on,
    blocked_by: deps.blocked_by,
    blocks: deps.blocks,
    prerequisites: deps.prerequisites,
    estimated_hours: estimatedHours,
    assignees: task.assignees,
    milestone: task.milestone,
    labels: task.labels,
    created: task.created,
    updated: task.updated,
    url: `https://github.com/customer-cloud/miyabi-private/issues/${tid}`
  };
});

// Save as JSON
fs.writeFileSync('master-task-db.json', JSON.stringify(masterDB, null, 2));
console.log(`✅ Master database created with ${masterDB.length} tasks`);

// Save as CSV for Excel/Sheets
const csvHeader = [
  'ID', 'Title', 'State', 'Priority', 'Type', 'Phase', 'IsEpic',
  'ParentID', 'EstimatedHours', 'DependsOn', 'BlockedBy', 'Blocks',
  'Assignees', 'Milestone', 'URL'
].join(',');

const csvRows = masterDB.map(task => [
  task.id,
  `"${task.title.replace(/"/g, '""')}"`,
  task.state,
  `"${task.priority}"`,
  `"${task.type}"`,
  `"${task.phase}"`,
  task.is_epic,
  task.parent_id || '',
  task.estimated_hours || '',
  `"${task.depends_on.join(';')}"`,
  `"${task.blocked_by.join(';')}"`,
  `"${task.blocks.join(';')}"`,
  `"${task.assignees.join(';')}"`,
  task.milestone || '',
  task.url
].join(','));

const csv = [csvHeader, ...csvRows].join('\n');
fs.writeFileSync('master-task-db.csv', csv);
console.log('✅ CSV export created');

// Summary report
const summary = {
  total_tasks: masterDB.length,
  epics: masterDB.filter(t => t.is_epic).length,
  child_tasks: masterDB.filter(t => t.parent_id !== null).length,
  standalone_tasks: masterDB.filter(t => !t.is_epic && t.parent_id === null).length,
  total_estimated_hours: masterDB.reduce((sum, t) => sum + (t.estimated_hours || 0), 0),
  average_hours_per_task: Math.round(masterDB.reduce((sum, t) => sum + (t.estimated_hours || 0), 0) / masterDB.length * 10) / 10,
  by_state: {
    open: masterDB.filter(t => t.state === 'OPEN').length,
    closed: masterDB.filter(t => t.state === 'CLOSED').length
  },
  by_priority: {}
};

// Count by priority
masterDB.forEach(t => {
  const p = t.priority.includes('P0') ? 'P0' :
            t.priority.includes('P1') ? 'P1' :
            t.priority.includes('P2') ? 'P2' :
            t.priority.includes('P3') ? 'P3' : 'No Priority';
  summary.by_priority[p] = (summary.by_priority[p] || 0) + 1;
});

console.log('\n📊 Database Summary:');
console.log(JSON.stringify(summary, null, 2));

fs.writeFileSync('master-db-summary.json', JSON.stringify(summary, null, 2));
console.log('\n✅ Summary saved to master-db-summary.json');
