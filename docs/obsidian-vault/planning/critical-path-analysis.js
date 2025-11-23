// Critical Path Method (CPM) Analysis
const fs = require('fs');

// Load data
const db = JSON.parse(fs.readFileSync('master-task-db.json', 'utf8'));
const graph = JSON.parse(fs.readFileSync('dependency-graph.json', 'utf8'));
const executionOrderArray = JSON.parse(fs.readFileSync('execution-order.json', 'utf8'));

// Filter OPEN tasks only
const openTasks = db.filter(t => t.state === 'OPEN');

// Build task map for quick lookup
const taskMap = {};
openTasks.forEach(task => {
  taskMap[task.id] = {
    ...task,
    earliestStart: 0,
    earliestFinish: 0,
    latestStart: 0,
    latestFinish: 0,
    slack: 0,
    isCritical: false
  };
});

// Build adjacency list from graph edges
const adjacencyList = {};
openTasks.forEach(task => {
  adjacencyList[task.id] = {
    predecessors: [],
    successors: []
  };
});

graph.edges.forEach(edge => {
  if (edge.type === 'child_of' && taskMap[edge.from] && taskMap[edge.to]) {
    // Child tasks depend on their parent
    adjacencyList[edge.from].predecessors.push(edge.to);
    adjacencyList[edge.to].successors.push(edge.from);
  } else if (edge.type === 'depends_on' && taskMap[edge.from] && taskMap[edge.to]) {
    adjacencyList[edge.from].predecessors.push(edge.to);
    adjacencyList[edge.to].successors.push(edge.from);
  }
});

console.log('🔍 CPM Analysis Starting...\n');
console.log(`Total OPEN tasks: ${openTasks.length}`);
console.log(`Total edges: ${graph.edges.length}\n`);

// === FORWARD PASS: Calculate Earliest Start/Finish ===
console.log('📊 Phase 1: Forward Pass (Earliest Times)...');

executionOrderArray.forEach((taskObj, index) => {
  const taskId = taskObj.id;
  const task = taskMap[taskId];
  if (!task) return;

  const predecessors = adjacencyList[taskId].predecessors;

  if (predecessors.length === 0) {
    // No predecessors - can start immediately
    task.earliestStart = 0;
  } else {
    // Start after all predecessors finish
    task.earliestStart = Math.max(
      ...predecessors.map(predId => {
        const pred = taskMap[predId];
        return pred ? pred.earliestFinish : 0;
      })
    );
  }

  task.earliestFinish = task.earliestStart + task.estimated_hours;
});

// Find project duration (max earliest finish)
const projectDuration = Math.max(...openTasks.map(t => taskMap[t.id].earliestFinish));
console.log(`✅ Project Duration: ${projectDuration} hours (${Math.ceil(projectDuration / 40)} weeks)\n`);

// === BACKWARD PASS: Calculate Latest Start/Finish ===
console.log('📊 Phase 2: Backward Pass (Latest Times)...');

// Start from the end
const reversedOrder = [...executionOrderArray].reverse();

reversedOrder.forEach(taskObj => {
  const taskId = taskObj.id;
  const task = taskMap[taskId];
  if (!task) return;

  const successors = adjacencyList[taskId].successors;

  if (successors.length === 0) {
    // No successors - must finish by project end
    task.latestFinish = projectDuration;
  } else {
    // Must finish before earliest successor starts
    task.latestFinish = Math.min(
      ...successors.map(succId => {
        const succ = taskMap[succId];
        return succ ? succ.latestStart : projectDuration;
      })
    );
  }

  task.latestStart = task.latestFinish - task.estimated_hours;
});

// === CALCULATE SLACK AND IDENTIFY CRITICAL PATH ===
console.log('📊 Phase 3: Calculating Slack and Critical Path...');

const criticalTasks = [];
let totalSlack = 0;

openTasks.forEach(task => {
  const t = taskMap[task.id];
  t.slack = t.latestStart - t.earliestStart;

  // Tasks with zero (or near-zero) slack are critical
  if (t.slack < 0.01) {
    t.isCritical = true;
    criticalTasks.push(t);
  }

  totalSlack += t.slack;
});

console.log(`✅ Critical Path identified: ${criticalTasks.length} tasks\n`);

// === GENERATE REPORTS ===

// Critical Path Tasks
const criticalPathReport = {
  project_duration_hours: projectDuration,
  project_duration_weeks: Math.ceil(projectDuration / 40),
  critical_task_count: criticalTasks.length,
  total_task_count: openTasks.length,
  critical_percentage: Math.round((criticalTasks.length / openTasks.length) * 100),
  critical_tasks: criticalTasks.map(t => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    estimated_hours: t.estimated_hours,
    earliest_start: t.earliestStart,
    earliest_finish: t.earliestFinish,
    is_epic: t.is_epic
  })).sort((a, b) => a.earliest_start - b.earliest_start)
};

fs.writeFileSync('critical-path.json', JSON.stringify(criticalPathReport, null, 2));
console.log('✅ Critical path report saved: critical-path.json');

// All tasks with timing data
const allTasksWithTiming = openTasks.map(task => {
  const t = taskMap[task.id];
  return {
    id: t.id,
    title: t.title,
    priority: t.priority,
    estimated_hours: t.estimated_hours,
    is_epic: t.is_epic,
    earliest_start: t.earliestStart,
    earliest_finish: t.earliestFinish,
    latest_start: t.latestStart,
    latest_finish: t.latestFinish,
    slack: t.slack,
    is_critical: t.isCritical
  };
}).sort((a, b) => a.earliest_start - b.earliest_start);

fs.writeFileSync('tasks-with-timing.json', JSON.stringify(allTasksWithTiming, null, 2));
console.log('✅ Full timing data saved: tasks-with-timing.json');

// Slack distribution analysis
const slackBuckets = {
  zero: [], // 0 hours (critical)
  low: [],  // 0-8 hours
  medium: [], // 8-40 hours
  high: []  // 40+ hours
};

openTasks.forEach(task => {
  const t = taskMap[task.id];
  if (t.slack < 0.01) slackBuckets.zero.push(t.id);
  else if (t.slack < 8) slackBuckets.low.push(t.id);
  else if (t.slack < 40) slackBuckets.medium.push(t.id);
  else slackBuckets.high.push(t.id);
});

const slackDistribution = {
  zero_slack: slackBuckets.zero.length,
  low_slack: slackBuckets.low.length,
  medium_slack: slackBuckets.medium.length,
  high_slack: slackBuckets.high.length,
  average_slack: Math.round(totalSlack / openTasks.length * 10) / 10
};

fs.writeFileSync('slack-distribution.json', JSON.stringify(slackDistribution, null, 2));
console.log('✅ Slack distribution saved: slack-distribution.json');

// Generate Markdown Report
let markdown = `# Critical Path Analysis Report

**Generated**: ${new Date().toISOString().split('T')[0]}
**Total Tasks**: ${openTasks.length} (OPEN only)
**Project Duration**: ${projectDuration} hours (${Math.ceil(projectDuration / 40)} weeks)

---

## 🔴 Critical Path (${criticalTasks.length} tasks)

These tasks have **zero slack** and directly impact project completion time.

| ID | Title | Priority | Hours | Earliest Start | Earliest Finish |
|----|-------|----------|-------|----------------|-----------------|
`;

criticalPathReport.critical_tasks.forEach(task => {
  const title = task.title.substring(0, 60);
  markdown += `| #${task.id} | ${title} | ${task.priority} | ${task.estimated_hours}h | ${Math.round(task.earliest_start)}h | ${Math.round(task.earliest_finish)}h |\n`;
});

markdown += `\n---\n\n## 📊 Slack Distribution\n\n`;
markdown += `- **Zero Slack (Critical)**: ${slackDistribution.zero_slack} tasks\n`;
markdown += `- **Low Slack (< 8h)**: ${slackDistribution.low_slack} tasks\n`;
markdown += `- **Medium Slack (8-40h)**: ${slackDistribution.medium_slack} tasks\n`;
markdown += `- **High Slack (40h+)**: ${slackDistribution.high_slack} tasks\n`;
markdown += `- **Average Slack**: ${slackDistribution.average_slack} hours\n\n`;

markdown += `---\n\n## 🎯 Top 10 Tasks by Earliest Start Time\n\n`;
markdown += `| ID | Title | Priority | Hours | Slack | Critical |\n`;
markdown += `|----|-------|----------|-------|-------|----------|\n`;

allTasksWithTiming.slice(0, 10).forEach(task => {
  const title = task.title.substring(0, 50);
  const critical = task.is_critical ? '🔴' : '⚪';
  markdown += `| #${task.id} | ${title} | ${task.priority} | ${task.estimated_hours}h | ${Math.round(task.slack)}h | ${critical} |\n`;
});

markdown += `\n---\n\n## 📈 Summary\n\n`;
markdown += `**Critical Path Percentage**: ${criticalPathReport.critical_percentage}% of total tasks\n\n`;
markdown += `**Key Insights**:\n`;
markdown += `- ${criticalTasks.length} tasks are on the critical path and require close monitoring\n`;
markdown += `- ${slackBuckets.low.length} tasks have minimal slack (< 8h) and are at risk\n`;
markdown += `- ${slackBuckets.high.length} tasks have high flexibility (40h+ slack)\n`;
markdown += `- Project completion time: ${Math.ceil(projectDuration / 40)} weeks\n`;

fs.writeFileSync('critical-path-report.md', markdown);
console.log('✅ Markdown report saved: critical-path-report.md\n');

// Print Summary
console.log('📋 SUMMARY:');
console.log(`   Critical Tasks: ${criticalTasks.length}/${openTasks.length} (${criticalPathReport.critical_percentage}%)`);
console.log(`   Project Duration: ${projectDuration}h (${Math.ceil(projectDuration / 40)} weeks)`);
console.log(`   Average Slack: ${slackDistribution.average_slack}h`);
console.log('');
console.log('✅ Critical Path Analysis Complete!');
