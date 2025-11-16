# Paper2Agent - Research Paper to AI Agent Converter

**Version**: 1.0.0
**Status**: Active
**Based on**: [arXiv:2509.06917](https://arxiv.org/abs/2509.06917)

---

## 🎯 Overview

Automatically converts research papers into interactive AI agents using the Model Context Protocol (MCP). Transforms static PDFs into functional agents that can execute the paper's methodology.

### Core Capabilities

1. **Paper Analysis**: Extract abstract, methods, code references from PDF
2. **Codebase Extraction**: Clone and analyze associated GitHub repositories
3. **MCP Generation**: Auto-generate MCP server definitions
4. **Agent Creation**: Deploy as interactive Miyabi agent
5. **Test Generation**: Create validation tests from paper's examples

---

## 📋 Usage

### Basic Usage

```bash
# Convert a paper to an agent
miyabi paper2agent convert \
  --paper "https://arxiv.org/pdf/2509.06917.pdf" \
  --output "./agents/paper2agent-example"

# Use the generated agent
miyabi agent run Paper2Agent-AlphaGenome \
  --query "Predict splice sites in this sequence: ATCG..."
```

### Advanced Usage

```bash
# Step 1: Analyze paper
.claude/Skills/paper2agent/analyze-paper.sh paper.pdf

# Step 2: Extract codebase
.claude/Skills/paper2agent/extract-code.sh \
  --repo "https://github.com/author/repo"

# Step 3: Generate MCP server
.claude/Skills/paper2agent/generate-mcp.sh \
  --paper-analysis ./analysis.json \
  --codebase ./repo

# Step 4: Test agent
.claude/Skills/paper2agent/test-agent.sh \
  --agent ./agents/paper2agent-example
```

---

## 🏗️ Architecture

```
Paper (PDF)
    ↓
┌──────────────────────────────────────┐
│  1. Paper Analysis                   │
│  - Extract sections (Abstract, etc.) │
│  - Identify methods                  │
│  - Find code references              │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  2. Codebase Extraction              │
│  - Clone GitHub repo                 │
│  - Analyze API surface               │
│  - Extract function signatures       │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  3. MCP Server Generation            │
│  - Create server definition          │
│  - Map functions to tools            │
│  - Generate parameter schemas        │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  4. Agent Deployment                 │
│  - Register as Miyabi agent          │
│  - Create agent spec                 │
│  - Deploy to MCP registry            │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  5. Validation Testing               │
│  - Extract examples from paper       │
│  - Generate test cases               │
│  - Verify reproducibility            │
└──────────────────────────────────────┘
```

---

## 📦 Components

### 1. analyze-paper.sh

**Purpose**: Extract structured information from research paper PDF

**Input**: PDF file path or URL
**Output**: JSON with extracted sections

```json
{
  "title": "Paper2Agent: Reimagining Research Papers...",
  "abstract": "...",
  "methods": "...",
  "code_references": [
    {
      "type": "github",
      "url": "https://github.com/author/repo"
    }
  ],
  "examples": [
    {
      "description": "Splice site prediction",
      "input": "ATCG...",
      "expected_output": "..."
    }
  ]
}
```

### 2. extract-code.sh

**Purpose**: Clone and analyze codebase

**Input**: GitHub repository URL
**Output**: API analysis JSON

```json
{
  "repository": "https://github.com/author/repo",
  "language": "python",
  "entry_points": [
    {
      "function": "predict_splice_site",
      "signature": "def predict_splice_site(sequence: str) -> dict",
      "docstring": "...",
      "parameters": [...]
    }
  ]
}
```

### 3. generate-mcp.sh

**Purpose**: Generate MCP server definition

**Input**: Paper analysis + code analysis
**Output**: MCP server JSON

```json
{
  "name": "paper-alphagenome",
  "version": "1.0.0",
  "command": "python",
  "args": ["-m", "alphagenome.mcp_server"],
  "tools": [
    {
      "name": "predict_splice_site",
      "description": "Predict splice sites using AlphaGenome model",
      "inputSchema": {
        "type": "object",
        "properties": {
          "sequence": {
            "type": "string",
            "description": "DNA sequence to analyze"
          }
        },
        "required": ["sequence"]
      }
    }
  ]
}
```

### 4. deploy-agent.sh

**Purpose**: Deploy as Miyabi agent

**Actions**:
1. Create agent spec in `.claude/agents/specs/paper2agent/`
2. Register MCP server in `.claude/mcp.json`
3. Add to agent registry

### 5. test-agent.sh

**Purpose**: Validate agent functionality

**Tests**:
1. Example reproduction from paper
2. API availability check
3. Error handling
4. Performance benchmarks

---

## 🔧 Configuration

### Environment Variables

```bash
# Required
export MIYABI_PAPER2AGENT_CACHE_DIR="$HOME/.miyabi/paper2agent"

# Optional
export MIYABI_PAPER2AGENT_PDF_PARSER="pdftotext"  # or "pypdf"
export MIYABI_PAPER2AGENT_TEST_TIMEOUT=300        # seconds
export MIYABI_PAPER2AGENT_MCP_PORT=50052          # MCP server port
```

### Configuration File

`.claude/Skills/paper2agent/config.json`:

```json
{
  "pdf_parser": "pdftotext",
  "code_analysis": {
    "languages": ["python", "rust", "javascript"],
    "max_repo_size_mb": 500
  },
  "mcp_generation": {
    "port_range": [50052, 50100],
    "timeout": 300
  },
  "test_suite": {
    "run_examples": true,
    "verify_reproducibility": true,
    "max_test_duration": 600
  }
}
```

---

## 📊 Example: AlphaGenome Paper

### Input

```bash
miyabi paper2agent convert \
  --paper "https://arxiv.org/pdf/2509.06917.pdf" \
  --repo "https://github.com/bioinformatics/alphagenome" \
  --name "AlphaGenome"
```

### Generated Agent

```bash
# Query the agent
miyabi chat AlphaGenome "Find splice variants in this sequence: ATCG..."

# Direct MCP call
miyabi mcp call paper-alphagenome predict_splice_site \
  '{"sequence": "ATCG..."}'
```

### Generated Files

```
.claude/agents/specs/paper2agent/
  └── AlphaGenome.md              # Agent specification

.claude/mcp-servers/paper2agent/
  └── alphagenome/
      ├── mcp_server.py           # Generated MCP server
      ├── requirements.txt        # Dependencies
      └── tests/
          └── test_splice.py      # Validation tests

.miyabi/paper2agent/
  └── alphagenome/
      ├── paper-analysis.json     # Extracted paper info
      ├── code-analysis.json      # API analysis
      └── mcp-definition.json     # MCP config
```

---

## 🧪 Testing

### Test Suite

```bash
# Run all tests
.claude/Skills/paper2agent/test-agent.sh --agent AlphaGenome

# Test specific functionality
.claude/Skills/paper2agent/test-agent.sh \
  --agent AlphaGenome \
  --test reproduce_paper_example_1
```

### Validation Criteria

1. ✅ Paper examples reproduce successfully
2. ✅ API calls return expected types
3. ✅ Error handling works correctly
4. ✅ Performance within acceptable range
5. ✅ MCP server starts without errors

---

## 🔗 Integration with Miyabi

### Agent Registry

Paper2Agent-generated agents are registered in:
- `.claude/agents/specs/paper2agent/`
- Listed in `miyabi agent list`
- Callable via `miyabi agent run <name>`

### MCP Integration

- MCP servers registered in `.claude/mcp.json`
- Auto-start on first use
- Health checks via `miyabi mcp status`

### Git Workflow

Each paper conversion creates:
- Feature branch: `feature/paper2agent-<paper-name>`
- Issue: Auto-created with paper metadata
- PR: Generated after successful tests

---

## 📚 Supported Paper Types

### Bioinformatics
- ✅ Genomics tools (AlphaGenome, etc.)
- ✅ Protein structure prediction
- ✅ Sequence alignment

### Machine Learning
- ✅ Model architectures
- ✅ Training pipelines
- ✅ Benchmark frameworks

### Data Science
- ✅ Analysis pipelines
- ✅ Visualization tools
- ✅ Statistical methods

---

## 🚨 Limitations

1. **Code Quality**: Generated MCP servers require manual review
2. **Dependencies**: Complex dependencies may need manual setup
3. **Non-Python Code**: Limited support for languages other than Python/Rust
4. **Proprietary Tools**: Cannot convert papers requiring licensed software
5. **Data Requirements**: Large datasets need manual download

---

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Design architecture
- [ ] Implement PDF analysis
- [ ] Implement code extraction
- [ ] Generate basic MCP servers

### Phase 2
- [ ] Support for Rust papers
- [ ] Auto-dependency resolution
- [ ] Enhanced test generation
- [ ] Performance optimization

### Phase 3
- [ ] Multi-language support
- [ ] Cloud deployment
- [ ] Paper recommendation system
- [ ] Agent composition

---

## 🔗 Related Documentation

- **MCP Protocol**: `.claude/MCP_INTEGRATION_PROTOCOL.md`
- **Agent System**: `.claude/context/agents.md`
- **Skill Development**: `.claude/guides/skill-development.md`

---

**Status**: ✅ Active Development
**Next**: Implement PDF analysis script
