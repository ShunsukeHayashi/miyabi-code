# Miyabi Crates Architecture Diagrams - Visual Index

Generated on: 2025-10-24

## 📋 Available Diagrams

### 1. Comprehensive Crates Architecture
![Miyabi Crates Architecture](Miyabi%20Crates%20Architecture.png)

**Source**: `crates-architecture.puml`

Shows the complete dependency graph of all 26+ crates in the Miyabi workspace:
- Foundation Layer (miyabi-types)
- Core Utilities (miyabi-core)
- Infrastructure (github, worktree, llm, knowledge, potpie)
- Agent Core (miyabi-agent-core)
- Specialized Agents (coordinator, codegen, review, workflow, business, integrations)
- Agent Aggregator (miyabi-agents - DEPRECATED)
- Application Layer (CLI, MCP Server, Web API, Orchestrator)
- Support Modules (webhook, benchmark, feedback-loop, a2a)

**Legend**:
- Blue: Foundation
- Green: Core
- Yellow: Infrastructure
- Coral: Agent Core
- Salmon: Specialized Agents
- Pink: Applications

---

### 2. Layered Architecture
![Miyabi Crates Layers](Miyabi%20Crates%20Layers.png)

**Source**: `crates-layers.puml`

Simplified view showing the 6-layer architecture:
1. **Layer 1**: Foundation (miyabi-types) - Zero dependencies
2. **Layer 2**: Core Utilities (miyabi-core)
3. **Layer 3**: Infrastructure (github, worktree, llm, knowledge, potpie)
4. **Layer 4**: Agent Framework (miyabi-agent-core)
5. **Layer 5**: Specialized Agents
6. **Layer 6**: Application Layer

**Key Insight**: Clear dependency flow from bottom (foundation) to top (applications)

---

### 3. Agent Execution Flow
![Agent Execution Flow](Agent%20Execution%20Flow.png)

**Source**: `agent-execution-flow.puml`

Sequence diagram showing Worktree-based parallel execution:
- User invokes `miyabi agent run coordinator --issues 270,271`
- CoordinatorAgent analyzes and decomposes tasks
- WorktreeManager creates isolated Git worktrees (`.worktrees/issue-270/`, etc.)
- Parallel Claude Code sessions execute in each worktree
- Each worktree has its own agent context (`.agent-context.json`, `EXECUTION_CONTEXT.md`)
- Results are merged back to main branch
- Automatic cleanup

**Benefits**:
- True parallelism (no file locking)
- Isolated execution environments
- Easy rollback per worktree
- Independent debugging
- Unlimited scalability

---

### 4. Knowledge Management System
![Knowledge Management System](Knowledge%20Management%20System.png)

**Source**: `knowledge-system.puml`

Component diagram showing the miyabi-knowledge crate architecture:

**Components**:
- **KnowledgeManager**: Orchestrates indexing, search, and stats
- **Log Collection**: Parses `.ai/logs/` and worktree execution logs
- **Embedding Provider**: Ollama (local/LAN) or OpenAI API
- **Vector Search**: Qdrant client with metadata filtering
- **Qdrant Vector DB**: Rust-native vector database (384d/1536d)

**Workflow**:
1. Collect logs from `.ai/logs/` and `.worktrees/*/execution.log`
2. Parse Markdown and extract metadata (Agent, Issue, Task, Outcome)
3. Generate embeddings (all-MiniLM-L6-v2 or text-embedding-3-small)
4. Store in Qdrant with metadata
5. Search via similarity + filters

**Access Methods**:
- Rust API: `KnowledgeManager::search()`
- CLI: `miyabi knowledge search/index/stats`
- MCP: `knowledge.search` (Claude Code integration)

---

### 5. MCP Integration Architecture
![MCP Integration Architecture](MCP%20Integration%20Architecture.png)

**Source**: `mcp-integration.puml`

Sequence diagram showing Claude Code ↔ MCP Server integration:

**Protocol**: JSON-RPC 2.0 over stdio

**Supported Operations**:
- `knowledge.search`: Vector similarity search with filters
- `agent.execute`: Execute any agent (Coordinator, CodeGen, Review, etc.)
- `worktree.*`: Worktree lifecycle management
- `github.*`: GitHub API operations

**Example Flow**:
1. User asks Claude Code about error handling
2. Claude Code → MCP Client → `knowledge.search` request
3. MCP Server → Knowledge System → Qdrant search
4. Results returned with similarity scores (0.0-1.0)
5. Claude Code uses context to answer user's question

**Configuration** (`~/.config/claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "miyabi": {
      "command": "miyabi",
      "args": ["mcp", "serve", "--stdio"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

---

## 🔄 Regenerating Diagrams

### Prerequisites
```bash
brew install plantuml
```

### Generate All
```bash
cd /Users/a003/dev/miyabi-private
plantuml -tpng docs/architecture/*.puml
```

### Generate Individual
```bash
plantuml -tpng docs/architecture/crates-architecture.puml
```

### Generate SVG (Scalable)
```bash
plantuml -tsvg docs/architecture/*.puml
```

---

## 📊 Diagram Statistics

| Diagram | Type | Nodes | Relations | Complexity |
|---------|------|-------|-----------|------------|
| Crates Architecture | Component | 26+ | 50+ | High |
| Crates Layers | Component | 6 layers | 12+ | Medium |
| Agent Execution Flow | Sequence | 8 actors | 30+ msgs | High |
| Knowledge System | Component | 4 subsystems | 15+ | Medium |
| MCP Integration | Sequence | 6 actors | 20+ msgs | Medium |

---

## 🔗 Related Documentation

- **[ENTITY_RELATION_MODEL.md](../ENTITY_RELATION_MODEL.md)**: 12 entities, 27 relationships
- **[RUST_MIGRATION_REQUIREMENTS.md](../RUST_MIGRATION_REQUIREMENTS.md)**: Why Rust?
- **[WORKTREE_PROTOCOL.md](../WORKTREE_PROTOCOL.md)**: Worktree lifecycle
- **[AGENT_OPERATIONS_MANUAL.md](../AGENT_OPERATIONS_MANUAL.md)**: Agent guide
- **[README.md](README.md)**: Architecture diagrams README

---

## 📝 Notes

### Design Principles
1. **Layered Architecture**: Clear separation of concerns
2. **Dependency Inversion**: Core types at the bottom, applications at the top
3. **Worktree Isolation**: True parallel execution without conflicts
4. **MCP First**: External tool integration via Model Context Protocol
5. **Knowledge-Driven**: Learn from execution history via RAG

### Color Conventions
- **Foundation**: Light Blue (zero dependencies)
- **Infrastructure**: Light Yellow (external integrations)
- **Agents**: Light Coral/Salmon (business logic)
- **Applications**: Light Pink (user-facing)

### Stereotypes
- `<<Core Types>>`: Type definitions
- `<<Agent Traits>>`: Trait definitions
- `<<CLI Binary>>`: Executable applications
- `<<DEPRECATED>>`: Legacy code (backward compatibility only)

---

**Last Updated**: 2025-10-24
**Diagram Format**: PlantUML (.puml)
**Output Format**: PNG (1200+ DPI)
**Codebase Version**: 0.1.1 (Rust Edition)
