// Generate PlantUML Gantt chart
const fs = require('fs');
const db = JSON.parse(fs.readFileSync('master-task-db.json', 'utf8'));
const levels = JSON.parse(fs.readFileSync('execution-levels.json', 'utf8'));

// Start date
const startDate = '2025-11-19';

let plantuml = `@startgantt
title Miyabi Project - Gantt Chart
scale 1
printscale weekly

`;

// Add legend
plantuml += `legend
|= Priority |= Color |
| P0-Critical | <color:red>Red |
| P1-High | <color:orange>Orange |
| P2-Medium | <color:green>Green |
| P3-Low | <color:blue>Blue |
endlegend

`;

// Group tasks by EPIC
const epics = db.filter(t => t.is_epic && t.state === 'OPEN');
const standalone = db.filter(t => !t.is_epic && !t.parent_id && t.state === 'OPEN');

// Process EPICs
epics.forEach(epic => {
  const children = db.filter(t => t.parent_id === epic.id && t.state === 'OPEN');

  if (children.length === 0) {
    // Epic with no children - treat as single task
    const color = epic.priority.includes('P0') ? 'red' :
                  epic.priority.includes('P1') ? 'orange' :
                  epic.priority.includes('P2') ? 'green' :
                  epic.priority.includes('P3') ? 'blue' : 'gray';

    const days = Math.ceil(epic.estimated_hours / 8);
    const title = epic.title.replace(/\[/g, '(').replace(/]/g, ')').substring(0, 60);

    plantuml += `[#${epic.id} ${title}] as [E${epic.id}] lasts ${days} days\n`;
    plantuml += `[E${epic.id}] is colored in ${color}\n`;
  } else {
    // Epic with children
    const epicTitle = epic.title.replace(/\[/g, '(').replace(/]/g, ')').substring(0, 50);
    plantuml += `\n-- EPIC #${epic.id}: ${epicTitle} --\n`;

    children.forEach((child, idx) => {
      const color = child.priority.includes('P0') ? 'red' :
                    child.priority.includes('P1') ? 'orange' :
                    child.priority.includes('P2') ? 'green' :
                    child.priority.includes('P3') ? 'blue' : 'gray';

      const days = Math.ceil(child.estimated_hours / 8);
      const title = child.title.replace(/\[/g, '(').replace(/]/g, ')').substring(0, 60);

      plantuml += `[#${child.id} ${title}] as [T${child.id}] lasts ${days} days\n`;
      plantuml += `[T${child.id}] is colored in ${color}\n`;

      // Add dependency to previous sibling
      if (idx > 0) {
        const prevChild = children[idx - 1];
        plantuml += `[T${child.id}] starts at [T${prevChild.id}]'s end\n`;
      }
    });
  }
});

// Add standalone tasks (limit to P0-P1)
const importantStandalone = standalone.filter(t =>
  t.priority.includes('P0') || t.priority.includes('P1')
).slice(0, 20); // Limit to avoid too crowded chart

if (importantStandalone.length > 0) {
  plantuml += `\n-- Standalone High-Priority Tasks --\n`;

  importantStandalone.forEach(task => {
    const color = task.priority.includes('P0') ? 'red' :
                  task.priority.includes('P1') ? 'orange' : 'green';

    const days = Math.ceil(task.estimated_hours / 8);
    const title = task.title.replace(/\[/g, '(').replace(/]/g, ')').substring(0, 60);

    plantuml += `[#${task.id} ${title}] as [S${task.id}] lasts ${days} days\n`;
    plantuml += `[S${task.id}] is colored in ${color}\n`;
  });
}

plantuml += `\n@endgantt\n`;

fs.writeFileSync('gantt-chart.puml', plantuml);
console.log('✅ PlantUML Gantt chart generated: gantt-chart.puml');

// Generate simplified EPIC-only version
let epicGantt = `@startgantt
title Miyabi Project - EPIC Overview
scale 1
printscale weekly

`;

epics.forEach((epic, idx) => {
  const color = epic.priority.includes('P0') ? 'red' :
                epic.priority.includes('P1') ? 'orange' :
                epic.priority.includes('P2') ? 'green' : 'blue';

  const days = Math.ceil(epic.estimated_hours / 8);
  const title = epic.title.replace(/\[/g, '(').replace(/]/g, ')').substring(0, 60);

  epicGantt += `[#${epic.id} ${title}] as [E${epic.id}] lasts ${days} days\n`;
  epicGantt += `[E${epic.id}] is colored in ${color}\n`;
});

epicGantt += `\n@endgantt\n`;

fs.writeFileSync('gantt-chart-epics-only.puml', epicGantt);
console.log('✅ EPIC-only Gantt chart generated: gantt-chart-epics-only.puml');

// Generate summary
const summary = {
  total_open_tasks: db.filter(t => t.state === 'OPEN').length,
  total_estimated_hours: db.filter(t => t.state === 'OPEN').reduce((sum, t) => sum + t.estimated_hours, 0),
  estimated_weeks: Math.ceil(db.filter(t => t.state === 'OPEN').reduce((sum, t) => sum + t.estimated_hours, 0) / 40),
  epics: {
    total: epics.length,
    with_children: epics.filter(e => db.some(t => t.parent_id === e.id)).length
  },
  by_priority: {
    p0: db.filter(t => t.state === 'OPEN' && t.priority.includes('P0')).length,
    p1: db.filter(t => t.state === 'OPEN' && t.priority.includes('P1')).length,
    p2: db.filter(t => t.state === 'OPEN' && t.priority.includes('P2')).length,
    p3: db.filter(t => t.state === 'OPEN' && t.priority.includes('P3')).length
  }
};

fs.writeFileSync('gantt-summary.json', JSON.stringify(summary, null, 2));
console.log('✅ Gantt summary generated');
console.log(JSON.stringify(summary, null, 2));
