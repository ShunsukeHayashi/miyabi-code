// Identify EPIC issues and build hierarchy
const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('tasks-structured.json', 'utf8'));

// EPIC detection patterns
const epicPatterns = [
  /\[EPIC\]/i,
  /\[MASTER\]/i,
  /epic/i,
  /master issue/i,
  /parent issue/i
];

// Sub-task detection patterns
const subTaskPatterns = [
  /sub-issue/i,
  /sub-task/i,
  /child issue/i,
  /depends on #(\d+)/gi,
  /blocked by #(\d+)/gi,
  /parent: #(\d+)/gi,
  /#(\d+)/g  // Any issue reference
];

const epics = [];
const hierarchy = {};

tasks.forEach(task => {
  const isEpic = epicPatterns.some(pattern =>
    pattern.test(task.title) || pattern.test(task.body)
  );

  if (isEpic) {
    epics.push(task.id);
    hierarchy[task.id] = {
      title: task.title,
      children: [],
      type: 'epic'
    };
  }
});

// Extract relationships from issue bodies
tasks.forEach(task => {
  const body = task.body || '';
  const title = task.title || '';

  // Find dependency references
  const matches = body.matchAll(/#(\d+)/g);
  const references = Array.from(matches).map(m => parseInt(m[1]));

  // Check if referenced issues are EPICs
  references.forEach(ref => {
    if (epics.includes(ref)) {
      if (!hierarchy[ref]) {
        hierarchy[ref] = { children: [], type: 'epic' };
      }
      if (!hierarchy[ref].children.includes(task.id)) {
        hierarchy[ref].children.push(task.id);
      }
    }
  });

  // Check for explicit parent declarations
  const parentMatch = body.match(/parent:\s*#?(\d+)/i);
  if (parentMatch) {
    const parentId = parseInt(parentMatch[1]);
    if (!hierarchy[parentId]) {
      hierarchy[parentId] = { children: [], type: 'epic' };
    }
    if (!hierarchy[parentId].children.includes(task.id)) {
      hierarchy[parentId].children.push(task.id);
    }
  }

  // Check title for EPIC indicators
  if (title.includes('[EPIC]') || title.includes('EPIC')) {
    if (!epics.includes(task.id)) {
      epics.push(task.id);
      hierarchy[task.id] = {
        title: task.title,
        children: [],
        type: 'epic'
      };
    }
  }
});

// Remove duplicates from children
Object.keys(hierarchy).forEach(epicId => {
  hierarchy[epicId].children = [...new Set(hierarchy[epicId].children)];
});

fs.writeFileSync('task-hierarchy.json', JSON.stringify(hierarchy, null, 2));
console.log(`✅ Identified ${epics.length} EPIC issues`);
console.log('EPIC IDs:', epics.sort((a,b) => a - b));

// Generate hierarchy summary
const hierarchySummary = {
  total_epics: epics.length,
  epics_with_children: Object.keys(hierarchy).filter(id => hierarchy[id].children.length > 0).length,
  total_child_tasks: Object.values(hierarchy).reduce((sum, epic) => sum + epic.children.length, 0),
  details: epics.sort((a,b) => a - b).map(id => ({
    epic_id: id,
    epic_title: tasks.find(t => t.id === id)?.title || 'Unknown',
    children_count: hierarchy[id]?.children.length || 0,
    children: hierarchy[id]?.children || []
  }))
};

fs.writeFileSync('hierarchy-summary.json', JSON.stringify(hierarchySummary, null, 2));
console.log(`✅ Hierarchy summary generated`);
console.log(`   EPICs with children: ${hierarchySummary.epics_with_children}`);
console.log(`   Total child tasks: ${hierarchySummary.total_child_tasks}`);
