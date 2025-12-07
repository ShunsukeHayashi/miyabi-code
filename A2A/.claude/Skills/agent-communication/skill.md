# Agent Communication Skill

A2Aプロトコルを使用したエージェント間通信を実行します。

## Overview

このスキルはP0.2プロトコルに準拠したエージェント間メッセージングを提供します。

## Usage

```
/skill agent-communication
```

## Communication Patterns

### 1. Direct Send

特定のエージェントに直接メッセージ送信:

```bash
source ./a2a.sh

# 楓にタスク送信
a2a_send "%19" "[指揮郎] タスク: 新機能実装"

# 桜にレビュー依頼
a2a_send "%20" "[楓→桜] レビュー依頼: PR #123"
```

### 2. Status Report

コンダクターへのステータス報告:

```bash
# 完了報告
a2a_completed "楓" "Issue #270 実装完了"

# 進捗報告
a2a_progress "楓" "実装中 (50%)"

# エラー報告
a2a_error "牡丹" "デプロイ失敗 - S3権限エラー"
```

### 3. Broadcast

全エージェントへの一斉送信:

```bash
a2a_broadcast "システムメンテナンス開始"
```

### 4. Agent Relay

エージェント間のリレー（ワークフロー連携）:

```bash
# 楓→桜へのリレー
a2a_relay "楓" "桜" "レビュー依頼" "PR #123"

# 桜→椿へのリレー
a2a_relay "桜" "椿" "承認" "PR #123 マージ可"
```

## Health Check

エージェントペインの健全性確認:

```bash
a2a_health
```

Output:
```
Agent Health Status:
  %18 指揮郎 - alive (zsh)
  %19 楓    - alive (zsh)
  %20 桜    - alive (zsh)
  %21 椿    - alive (zsh)
  %22 牡丹  - alive (zsh)
  %23 見付郎 - alive (zsh)
```

## Capture Output

エージェントの出力をキャプチャ:

```bash
# 最新20行取得
tmux capture-pane -t %19 -p | tail -20

# 特定パターン検索
tmux capture-pane -t %19 -p | grep -E "(完了|エラー)"
```

## Message Format Reference

```
[Agent] Status: Detail
[FromAgent→ToAgent] Action: Detail
```

Status types: 開始, 進行中, 完了, エラー, 待機, 承認
