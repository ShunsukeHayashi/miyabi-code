# miyabi-codex

**Version**: 1.0.0
**Status**: ✅ Production Ready

OpenAI GPT-4 powered code generation, analysis, and review via Model Context Protocol (MCP).

---

## 🎯 Purpose

Provides AI-powered coding assistance using OpenAI's latest models:
- **Code Generation**: Generate code from natural language
- **Code Explanation**: Understand complex code
- **Code Review**: Get expert feedback
- **Refactoring**: Improve code quality
- **Bug Fixing**: Debug and fix errors
- **Test Generation**: Create comprehensive tests
- **Documentation**: Generate clear documentation
- **Code Completion**: Intelligent auto-completion

---

## 📦 Installation

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-codex
npm install
npm run build
```

---

## ⚙️ Configuration

### Prerequisites

1. **OpenAI API Key**: Get from https://platform.openai.com/api-keys
2. Set the API key as an environment variable

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "miyabi-codex": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-codex/dist/index.js"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key-here",
        "OPENAI_MODEL": "gpt-4-turbo-preview"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (**required**) | - |
| `OPENAI_MODEL` | Model to use | `gpt-4-turbo-preview` |

**Supported Models**:
- `gpt-4-turbo-preview` (Recommended for code)
- `gpt-4`
- `gpt-3.5-turbo`

---

## 🛠️ Available Tools

### 1. `codex_generate`

Generate code from a natural language description.

**Parameters**:
- `prompt` (required): Description of what code to generate
- `language` (optional): Target programming language
- `context` (optional): Additional requirements or context

**Example**:
```
Use codex_generate to create a binary search function in Python
```

**Returns**:
```python
def binary_search(arr, target):
    """
    Perform binary search on a sorted array.

    Args:
        arr: Sorted array to search
        target: Value to find

    Returns:
        Index of target if found, -1 otherwise
    """
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = (left + right) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1
```

---

### 2. `codex_explain`

Explain what a piece of code does.

**Parameters**:
- `code` (required): Code to explain
- `language` (optional): Programming language
- `context` (optional): Additional context

**Example**:
```
Use codex_explain to understand this Rust code: [code here]
```

**Returns**: Detailed explanation including:
- Overall purpose
- Key components
- Algorithms used
- Potential improvements

---

### 3. `codex_review`

Perform a comprehensive code review.

**Parameters**:
- `code` (required): Code to review
- `language` (optional): Programming language
- `focus` (optional): Review focus (performance, security, readability)

**Example**:
```
Use codex_review with focus "security" to review this code
```

**Returns**:
- Overall assessment
- Specific issues
- Improvement suggestions
- Security concerns
- Performance considerations

---

### 4. `codex_refactor`

Suggest refactoring improvements.

**Parameters**:
- `code` (required): Code to refactor
- `language` (optional): Programming language
- `context` (optional): Refactoring goals

**Example**:
```
Use codex_refactor to improve this function
```

**Returns**:
- Refactored code
- Explanation of changes
- Benefits of refactoring

---

### 5. `codex_fix`

Fix bugs and errors in code.

**Parameters**:
- `code` (required): Code with bugs
- `error` (required): Error message or description
- `language` (optional): Programming language

**Example**:
```
Use codex_fix for this code with error "TypeError: cannot read property 'length' of undefined"
```

**Returns**:
- Root cause analysis
- Fixed code
- Explanation of the fix
- Prevention tips

---

### 6. `codex_test`

Generate unit tests for code.

**Parameters**:
- `code` (required): Code to test
- `language` (optional): Programming language
- `context` (optional): Testing framework (e.g., "Jest", "pytest")

**Example**:
```
Use codex_test to generate pytest tests for this function
```

**Returns**:
- Comprehensive unit tests
- Edge case tests
- Test setup/teardown
- Coverage explanation

---

### 7. `codex_document`

Generate documentation for code.

**Parameters**:
- `code` (required): Code to document
- `language` (optional): Programming language
- `context` (optional): Documentation style (e.g., "JSDoc", "rustdoc")

**Example**:
```
Use codex_document to create JSDoc for this class
```

**Returns**:
- Function/class documentation
- Parameter descriptions
- Return value descriptions
- Usage examples
- Edge case notes

---

### 8. `codex_complete`

Complete partially written code.

**Parameters**:
- `code` (required): Partial code
- `cursor_position` (optional): Cursor position
- `language` (optional): Programming language

**Example**:
```
Use codex_complete to finish this function
```

**Returns**: Code completion suggestion

---

## ✅ Verification

### Test Manually

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-codex
OPENAI_API_KEY=sk-your-key npm start
# Press Ctrl+C to exit
```

**Expected Output**:
```
Miyabi Codex MCP Server running on stdio
Using OpenAI model: gpt-4-turbo-preview
```

### Test in Claude

```
Use codex_generate to create a hello world function in TypeScript
```

---

## 🎯 Use Cases

### 1. Code Generation

```
Use codex_generate with prompt "Create a REST API endpoint for user registration" and language "TypeScript"
```

### 2. Code Review Before PR

```
Use codex_review with focus "security" for all changed files
```

### 3. Bug Fixing

```
Use codex_fix with the error message and failing code
```

### 4. Test Coverage

```
Use codex_test to generate tests for untested functions
```

### 5. Documentation Sprint

```
Use codex_document to generate docs for all public APIs
```

### 6. Refactoring Legacy Code

```
Use codex_refactor to modernize old code
```

---

## 💡 Best Practices

### Prompt Engineering Tips

1. **Be Specific**: Include language, framework, and requirements
2. **Provide Context**: Mention related code, patterns, or constraints
3. **Iterate**: Use review/refactor tools to improve generated code
4. **Verify**: Always review AI-generated code before using

### Example: Effective Prompt

❌ **Bad**:
```
Use codex_generate with prompt "make a function"
```

✅ **Good**:
```
Use codex_generate with prompt "Create a TypeScript function that validates email addresses using regex, returns boolean, and includes JSDoc comments" and language "TypeScript"
```

---

## 💰 Cost Considerations

### OpenAI API Pricing (as of 2024)

| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|------------------------|
| gpt-4-turbo-preview | $0.01 | $0.03 |
| gpt-4 | $0.03 | $0.06 |
| gpt-3.5-turbo | $0.0005 | $0.0015 |

**Average Request Cost**:
- Code generation: ~$0.05-0.15
- Code review: ~$0.03-0.10
- Code explanation: ~$0.02-0.08

**Tips to Reduce Costs**:
- Use `gpt-3.5-turbo` for simple tasks
- Cache frequently used prompts
- Limit context to relevant code only

---

## 🐛 Troubleshooting

### API Key Error

```
Error: OPENAI_API_KEY environment variable is required
```

**Solution**: Set the API key in MCP configuration or environment

### Rate Limit Error

```
Error: Rate limit exceeded
```

**Solution**:
- Wait and retry
- Upgrade OpenAI plan
- Use exponential backoff

### Model Not Found

```
Error: Model 'gpt-5' not found
```

**Solution**: Use a supported model (see Configuration section)

---

## 🔒 Security Notes

1. **API Key Protection**:
   - Never commit API keys to git
   - Use environment variables only
   - Rotate keys periodically

2. **Code Review**:
   - Always review AI-generated code
   - Don't blindly trust output
   - Test thoroughly before deployment

3. **Data Privacy**:
   - OpenAI processes your code
   - Don't send sensitive/proprietary code
   - Review OpenAI's data usage policy

---

## 🚀 Advanced Usage

### Custom System Prompts

Modify `src/index.ts` to customize system prompts for your specific needs:

```typescript
const systemPrompt = `You are an expert ${language} developer at a ${context} company...`;
```

### Model Selection

Use different models for different tasks:
- **gpt-4-turbo-preview**: Complex refactoring, architecture design
- **gpt-3.5-turbo**: Simple generation, quick explanations

---

## 🔗 Related

- **Main Quickstart**: `../MIYABI_MCP_QUICKSTART.md`
- **OpenAI API Docs**: https://platform.openai.com/docs
- **OpenAI Pricing**: https://openai.com/pricing

---

## 📈 Comparison with Other Tools

| Feature | miyabi-codex | GitHub Copilot | Cursor |
|---------|--------------|----------------|--------|
| MCP Integration | ✅ | ❌ | ❌ |
| Custom Prompts | ✅ | ⚠️ Limited | ✅ |
| Code Review | ✅ | ❌ | ⚠️ Limited |
| Test Generation | ✅ | ⚠️ Limited | ✅ |
| Documentation | ✅ | ❌ | ⚠️ Limited |
| Cost Control | ✅ Full | ❌ Subscription | ❌ Subscription |

---

## 📝 Future Enhancements

- [ ] Support for o1-preview (advanced reasoning)
- [ ] Streaming responses for long generations
- [ ] Code embeddings for semantic search
- [ ] Integration with Miyabi Agent System
- [ ] Caching for common patterns
- [ ] Multi-file refactoring

---

**Project**: Miyabi
**Last Updated**: 2025-11-19
**Maintainer**: Miyabi Team
