# Gemini 3 Adaptive Runtime MCP Server

A Model Context Protocol (MCP) server that provides access to Google's Gemini 3 Pro Preview model with the "Adaptive Runtime" specification - enabling dynamic UI generation, deep reasoning, and code execution capabilities.

## Overview

Based on the "The Adaptive Runtime" specification, this MCP server transforms Gemini 3 into a **"Just-in-Time UI Architect"** and **"Deep Reasoning Engine"**. It's designed to generate functional React UIs, perform complex reasoning tasks, and execute code - all powered by Gemini 3's extended thinking capabilities.

### Key Features

#### 1. Dynamic UI Generation
- **Adaptive UI Components**: Generates complete React TypeScript components with Tailwind CSS
- **Context-Aware**: Adapts UI based on user expertise level and device constraints
- **Interactive**: Creates fully functional UIs with state management and event handlers
- **Iterative Design**: Refines UIs based on user feedback

#### 2. Deep Reasoning Engine
- **Extended Thinking**: Uses Gemini 3's `thinking_level=high` for complex analysis
- **Structured Output**: Returns reasoning process, conclusions, and confidence levels
- **Multi-Perspective**: Considers alternative viewpoints and scenarios
- **Decision Analysis**: Evaluates options with pros, cons, and trade-offs

#### 3. Code Execution
- **Multi-Language Support**: Python, JavaScript, TypeScript, and more
- **Built-in Execution**: Uses Gemini 3's code execution capability
- **Analysis Tools**: Bug detection, performance optimization, security scanning
- **Test Generation**: Creates comprehensive test suites automatically

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- A Google AI API key ([Get one here](https://aistudio.google.com/app/apikey))

### Setup

1. Clone and navigate to the directory:
```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/gemini3-adaptive-runtime
```

2. Install dependencies:
```bash
npm install
```

3. Configure your API key:
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

4. Build the server:
```bash
npm run build
```

## Configuration

### MCP Settings

Add to your MCP settings file (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gemini3-adaptive-runtime": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/gemini3-adaptive-runtime/dist/index.js"
      ],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | - | Your Google AI API key |
| `GEMINI_MODEL` | No | `gemini-3-pro-preview` | Model to use |
| `GEMINI_THINKING_LEVEL` | No | `high` | Thinking depth (low/high) |
| `GEMINI_TEMPERATURE` | No | `0.3` | Temperature for generation |
| `GEMINI_TOP_P` | No | `0.95` | Top-P sampling parameter |
| `GEMINI_MAX_OUTPUT_TOKENS` | No | `8192` | Max tokens in response |

## Available Tools

### Dynamic UI Generation Tools

#### `generate_dynamic_ui`
Generate a dynamic React TypeScript UI component.

**Parameters:**
- `prompt` (required): User request describing the desired UI
- `contextUrls` (optional): URLs to reference for context or data
- `currentScreenState` (optional): Current UI state for context-aware generation
- `thinkingLevel` (optional): "high" (default) or "low"

**Example:**
```typescript
{
  "prompt": "Create a dashboard to compare sales data by region with interactive charts",
  "thinkingLevel": "high"
}
```

**Returns:**
```typescript
{
  "ui_strategy": "User wants comparison → Bar Chart is better than Pie Chart...",
  "title": "Regional Sales Dashboard",
  "react_code": "import React, { useState } from 'react'...",
  "suggested_next_prompts": [
    "Add time range filter",
    "Include year-over-year comparison"
  ]
}
```

#### `iterate_ui`
Improve an existing UI component based on feedback.

**Parameters:**
- `originalCode` (required): Current React component code
- `feedback` (required): User feedback describing desired changes
- `thinkingLevel` (optional): "high" (default) or "low"

### Reasoning Tools

#### `deep_reasoning`
Perform deep reasoning on complex questions.

**Parameters:**
- `question` (required): The question or problem to reason about
- `context` (optional): Additional context or background
- `includeAlternatives` (optional): Whether to include alternative perspectives
- `thinkingLevel` (optional): "high" (default) or "low"

**Example:**
```typescript
{
  "question": "Should we migrate our monolith to microservices?",
  "context": "E-commerce platform, 50K daily users, 10-person team",
  "includeAlternatives": true
}
```

**Returns:**
```typescript
{
  "reasoning_process": "Step-by-step analysis...",
  "conclusion": "Recommendation: Gradual migration with strangler pattern...",
  "confidence_level": "high",
  "alternative_perspectives": [
    "Keep monolith and optimize",
    "Hybrid approach with selective extraction"
  ]
}
```

#### `compare_options`
Compare multiple options with structured evaluation.

**Parameters:**
- `question` (required): The decision question
- `options` (required): Array of `{name, details}` objects
- `criteria` (optional): Array of evaluation criteria

#### `analyze_decision`
Analyze a decision with potential consequences and risks.

**Parameters:**
- `decision` (required): The decision to analyze
- `context` (required): Context and background
- `timeHorizon` (optional): Time horizon (e.g., "6 months", "5 years")

### Code Execution Tools

#### `execute_code`
Generate and execute code to solve computational tasks.

**Parameters:**
- `task` (required): Description of the task
- `language` (optional): Preferred programming language
- `context` (optional): Additional context or data
- `thinkingLevel` (optional): "high" (default) or "low"

**Example:**
```typescript
{
  "task": "Parse this CSV data and create a summary statistics table",
  "language": "python",
  "context": "year,revenue,expenses\n2021,1000000,800000\n..."
}
```

#### `analyze_code`
Analyze code for bugs, performance, and security issues.

**Parameters:**
- `code` (required): The code to analyze
- `language` (required): Programming language
- `analysisGoals` (optional): Specific analysis goals

#### `generate_tests`
Generate comprehensive test cases for code.

**Parameters:**
- `code` (required): The code to test
- `language` (required): Programming language
- `testFramework` (optional): Test framework to use

#### `solve_algorithm`
Solve algorithmic problems with optimal solutions.

**Parameters:**
- `problem` (required): The algorithmic problem
- `constraints` (optional): Time/space constraints
- `language` (optional): Preferred language

## Usage Examples

### Example 1: Generate a Dynamic UI

```typescript
// Request
{
  "prompt": "I have weather forecast data. Create an hourly timeline UI with temperature, precipitation probability, and clothing recommendations.",
  "thinkingLevel": "high"
}

// Response includes:
// - UI strategy explanation
// - Complete React component with:
//   - Horizontal scrollable timeline
//   - Interactive slider for time selection
//   - Animated transitions
//   - Clothing recommendation icons
```

### Example 2: Deep Reasoning

```typescript
// Request
{
  "question": "How should we prioritize technical debt vs new features?",
  "context": "SaaS product, high customer churn, aging codebase, competitive market",
  "includeAlternatives": true
}

// Response includes:
// - Structured reasoning process
// - Weighted recommendation
// - Alternative approaches
// - Confidence assessment
```

### Example 3: Code Analysis

```typescript
// Request
{
  "code": "def process_data(items):\n    result = []\n    for i in items:\n        result.append(i * 2)\n    return result",
  "language": "python",
  "analysisGoals": ["performance", "pythonic style"]
}

// Response includes:
// - Identified issues (list comprehension opportunity)
// - Optimized version
// - Performance comparison
// - Detailed explanation
```

## Architecture

### The Adaptive Runtime Workflow

```
User Prompt
    ↓
1. Ingest: Parse intent + context
    ↓
2. Reasoning (thinking=high): Analyze user intent, data structure, optimal UI pattern
    ↓
3. Architecting: Design component structure, state management, styling
    ↓
4. Coding: Generate complete TypeScript React component
    ↓
5. Output: Structured JSON with code + reasoning explanation
```

### Key Design Principles

1. **No Text Walls**: Always respond with functional UI, not explanations
2. **Radical Adaptation**: UI complexity matches user expertise and device
3. **Full Functionality**: Generated UIs are production-ready, not mockups
4. **Self-Correction**: Deep thinking ensures mobile-responsive, accessible designs

## Gemini 3 Capabilities Used

- **Extended Thinking**: `thinking_level=high` for complex reasoning
- **Structured Output**: `response_mime_type=application/json` with schemas
- **Code Execution**: Built-in Python execution for data processing
- **Google Search**: Real-time information retrieval
- **Context Window**: 1M tokens input / 64K tokens output

## Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run dev
```

### Test
```bash
npm test
```

## Troubleshooting

### Common Issues

1. **API Key Error**
   - Ensure `GEMINI_API_KEY` is set in your environment
   - Verify the API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)

2. **Model Not Found**
   - Gemini 3 Pro Preview is currently in preview
   - Ensure your API key has access to the preview model

3. **Generation Errors**
   - Check if the prompt is clear and specific
   - Try reducing complexity or breaking into smaller tasks
   - Verify `thinkingLevel` is appropriate for the task

4. **Timeout Issues**
   - Complex tasks may take longer with `thinking_level=high`
   - Consider using `thinking_level=low` for simpler tasks

## Limitations

- **Beta Feature**: Gemini 3 Pro Preview is in beta, features may change
- **Rate Limits**: Subject to Google AI API rate limits
- **Context**: While large (1M tokens), extremely long contexts may be truncated
- **Execution Environment**: Code execution runs in Google's sandbox

## Contributing

This MCP server is part of the Miyabi project. For contributions:

1. Follow the Miyabi development guidelines
2. Test thoroughly with various prompts and scenarios
3. Update documentation for new features
4. Ensure type safety and error handling

## License

MIT License - See LICENSE file for details

## References

- [Gemini 3 API Documentation](https://ai.google.dev/gemini-api/docs/gemini-3?hl=ja&thinking=high)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [The Adaptive Runtime Specification](.claude/agents/The_Adaptive_Runtime.md)
- [Google Generative AI SDK](https://github.com/google/generative-ai-js)

---

**Built with ❤️ for the Miyabi Project**
