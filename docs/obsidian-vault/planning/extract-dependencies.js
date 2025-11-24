// Extract dependency information from issue bodies
const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('tasks-structured.json', 'utf8'));

// Dependency extraction patterns
const dependencyPatterns = [
  { type: 'depends_on', regex: /depends on #?(\d+)/gi },
  { type: 'blocked_by', regex: /blocked by #?(\d+)/gi },
  { type: 'requires', regex: /requires #?(\d+)/gi },
  { type: 'after', regex: /after #?(\d+)/gi },
  { type: 'prerequisite', regex: /prerequisite:?\s*#?(\d+)/gi },
  { type: 'needs', regex: /needs #?(\d+)/gi }
];

const dependencies = {};

tasks.forEach(task => {
  const body = task.body || '';
  const title = task.title || '';
  const fullText = body + ' ' + title;

  dependencies[task.id] = {
    issue_id: task.id,
    title: task.title,
    depends_on: [],
    blocked_by: [],
    blocks: [],  // Reverse relationship
    prerequisites: []
  };

  dependencyPatterns.forEach(({ type, regex }) => {
    const matches = fullText.matchAll(regex);

    for (const match of matches) {
      const depId = parseInt(match[1]);

      // Validate dependency exists
      if (tasks.find(t => t.id === depId)) {
        if (type === 'depends_on' || type === 'requires' || type === 'needs') {
          dependencies[task.id].depends_on.push(depId);
        } else if (type === 'blocked_by') {
          dependencies[task.id].blocked_by.push(depId);
        } else if (type === 'after' || type === 'prerequisite') {
          dependencies[task.id].prerequisites.push(depId);
        }
      }
    }
  });

  // Remove duplicates
  dependencies[task.id].depends_on = [...new Set(dependencies[task.id].depends_on)];
  dependencies[task.id].blocked_by = [...new Set(dependencies[task.id].blocked_by)];
  dependencies[task.id].prerequisites = [...new Set(dependencies[task.id].prerequisites)];
});

// Build reverse relationships (blocks)
Object.keys(dependencies).forEach(taskId => {
  const tid = parseInt(taskId);
  const deps = dependencies[taskId];

  [...deps.depends_on, ...deps.blocked_by, ...deps.prerequisites].forEach(depId => {
    if (dependencies[depId]) {
      dependencies[depId].blocks.push(tid);
    }
  });
});

// Remove duplicate blocks
Object.keys(dependencies).forEach(taskId => {
  dependencies[taskId].blocks = [...new Set(dependencies[taskId].blocks)];
});

fs.writeFileSync('task-dependencies.json', JSON.stringify(dependencies, null, 2));
console.log(`✅ Dependencies extracted for ${Object.keys(dependencies).length} tasks`);

// Generate dependency statistics
const stats = {
  total_tasks: Object.keys(dependencies).length,
  tasks_with_dependencies: Object.values(dependencies).filter(d =>
    d.depends_on.length > 0 || d.blocked_by.length > 0 || d.prerequisites.length > 0
  ).length,
  tasks_blocking_others: Object.values(dependencies).filter(d => d.blocks.length > 0).length,
  total_dependency_links: Object.values(dependencies).reduce((sum, d) =>
    sum + d.depends_on.length + d.blocked_by.length + d.prerequisites.length, 0
  ),
  most_dependencies: Object.values(dependencies)
    .sort((a, b) =>
      (b.depends_on.length + b.blocked_by.length + b.prerequisites.length) -
      (a.depends_on.length + a.blocked_by.length + a.prerequisites.length)
    )
    .slice(0, 10)
    .map(d => ({
      id: d.issue_id,
      title: d.title,
      dependency_count: d.depends_on.length + d.blocked_by.length + d.prerequisites.length,
      depends_on: d.depends_on,
      blocked_by: d.blocked_by,
      prerequisites: d.prerequisites
    }))
};

fs.writeFileSync('dependency-stats.json', JSON.stringify(stats, null, 2));
console.log('✅ Dependency statistics generated');
console.log(`   Tasks with dependencies: ${stats.tasks_with_dependencies}`);
console.log(`   Tasks blocking others: ${stats.tasks_blocking_others}`);
console.log(`   Total dependency links: ${stats.total_dependency_links}`);
