// Generate sprint plan
const fs = require('fs');
const db = JSON.parse(fs.readFileSync('master-task-db.json', 'utf8'));
const levels = JSON.parse(fs.readFileSync('execution-levels.json', 'utf8'));

// Sprint configuration
const SPRINT_DURATION_WEEKS = 2;
const SPRINT_HOURS = 80; // 2 weeks * 40 hours/week

// Get open tasks sorted by priority
const openTasks = db.filter(t => t.state === 'OPEN').sort((a, b) => {
  const aPrio = a.priority.includes('P0') ? 0 :
                a.priority.includes('P1') ? 1 :
                a.priority.includes('P2') ? 2 :
                a.priority.includes('P3') ? 3 : 4;
  const bPrio = b.priority.includes('P0') ? 0 :
                b.priority.includes('P1') ? 1 :
                b.priority.includes('P2') ? 2 :
                b.priority.includes('P3') ? 3 : 4;
  return aPrio - bPrio;
});

// Allocate to sprints
const sprints = [];
let currentSprint = {
  number: 1,
  start_date: '2025-11-19',
  tasks: [],
  total_hours: 0,
  by_priority: { p0: 0, p1: 0, p2: 0, p3: 0 }
};

openTasks.forEach(task => {
  // Check if adding this task exceeds sprint capacity
  if (currentSprint.total_hours + task.estimated_hours > SPRINT_HOURS && currentSprint.tasks.length > 0) {
    // Finalize current sprint
    sprints.push({...currentSprint});

    // Start new sprint
    const sprintNum = sprints.length + 1;
    const startDate = new Date('2025-11-19');
    startDate.setDate(startDate.getDate() + (sprintNum - 1) * 14);

    currentSprint = {
      number: sprintNum,
      start_date: startDate.toISOString().split('T')[0],
      tasks: [],
      total_hours: 0,
      by_priority: { p0: 0, p1: 0, p2: 0, p3: 0 }
    };
  }

  // Add task to current sprint
  currentSprint.tasks.push({
    id: task.id,
    title: task.title,
    priority: task.priority,
    estimated_hours: task.estimated_hours
  });

  currentSprint.total_hours += task.estimated_hours;

  if (task.priority.includes('P0')) currentSprint.by_priority.p0++;
  else if (task.priority.includes('P1')) currentSprint.by_priority.p1++;
  else if (task.priority.includes('P2')) currentSprint.by_priority.p2++;
  else if (task.priority.includes('P3')) currentSprint.by_priority.p3++;
});

// Add final sprint
if (currentSprint.tasks.length > 0) {
  sprints.push(currentSprint);
}

fs.writeFileSync('sprint-plan.json', JSON.stringify(sprints, null, 2));
console.log(`✅ Sprint plan generated: ${sprints.length} sprints`);

// Generate Markdown sprint board
let markdown = `# Miyabi Project - Sprint Plan

**Generated**: ${new Date().toISOString().split('T')[0]}
**Total Sprints**: ${sprints.length}
**Sprint Duration**: ${SPRINT_DURATION_WEEKS} weeks
**Total Estimated Duration**: ${sprints.length * SPRINT_DURATION_WEEKS} weeks

---

`;

sprints.forEach(sprint => {
  const endDate = new Date(sprint.start_date);
  endDate.setDate(endDate.getDate() + 14);

  markdown += `## Sprint ${sprint.number}: ${sprint.start_date} - ${endDate.toISOString().split('T')[0]}

**Total Hours**: ${sprint.total_hours}h
**Tasks**: ${sprint.tasks.length}
**By Priority**: P0: ${sprint.by_priority.p0}, P1: ${sprint.by_priority.p1}, P2: ${sprint.by_priority.p2}, P3: ${sprint.by_priority.p3}

### Tasks

`;

  sprint.tasks.forEach(task => {
    markdown += `- [ ] **#${task.id}** ${task.title} (${task.estimated_hours}h) - ${task.priority}\n`;
  });

  markdown += `\n---\n\n`;
});

fs.writeFileSync('sprint-plan.md', markdown);
console.log('✅ Sprint board markdown generated: sprint-plan.md');

// Summary
const sprintSummary = {
  total_sprints: sprints.length,
  total_weeks: sprints.length * SPRINT_DURATION_WEEKS,
  total_tasks: openTasks.length,
  total_hours: openTasks.reduce((sum, t) => sum + t.estimated_hours, 0),
  average_tasks_per_sprint: Math.round(openTasks.length / sprints.length * 10) / 10,
  average_hours_per_sprint: Math.round(openTasks.reduce((sum, t) => sum + t.estimated_hours, 0) / sprints.length * 10) / 10
};

fs.writeFileSync('sprint-summary.json', JSON.stringify(sprintSummary, null, 2));
console.log('✅ Sprint summary generated');
console.log(JSON.stringify(sprintSummary, null, 2));
