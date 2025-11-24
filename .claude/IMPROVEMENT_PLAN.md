# .claude/ Directory - Comprehensive Improvement Plan

**Generated**: 2025-11-20
**Scope**: Complete optimization of .claude directory structure for Miyabi project
**Goal**: Enhanced Claude Code integration, better organization, Lark platform integration

---

## 📊 Current State Analysis

### Directory Statistics
- **Total Size**: 3.5MB
- **Total Markdown Files**: 247
- **Context Modules**: 17 (4,513 total lines)
- **Skills**: 19
- **Commands**: 33
- **Hooks**: 29
- **Agents**: 21 (7 Coding + 14 Business)

### Existing Structure
```
.claude/
├── Skills/              # 19 managed skills
├── agents/              # Agent specs, prompts, triggers
├── commands/            # 33 slash commands
├── context/             # 17 context modules
├── hooks/               # 29 hook scripts
├── docs/                # Documentation
├── guides/              # User guides
├── mcp-servers/         # MCP server configs
├── prompts/             # Prompt templates
├── scripts/             # Utility scripts
├── workflows/           # Workflow definitions
└── [config files]       # settings.json, mcp.json, etc.
```

---

## 🎯 Identified Improvement Areas

### 1. **Lark Platform Integration** (P0 - Critical)

**Current State**:
- Lark integration exists in `agents/lark/` directory
- Basic notification templates available
- 4 MCP servers for Lark (lark-mcp-enhanced, lark-openapi-mcp-enhanced, etc.)

**Missing**:
- ❌ Dedicated context module for Lark platform architecture
- ❌ Lark API reference integration in context
- ❌ Lark-specific skills
- ❌ Lark workflow automation commands

**Required Actions**:
1. Create `context/lark-platform.md` - Complete Lark architecture context
2. Integrate `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.lark/LARK_PLATFORM_COMPLETE_ARCHITECTURE.md`
3. Create `Skills/lark-integration/` skill
4. Add Lark-specific slash commands
5. Update `INDEX.md` to include Lark context priority

---

### 2. **Context Module Organization** (P0 - Critical)

**Current Issues**:
- Context modules organized but could benefit from better categorization
- Some legacy modules marked as "Superseded" but still present
- No clear separation between foundational vs. domain-specific context

**Proposed Reorganization**:

```yaml
context/
├── 00-foundational/           # P0 - Always load first
│   ├── core-rules.md          # MCP First, Benchmark, Context7
│   ├── miyabi-definition.md   # Complete system definition
│   └── architecture.md        # System architecture
│
├── 01-development/            # P1 - Development context
│   ├── rust.md
│   ├── typescript.md
│   ├── development.md
│   └── protocols.md
│
├── 02-infrastructure/         # P1 - Infrastructure context
│   ├── worktree.md
│   ├── infrastructure.md
│   └── external-deps.md
│
├── 03-agents/                 # P2 - Agent system context
│   ├── agents.md
│   └── agent-protocols.md
│
├── 04-integrations/           # P2 - External integrations
│   ├── lark-platform.md       # ✨ NEW
│   ├── aifactory-integration.md
│   └── pantheon-society.md
│
├── 05-specialized/            # P3 - Specialized context
│   ├── swml-framework.md
│   ├── omega-phases.md
│   ├── lint-integration.md
│   └── DIAGRAMS.md
│
└── legacy/                    # Archive superseded modules
    ├── entity-relation.md
    └── labels.md
```

**Benefits**:
- Clear priority hierarchy (00 = P0, highest priority)
- Easy to find relevant context
- Better performance (load only needed modules)

---

### 3. **MCP Server Configuration Enhancement** (P1 - High)

**Current `mcp.json`**:
- Contains basic MCP server configurations
- Missing comprehensive Lark MCP integration

**Improvements Needed**:
```json
{
  "mcpServers": {
    // Existing servers...

    // ✨ NEW: Lark integration
    "lark-dev-docs": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-lark-dev-docs-mcp/src/index.js"
      ],
      "description": "Authenticated Lark documentation crawler",
      "capabilities": ["lark_dev_docs_read", "lark_api_search", "lark_dev_docs_navigate"]
    },

    "lark-mcp-enhanced": {
      "command": "npm",
      "args": ["start"],
      "cwd": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/lark-mcp-enhanced",
      "description": "Miyabi-customized Lark MCP server",
      "preset": "default"
    },

    "lark-openapi-enhanced": {
      "command": "node",
      "args": ["dist/cli.js", "mcp"],
      "cwd": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/lark-openapi-mcp-enhanced",
      "description": "Full Lark OpenAPI + Genesis AI",
      "features": ["all-openapi", "base-app-generation"]
    }
  }
}
```

---

### 4. **Skill Enhancement** (P1 - High)

**New Skills Needed**:

#### Skill: `lark-integration`
```yaml
location: .claude/Skills/lark-integration/
purpose: Comprehensive Lark platform operations
capabilities:
  - Send notifications (text, cards)
  - Create/manage groups
  - Document operations (Lark Docs, Base)
  - Calendar management
  - Workflow automation

workflow:
  1. Load lark-platform.md context
  2. Authenticate via MCP (tenant or user token)
  3. Execute Lark API operations
  4. Handle webhooks/events
  5. Generate reports

tools:
  - lark-mcp-enhanced (preferred)
  - lark-openapi-enhanced (for complex operations)
  - lark-dev-docs (for documentation lookup)
```

#### Skill: `context-optimizer`
```yaml
location: .claude/Skills/context-optimizer/
purpose: Intelligently load only necessary context modules
capabilities:
  - Analyze task requirements
  - Determine minimum context modules needed
  - Load context in priority order
  - Cache frequently used context

workflow:
  1. Parse user task/command
  2. Identify required context categories
  3. Load from 00-foundational → higher levels
  4. Skip unnecessary specialized context
```

---

### 5. **Slash Commands for Lark** (P1 - High)

**New Commands to Create**:

```bash
.claude/commands/
├── lark-notify.md           # Send Lark notification
├── lark-create-group.md     # Create Lark group
├── lark-sync-issues.md      # Sync GitHub Issues to Lark Base
├── lark-daily-report.md     # Generate and send daily report
├── lark-doc-create.md       # Create Lark document
└── lark-calendar-event.md   # Create calendar event
```

#### Example: `/lark-notify`
```markdown
# /lark-notify - Send Lark Notification

**Usage**: `/lark-notify <target> <message> [--type=card|text]`

**Description**: Send a notification to a Lark user or group using MCP.

**Examples**:
- `/lark-notify @team "Build completed successfully"`
- `/lark-notify chat_12345 "New Issue #234" --type=card`

**Implementation**:
1. Load lark-platform.md context
2. Authenticate via lark-mcp-enhanced
3. Determine target (user_id, chat_id, email)
4. Send message using im.v1.message.create
5. Confirm delivery

**MCP Tool**: `im.v1.message.create`
```

---

### 6. **Context Module: lark-platform.md** (P0 - Critical)

**Content Structure**:
```markdown
# Lark Platform Integration Context

**Priority**: ⭐⭐⭐⭐ (High - Load when Lark operations needed)
**Size**: ~2000 tokens
**Last Updated**: 2025-11-20

## Quick Reference

### MCP Tools Available
- im.v1.message.create - Send messages
- im.v1.chat.create - Create groups
- bitable.v1.app_table_record.batch_create - Base operations
- docx.v1.document.create - Document creation
- calendar.v1.calendar_event.create - Calendar events

### Authentication
- Tenant Token: App-level operations
- User Token: User-delegated operations

### API Explorer Pattern
URL: https://open.larksuite.com/api-explorer/{app_id}?apiName={action}&project={service}&resource={type}&version={v}

## Platform Architecture
[Include condensed version of LARK_PLATFORM_COMPLETE_ARCHITECTURE.md]

## Common Patterns
[Include frequently used patterns from architecture doc]

## MCP Integration
[MCP-specific details]

## Error Handling
[Common errors and solutions]
```

**Source**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.lark/LARK_PLATFORM_COMPLETE_ARCHITECTURE.md`

**Integration Strategy**:
- Extract essential information (not full 46KB)
- Focus on Claude Code-relevant details
- Prioritize MCP tool usage patterns
- Include query parameter structure for API Explorer

---

### 7. **Documentation Improvements** (P2 - Medium)

**Updates Needed**:

#### `.claude/INDEX.md`
- Add Lark integration section
- Update context module priority table
- Add MCP server reference

#### `.claude/context/INDEX.md`
- Reflect new directory structure (00-05 + legacy)
- Add lark-platform.md entry
- Update usage patterns

#### `.claude/README.md`
- Add Lark integration quickstart
- Update directory structure diagram
- Add troubleshooting for Lark MCP

---

### 8. **Workflow Automation** (P2 - Medium)

**New Workflows**:

```yaml
.claude/workflows/
├── lark-notification.yaml
│   trigger: "GitHub Issue created"
│   actions:
│     - Load lark-platform context
│     - Extract Issue details
│     - Format as Lark card
│     - Send to designated group
│     - Record in Lark Base
│
├── lark-daily-standup.yaml
│   trigger: "Cron 9:00 AM daily"
│   actions:
│     - Collect completed Issues
│     - Collect pending Issues
│     - Check Agent status
│     - Generate standup report
│     - Send to team group
│
└── lark-sync-github.yaml
    trigger: "Manual or scheduled"
    actions:
      - Fetch all GitHub Issues
      - Create/update Lark Base
      - Sync Issue states
      - Notify on conflicts
```

---

### 9. **Hook Enhancements** (P2 - Medium)

**New Hooks**:

```bash
.claude/hooks/
├── lark-session-start.sh    # Verify Lark MCP connection on session start
├── lark-issue-created.sh    # Auto-notify Lark when Issue created
└── lark-keepalive.sh        # Maintain Lark authentication
```

#### `lark-session-start.sh`
```bash
#!/bin/bash
# Verify Lark MCP servers are available

echo "🔍 Checking Lark MCP servers..."

# Check lark-mcp-enhanced
if claude mcp list | grep -q "lark-mcp-enhanced"; then
  echo "✅ lark-mcp-enhanced available"
else
  echo "⚠️  lark-mcp-enhanced not found"
fi

# Check lark-dev-docs
if claude mcp list | grep -q "lark-dev-docs"; then
  echo "✅ lark-dev-docs available"
else
  echo "ℹ️  lark-dev-docs not configured (optional)"
fi
```

---

### 10. **Settings Enhancement** (P2 - Medium)

**`settings.json` Updates**:

```json
{
  "contextModules": {
    "autoLoad": [
      "00-foundational/core-rules.md",
      "00-foundational/miyabi-definition.md"
    ],
    "lazyLoad": true,
    "categories": {
      "foundational": "00-foundational/",
      "development": "01-development/",
      "infrastructure": "02-infrastructure/",
      "agents": "03-agents/",
      "integrations": "04-integrations/",
      "specialized": "05-specialized/"
    }
  },

  "larkIntegration": {
    "enabled": true,
    "defaultMcpServer": "lark-mcp-enhanced",
    "notificationGroup": "chat_id_placeholder",
    "autoNotify": {
      "issueCreated": true,
      "buildFailed": true,
      "agentBlocked": true
    }
  },

  "performance": {
    "contextCaching": true,
    "maxContextTokens": 20000,
    "priorityLoading": true
  }
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Critical Lark Integration (P0)
**Timeline**: Immediate
**Tasks**:
1. ✅ Create `context/04-integrations/lark-platform.md`
2. ✅ Extract essential content from LARK_PLATFORM_COMPLETE_ARCHITECTURE.md
3. ⬜ Update `context/INDEX.md` with Lark module
4. ⬜ Test Lark context loading

**Success Criteria**:
- Claude Code can reference Lark API patterns
- MCP tool names are correctly identified
- Query parameter structure is understood

---

### Phase 2: Context Reorganization (P0)
**Timeline**: Day 1-2
**Tasks**:
1. ⬜ Create numbered directory structure (00-05)
2. ⬜ Move existing modules to appropriate categories
3. ⬜ Create `legacy/` directory for superseded modules
4. ⬜ Update all INDEX files
5. ⬜ Test context loading performance

**Success Criteria**:
- Context modules load in priority order
- Legacy modules not loaded by default
- Documentation accurately reflects structure

---

### Phase 3: MCP Configuration (P1)
**Timeline**: Day 2-3
**Tasks**:
1. ⬜ Update `mcp.json` with all Lark servers
2. ⬜ Test each MCP server connection
3. ⬜ Document MCP tool capabilities
4. ⬜ Create MCP troubleshooting guide

**Success Criteria**:
- All 4 Lark MCP servers configured
- Connection tests pass
- Tools callable from Claude Code

---

### Phase 4: Skills & Commands (P1)
**Timeline**: Day 3-5
**Tasks**:
1. ⬜ Create `lark-integration` skill
2. ⬜ Create 6 Lark slash commands
3. ⬜ Test skill execution
4. ⬜ Document command usage

**Success Criteria**:
- `/lark-notify` sends message successfully
- Skill can handle all major Lark operations
- Error handling works properly

---

### Phase 5: Workflows & Automation (P2)
**Timeline**: Day 5-7
**Tasks**:
1. ⬜ Create 3 Lark workflows
2. ⬜ Implement workflow triggers
3. ⬜ Test automation end-to-end
4. ⬜ Create monitoring/logging

**Success Criteria**:
- GitHub Issue auto-notifies Lark
- Daily standup sends automatically
- Sync workflow maintains consistency

---

### Phase 6: Documentation & Polish (P2)
**Timeline**: Day 7-10
**Tasks**:
1. ⬜ Update all INDEX files
2. ⬜ Update README.md
3. ⬜ Create Lark integration guide
4. ⬜ Add troubleshooting documentation
5. ⬜ Create usage examples

**Success Criteria**:
- All documentation current
- New users can set up Lark integration
- Common issues documented

---

## 📋 Priority Quick Reference

### P0 - Critical (Do Now)
- ✅ Create lark-platform.md context module
- ⬜ Reorganize context/ directory structure
- ⬜ Update context/INDEX.md

### P1 - High (This Week)
- ⬜ Update mcp.json with Lark servers
- ⬜ Create lark-integration skill
- ⬜ Create Lark slash commands

### P2 - Medium (Next Week)
- ⬜ Create Lark workflows
- ⬜ Add Lark hooks
- ⬜ Update all documentation

### P3 - Low (Nice to Have)
- ⬜ Advanced Lark features
- ⬜ Performance optimizations
- ⬜ Additional context modules

---

## 🎯 Expected Outcomes

### Immediate Benefits
1. **Lark Integration**: Seamless Lark API usage from Claude Code
2. **Better Organization**: Clear context module hierarchy
3. **Faster Loading**: Priority-based context loading
4. **Automation**: Automated Lark notifications and sync

### Long-term Benefits
1. **Scalability**: Easy to add new integrations
2. **Maintainability**: Clear structure for updates
3. **Performance**: Optimized context loading
4. **Documentation**: Comprehensive and current

---

## 📊 Metrics for Success

### Context Loading
- **Current**: ~5000 tokens (all modules)
- **Target**: ~2000 tokens (priority modules only)
- **Improvement**: 60% reduction

### Lark Operations
- **Current**: Manual MCP tool calls
- **Target**: Automated via skills/commands
- **Improvement**: 80% time saved

### Documentation
- **Current**: 247 markdown files, some outdated
- **Target**: All current, well-organized
- **Improvement**: 100% accuracy

---

## 🔧 Maintenance Plan

### Weekly
- Review and update Lark API changes
- Test MCP server connections
- Update documentation if needed

### Monthly
- Audit context module usage
- Optimize frequently-loaded context
- Archive unused modules

### Quarterly
- Major documentation review
- Performance optimization
- Add new integrations

---

## 📝 Notes

### Dependencies
- Lark MCP servers must be installed and configured
- Chrome debug mode required for lark-dev-docs-mcp
- Network access to Lark API endpoints

### Risks
- MCP server connection failures
- Lark API changes breaking integration
- Context loading performance degradation

### Mitigation
- Robust error handling in skills
- Regular testing of MCP connections
- Monitor context loading times

---

**END OF IMPROVEMENT PLAN**

**Next Action**: Begin Phase 1 - Create lark-platform.md context module
