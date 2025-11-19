# Miyabi 完全自律型オペレーション - アーキテクチャ

**Version**: 1.0.0
**Last Updated**: 2025-11-15
**Vision**: "黒い画面を見なくて良くなる" - タスクを投入すれば全て自動実行

---

## 🎯 コンセプト

### 基本原則

1. **タスクベース実行** - タスクキューに投入すれば自動実行
2. **ヘッドレスモード** - 全てバックグラウンドで実行
3. **コールアウト駆動** - 情報不足時のみ人間に通知
4. **監視エージェント** - メインラインでタスクを監視
5. **GitHub連携** - Issue/Commentで非同期コミュニケーション

### 目標

- ✅ **ターミナルインタラクション不要**
- ✅ **タスク投入だけで完結**
- ✅ **必要な時だけ通知**
- ✅ **全プロセスが自動化**

---

## 🏛️ アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 0: Human (Shunsuke)                                  │
│  - タスク投入（.claude/tasks/）                             │
│  - コールアウト対応（GitHub Issue/Comment）                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Maestro (Mobile Monitoring Agent)                 │
│  - 状況監視                                                  │
│  - アラート通知                                              │
│  - Human へのレポート                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Orchestrator (Mac Main Agent) ◀── YOU ARE HERE    │
│  - タスクキュー管理                                          │
│  - ヘッドレスエージェント起動                                │
│  - 進捗監視                                                  │
│  - コールアウト判定                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Coordinators (MUGEN/MAJIN)                        │
│  - 重いタスクの分散実行                                      │
│  - リソース調整                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Workers (Headless Agents)                         │
│  - BatchIssueAgent                                           │
│  - ReportGenerationAgent                                     │
│  - DataAnalysisAgent                                         │
│  - ... (71+ agents)                                          │
│                                                              │
│  実行形式:                                                   │
│  claude -p "$(cat prompt) $(cat template)"                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 タスク実行フロー

### Phase 1: タスク投入

```
Human
  ↓
  1. タスクJSONを作成して .claude/tasks/pending/ に配置

例: .claude/tasks/pending/weekly-report.json
{
  "task_id": "weekly-report-20251115",
  "from": "human",
  "to": "report-agent",
  "priority": "P2",
  "directive": "週次レポート生成",
  "template": "weekly-report",
  "execution": {
    "type": "headless",
    "prompt": "weekly-report.txt",
    "template": "weekly-report.json"
  }
}
```

### Phase 2: 自動実行（Orchestratorが監視）

```
Orchestrator (5分毎にポーリング)
  ↓
  1. .claude/tasks/pending/ をスキャン
  2. タスクを .claude/tasks/in_progress/ に移動
  3. ヘッドレスエージェントを起動

  実行コマンド:
  cd ~/Dev/miyabi-private && \
  claude -p "$(cat .claude/prompts/weekly-report.txt)

  $(cat .claude/templates/weekly-report.json)" \
  > .claude/logs/weekly-report_20251115.log 2>&1 &

  4. PIDを記録してバックグラウンド実行
```

### Phase 3: 実行中の監視

```
Orchestrator
  ↓
  1. プロセス状態を確認（ps aux）
  2. ログファイルを監視
  3. 異常検知時:
     - タイムアウト（2時間以上）
     - エラーパターン検出
     - リソース枯渇
  4. 正常完了時:
     - タスクを .claude/tasks/completed/ に移動
     - 結果をGitHubにコミット or Issue作成
```

### Phase 4: コールアウト（情報不足時のみ）

```
Headless Agent
  ↓
  [情報不足・判断不可を検出]
  ↓
  1. GitHub Issue自動作成

  Title: [Callout] weekly-report-20251115 - 情報不足
  Body:
    ## 状況
    週次レポート生成中に不明な点が発生しました。

    ## 質問
    - Q1: データソースXのアクセス権限がありません
    - Q2: メトリクスYの計算方法を確認してください

    ## ログ
    [ログの抜粋]

    ## 必要なアクション
    上記質問にコメントで回答してください。

    @hayashi-s

  Label: 🔔 callout, priority:p1

  ↓
  2. Lark/Slack通知
  3. タスクを .claude/tasks/blocked/ に移動
  4. 待機状態へ
```

### Phase 5: 再開（回答受領後）

```
Human
  ↓
  GitHub Issueにコメントで回答

  ↓
  Orchestrator（GitHub webhook or ポーリング）
  ↓
  1. コメントを読み込み
  2. 回答をタスクに統合
  3. タスクを .claude/tasks/pending/ に戻す
  4. 再実行
```

---

## 📋 タスクキュー構造

```
.claude/tasks/
├── pending/              # 待機中タスク
│   ├── task-001.json
│   ├── task-002.json
│   └── ...
├── in_progress/          # 実行中タスク
│   ├── task-003.json
│   ├── task-004.json
│   └── ...
├── completed/            # 完了タスク
│   ├── 2025-11-15/
│   │   ├── task-005.json
│   │   └── task-006.json
│   └── ...
└── blocked/              # ブロック中タスク（コールアウト待ち）
    ├── task-007.json
    └── ...
```

### タスクJSON形式

```json
{
  "task_id": "unique-id",
  "version": "1.0.0",
  "created_at": "2025-11-15T18:00:00+09:00",
  "updated_at": "2025-11-15T18:30:00+09:00",
  "from": "human | maestro | orchestrator",
  "to": "agent-name",
  "priority": "P0 | P1 | P2 | P3",
  "directive": "タスクの説明",
  "execution": {
    "type": "headless",
    "prompt": "prompt-file.txt",
    "template": "template-file.json",
    "command": "optional: custom command",
    "timeout": 7200,
    "retry": 3
  },
  "status": "pending | in_progress | completed | blocked | failed",
  "progress": {
    "current": 5,
    "total": 10,
    "percentage": 50
  },
  "output": {
    "log_file": ".claude/logs/task_*.log",
    "result_file": "path/to/result",
    "github_issue": "#123",
    "github_pr": "#456"
  },
  "callout": {
    "required": false,
    "issue_number": null,
    "questions": [],
    "answers": []
  },
  "dependencies": ["task-id-1", "task-id-2"],
  "metadata": {
    "tags": ["report", "weekly"],
    "estimated_duration": "30m",
    "actual_duration": "25m"
  }
}
```

---

## 🤖 監視エージェント（Orchestrator）

### 役割

1. **タスクキュー監視** (5分毎)
2. **ヘッドレスエージェント起動**
3. **プロセス監視**
4. **コールアウト判定**
5. **完了通知**

### 実装

```bash
#!/bin/bash
# .claude/scripts/orchestrator-daemon.sh

while true; do
  # 1. Pending タスクをスキャン
  for task in .claude/tasks/pending/*.json; do
    task_id=$(jq -r '.task_id' "$task")

    # 2. タスクを in_progress に移動
    mv "$task" ".claude/tasks/in_progress/"

    # 3. ヘッドレス実行
    prompt=$(jq -r '.execution.prompt' ".claude/tasks/in_progress/$(basename $task)")
    template=$(jq -r '.execution.template' ".claude/tasks/in_progress/$(basename $task)")

    log_file=".claude/logs/${task_id}.log"

    cd ~/Dev/miyabi-private && \
    claude -p "$(cat .claude/prompts/$prompt)

    $(cat .claude/templates/$template)" \
    > "$log_file" 2>&1 &

    pid=$!

    # 4. PIDを記録
    jq --arg pid "$pid" '.execution.pid = $pid' \
      ".claude/tasks/in_progress/$(basename $task)" \
      > tmp && mv tmp ".claude/tasks/in_progress/$(basename $task)"

    echo "[$(date)] Started task: $task_id (PID: $pid)"
  done

  # 5. 実行中タスクの監視
  for task in .claude/tasks/in_progress/*.json; do
    pid=$(jq -r '.execution.pid' "$task")

    # プロセスが終了しているか確認
    if ! ps -p "$pid" > /dev/null; then
      task_id=$(jq -r '.task_id' "$task")

      # ログからステータス判定
      if grep -q "SUCCESS" ".claude/logs/${task_id}.log"; then
        # 完了
        mv "$task" ".claude/tasks/completed/"
        echo "[$(date)] Completed task: $task_id"
      elif grep -q "CALLOUT" ".claude/logs/${task_id}.log"; then
        # コールアウト必要
        mv "$task" ".claude/tasks/blocked/"
        # GitHub Issue作成
        .claude/scripts/create-callout-issue.sh "$task_id"
        echo "[$(date)] Blocked task (callout required): $task_id"
      else
        # 失敗
        mv "$task" ".claude/tasks/failed/"
        echo "[$(date)] Failed task: $task_id"
      fi
    fi
  done

  # 6. 5分待機
  sleep 300
done
```

### デーモン起動

```bash
# バックグラウンドで常時起動
nohup ./.claude/scripts/orchestrator-daemon.sh > .claude/logs/orchestrator.log 2>&1 &

# systemd service化（推奨）
sudo systemctl enable miyabi-orchestrator
sudo systemctl start miyabi-orchestrator
```

---

## 🔔 コールアウト機構

### コールアウトのトリガー

ヘッドレスエージェントが以下を検出した場合：

1. **情報不足**
   - 設定値が不明
   - データソースにアクセスできない
   - 判断基準が不明確

2. **曖昧な指示**
   - 複数の解釈が可能
   - 優先順位が不明

3. **エラー（自動復旧不可）**
   - 権限エラー
   - ネットワークエラー（長期）
   - データ不整合

### コールアウトの出力形式

エージェントはログに以下を出力：

```
[CALLOUT]
Reason: 情報不足
Questions:
  - Q1: データソースXのアクセストークンを提供してください
  - Q2: メトリクスYの計算式を確認してください
Context:
  [関連するコンテキスト情報]
Suggested Actions:
  - Action 1: ...
  - Action 2: ...
[/CALLOUT]
```

### GitHub Issue自動作成

```bash
#!/bin/bash
# .claude/scripts/create-callout-issue.sh

task_id=$1
log_file=".claude/logs/${task_id}.log"
task_file=".claude/tasks/blocked/${task_id}.json"

# ログからコールアウト情報を抽出
callout_content=$(sed -n '/\[CALLOUT\]/,/\[\/CALLOUT\]/p' "$log_file")

# GitHub Issue作成
gh issue create \
  --title "[Callout] ${task_id} - 情報不足" \
  --label "🔔 callout,priority:p1" \
  --body "## 状況
タスク実行中に情報不足が検出されました。

## タスク詳細
\`\`\`json
$(cat "$task_file")
\`\`\`

## コールアウト内容
\`\`\`
${callout_content}
\`\`\`

## ログ
\`\`\`
$(tail -50 "$log_file")
\`\`\`

## 必要なアクション
上記の質問にコメントで回答してください。

@hayashi-s"
```

---

## 📊 実装ロードマップ

### Phase 1: 基盤構築（1週間）

- [x] タスクキュー構造作成
- [x] ヘッドレスモードパターン確立
- [ ] Orchestratorデーモン実装
- [ ] コールアウト機構実装

### Phase 2: エージェント移行（2-3週間）

- [ ] Top 10タスクをヘッドレス化
- [ ] 既存コマンドをタスクキュー対応
- [ ] エラーハンドリング強化

### Phase 3: 監視強化（1週間）

- [ ] Maestro連携
- [ ] アラート通知
- [ ] ダッシュボード構築

### Phase 4: 完全自律化（継続的）

- [ ] 71タスクの段階的移行
- [ ] 学習・最適化
- [ ] 予測機能追加

---

## 🎯 期待される効果

### Before（現状）

| 項目 | 状態 |
|------|------|
| 作業時間 | 8時間/日（画面に張り付き） |
| タスク切り替え | 手動、頻繁な中断 |
| エラー対応 | 即座に対応必要 |
| 並行実行 | 困難 |

### After（完全自律化）

| 項目 | 状態 |
|------|------|
| 作業時間 | 30分/日（タスク投入とレビューのみ） |
| タスク切り替え | 自動、非同期 |
| エラー対応 | コールアウト時のみ |
| 並行実行 | 最大71タスク同時実行 |

**時間削減**: 93.75%（8時間 → 30分）

---

## 🔗 関連ドキュメント

- [HEADLESS_TASK_FRAMEWORK.md](./HEADLESS_TASK_FRAMEWORK.md)
- [BATCH_ISSUE_CREATION.md](./BATCH_ISSUE_CREATION.md)
- [BatchIssueAgent Spec](../agents/specs/coding/batch-issue-agent.md)
- [MIYABI_SOCIETY_FORMULA.md](../../miyabi_def/MIYABI_SOCIETY_FORMULA.md)

---

**Vision**: "黒い画面を見なくて良くなる"
**Status**: Phase 1 実装中
**Next**: Orchestratorデーモン実装

🌸 **Miyabi Society - Full Autonomy** 🌸
