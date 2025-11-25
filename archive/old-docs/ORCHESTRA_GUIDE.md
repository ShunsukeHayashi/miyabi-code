# Miyabi Orchestra - Issue #758 Mission Control Dashboard

## 🎭 Hybrid Ensemble Configuration (7 Panes)

**Issue**: #758 - Mission Control dashboard (Next.js) prototype
**Worktree**: `/Users/shunsuke/Dev/miyabi-private/.worktrees/issue-758-mission-control`
**Branch**: `feature/issue-758-mission-control`

---

## 📋 Orchestra Roles & Tasks

### Pane 1: 🎼 Conductor (Overall Coordination)
**Agent**: Coordinator
**Role**: Project orchestration, progress tracking, integration management

**Tasks**:
- Monitor progress across all panes
- Coordinate between coding and business agents
- Track acceptance criteria completion
- Manage Git operations (commits, PRs)

**Commands**:
```bash
# Monitor git status
git status --short

# Check tmux panes
tmux list-panes -F "#{pane_index}: #{pane_current_command}"

# View recent changes
git log --oneline -5
```

---

### Pane 2: 💻 Coding Agent 1 - Project Setup
**Agent**: CodeGen (カエデ)
**Role**: Next.js project initialization and base infrastructure

**Tasks**:
- [ ] Bootstrap Next.js project with App Router
- [ ] Configure Tailwind CSS
- [ ] Setup project structure (components/, app/, lib/)
- [ ] Create basic layout template
- [ ] Configure TypeScript settings

**Commands**:
```bash
# Check if miyabi-dashboard exists
ls -la crates/miyabi-dashboard/ 2>/dev/null || echo "Create new Next.js project"

# Initialize Next.js (if needed)
npx create-next-app@latest miyabi-mission-control --typescript --tailwind --app

# Install dependencies
cd crates/miyabi-dashboard && npm install
```

---

### Pane 3: 💻 Coding Agent 2 - Core Components (Part 1)
**Agent**: CodeGen (サクラ)
**Role**: Implement Agent Board and TMAXL View components

**Tasks**:
- [ ] Create AgentBoard component with mock data
- [ ] Implement agent status display (active, idle, working)
- [ ] Create TMAXLView component
- [ ] Implement tmux session visualization
- [ ] Add interactive controls

**Mock Data Structure**:
```typescript
interface Agent {
  id: string;
  name: string;
  type: 'coding' | 'business';
  status: 'active' | 'idle' | 'working';
  currentTask?: string;
}

interface TmuxSession {
  name: string;
  windows: TmuxWindow[];
  activePane: number;
}
```

---

### Pane 4: 💻 Coding Agent 3 - Core Components (Part 2)
**Agent**: CodeGen (ハル)
**Role**: Implement Timeline/Alerts and Reference Hub components

**Tasks**:
- [ ] Create Timeline component with event history
- [ ] Implement Alerts panel for notifications
- [ ] Create ReferenceHub component for documentation links
- [ ] Add filtering and search functionality
- [ ] Integrate mock data sources

**Mock Data Structure**:
```typescript
interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
  agent?: string;
  message: string;
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
}
```

---

### Pane 5: 🎨 Business Agent 1 - Design System
**Agent**: ProductDesign (ミヤビ)
**Role**: UI/UX design, Mission Control aesthetics

**Tasks**:
- [ ] Define color palette (command center theme)
- [ ] Create component style guide
- [ ] Design responsive layouts
- [ ] Define typography system
- [ ] Create icon set requirements

**Deliverables**:
- `DESIGN_SYSTEM.md` - Color palette, typography, spacing
- `COMPONENT_STYLES.md` - Component-specific styling guidelines
- Tailwind configuration updates

---

### Pane 6: 📚 Business Agent 2 - Documentation
**Agent**: ContentCreation (アヤ)
**Role**: Component documentation and usage examples

**Tasks**:
- [ ] Document component APIs and props
- [ ] Create usage examples for each component
- [ ] Write integration guide for API connections
- [ ] Document mock data structure
- [ ] Create README for the dashboard

**Deliverables**:
- `components/README.md` - Component documentation
- `INTEGRATION_GUIDE.md` - API integration instructions
- `MOCK_DATA.md` - Mock data structure reference

---

### Pane 7: 🧪 Business Agent 3 - Testing & Storybook
**Agent**: Analytics (ケイ)
**Role**: Storybook setup, testing strategy

**Tasks**:
- [ ] Setup Storybook configuration
- [ ] Create stories for key components
- [ ] Define testing strategy
- [ ] Create test data generators
- [ ] Document testing approach

**Commands**:
```bash
# Install Storybook
npx storybook@latest init

# Run Storybook
npm run storybook
```

---

## 🎯 Acceptance Criteria Checklist

- [ ] Next.js app runs locally (npm start/dev)
- [ ] Four core panels display with mock data:
  - [ ] Agent Board
  - [ ] TMAXL View
  - [ ] Timeline/Alerts
  - [ ] Reference Hub
- [ ] Component structure documented
- [ ] API integration points prepared
- [ ] Tailwind styling applied with command center aesthetics
- [ ] Storybook configured (optional but recommended)

---

## 🚀 Quick Start Commands

### Launch Claude Code in Each Pane

**Pane 1 (Conductor)**:
```bash
# Start Claude Code and declare role
claude

# Then in Claude Code:
"I am the Conductor for Issue #758. Managing overall progress and integration."
```

**Panes 2-4 (Coding Agents)**:
```bash
claude
# Declare specific role based on pane assignment
```

**Panes 5-7 (Business Agents)**:
```bash
claude
# Declare specific role based on pane assignment
```

---

## 📊 Progress Tracking

### Conductor Monitoring Commands

```bash
# Check all pane activity
tmux list-panes -a -F "#{pane_index}: #{pane_current_command} - #{pane_current_path}"

# Capture output from specific pane
tmux capture-pane -t %XX -p | tail -20

# Send command to specific pane
tmux send-keys -t %XX "command here" Enter
```

### Agent Reporting Format

Each agent should report progress to Conductor using:

```
[Agent Name] Status: <brief update>
Example: [カエデ] Next.js project initialized. App Router configured. Ready for component development.
```

---

## 🎭 Orchestra Philosophy

This ensemble combines:
- **3 Coding Agents**: Parallel component development
- **3 Business Agents**: Design, documentation, testing
- **1 Conductor**: Orchestration and integration

Work flows horizontally (parallel development) and vertically (coordination).

---

## 📚 Reference Documents

- **Philosophy**: `.claude/MIYABI_PARALLEL_ORCHESTRA.md`
- **Technical Details**: `.claude/TMUX_OPERATIONS.md`
- **Kamui Integration**: `.claude/KAMUI_TMUX_GUIDE.md`
- **Issue Details**: https://github.com/customer-cloud/miyabi-private/issues/758

---

**Generated**: 2025-11-05
**Session**: miyabi-refactor:issue-758
