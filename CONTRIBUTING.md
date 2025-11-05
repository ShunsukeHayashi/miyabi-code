# Contributing to Autonomous Operations

Thank you for your interest in contributing to the Autonomous Operations platform! This guide will help you get started.

## 🎯 Overview

Autonomous Operations is a fully autonomous AI-driven development platform. We follow the Organizational (組織設計) theory principles for clear responsibility, hierarchy, and data-driven decision making.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Contributor License Agreement (CLA)](#-contributor-license-agreement-cla)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Agent Development](#agent-development)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## 📜 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Follow objective, data-driven discussions
- Respect the Organizational principles (no emotional judgment)

## 📝 Contributor License Agreement (CLA)

By submitting a pull request to this project, you agree to the following terms:

### 1. License Grant

You grant Shunsuke Hayashi and all users of Miyabi a perpetual, worldwide, non-exclusive, royalty-free license to:
- Use, reproduce, and distribute your contributions
- Create derivative works based on your contributions
- Sublicense your contributions under Apache License 2.0

### 2. Patent License

If your contribution includes any patents, you grant a patent license to:
- Make, use, sell, and distribute the work embodying your contribution
- This license applies only to patent claims you can license

### 3. Your Certifications

By submitting a contribution, you certify that:

- ✅ You have the right to submit the work under Apache 2.0
- ✅ Your contribution is your original creation or you have permission to submit it
- ✅ You understand this is a voluntary contribution
- ✅ Your contribution does not violate any third-party rights

### 4. No Warranty

Your contributions are provided "AS IS" without warranties of any kind.

### 5. Employer Rights

If your employer has rights to intellectual property you create, you have:
- Permission to make the contribution on behalf of your employer, OR
- Your employer has waived such rights for this contribution

---

**By creating a pull request, you acknowledge that you have read and agree to these terms.**

For questions about the CLA, please open an issue or contact the maintainers via GitHub.

## 🚀 Getting Started

### Prerequisites

```bash
node -v    # v20+
npm -v     # v10+
git --version  # v2.40+
```

### Setup

1. **Fork the repository**
   ```bash
   gh repo fork ShunsukeHayashi/Autonomous-Operations
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Autonomous-Operations.git
   cd Autonomous-Operations
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Verify setup**
   ```bash
   npm run typecheck  # Should pass with 0 errors
   npm test           # Should pass 7/7 tests
   ```

## 💻 Development Workflow

### Branch Naming

```bash
# Feature branches
devin/YYYYMMDD-feature-name

# Bug fixes
devin/YYYYMMDD-fix-issue-123

# Documentation
devin/YYYYMMDD-docs-update
```

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <description>

[optional body]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>

# Types
feat:     New feature
fix:      Bug fix
refactor: Code refactoring
docs:     Documentation
test:     Testing
ci:       CI/CD changes
perf:     Performance improvement

# Examples
feat(agents): implement AutoFixAgent
fix(coordinator): resolve circular dependency detection bug
docs(manual): update agent operations manual
test(codegen): add unit tests for code generation
```

### Log-Driven Development (LDD)

All development MUST follow LDD protocol:

1. **Before starting**
   ```bash
   # Create daily log
   echo "## $(date +%Y-%m-%d)" > .ai/logs/$(date +%Y-%m-%d).md
   ```

2. **Log structure**
   ```markdown
   ## codex_prompt_chain

   **intent**: What you're trying to achieve

   **plan**:
   1. Step 1
   2. Step 2

   **implementation**:
   - File changes

   **verification**:
   - Test results

   ## tool_invocations

   - command: npm test
     workdir: /path
     timestamp: 2025-10-08T12:00:00Z
     status: passed
     notes: All tests passing
   ```

3. **Update memory bank**
   ```bash
   # After completing work
   cat >> @memory-bank.mdc << EOF
   ## [$(date +%Y-%m-%d)] Your contribution
   - What was implemented
   - Key decisions
   - Next steps
   EOF
   ```

### AI-generated artifacts

- `.ai/metrics`, `.ai/improvements`, `.ai/state` は一時生成物です。リポジトリでは自動的に無視されるため、コミット前に `scripts/cleanup-ai-artifacts.sh` を実行してクリーンな状態を維持してください。
- `.ai/plans/**` は issue ごとの計画履歴として保持します。不要な旧バージョンを削除する場合は最新のものを残し、レビュー用の情報が維持されるようにしてください。
- `.ai/logs`, `.ai/parallel-reports`, `.ai/issues` などコミット対象のフォルダは機密情報が含まれていないかを確認し、必要最小限のファイルのみをコミットしてください。

## 🤖 Agent Development

### Creating a New Agent

1. **Extend BaseAgent**
   ```typescript
   import { BaseAgent } from '../base-agent.js';
   import { AgentResult, Task } from '../types/index.js';

   export class MyNewAgent extends BaseAgent {
     constructor(config: any) {
       super('MyNewAgent', config);
     }

     async execute(task: Task): Promise<AgentResult> {
       this.log('🚀 MyNewAgent starting');

       try {
         // Implementation

         return {
           status: 'success',
           data: result,
           metrics: {
             taskId: task.id,
             agentType: this.agentType,
             durationMs: Date.now() - this.startTime,
             timestamp: new Date().toISOString(),
           },
         };
       } catch (error) {
         // Escalate if needed
         await this.escalate(
           `Error in MyNewAgent: ${(error as Error).message}`,
           'TechLead',
           'Sev.2-High',
           { error: (error as Error).stack }
         );
         throw error;
       }
     }
   }
   ```

2. **Add type definitions**
   ```typescript
   // In agents/types/index.ts
   export type AgentType =
     | 'CoordinatorAgent'
     | 'MyNewAgent'  // Add here
     | ...
   ```

3. **Write tests**
   ```typescript
   // In tests/mynew-agent.test.ts
   describe('MyNewAgent', () => {
     it('should execute successfully', async () => {
       const agent = new MyNewAgent(config);
       const result = await agent.execute(task);
       expect(result.status).toBe('success');
     });
   });
   ```

### Agent Best Practices

- ✅ Always extend `BaseAgent`
- ✅ Implement `execute(task: Task): Promise<AgentResult>`
- ✅ Use `this.log()` for logging
- ✅ Use `this.escalate()` for issues
- ✅ Record tool invocations with `this.logToolInvocation()`
- ✅ Handle errors gracefully
- ✅ Return proper metrics
- ❌ Never use `console.log()` directly
- ❌ Never swallow errors silently

## 🧪 Testing Guidelines

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage

# Type check
npm run typecheck
```

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('MyNewAgent', () => {
  let agent: MyNewAgent;
  let config: AgentConfig;

  beforeEach(() => {
    config = {
      deviceIdentifier: 'test-device',
      githubToken: 'test-token',
      anthropicApiKey: 'test-key',
      useTaskTool: false,
      useWorktree: false,
      logDirectory: '.ai/logs',
      reportDirectory: '.ai/test-reports',
    };
    agent = new MyNewAgent(config);
  });

  describe('execute', () => {
    it('should handle feature tasks', async () => {
      const task: Task = {
        id: 'test-1',
        title: 'Test Feature',
        description: 'Test',
        type: 'feature',
        priority: 1,
        severity: 'Sev.3-Medium',
        impact: 'Medium',
        assignedAgent: 'MyNewAgent',
        dependencies: [],
        estimatedDuration: 30,
        status: 'idle',
      };

      const result = await agent.execute(task);

      expect(result.status).toBe('success');
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.agentType).toBe('MyNewAgent');
    });
  });
});
```

### Test Coverage Requirements

- **Minimum coverage**: 80%
- **Critical paths**: 100% coverage
- **Error handling**: Must be tested

## 🔄 Pull Request Process

### Before Creating PR

1. **Ensure all tests pass**
   ```bash
   npm test
   npm run typecheck
   ```

2. **Update documentation**
   - README.md (if adding features)
   - Type definitions
   - JSDoc comments

3. **Follow commit conventions**
   - Conventional Commits format
   - Include Claude Code attribution

### Creating PR

```bash
# Push your branch
git push origin devin/20251008-your-feature

# Create draft PR
gh pr create \
  --title "feat(scope): description" \
  --body "$(cat <<'EOF'
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Test Results
✅ All tests passing
✅ TypeScript: 0 errors
✅ Coverage: 85%

## Checklist
- [x] Tests added/updated
- [x] Documentation updated
- [x] Type definitions updated
- [x] No breaking changes

Closes #123

---

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)" \
  --draft
```

### PR Review Process

1. **Automated Checks**
   - TypeScript compilation
   - Test suite
   - Linting
   - Coverage report

2. **Code Review**
   - TechLead approval required
   - Address review comments
   - Re-request review after changes

3. **Merge**
   - Squash and merge (default)
   - Delete branch after merge

## 🎨 Style Guide

### TypeScript

```typescript
// ✅ Good: Strict types
interface UserData {
  id: string;
  name: string;
  email: string;
}

// ❌ Bad: Any types
interface UserData {
  data: any;
}

// ✅ Good: Explicit return types
async function fetchUser(id: string): Promise<UserData> {
  // ...
}

// ❌ Bad: Implicit return types
async function fetchUser(id: string) {
  // ...
}
```

### Naming Conventions

```typescript
// Classes: PascalCase
class CodeGenAgent extends BaseAgent {}

// Interfaces: PascalCase
interface AgentConfig {}

// Functions: camelCase
async function executeTask() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Private methods: camelCase with underscore prefix (optional)
private async _internalMethod() {}
```

### File Structure

```
agents/
├── agent-name/
│   ├── agent-name-agent.ts    # Main implementation
│   └── types.ts               # Agent-specific types (optional)
├── types/
│   └── index.ts               # Shared types
└── base-agent.ts              # Base class
```

### Comments

```typescript
/**
 * Execute the agent's main task
 *
 * @param task - The task to execute
 * @returns Agent execution result with metrics
 * @throws AgentError if execution fails
 */
async execute(task: Task): Promise<AgentResult> {
  // Implementation
}

// Single-line comments for brief explanations
const retry = 3; // Maximum retry attempts
```

## 📊 Quality Standards

### Code Quality

- **TypeScript strict mode**: Required
- **ESLint**: Must pass with 0 errors
- **Test coverage**: ≥80%
- **Quality score**: ≥80/100 (ReviewAgent)

### Performance

- **Agent execution**: <5 minutes (typical)
- **Memory usage**: <500MB per agent
- **Concurrent tasks**: 2-5 recommended

### Security

- **No hardcoded secrets**: Use environment variables
- **No eval()**: Forbidden
- **Input validation**: Always validate external input
- **Dependency scanning**: npm audit must pass

## 🐛 Reporting Issues

### Bug Reports

Use the Issue template:

```markdown
**Describe the bug**
Clear and concise description

**To Reproduce**
1. Step 1
2. Step 2

**Expected behavior**
What should happen

**Actual behavior**
What actually happened

**Environment**
- OS: macOS 14.0
- Node: v20.10.0
- npm: v10.2.0

**Logs**
Attach `.ai/logs/` files if relevant
```

### Feature Requests

```markdown
**Feature Description**
What feature do you want?

**Use Case**
Why is this needed?

**Proposed Solution**
How might this work?

**Alternatives Considered**
What other approaches were considered?
```

## 🎓 Learning Resources

- [docs/AGENT_OPERATIONS_MANUAL.md](docs/AGENT_OPERATIONS_MANUAL.md) - Complete agent guide
- [docs/AUTONOMOUS_WORKFLOW_INTEGRATION.md](docs/AUTONOMOUS_WORKFLOW_INTEGRATION.md) - Workflow integration
- [docs/REPOSITORY_OVERVIEW.md](docs/REPOSITORY_OVERVIEW.md) - Architecture overview
- [Organizational Design Principles](https://en.wikipedia.org/wiki/Organizational) - Management philosophy

## 📚 Documentation Guidelines

### ドキュメント更新ルール

ドキュメントを更新する際は、以下のルールに従ってください。

#### 1. メタデータ更新

**ドキュメント更新時は必ずメタデータを更新**

```markdown
**Last Updated**: YYYY-MM-DD
**Version**: X.X.X
**Status**: ✅ Active / 📋 Planning / 🚧 WIP
```

#### 2. バージョニングルール

| 変更内容 | Version更新 | 例 |
|---------|-----------|-----|
| **Patch** (軽微な修正) | x.x.X | 誤字修正、リンク修正 |
| **Minor** (機能追加) | x.X.0 | 新セクション追加、大幅な改善 |
| **Major** (破壊的変更) | X.0.0 | 構造変更、互換性のない変更 |

#### 3. 対象ドキュメント

**メタデータ必須**:
- Context modules (`.claude/context/*.md`)
- Core docs (`docs/*.md`)
- Agent specs (`.claude/agents/specs/**/*.md`)
- CLAUDE.md

**メタデータ推奨**:
- README.md
- その他主要ドキュメント

#### 4. 更新チェックリスト

ドキュメント更新時は以下を確認:

- [ ] `Last Updated` を今日の日付に更新
- [ ] `Version` を適切にインクリメント (Patch/Minor/Major)
- [ ] `Status` を適切に設定 (Active/Planning/WIP)
- [ ] 変更内容をコミットメッセージに記載
- [ ] 関連ドキュメントのリンク切れチェック

#### 5. コミットメッセージ規約

ドキュメント更新時は `docs:` prefixを使用:

```bash
# 良い例
docs(CLAUDE.md): Agent数を実態に合わせて更新
docs(context): バージョン情報を追加
docs(README): インストール手順を改善

# 悪い例
Update CLAUDE.md  # prefixなし
Fix docs  # 具体性なし
```

#### 6. サンプルテンプレート

**Context Module Template**:
```markdown
# Module Title

**Last Updated**: 2025-10-26
**Version**: 2.0.1
**Priority**: ⭐⭐⭐⭐

## Content...
```

**Core Doc Template**:
```markdown
# Document Title

**Last Updated**: 2025-10-26
**Version**: 2.0.1
**Status**: ✅ Active

## Content...
```

**Agent Spec Template**:
```markdown
# Agent Name

**Agent名**: AgentName
**バージョン**: 1.0.0
**ステータス**: ✅ 実装済み / 📋 Planning
**Target Release**: vX.X.X (計画中の場合)

## Content...
```

#### 7. よくある質問

**Q: 小さな誤字修正でもVersionを上げる？**
A: はい。Patch versionを上げてください (例: 2.0.1 → 2.0.2)

**Q: Last Updatedのみ変更すればいい？**
A: いいえ。Versionも必ず更新してください。

**Q: 複数ファイルを一度に更新した場合は？**
A: 各ファイルのVersionとLast Updatedを個別に更新してください。

**Q: Statusはいつ変更する？**
A: Planning → WIP (作業開始時)、WIP → Active (完成時)

---

## 💡 Tips

- **Start small**: Begin with documentation or test improvements
- **Ask questions**: Use GitHub Discussions
- **Follow patterns**: Look at existing agents for examples
- **Test thoroughly**: Write tests first (TDD recommended)
- **Document everything**: Future you will thank you

## 🙏 Recognition

Contributors are recognized in:
- README.md acknowledgments
- Git commit history
- Release notes

Significant contributions may earn you:
- Contributor badge
- Mention in documentation
- Invitation to maintainer team

---

Thank you for contributing to Autonomous Operations! 🤖

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
