# AntiGravity Development Guidelines

## 🎯 Development Philosophy

### Core Principles
1. **MCP First** - ツールはMCP経由で使用
2. **Issue Driven** - 全作業はIssueに紐づく
3. **Test Coverage** - テストなきコードなし
4. **Documentation** - コードと同時にドキュメント更新

---

## 🔀 Git Workflow

### Branch Strategy
```
main
  └── develop
        ├── feature/issue-XXX-description
        ├── fix/issue-XXX-description
        └── refactor/issue-XXX-description
```

### Branch Naming
```
type/issue-number-short-description

Examples:
- feature/issue-123-add-dashboard
- fix/issue-456-memory-leak
- refactor/issue-789-cleanup-api
```

### Commit Convention
```
type(scope): description

feat(dashboard): add agent status panel
fix(mcp): resolve connection timeout
docs(readme): update installation guide
refactor(core): simplify agent communication
test(api): add integration tests
chore(deps): update dependencies
```

---

## 🏗️ Code Standards

### Rust
```rust
// cargo fmt で整形
// cargo clippy で静的解析

// 命名規則
struct AgentConfig { ... }  // PascalCase
fn process_task() { ... }   // snake_case
const MAX_AGENTS: u32 = 21; // SCREAMING_SNAKE_CASE
```

### TypeScript
```typescript
// ESLint + Prettier で整形

// 命名規則
interface AgentConfig { ... }  // PascalCase
function processTask() { ... } // camelCase
const MAX_AGENTS = 21;         // SCREAMING_SNAKE_CASE
```

---

## 🧪 Testing

### Rust Tests
```bash
# 全テスト実行
cargo test

# 特定テスト
cargo test test_agent_communication

# カバレッジ
cargo tarpaulin
```

### TypeScript Tests
```bash
# Jest実行
npm test

# Watch mode
npm test -- --watch
```

---

## 📦 Build & Deploy

### Local Build
```bash
# Rust
cargo build --release

# Frontend
npm run build
```

### CI/CD Pipeline
1. Push to feature branch
2. GitHub Actions runs tests
3. Create PR to develop
4. Review & Merge
5. Auto-deploy to staging
6. Merge to main
7. Auto-deploy to production

---

## 🔐 Security

### Secrets Management
- 環境変数は `.env` (gitignore済み)
- Secrets は GitHub Secrets 経由
- API キーはコードに含めない

### Code Review Checklist
- [ ] セキュリティホールなし
- [ ] 機密情報の露出なし
- [ ] 入力バリデーション済み
- [ ] エラーハンドリング適切

---

## 📊 Performance

### Metrics
- レスポンスタイム < 200ms
- メモリ使用量 < 512MB
- CPU使用率 < 80%

### Optimization Guidelines
1. 機能完成後に最適化
2. プロファイリングで検証
3. 計測なき最適化なし
