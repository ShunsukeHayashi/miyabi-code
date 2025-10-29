# Plan Mode & AGENTS.md Integration (Issue #609)

## 1.目的
- GitHub Agent HQ の Plan Mode と `AGENTS.md` ガードレールのアプローチを Miyabi に適用し、計画→実装→レビューを一貫したワークフローとして提供する。
- Miyabi CLI / VS Code 双方で計画フェーズを明示化し、生成コードのガードレール（AGENTS.md）を自動生成・同期する仕組みを整える。

## 2.現状分析
| 項目 | 現状 | 課題 |
|------|------|------|
| 計画フェーズ | `Plans.md` と `.ai/plans/` でテキスト管理。 | 対話的な質問／承認ステップが無い。CLI/VSCodeで一貫性が不足。 |
| 実行プロンプト | `.codex/agents/prompts/coding/*.md` に詳細手順あり。 | 事前計画の具体的コンテキストをプロンプトに渡せていない。 |
| ガードレール | `.codex/agents/specs/` などで仕様管理。 | Codex/GitHubの `AGENTS.md` 形式と互換がなく、VS Code拡張で扱えない。 |

## 3.提案アーキテクチャ
```
┌──────────────────────────────┐
│  Planning Interface          │
│  - CLI: `miyabi plan`        │
│  - VS Code Panel             │
│  (質問→回答→承認→保存)       │
└──────────────┬───────────────┘
               │ plan.json / plan.md
┌──────────────┴───────────────┐
│  Plan Store (.ai/plans/)     │
│  - 構造化データ (JSON/YAML)  │
│  - 命名: issue-XXXX/snapshot │
└──────────────┬───────────────┘
               │
┌──────────────┴───────────────┐
│  AGENTS.md Generator         │
│  - `.codex/agents/*` を参照 │
│  - ガードレール差分適用     │
│  - VS Code拡張と同期        │
└──────────────┬───────────────┘
               │
┌──────────────┴───────────────┐
│  Execution Pipeline          │
│  - agent-execution Skill     │
│  - プロンプトへ計画/AGENTS   │
└──────────────────────────────┘
```

## 4.ワークフロー案
1. `miyabi plan --issue 610` を実行 → CLI が質問テンプレートを用いて前提条件・完了条件・リスクをヒアリング。
2. 回答を `plan.json` / `plan.md` に保存し、レビュー用のPlanを出力（`.ai/plans/610/plan-<timestamp>.json`）。
3. `miyabi generate-agents-md --issue 610` を実行 → Plan情報と `.codex/agents/specs/` から `AGENTS.md` を生成（プロジェクトルート or `.codex/AGENTS.generated.md`）。
4. VS Code拡張は生成された `AGENTS.md` を検知し、Copilotにガードレールを適用（Plan Mode UIと同期）。
5. `miyabi agent run codegen --issue 610 --plan plan.json` で計画を実行。Agentは計画ステップ・ガードレールに従ったタスクを実施。

## 5.データモデル案
```jsonc
{
  "issue": 610,
  "title": "MCP Registry UX",
  "goal": "設計の詳細化",
  "steps": [
    {"id": "research", "description": "既存MCPサーバー確認", "owner": "CodeGenAgent"},
    {"id": "design", "description": "UX案作成", "owner": "DocumentationAgent"}
  ],
  "constraints": [
    "Prefer using existing CLI modules",
    "Keep config sync atomic"
  ],
  "dependencies": [],
  "risks": ["Secrets handling", "Versioning conflicts"]
}
```

## 6. VS Code 連携ポイント
- Plan Mode panel: webview で `plan.json` を編集 / 承認。Codex CLI とファイル同期を保つ。
- AGENTS.md watcher: 変更時に VS Code API (`Copilot agent customization`) を呼び出して設定反映。
- MCP Registry や Mission Control とも統一した UI タブにすることを検討（将来的）。

## 7. リスクと課題
- CLIとVS Codeの双方向同期（競合解決）。
- `AGENTS.md` 生成後のレビュー方法（差分確認）。
- 計画テンプレートのカスタマイズ（プロジェクトごとの拡張性）。
- 既存 `.ai/plans` との互換性確保。

## 8. 次のアクション (Post-Spike)
- [ ] CLI Plan Mode のコマンド仕様書作成（質問テンプレート、保存形式）。
- [ ] `AGENTS.md` ジェネレータのプロトタイプ実装（テンプレート + specマージ）。
- [ ] VS Code拡張にPlan/AGENTS同期機構を追加（API検証）。
- [ ] Docs更新：運用手順、テンプレート例。

