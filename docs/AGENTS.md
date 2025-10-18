# Codex Agents 運用ガイド（CLAUDE準拠要約）

> 本ドキュメントは `agents.md` / `CLAUDE.md` の要点を抜粋し、ワークツリー内の Codex/Claude Code 実行に必要な最小情報を提供します。詳細は必ず `agents.md` および `.claude/agents/` の仕様書を参照してください。

---

## 1. 参照チェーン
1. `CLAUDE.md`（プロジェクト全体方針）
2. `agents.md`（CLAUDE準拠の統合マニュアル）
3. `.claude/agents/specs/**`（Agent仕様）
4. `.claude/agents/prompts/**`（Worktree実行手順）

---

## 2. Agent 体系
- **Coding 7**: しきるん (Coordinator) / つくるん (CodeGen) / めだまん (Review) / みつけるん (Issue) / まとめるん (PR) / はこぶん (Deployment) / つなぐん (Hooks)
- **Business 14**: あきんどさん 〜 かぞえるん（戦略・マーケ・営業の全14種）
- キャラクター名マッピングは `.claude/agents/agent-name-mapping.json` を単一ソースとする
- 色区分と並列ルール: 🔴リーダー（並列不可） / 🟢実行 / 🔵分析 / 🟡サポート（条件付き）

---

## 3. 基本フロー
1. **Issue Intake**: Label と metadata を取得 (`state:pending`)
2. **タスク分解**: しきるん → WorktreeManager
3. **Worktree 実行**: `.worktrees/<issue-id>/` で各 Agent がプロンプトに従い実行
4. **成果物**: コード / ドキュメント / PR / デプロイ結果
5. **ログ**: `.ai/logs/` と `@memory-bank.mdc` に IDD 形式で記録

成果物には `EXECUTION_CONTEXT.md` と `.agent-context.json` が必ず付帯します。

---

## 4. ラベル連携（53 Labels）
- 代表カテゴリ: STATE, AGENT, PRIORITY, TYPE, SEVERITY, PHASE, SPECIAL, TRIGGER, QUALITY, COMMUNITY
- 遷移例: `state:pending → state:analyzing → state:implementing → state:reviewing → state:done`
- IssueAgent が初期推定、CoordinatorAgent が確定、ReviewAgent が品質スコアに応じて QUALITY ラベルを更新

---

## 5. 推奨コマンド
```bash
cargo fmt
cargo clippy -- -D warnings
cargo test --all
cargo build --release --bin miyabi
scripts/smoke-codex-miyabi.sh
```
TypeScript レガシー資産が必要な場合は `pnpm lint` / `pnpm test` を補助的に使用します。

---

## 6. ガバナンス
- ブランチ命名: `devin/{timestamp}-{feature-name}`
- コミット: Conventional Commits
- PR: Draft + 検証手順の明記
- Secrets: `.env` / `.env.local` 管理、`.gitignore` 徹底
- 破壊的操作はユーザー承認なしで実施しない（`git reset --hard`, `rm -rf` 等禁止）

---

## 7. 更新履歴
| Date       | Author | Summary |
| ---------- | ------ | ------- |
| 2025-10-16 | Codex  | `CLAUDE.md` と同一方針へ再構成（Agent体系 / フロー / ラベル / コマンドを統一） |
