# 🦀 Rust CLI マイグレーション計画

**作成日**: 2025-11-22
**バージョン**: 1.0.0
**ステータス**: 🚀 Active

---

## 📊 現状サマリー

### 発見された事実

| 項目 | 当初想定 | 実際の状態 |
|------|---------|-----------|
| Rustクレート数 | 未実装 | **48個存在** |
| ビルド状態 | 失敗 | **全てビルド成功** |
| miyabi CLI | 使用不可 | **14MBバイナリで完全動作** |
| Agent実装 | なし | **7種類実装済み** |

### 利用可能なコマンド

```bash
# インストール場所
~/.local/bin/miyabi

# バージョン
miyabi 0.1.1
```

---

## 🎯 Phase 1: 即時利用開始（完了）

### ✅ 完了項目

1. [x] Workspace全体のビルド確認
2. [x] リリースビルド作成（14MB）
3. [x] PATHへのシンボリックリンク作成
4. [x] 基本動作確認
5. [x] 古いバイナリの削除

### 利用可能なコマンド

| コマンド | 説明 | 使用例 |
|---------|------|--------|
| `miyabi status` | プロジェクト状態 | `miyabi status` |
| `miyabi agent` | Agent実行 | `miyabi agent coordinator --issue 123` |
| `miyabi mode` | 適応モード | `miyabi mode run codegen --issue 123` |
| `miyabi infinity` | 自律実行 | `miyabi infinity --max-issues 10` |
| `miyabi parallel` | 並列実行 | `miyabi parallel --issues 1,2,3` |
| `miyabi worktree` | Worktree管理 | `miyabi worktree list` |
| `miyabi a2a` | Agent間通信 | `miyabi a2a create --title "Task"` |

---

## 🔄 Phase 2: 並行運用（今週）

### 目標

- tmux運用とRust CLIを並行して使用
- 簡単なタスクからRust CLIに移行
- 問題点の洗い出し

### 移行対象タスク

| タスク | 現在の方法 | Rust CLI |
|--------|-----------|----------|
| Issue状態確認 | `gh issue view` | `miyabi status` |
| Agent実行 | tmux + Claude Code | `miyabi agent <type>` |
| コードレビュー | 手動 | `miyabi mode run review` |
| 並列実行 | 手動worktree | `miyabi parallel` |

### 実行計画

```bash
# Day 1-2: 状態確認系コマンドの使用
miyabi status
miyabi worktree list
miyabi mode list

# Day 3-4: 単一Issue処理
miyabi work-on <ISSUE_NUMBER>
miyabi agent codegen --issue <NUMBER>

# Day 5-7: 並列・自律実行
miyabi parallel --issues <LIST>
miyabi infinity --dry-run --max-issues 3
```

---

## 🚀 Phase 3: 完全移行（来週）

### 目標

- Agent実行をRust CLIベースに完全移行
- MCPサーバーとの連携確認
- ドキュメント更新

### 移行完了条件

- [ ] 全Agentタイプの動作確認
- [ ] infinity modeの本番使用
- [ ] 並列実行の安定動作
- [ ] tmux運用との比較レポート作成

---

## 📊 期待される効果

### パフォーマンス比較（設計値）

| 指標 | tmux + Claude Code | Rust CLI | 改善率 |
|------|-------------------|----------|--------|
| 起動時間 | 2-3秒 | 0.05秒 | **98%短縮** |
| メモリ使用量 | 400-500MB | 50-100MB | **80%削減** |
| Agent実行 | 個別待機必要 | チェーン実行 | **50%短縮** |

### 運用面

- ✅ 単一バイナリで配布可能
- ✅ コンパイル時型安全性
- ✅ 並列実行のネイティブサポート
- ✅ エラーハンドリングの改善

---

## 🛠️ 利用可能なAgent一覧

### Coding Agents

| Agent | コマンド | 説明 |
|-------|---------|------|
| Coordinator | `miyabi agent coordinator` | マルチエージェント調整 |
| CodeGen | `miyabi agent codegen` | コード生成 |
| Review | `miyabi agent review` | コードレビュー |
| Issue | `miyabi agent issue` | Issue分析 |
| Workflow | `miyabi agent workflow` | ワークフロー管理 |

### Business Agents

| Agent | クレート | 説明 |
|-------|---------|------|
| Business | `miyabi-agent-business` | ビジネスロジック |
| AWS | `miyabi-aws-agent` | AWS連携 |

---

## 📁 クレート構成

```
crates/
├── miyabi-cli/              # CLI エントリーポイント
├── miyabi-core/             # コア機能
├── miyabi-types/            # 型定義
├── miyabi-agents/           # Agent統合
├── miyabi-agent-core/       # Agent基盤
├── miyabi-agent-coordinator/ # Coordinator Agent
├── miyabi-agent-codegen/    # CodeGen Agent
├── miyabi-agent-review/     # Review Agent
├── miyabi-agent-issue/      # Issue Agent
├── miyabi-agent-workflow/   # Workflow Agent
├── miyabi-agent-business/   # Business Agent
├── miyabi-orchestrator/     # オーケストレーション
├── miyabi-worktree/         # Git Worktree管理
├── miyabi-github/           # GitHub API統合
├── miyabi-llm/              # LLM抽象化
├── miyabi-knowledge/        # ナレッジ管理
├── miyabi-modes/            # 適応モード
├── miyabi-a2a/              # Agent間通信
├── miyabi-workflow/         # ワークフローDSL
└── ...（48クレート）
```

---

## 🔧 トラブルシューティング

### Qdrantが必要な場合

```bash
# Qdrantの起動（Docker）
docker run -p 6333:6333 qdrant/qdrant

# Knowledge機能の使用
miyabi knowledge stats
miyabi knowledge search "query"
```

### ビルドエラーが発生した場合

```bash
# クリーンビルド
cargo clean
cargo build --release --bin miyabi

# 依存関係の更新
cargo update
```

---

## 📝 次のステップ

1. **即時**: `miyabi status` を日常的に使用開始
2. **今週**: 簡単なIssueで `miyabi work-on` をテスト
3. **来週**: `miyabi infinity` で自律実行を開始

---

## 📞 フィードバック

問題や改善提案は以下で報告：

```bash
# GitHub Issue作成
gh issue create --title "Rust CLI: [問題内容]" --label "🦀 rust"

# このコマンドセンターで報告
"Rust CLIで〜の問題が発生"
```

---

**🦀 Rust CLI Migration Plan v1.0.0**
**Welcome to the future of Miyabi!**
