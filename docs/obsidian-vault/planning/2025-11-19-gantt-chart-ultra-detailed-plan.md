---
title: "Miyabi Gantt Chart Creation - Ultra Detailed Plan"
created: 2025-11-19
updated: 2025-11-19
author: "Claude Code - Orchestrator"
category: "planning"
tags: ["miyabi", "gantt-chart", "project-planning", "task-decomposition"]
status: "draft"
---

# 📊 Miyabi Gantt Chart Creation - Ultra Detailed Task Breakdown

**Project Goal**: Create comprehensive Gantt chart for all 100 GitHub Issues with dependency mapping, critical path analysis, and sprint planning

**Total Estimated Time**: 4-5 hours
**Breakdown**: 7 major phases, 50+ granular tasks

---

## 🎯 Phase 1: Data Collection & Extraction (90 minutes)

### Task 1.1: Export GitHub Issues to JSON (10 min)

**Objective**: Download all 100 issues with complete metadata

**Prerequisites**:
- GitHub CLI (`gh`) installed and authenticated
- Network connection active
- Write permission to local filesystem

**Commands**:
```bash
# Set working directory
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/docs/obsidian-vault/planning

# Export issues with all fields
gh issue list \
  --limit 100 \
  --state all \
  --json number,title,state,body,labels,assignees,milestone,createdAt,updatedAt,closedAt,comments \
  > issues-raw-$(date +%Y%m%d).json

# Verify file creation
ls -lh issues-raw-*.json
wc -l issues-raw-*.json
```

**Expected Output**:
- File: `issues-raw-20251119.json`
- Size: ~500KB - 2MB
- Format: JSON array with 100 objects

**Validation**:
```bash
# Check JSON validity
cat issues-raw-20251119.json | jq '.' > /dev/null && echo "✅ Valid JSON" || echo "❌ Invalid JSON"

# Count issues
cat issues-raw-20251119.json | jq 'length'
# Expected: 100

# Sample first issue
cat issues-raw-20251119.json | jq '.[0]'
```

**Success Criteria**:
- ✅ File exists
- ✅ Valid JSON format
- ✅ 100 issues present
- ✅ All required fields populated

---

### Task 1.2: Parse and Extract Core Metadata (15 min)

**Objective**: Transform raw JSON into structured task list with essential fields

**Input**: `issues-raw-20251119.json`

**Script**: Create `parse-issues.js`

```javascript
// File: parse-issues.js
const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('issues-raw-20251119.json', 'utf8'));

const tasks = raw.map(issue => {
  // Extract priority from labels
  const priority = issue.labels.find(l =>
    l.name.includes('priority:') ||
    l.name.includes('P0') ||
    l.name.includes('P1')
  )?.name || 'no-priority';

  // Extract type from labels
  const type = issue.labels.find(l =>
    l.name.includes('type:') ||
    l.name.startsWith('✨') ||
    l.name.startsWith('🐛')
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
```

**Execution**:
```bash
# Run parser
node parse-issues.js

# Verify output
ls -lh tasks-structured.json tasks-summary.json

# View summary
cat tasks-summary.json | jq '.'
```

**Expected Output**:
- `tasks-structured.json` - 100 tasks with normalized fields
- `tasks-summary.json` - Statistical summary

**Validation**:
```bash
# Check task count
cat tasks-structured.json | jq 'length'

# Check priorities distribution
cat tasks-summary.json | jq '.by_priority'

# Sample first 3 tasks
cat tasks-structured.json | jq '.[0:3]'
```

**Success Criteria**:
- ✅ 100 tasks extracted
- ✅ All priority labels normalized
- ✅ Summary statistics generated

---

### Task 1.3: Identify EPIC Issues and Hierarchies (15 min)

**Objective**: Build parent-child relationship map for EPIC issues

**Method**: Scan issue bodies for keywords and references

**Script**: `identify-epics.js`

```javascript
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

  // Find dependency references
  const matches = body.matchAll(/#(\d+)/g);
  const references = Array.from(matches).map(m => parseInt(m[1]));

  // Check if referenced issues are EPICs
  references.forEach(ref => {
    if (epics.includes(ref)) {
      if (!hierarchy[ref]) {
        hierarchy[ref] = { children: [], type: 'epic' };
      }
      hierarchy[ref].children.push(task.id);
    }
  });

  // Check for explicit parent declarations
  const parentMatch = body.match(/parent:\s*#?(\d+)/i);
  if (parentMatch) {
    const parentId = parseInt(parentMatch[1]);
    if (!hierarchy[parentId]) {
      hierarchy[parentId] = { children: [], type: 'epic' };
    }
    hierarchy[parentId].children.push(task.id);
  }
});

// Remove duplicates from children
Object.keys(hierarchy).forEach(epicId => {
  hierarchy[epicId].children = [...new Set(hierarchy[epicId].children)];
});

fs.writeFileSync('task-hierarchy.json', JSON.stringify(hierarchy, null, 2));
console.log(`✅ Identified ${epics.length} EPIC issues`);
console.log('EPIC IDs:', epics);

// Generate hierarchy summary
const hierarchySummary = {
  total_epics: epics.length,
  epics_with_children: Object.keys(hierarchy).filter(id => hierarchy[id].children.length > 0).length,
  total_child_tasks: Object.values(hierarchy).reduce((sum, epic) => sum + epic.children.length, 0),
  details: epics.map(id => ({
    epic_id: id,
    epic_title: tasks.find(t => t.id === id)?.title,
    children_count: hierarchy[id]?.children.length || 0,
    children: hierarchy[id]?.children || []
  }))
};

fs.writeFileSync('hierarchy-summary.json', JSON.stringify(hierarchySummary, null, 2));
console.log('✅ Hierarchy summary generated');
```

**Execution**:
```bash
node identify-epics.js

# View hierarchy
cat task-hierarchy.json | jq '.'

# View summary
cat hierarchy-summary.json | jq '.'
```

**Expected Output**:
- `task-hierarchy.json` - Parent-child mappings
- `hierarchy-summary.json` - EPIC statistics

**Manual Verification List**:
```bash
# Known EPICs to verify:
# #970 - Miyabi Society 完全再構築
# #1018 - M1 Infrastructure Blitz
# #977 - Master Coordination

cat hierarchy-summary.json | jq '.details[] | select(.epic_id == 970 or .epic_id == 1018 or .epic_id == 977)'
```

**Success Criteria**:
- ✅ Major EPICs identified (#970, #1018, #977)
- ✅ Child relationships mapped
- ✅ No circular references

---

### Task 1.4: Extract Dependency Information (20 min)

**Objective**: Parse issue bodies for explicit dependencies (blocks, depends on, etc.)

**Dependency Keywords**:
- "depends on #XXX"
- "blocked by #XXX"
- "requires #XXX"
- "after #XXX"
- "prerequisite: #XXX"

**Script**: `extract-dependencies.js`

```javascript
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
      (b.depends_on.length + b.blocked_by.length) - (a.depends_on.length + a.blocked_by.length)
    )
    .slice(0, 10)
    .map(d => ({
      id: d.issue_id,
      title: d.title,
      dependency_count: d.depends_on.length + d.blocked_by.length + d.prerequisites.length,
      depends_on: d.depends_on,
      blocked_by: d.blocked_by
    }))
};

fs.writeFileSync('dependency-stats.json', JSON.stringify(stats, null, 2));
console.log('✅ Dependency statistics generated');
```

**Execution**:
```bash
node extract-dependencies.js

# View dependencies
cat task-dependencies.json | jq '.' | head -50

# View statistics
cat dependency-stats.json | jq '.'

# Check specific high-priority issues
cat task-dependencies.json | jq '.["970"], .["1018"], .["977"]'
```

**Expected Output**:
- `task-dependencies.json` - Full dependency graph
- `dependency-stats.json` - Dependency metrics

**Validation Queries**:
```bash
# Find tasks with most dependencies
cat dependency-stats.json | jq '.most_dependencies'

# Count isolated tasks (no dependencies)
cat task-dependencies.json | jq '[.[] | select((.depends_on | length) == 0 and (.blocked_by | length) == 0)] | length'

# Find circular dependency candidates
# (Tasks that depend on each other)
```

**Success Criteria**:
- ✅ All dependency keywords detected
- ✅ Bidirectional relationships (blocks ↔ depends_on)
- ✅ Statistics generated

---

### Task 1.5: Create Master Task Database (15 min)

**Objective**: Merge all extracted data into unified CSV/JSON database

**Input Files**:
- `tasks-structured.json`
- `task-hierarchy.json`
- `task-dependencies.json`

**Script**: `create-master-db.js`

```javascript
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
    if (hierarchy[epicId].children.includes(tid)) {
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
  task.priority,
  task.type,
  task.phase,
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
  average_hours_per_task: masterDB.reduce((sum, t) => sum + (t.estimated_hours || 0), 0) / masterDB.length
};

console.log('\n📊 Database Summary:');
console.log(JSON.stringify(summary, null, 2));

fs.writeFileSync('master-db-summary.json', JSON.stringify(summary, null, 2));
```

**Execution**:
```bash
node create-master-db.js

# Verify outputs
ls -lh master-task-db.*

# View summary
cat master-db-summary.json | jq '.'

# Sample records
cat master-task-db.json | jq '.[0:3]'

# Open CSV in default viewer (macOS)
open master-task-db.csv
```

**Expected Output**:
- `master-task-db.json` - Complete unified database
- `master-task-db.csv` - Excel/Sheets compatible
- `master-db-summary.json` - Database statistics

**Success Criteria**:
- ✅ 100 tasks in database
- ✅ All relationships preserved
- ✅ Estimated hours for all tasks
- ✅ CSV opens in Excel/Sheets

---

## ✅ Phase 1 Checkpoint

**Deliverables**:
1. ✅ `issues-raw-20251119.json` - Raw GitHub data
2. ✅ `tasks-structured.json` - Normalized tasks
3. ✅ `task-hierarchy.json` - EPIC relationships
4. ✅ `task-dependencies.json` - Dependency graph
5. ✅ `master-task-db.json` - Unified database
6. ✅ `master-task-db.csv` - Spreadsheet export

**Validation**:
```bash
# Count all generated files
ls -1 *.json *.csv | wc -l
# Expected: 10+ files

# Total size
du -sh .
# Expected: ~5-10MB
```

---

## 🎯 Phase 2: Dependency Graph Construction (60 minutes)

### Task 2.1: Build Adjacency List (10 min)

**Objective**: Create graph data structure for dependency analysis

**Script**: `build-graph.js`

```javascript
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
  if (['depends_on', 'blocked_by', 'prerequisite'].includes(edge.type)) {
    adjacencyList[edge.from].successors.push(edge.to);
    adjacencyList[edge.to].predecessors.push(edge.from);
  }
});

fs.writeFileSync('adjacency-list.json', JSON.stringify(adjacencyList, null, 2));
console.log('✅ Adjacency list created');
```

**Execution**:
```bash
node build-graph.js

# Verify
cat dependency-graph.json | jq '.nodes | length, .edges | length'
```

**Expected Output**:
- `dependency-graph.json` - Graph structure
- `adjacency-list.json` - For traversal algorithms

**Success Criteria**:
- ✅ All 100 nodes present
- ✅ All dependencies as edges
- ✅ No duplicate edges

---

### Task 2.2: Detect Circular Dependencies (15 min)

**Objective**: Find and report cycles in dependency graph

**Algorithm**: Depth-First Search (DFS) with cycle detection

**Script**: `detect-cycles.js`

```javascript
const fs = require('fs');
const adjacencyList = JSON.parse(fs.readFileSync('adjacency-list.json', 'utf8'));
const db = JSON.parse(fs.readFileSync('master-task-db.json', 'utf8'));

// DFS-based cycle detection
function detectCycles(adjList) {
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(node, path = []) {
    if (recursionStack.has(node)) {
      // Cycle detected
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat(node);
      cycles.push(cycle);
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const successors = adjList[node]?.successors || [];
    successors.forEach(successor => {
      dfs(successor, [...path]);
    });

    recursionStack.delete(node);
  }

  // Run DFS from each unvisited node
  Object.keys(adjList).forEach(nodeId => {
    if (!visited.has(parseInt(nodeId))) {
      dfs(parseInt(nodeId));
    }
  });

  return cycles;
}

const cycles = detectCycles(adjacencyList);

if (cycles.length === 0) {
  console.log('✅ No circular dependencies detected');
  fs.writeFileSync('cycles-report.json', JSON.stringify({
    has_cycles: false,
    cycles: []
  }, null, 2));
} else {
  console.log(`⚠️  Found ${cycles.length} circular dependencies:`);

  const report = {
    has_cycles: true,
    cycle_count: cycles.length,
    cycles: cycles.map(cycle => ({
      length: cycle.length,
      tasks: cycle.map(id => {
        const task = db.find(t => t.id === id);
        return {
          id: id,
          title: task?.title || 'Unknown'
        };
      }),
      task_ids: cycle
    }))
  };

  console.log(JSON.stringify(report, null, 2));
  fs.writeFileSync('cycles-report.json', JSON.stringify(report, null, 2));

  console.log('\n⚠️  WARNING: Circular dependencies must be resolved before scheduling');
}
```

**Execution**:
```bash
node detect-cycles.js

# View report
cat cycles-report.json | jq '.'
```

**Expected Output**:
- `cycles-report.json` - Cycle detection results

**Possible Outcomes**:

**Case 1: No cycles**
```json
{
  "has_cycles": false,
  "cycles": []
}
```

**Case 2: Cycles found**
```json
{
  "has_cycles": true,
  "cycle_count": 2,
  "cycles": [
    {
      "length": 3,
      "tasks": [
        { "id": 100, "title": "Task A" },
        { "id": 101, "title": "Task B" },
        { "id": 102, "title": "Task C" }
      ]
    }
  ]
}
```

**Manual Resolution** (if cycles found):
1. Review each cycle
2. Identify incorrect dependency
3. Update GitHub Issue to remove false dependency
4. Re-run extraction from Task 1.4

**Success Criteria**:
- ✅ Cycle detection runs successfully
- ✅ If cycles found, resolution plan documented

---

### Task 2.3: Topological Sort (15 min)

**Objective**: Determine valid execution order (if no cycles)

**Algorithm**: Kahn's algorithm (BFS-based topological sort)

**Script**: `topological-sort.js`

```javascript
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

    const successors = adjList[current]?.successors || [];
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

// Group by execution level (tasks with no dependencies first, etc.)
const levels = [];
let currentLevel = 0;
const processed = new Set();

while (processed.size < executionOrder.length) {
  const levelTasks = executionOrder.filter(task => {
    if (processed.has(task.id)) return false;
    // All dependencies must be processed
    return task.depends_on.every(depId => processed.has(depId));
  });

  if (levelTasks.length === 0) break; // Should not happen if no cycles

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
console.log('Level breakdown:');
levels.forEach(level => {
  console.log(`  Level ${level.level}: ${level.task_count} tasks, ${level.total_hours}h`);
});
```

**Execution**:
```bash
node topological-sort.js

# View execution order
cat execution-order.json | jq '.[0:10]'

# View levels
cat execution-levels.json | jq '.'
```

**Expected Output**:
- `execution-order.json` - Tasks in dependency-respecting order
- `execution-levels.json` - Parallel execution groups

**Validation**:
```bash
# Check that P0 tasks are not late in order
cat execution-order.json | jq '[.[] | select(.priority | contains("P0"))] | map(.order)'

# Check first level (should be independent tasks)
cat execution-levels.json | jq '.[0]'
```

**Success Criteria**:
- ✅ All 100 tasks in sorted order
- ✅ Execution levels defined
- ✅ No dependency violations

---

### Task 2.4: Generate Mermaid Dependency Graph (15 min)

**Objective**: Create visual dependency graph in Mermaid format

**Script**: `generate-mermaid-graph.js`

```javascript
const fs = require('fs');
const graph = JSON.parse(fs.readFileSync('dependency-graph.json', 'utf8'));
const db = JSON.parse(fs.readFileSync('master-task-db.json', 'utf8'));

// Mermaid graph header
let mermaid = `graph TD\n`;

// Add nodes with styling based on priority
graph.nodes.forEach(node => {
  const task = db.find(t => t.id === node.id);

  // Truncate long titles
  const shortTitle = task.title.length > 40
    ? task.title.substring(0, 37) + '...'
    : task.title;

  // Escape special characters
  const escapedTitle = shortTitle.replace(/"/g, '&quot;').replace(/\[/g, '\\[').replace(/]/g, '\\]');

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
console.log(`   File: dependency-graph.mmd`);

// Also generate a simplified version (EPICs only)
const epicNodes = graph.nodes.filter(n => {
  const task = db.find(t => t.id === n.id);
  return task.is_epic;
});

const epicEdges = graph.edges.filter(e =>
  epicNodes.some(n => n.id === e.from) && epicNodes.some(n => n.id === e.to)
);

let epicMermaid = `graph TD\n`;
epicNodes.forEach(node => {
  const task = db.find(t => t.id === node.id);
  const shortTitle = task.title.substring(0, 40);
  epicMermaid += `  I${node.id}[["#${node.id} ${shortTitle}"]]:::p0\n`;
});

epicEdges.forEach(edge => {
  epicMermaid += `  I${edge.from} --> I${edge.to}\n`;
});

epicMermaid += `\nclassDef p0 fill:#ff6b6b,stroke:#c92a2a,stroke-width:3px,color:#fff\n`;

fs.writeFileSync('dependency-graph-epics-only.mmd', epicMermaid);
console.log('✅ Simplified EPIC-only graph generated');
```

**Execution**:
```bash
node generate-mermaid-graph.js

# View files
ls -lh *.mmd

# Preview in Obsidian or GitHub
# Copy content and paste into Mermaid Live Editor: https://mermaid.live
cat dependency-graph.mmd | pbcopy  # macOS clipboard
```

**Expected Output**:
- `dependency-graph.mmd` - Full graph (all 100 tasks)
- `dependency-graph-epics-only.mmd` - High-level view (EPICs only)

**Validation**:
```bash
# Count nodes in Mermaid file
grep -c "^  I[0-9]" dependency-graph.mmd

# Count edges
grep -c " --> " dependency-graph.mmd
```

**Success Criteria**:
- ✅ Mermaid syntax valid
- ✅ All tasks represented
- ✅ Color-coded by priority
- ✅ Renders correctly in viewer

---

### Task 2.5: Validate Graph Structure (5 min)

**Objective**: Run final validation checks on graph

**Validation Script**: `validate-graph.js`

```javascript
const fs = require('fs');
const graph = JSON.parse(fs.readFileSync('dependency-graph.json', 'utf8'));
const db = JSON.parse(fs.readFileSync('master-task-db.json', 'utf8'));

const validations = {
  total_checks: 0,
  passed: 0,
  failed: 0,
  checks: []
};

function check(name, condition, details = '') {
  validations.total_checks++;
  const passed = condition;
  if (passed) validations.passed++;
  else validations.failed++;

  validations.checks.push({
    name,
    passed,
    details
  });

  console.log(passed ? '✅' : '❌', name, details);
}

// Check 1: All tasks have nodes
check(
  'All tasks have nodes in graph',
  db.length === graph.nodes.length,
  `DB: ${db.length}, Graph: ${graph.nodes.length}`
);

// Check 2: No orphaned edges
const nodeIds = new Set(graph.nodes.map(n => n.id));
const orphanedEdges = graph.edges.filter(e =>
  !nodeIds.has(e.from) || !nodeIds.has(e.to)
);
check(
  'No orphaned edges',
  orphanedEdges.length === 0,
  `Found: ${orphanedEdges.length}`
);

// Check 3: All dependencies are valid
let invalidDeps = 0;
db.forEach(task => {
  [...task.depends_on, ...task.blocked_by, ...task.prerequisites].forEach(depId => {
    if (!db.find(t => t.id === depId)) invalidDeps++;
  });
});
check(
  'All dependencies reference existing tasks',
  invalidDeps === 0,
  `Invalid: ${invalidDeps}`
);

// Check 4: EPICs have children
const epics = db.filter(t => t.is_epic);
const epicsWithoutChildren = epics.filter(e =>
  e.children_ids.length === 0
);
check(
  'All EPICs have children',
  epicsWithoutChildren.length === 0,
  `EPICs without children: ${epicsWithoutChildren.length}`
);

// Check 5: No self-dependencies
let selfDeps = 0;
db.forEach(task => {
  if (task.depends_on.includes(task.id)) selfDeps++;
  if (task.blocked_by.includes(task.id)) selfDeps++;
});
check(
  'No self-dependencies',
  selfDeps === 0,
  `Self-deps found: ${selfDeps}`
);

// Summary
console.log('\n📊 Validation Summary:');
console.log(`Total checks: ${validations.total_checks}`);
console.log(`Passed: ${validations.passed}`);
console.log(`Failed: ${validations.failed}`);

fs.writeFileSync('graph-validation.json', JSON.stringify(validations, null, 2));

if (validations.failed > 0) {
  console.log('\n⚠️  WARNING: Some validations failed. Review graph-validation.json');
  process.exit(1);
} else {
  console.log('\n✅ All validations passed');
}
```

**Execution**:
```bash
node validate-graph.js

# View validation report
cat graph-validation.json | jq '.'
```

**Expected Output**:
- `graph-validation.json` - Validation results

**Success Criteria**:
- ✅ All validation checks pass
- ✅ No structural errors

---

## ✅ Phase 2 Checkpoint

**Deliverables**:
1. ✅ `dependency-graph.json` - Graph structure
2. ✅ `adjacency-list.json` - For algorithms
3. ✅ `cycles-report.json` - Cycle detection
4. ✅ `execution-order.json` - Topological sort
5. ✅ `execution-levels.json` - Parallel groups
6. ✅ `dependency-graph.mmd` - Mermaid visual
7. ✅ `dependency-graph-epics-only.mmd` - Simplified view
8. ✅ `graph-validation.json` - Validation report

**Time Checkpoint**: Should be at ~2.5 hours total

---

## 🎯 Phase 3: Time Estimation & Resource Allocation (45 minutes)

### Task 3.1: Refine Time Estimates (15 min)

### Task 3.2: Assign Resources (15 min)

### Task 3.3: Calculate Earliest/Latest Start Times (15 min)

---

## 🎯 Phase 4: Critical Path Analysis (30 minutes)

### Task 4.1: Identify Critical Path (15 min)

### Task 4.2: Calculate Slack/Float (10 min)

### Task 4.3: Mark Critical Tasks (5 min)

---

## 🎯 Phase 5: Gantt Chart Generation (60 minutes)

### Task 5.1: Create PlantUML Gantt Chart (30 min)

### Task 5.2: Generate Alternative Formats (20 min)

### Task 5.3: Add Milestones (10 min)

---

## 🎯 Phase 6: Sprint Planning (30 minutes)

### Task 6.1: Define Sprint Boundaries (10 min)

### Task 6.2: Allocate Tasks to Sprints (15 min)

### Task 6.3: Create Sprint Boards (5 min)

---

## 🎯 Phase 7: Documentation & Validation (15 minutes)

### Task 7.1: Generate Summary Report (10 min)

### Task 7.2: Final Validation (5 min)

---

**Total Tasks**: 50+ granular tasks
**Total Time**: 4-5 hours
**Status**: Phase 1 & 2 fully detailed (2.5h), remaining phases outlined

---

**Next**: Continue with Phase 3-7 detailed breakdown?
