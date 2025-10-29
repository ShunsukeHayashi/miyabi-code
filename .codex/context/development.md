# Development Guidelines

**Last Updated**: 2025-10-26
**Version**: 2.0.1

**Priority**: ⭐⭐⭐

## 🦀 Rust Development

### Core Libraries
- `tokio` - 非同期ランタイム
- `async-trait` - Trait非同期メソッド
- `serde` + `serde_json` - シリアライゼーション
- `thiserror` + `anyhow` - エラーハンドリング
- `clap` - CLI フレームワーク
- `octocrab` - GitHub API
- `tracing` + `tracing-subscriber` - ログ

### Coding Standards
```bash
# Clippy警告0件
cargo clippy -- -D warnings

# Rustfmt適用
cargo fmt

# 全public APIにRustdocコメント
/// Documentation here
```

### Testing
```bash
# 単体テスト + 統合テスト
cargo test --all

# 特定パッケージ
cargo test --package miyabi-agents

# カバレッジ目標: 80%以上
```

### Error Handling
```rust
use miyabi_types::error::{MiyabiError, Result};

fn my_function() -> Result<String> {
    // Result型を常に使用
    Ok("success".to_string())
}
```

**詳細**: [rust.md](./rust.md)

## 📘 TypeScript (レガシー - 参考)

**Note**: TypeScript版は段階的にRustに移行中

- Strict mode必須
- ESM形式（import/export）
- Vitest使用

**詳細**: [typescript.md](./typescript.md)

## 🔐 Security

### トークン管理
```bash
# 環境変数推奨
export GITHUB_TOKEN=ghp_xxx
export ANTHROPIC_API_KEY=sk-xxx

# .miyabi.ymlはgitignore
echo ".miyabi.yml" >> .gitignore
```

### Dependabot & CodeQL
- Dependabot有効（自動セキュリティアップデート）
- CodeQL有効（静的解析）

## 📝 Commit Conventions

### Conventional Commits準拠
```
feat: Add new feature
fix: Fix bug
chore: Update dependencies
docs: Update documentation
refactor: Refactor code
test: Add tests
```

### Git Commit Process
```bash
# ステータス確認
git status

# 変更確認
git diff

# ステージング
git add <files>

# コミット（必ずHEREDOC使用）
git commit -m "$(cat <<'EOF'
feat(miyabi-core): add new feature

Description here

🤖 Generated with [Codex](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**詳細**: CLAUDE.md "Committing changes with git"セクション

## 🚀 Build & Release

### Development Build
```bash
cargo build
```

### Release Build
```bash
cargo build --release
# Binary: target/release/miyabi
```

### CI/CD
**GitHub Actions**: `.github/workflows/rust.yml`
- Test job: ubuntu-latest, macos-latest, windows-latest
- Build job: リリースバイナリ生成
- Artifact upload: `miyabi` / `miyabi.exe`

## 📊 Quality Metrics

### Code Quality Targets
- **Clippy警告**: 0件
- **テストカバレッジ**: 80%以上
- **Rustdocカバレッジ**: 100% (public API)
- **ビルド時間**: <5分 (CI)

### ReviewAgent Scoring (100点満点)
- 90-100点: `quality:excellent`
- 80-89点: `quality:good`
- 70-79点: `quality:fair`
- <70点: `quality:needs-improvement`

## 🔗 Related Modules

- **Rust**: [rust.md](./rust.md) - Rust詳細ガイド
- **Protocols**: [protocols.md](./protocols.md) - タスク管理・報告
- **Core Rules**: [core-rules.md](./core-rules.md) - MCP/Benchmark/Context7

## 📖 Detailed Documentation

- **Rust Migration**: `docs/RUST_MIGRATION_REQUIREMENTS.md`
- **Rust Migration Sprint**: `docs/RUST_MIGRATION_SPRINT_PLAN.md`
- **Rust Migration Checklist**: `.codex/RUST_MIGRATION_CHECKLIST.md`
