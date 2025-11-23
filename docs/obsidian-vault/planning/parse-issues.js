// Parse GitHub Issues - Extract structured metadata
const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('issues-raw-20251119.json', 'utf8'));

const tasks = raw.map(issue => {
  // Extract priority from labels
  const priority = issue.labels.find(l =>
    l.name.includes('priority:') ||
    l.name.includes('P0') ||
    l.name.includes('P1') ||
    l.name.includes('P2') ||
    l.name.includes('P3')
  )?.name || 'no-priority';

  // Extract type from labels
  const type = issue.labels.find(l =>
    l.name.includes('type:') ||
    l.name.startsWith('✨') ||
    l.name.startsWith('🐛') ||
    l.name.startsWith('📚') ||
    l.name.startsWith('🔧')
  )?.name || 'no-type';

  // Extract phase from labels
  const phase = issue.labels.find(l =>
    l.name.includes('phase:')
  )?.name || 'no-phase';

  return {
    id: issue.number,
    title: issue.title,
    state: issue.state,
    priority: priority,
    type: type,
    phase: phase,
    labels: issue.labels.map(l => l.name),
    assignees: issue.assignees.map(a => a.login),
    milestone: issue.milestone?.title || null,
    created: issue.createdAt,
    updated: issue.updatedAt,
    closed: issue.closedAt,
    body: issue.body || '',
    comments_count: issue.comments?.length || 0
  };
});

// Sort by priority
const priorityOrder = ['P0', 'P1', 'P2', 'P3'];
tasks.sort((a, b) => {
  const aIdx = priorityOrder.findIndex(p => a.priority.includes(p));
  const bIdx = priorityOrder.findIndex(p => b.priority.includes(p));
  if (aIdx === -1 && bIdx === -1) return 0;
  if (aIdx === -1) return 1;
  if (bIdx === -1) return -1;
  return aIdx - bIdx;
});

fs.writeFileSync('tasks-structured.json', JSON.stringify(tasks, null, 2));
console.log(`✅ Parsed ${tasks.length} tasks`);

// Generate summary
const summary = {
  total: tasks.length,
  by_priority: {},
  by_type: {},
  by_state: {},
  by_phase: {}
};

tasks.forEach(t => {
  summary.by_priority[t.priority] = (summary.by_priority[t.priority] || 0) + 1;
  summary.by_type[t.type] = (summary.by_type[t.type] || 0) + 1;
  summary.by_state[t.state] = (summary.by_state[t.state] || 0) + 1;
  summary.by_phase[t.phase] = (summary.by_phase[t.phase] || 0) + 1;
});

fs.writeFileSync('tasks-summary.json', JSON.stringify(summary, null, 2));
console.log('✅ Summary generated');
console.log(JSON.stringify(summary, null, 2));
