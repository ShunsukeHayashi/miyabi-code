# TDD Plan: Codex × tmux Multi-Agent Orchestration

## 1. Testable Workflows (Red-phase targets)

1. **Session Provisioning Chain**
   - `tmux-session-manager.sh codex [suffix]` がゼロ埋めシリアルで新規セッションを生成するか。
   - `.ai/logs` への作業宣言テンプレが自動書き込みされるか（Water Spider連携前提）。
   - セッション作成直後に `miyabi-worktree` の Worktree一覧と齟齬が無いか。

2. **Session Introspection & Cleanup**
   - `tmux-session-list.sh` が Codex/Claude 両タイプを集計し、Detached状態を可視化するか。
   - `tmux-session-cleanup.sh auto` で孤立セッションが削除され、ログに完了シグナルが出るか。

3. **Codex Skill Invocation Loop**
   - 各tmuxペインで `.codex/Skills/agent-execution` 等を呼び出した際、環境変数／Worktreeパスが期待どおり設定されるか。
   - Skill完了後、`.agent-context.json` と `.ai/logs` に成否とメタデータが書かれるか。

4. **Worktree Lifecycle Integration**
   - `git worktree add/remove` が tmuxスクリプト経由でも確実に実行され、タスク終了後に残骸がないか。
   - Worktree名と tmuxセッション名がマッピングテーブル通りであるか。

5. **Miyabi Orchestra Auto-Boot**
   - `miyabi-orchestra.sh coding-ensemble --tdd`（仮）実行時に Codexセッションへ自動アタッチされるか。
   - Orchestra起動中に `dmax profile` 情報（予定）が正しく反映されるか。

6. **Logging & Telemetry Consistency**
   - `.ai/logs`, `.ai/metrics`, `.agent-context.json` の三者でタスクID/セッションID/WorktreeIDが一致するか。
   - 障害ケース（Skill失敗、tmuxセッション切断）でリトライやアラートが飛ぶか。

---

## 2. Test Artefact Targets

| Artefact | 目的 | アプローチ | 優先度 |
|----------|------|------------|--------|
| `scripts/tests/tmux_session_test.sh` | セッション生成/一覧/クリーンアップ検証 | Bats/シェルでtmuxコマンドをモックしつつ実際に実行 | High |
| `tests/agent_execution_workflow.rs` | SkillコールとWorktree連携の統合テスト | Rustのintegration testで環境変数とファイル更新を検証 | High |
| `scripts/tests/orchestra_boot_test.sh` | Orchestra起動時のCodex割当確認 | `miyabi-orchestra.sh` に `--dry-run` を追加し、割当ログをSnapshot | Medium |
| `scripts/tests/log_consistency_check.py` | ログ整合性チェッカー | PythonでJSONログを照合し、欠落やID齟齬を報告 | Medium |

---

## 3. Skill/Agent Mapping

| シナリオ | 推奨Skill/Agent | 備考 |
|----------|-----------------|------|
| Session Provisioning | `tmux-session-bundle` Skill | CLIスクリプトのモック化対応も必要 |
| Skill Invocation Loop | `agent-execution`, `rust-development` | Worktree上でのTDDを回すための基本Skill |
| Worktree Lifecycle | `git-workflow` | Worktree残骸検知テストを自動化 |
| Logging Consistency | `documentation-generation` + `growth-analytics-dashboard` | ログ仕様とダッシュボード整合性を文章化 |
| Load/Stress Rehearsal | `performance-analysis` | Codexセッション増加時のリソースヘルス確認 |

---

## 4. Open Questions

1. Orchestra `--tdd` モードでは本番トークンを消費するか？→ Sandbox用プロンプトの切り替え方を決める必要あり。
2. CodexセッションIDと Worktree ID をどう同期させるか？→ `.ai/state/orchestra-session.json` に索引を用意？
3. ログ整合テストをCIで実行する際、tmux依存部をどうモックするか？→ `tmux -S` で仮想ソケットを生成し、CI内で完結させる案。

---

## 5. 実行優先度・メトリクス・スケジュール

### 優先順位
1. **Session Provisioning Chain**（High）  
   - 依存度が高く、Codexセッション全体の安定性を左右するため最優先でGreen化。  
2. **Codex Skill Invocation Loop**（High）  
   - TDD本体の対象。Worktree連携テストをGreenにしない限り他シナリオの意味なし。  
3. **Logging & Telemetry Consistency**（High）  
   - 可観測性が整わないとリグレッション検知ができないため同列で進行。  
4. **Session Introspection & Cleanup**（Medium）  
   - 運用負荷に直結するが、上記3つが安定後に最適化。  
5. **Miyabi Orchestra Auto-Boot**（Medium）  
   - `--tdd` 機能は基盤完成後に実装。  
6. **Worktree Lifecycle Integration**（Medium→High）  
   - Provisioningテストと並行で着手し、残骸ゼロを保証するタイミングでHighへ格上げ。

### 成功メトリクス
- **テスト実行時間**: High優先度スイート（シナリオ1,2,6）合計で < 8分。  
- **ログ整合率**: `.ai/logs` vs `.agent-context.json` vs `.ai/metrics` のID一致率 100%。  
- **残骸率**: テスト後に残る tmuxセッション / Worktree が 0 件であることを証明。  
- **再現性**: CIで3連続Greenを達成 → `ci/tdd-tmux` ジョブをブロッカーに設定。  
- **失敗検知時間**: テスト失敗からSlack通知まで < 2分（将来のalert hook）。

### スケジュール（目安）
| 週 | マイルストーン | 対応Agent/Skill |
|----|----------------|-----------------|
| Week 46 (現週) | シナリオ1,2のRedテスト作成 (`tmux_session_test.sh`, `agent_execution_workflow.rs`) | `tmux-session-bundle`, `agent-execution` |
| Week 47 | グリーン化 & CI統合、ログ整合チェッカーのSkeleton実装 | `rust-development`, `documentation-generation` |
| Week 48 | Orchestra `--tdd` 試験版 + Loadテスト | `performance-analysis`, `git-workflow` |
| Week 49 | ダッシュボード連携 + alert整備でTDDフェーズ完了 | `growth-analytics-dashboard`, `security-audit` (ログ保全確認) |

各週の完了条件を `.ai/logs/tdd-progress-YYYYWW.md` に追記し、Water Spiderで自動チェックする予定。

---

このファイルはTDD計画の作業台とし、今後のテストケース追加や優先度更新をここに追記します。
