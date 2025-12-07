# A2A Orchestration Skill

マルチエージェントタスクのオーケストレーションを実行します。

## Overview

このスキルは指揮郎（Conductor）として振る舞い、複雑なタスクを分解して各エージェントに割り当て、進捗を追跡します。

## Workflow

1. タスク分析と分解
2. エージェントへのタスク割り当て
3. 進捗監視と報告集約
4. 完了報告

## Usage

```
/skill a2a-orchestration
```

## Implementation

### Step 1: タスク分解

ユーザーのリクエストを分析し、以下のタスクに分解:
- Issue作成（見付郎）
- 実装（楓）
- レビュー（桜）
- PR/マージ（椿）
- デプロイ（牡丹）

### Step 2: エージェント割り当て

P0.2プロトコルで各エージェントにタスクを送信:

```bash
source ./a2a.sh

# Issue作成を依頼
a2a_send "%23" "[指揮郎] タスク: Issue作成 - ${TASK_DESCRIPTION}"

# 実装を依頼
a2a_send "%19" "[指揮郎] タスク: Issue #XXX 実装"
```

### Step 3: 進捗監視

各ペインの出力をキャプチャして進捗を確認:

```bash
# 全エージェントの最新状態
for pane in %18 %19 %20 %21 %22 %23; do
  echo "=== $pane ==="
  tmux capture-pane -t $pane -p | tail -5
done
```

### Step 4: 完了報告

全タスク完了後、結果をサマリー:

```
## Orchestration Complete

- Issue: #XXX created
- Implementation: Complete
- Review: Approved
- PR: #YYY merged
- Deploy: Production updated
```

## Agent Pane Reference

| Agent | Pane | Task Type |
|-------|------|-----------|
| 見付郎 | %23 | Issue管理 |
| 楓 | %19 | 実装 |
| 桜 | %20 | レビュー |
| 椿 | %21 | PR/マージ |
| 牡丹 | %22 | デプロイ |
