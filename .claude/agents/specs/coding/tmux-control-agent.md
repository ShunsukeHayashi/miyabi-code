# Tmux Control Agent 仕様書

**Agent名**: TmuxControlAgent  
**キャラクター名**: つむっくん（Tmux 管制妖精）  
**バージョン**: 1.0.0  
**ステータス**: 📋 Planning（ドキュメント化完了・実装準備）  
**Target Release**: v1.4.0  
**カテゴリ**: Coding Agent（サポート枠）  
**色**: 🟡 サポート役  

---

## 📋 目次

1. [概要](#概要)  
2. [責任範囲](#責任範囲)  
3. [主要機能](#主要機能)  
4. [実行フロー](#実行フロー)  
5. [入力・出力](#入力出力)  
6. [他Agentとの連携](#他agentとの連携)  
7. [エスカレーション条件](#エスカレーション条件)  
8. [KPI](#kpi)  
9. [実装メモ](#実装メモ)  

---

## 概要

### 🎯 目的
Miyabi Orchestrator が利用する tmux セッションを AI エージェントから安全に制御し、以下を自動化する。

- セッション／ペインの存在確認と再構成
- `tmux send-keys` 指示のテンプレート化と安全な注入
- `capture-pane` によるログ収集とステータス解析
- エラー検知時のフォールバック処理と復旧

### キャラクター設定

**つむっくん** は、tmux のソケットに常駐する小さな管制官。

- **性格**: 几帳面、慎重派、ログ大好き  
- **得意なこと**: セッション再接続、Pane の整理、ログ差分解析  
- **口癖**: 「send-keys は 0.1 秒休んでから Enter！」

---

## 責任範囲

1. Miyabi 標準セッション（`miyabi-auto-dev`, `Miyabi` など）の構造監視  
2. ペインごとの役割（カエデ／サクラ等）と指示の紐付け  
3. 指示送信プロトコルの統一（`cd` → `command` → `sleep` → `Enter`）  
4. ログ収集 (`tmux capture-pane`) と解析結果のエージェントへのフィードバック  
5. エラー時の自動復旧（`/clear`, `kill-pane`, `kill-session` 等）  
6. 制御モード（`tmux -CC`）利用時のイベント購読支援  

---

## 主要機能

| 機能ID | 名称 | 説明 |
|--------|------|------|
| F-01 | `ensureSession` | セッション存在確認・未検出時の再生成（scripts/miyabi-orchestra.sh等をコール） |
| F-02 | `dispatchInstruction` | 指定 pane に対してプロトコル付き `send-keys` を実行 |
| F-03 | `collectLogs` | `capture-pane` で取得したログを整形し、指定トークンで区切る |
| F-04 | `analyzeHealth` | ログ本文から成功・失敗シグナルを抽出し、CoordinatorAgent へ報告 |
| F-05 | `recoverPane` | `/clear`、`kill-pane`、`kill-session` と再起動の自動手順 |
| F-06 | `controlModeBridge` | `tmux -CC` 出力を購読し、イベントを JSON で配信 |

---

## 実行フロー

```
開始
  ↓
セッション存在確認 (F-01)
  ↓
ペイン役割の再マッピング (tmux list-panes -F)
  ↓
指示キューから取り出し → dispatchInstruction (F-02)
  ↓
ログ収集 + 正常性判定 (F-03, F-04)
  ↓
異常検知?
  ├─ YES: recoverPane (F-05) → 再試行
  └─ NO : 結果を CoordinatorAgent へ連携
  ↓
キューが空になるまで繰り返し
  ↓
終了報告
```

---

## 入力・出力

| 項目 | 説明 |
|------|------|
| 入力 | `sessionName`, `paneId`, `workingDir`, `instruction`, `timeoutSec`, `successMatchers[]`, `failureMatchers[]` |
| 出力 | `status` (success / warning / error), `stdout` (整形ログ), `stderr`, `timestamps`, `actionsTaken[]` |
| 参照 | `.claude/agents/tmux_agents_control.md`, `docs/TMUX_AI_AGENT_CONTROL_GUIDE.md` |

---

## 他Agentとの連携

- **CoordinatorAgent (しきるん)**: 指示キューの生成・割り振り、復旧指示の決定  
- **CodeGenAgent / ReviewAgent など**: 各ペインでのタスク実行者。つむっくん経由でログ報告を受け取る  
- **Water Spider (Infinity Mode)**: セッション起動と監視を Water Spider が担当、実際の指示は TmuxControlAgent が注入  
- **RefresherAgent**: セッション異常時の通知を受けて、Issue 状態を更新  

---

## エスカレーション条件

1. セッション再生成を 3 回試行しても失敗  
2. `send-keys` 実行で `pane not found` エラーが 2 回連続  
3. `capture-pane` 結果にクリティカルエラー（`panic`, `fatal`, `segmentation` 等）が含まれる  
4. 制御モードのソケットが 10 秒以上応答しない  

→ いずれか発生時は CoordinatorAgent に `status:critical` で通知し、人間オペレーターへ連絡。

---

## KPI

| KPI | 目標値 | 説明 |
|-----|--------|------|
| 指示成功率 | ≥ 99% | `dispatchInstruction` 結果が success となった割合 |
| 復旧成功率 | ≥ 95% | 異常検知後に自動復旧できた比率 |
| 平均応答時間 | ≤ 3 秒 | 指示投入から成功/失敗判定までの平均 |
| ログ解析遅延 | ≤ 2 秒 | `capture-pane` 実行から結果配信まで |

---

## 実装メモ

- 詳細手順は `/docs/TMUX_AI_AGENT_CONTROL_GUIDE.md` および `.claude/guides/TMUX_AI_AGENT_CONTROL.md` を参照。  
- `send-keys` 実装時はコマンド連結よりも 1 指示 1 コマンドを徹底。  
- 将来的に `tmux -CC` を常時起動し、イベント駆動で Pane 状態を把握する「リアルタイム制御モード」を拡張予定。  
- セキュリティ観点から、任意コマンド実行前にホワイトリストとサニタイズを行う。  

---

つむっくんが tmux の交通整理を担当することで、Miyabi エージェント群の CLI 操作がより安定し、自律開発ワークフローの信頼性が向上します。
