# CLAUDE.md

This file provides guidance for Claude Code working with miyabi-code.

## Language

**ALL responses, comments, and documentation in Japanese (日本語).**

## Project Overview

**MiyabiCode** is an AI coding agent for the Miyabi Agent Society. Inspired by OpenCode, it provides intelligent code generation, review, and workflow automation specifically designed for the Miyabi ecosystem.

### Key Features

- 🤖 **Anthropic Claude Integration** - Uses Claude API for code generation
- 🎭 **Agent Society Integration** - Coordinates with 21+ specialized agents
- 🔌 **MCP Bundle Integration** - Access to 172+ tools
- 📋 **Issue-Driven Development** - GitHub-centric workflow
- 🇯🇵 **Japanese Language Support** - Optimized for Japanese development

### Technology Stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript (strict mode) |
| LLM Provider | Anthropic Claude SDK |
| Build Tool | TypeScript Compiler (tsc) |
| Test Runner | Vitest |
| Linter | ESLint + TypeScript ESLint |
| Package Manager | npm |

## Project Structure

```
src/
├── agent/          # エージェント実装 (P3: Base → Router → 7 Agents)
├── llm/            # LLMプロバイダー (P4: Provider → Anthropic → OpenAI → Google → Local)
├── mcp/            # MCP統合 (P5: Client → Tools → Bundle → Progressive Disclosure)
├── tmux/           # tmux通信 (P6: Client → Protocol → Messenger → P0.2 → Pane ID)
├── github/         # GitHub API (P7: Client → Issue → PR → Branch)
├── githubops/      # ワークフロー (P8: Workflow → IDD → Branch Naming → Commit Format)
├── config/         # 設定管理 (P10: Schema → Load → Validate → Env Vars)
├── utils/          # ユーティリティ (P2: Errors → Logger → Retry)
├── commands/       # CLIコマンド (P9: Main → Run → Send → Issue → PR → Agent → Init)
└── types.ts        # 型定義
```

## Development Commands

```bash
# 開発モード
npm run dev

# ビルド
npm run build

# テスト
npm test                 # 単体テスト
npm run test:watch       # ウォッチモード
npm run test:coverage    # カバレッジレポート

# リント
npm run lint            # ESLint
npm run type-check      # 型チェック
```

## Configuration

### miyabicode.json Schema

```json
{
  "name": "project-name",
  "version": "0.1.0",
  "llm": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "maxTokens": 4096,
    "temperature": 0.7
  },
  "mcp": {
    "enabled": ["miyabi-mcp-bundle"],
    "progressiveDisclosure": true
  },
  "tmux": {
    "session": "miyabi",
    "target": "agents.0"
  },
  "github": {
    "owner": "ShunsukeHayashi",
    "repo": "dev-workspace"
  },
  "workflow": {
    "branchNaming": "conventional",
    "commitFormat": "conventional"
  }
}
```

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | Claude API access | Yes (if using Anthropic) |
| `OPENAI_API_KEY` | OpenAI API access | No |
| `GEMINI_API_KEY` | Google Gemini API | No |
| `GITHUB_TOKEN` | GitHub API access | Recommended |

## Implementation Phases

### Phase 1-2: Foundation (Issues #23-30)
- ✅ プロジェクト構造作成
- ✅ 型定義 (types.ts)
- ✅ 設定管理 (config/)
- ✅ エラー処理 (utils/errors.ts)
- ✅ CLI基本構造 (cli.ts)

### Phase 3: Agents (Issues #23-30)
- ⏳ エージェント基底クラス
- ⏳ ルーター実装
- ⏳ 7エージェント実装 (しきるん, カエデ, サクラ, ツバキ, ボタン, ながれるん)

### Phase 4: LLM Integration (Issues #31-35)
- ⏳ プロバイダー基底
- ⏳ Anthropic実装
- ⏳ OpenAI実装
- ⏳ Google Gemini実装
- ⏳ ローカルモデル実装

### Phase 5: MCP Integration (Issues #36-39)
- ⏳ MCPクライアント
- ⏳ ツール管理
- ⏳ miyabi-mcp-bundle統合
- ⏳ Progressive Disclosureパターン

### Phase 6: tmux Integration (Issues #40-44)
- ⏳ tmuxクライアント
- ⏳ 通信プロトコル
- ⏳ エージェントメッセンジャー
- ⏳ P0.2プロトコル対応
- ⏳ 永続ペインID対応

### Phase 7: GitHub Integration (Issues #45-48)
- ⏳ GitHubクライアント
- ⏳ Issue管理
- ⏳ PR管理
- ⏳ ブランチ管理

### Phase 8: Workflow (Issues #49-52)
- ⏳ ワークフロー実装
- ⏳ IDDプロトコル
- ⏳ ブランチ命名規則
- ⏳ コミットメッセージ規約

### Phase 9: CLI Commands (Issues #53-59)
- ⏳ CLIメイン
- ⏳ runコマンド
- ⏳ sendコマンド
- ⏳ issueコマンド群
- ⏳ prコマンド群
- ⏳ agentコマンド群
- ⏳ initコマンド

### Phase 10: Configuration (Issues #60-63)
- ⏳ miyabicode.jsonスキーマ
- ⏳ 設定ファイル読み込み
- ⏳ 設定バリデーション
- ⏳ 環境変数対応

### Phase 11: Testing (Issues #64-68)
- ⏳ 単体テスト (engine, agent, mcp)
- ⏳ 統合テスト (agent-flow, githubops)

### Phase 12: Build & Packaging (Issues #69-72)
- ⏳ ビルドスクリプト
- ⏳ パッケージング設定
- ⏳ インストールスクリプト
- ⏳ ドキュメント更新

## Code Standards

### TypeScript
- **Strict mode** 必須
- **型安全**: `any` 禁止、明示的な型定義
- **命名規則**:
  - インターフェース: `PascalCase`
  - クラス: `PascalCase`
  - 関数・変数: `camelCase`
  - 定数: `SCREAMING_SNAKE_CASE`
  - 型: `PascalCase`

### Error Handling
- `MiyabiCodeError` 基底クラスを使用
- 適切な `ErrorCode` を指定
- `withRetry` で再試行ロジックを実装

### Testing
- 新規コードは100%カバレッジを目標
- Vitestを使用
- 単体テスト + 統合テスト

### Documentation
- JSDoc/TSDoc for public APIs
- 日本語コメントで説明
- 複雑なロジックは説明を追加

## Dependencies

```json
{
  "@anthropic-ai/sdk": "^0.32.1",
  "@modelcontextprotocol/sdk": "^1.0.4",
  "octokit": "^4.0.2",
  "zod": "^3.24.1"
}
```

## Key Constraints

- **P0.2 プロトコル準拠**: tmux通信は永久ペインID (%N) 使用
- **Issue-Driven Development**: 全ての作業はGitHub Issueから
- **Progressive Disclosure**: MCPツールは段階的公開
- **日本語最適化**: UI/ドキュメントは日本語

## Troubleshooting

### 設定ファイルが見つからない
```bash
npm run dev -- init    # miyabicode.jsonを作成
```

### APIキー設定
```bash
export ANTHROPIC_API_KEY=sk-ant-xxx
export GITHUB_TOKEN=ghp_xxx
```

### tmux接続エラー
```bash
tmux list-sessions  # セッション確認
tmux attach -t miyabi  # 接続
```

## Related Projects

- **Miyabi Private**: `01-miyabi/_core/miyabi-private/`
- **MCP Bundle**: `01-miyabi/_mcp/miyabi-mcp-bundle/`
- **OpenCode**: `_reference/open-code/` (参考実装)
