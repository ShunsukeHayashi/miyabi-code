---
title: Miyabi Orchestraウィンドウ構成
created: '2025-11-22'
updated: '2025-11-21'
author: Claude Code
category: architecture
tags:
  - miyabi-orchestra
  - tmux
  - windows
  - daemons
  - autonomous
status: active
version: 1.0.0
priority: P0
---
# 🎼 Miyabi Orchestra ウィンドウ構成

## 概要

Guardianからの追加指示なしで自律的に動作するための完全なウィンドウ構成。

## 🎯 最重要ミッション

**Guardianからの追加指示ゼロ**
ファーストインプットのみで完遂する。

## ウィンドウ構成 (7 Windows)

| Window | 名前 | 役割 | デーモン |
|--------|------|------|----------|
| 1 | 🎼 WORKERS | オーケストレーター + 4ワーカー | - |
| 2 | 🖥️ MONITOR | システム監視 | monitor-daemon.sh |
| 3 | 🕷️ WATER-SPIDER | 問題検出・自動復旧 | water-spider-daemon.sh |
| 4 | 📍 TRACKING | 進捗追跡・統計 | tracking-daemon.sh |
| 5 | 📋 TASK-QUEUE | タスク管理・自動割り当て | task-queue-daemon.sh |
| 6 | 📡 COMM-HUB | 通信監視・途絶防止 | comm-hub-daemon.sh |
| 7 | 💓 HEALTH | 健全性監視 | health-daemon.sh |

## Window 1: 🎼 WORKERS

### ペイン構成

| ペインID | 役割 | タイトル |
|----------|------|----------|
| %1 | ORCHESTRATOR | 🎼 ORCHESTRATOR |
| %2 | WORKER-1 | ⚙️ WORKER-1 |
| %3 | WORKER-2 | ⚙️ WORKER-2 |
| %4 | WORKER-3 | ⚙️ WORKER-3 |
| %5 | WORKER-4 | ⚙️ WORKER-4 |

### 通信プロトコル

```
ORCHESTRATOR ←──自発的に報告─── WORKER
   (待機)                    (完了時に送信)
```

## Window 2: 🖥️ MONITOR

### 機能
- CPU/メモリ/ディスク監視
- tmuxセッション状態
- プロセス監視
- 自動アラート発報

### チェック間隔
30秒

## Window 3: 🕷️ WATER-SPIDER

### 機能
- ワーカーエラー自動検出
- API/接続問題検出
- 自動復旧処理
- オーケストレーターへの警告送信

### チェック間隔
15秒

### 自動復旧アクション
- エラー時: Ctrl+C送信
- 接続問題時: "next"コマンド送信

## Window 4: 📍 TRACKING

### 機能
- オーケストレーターペインの報告抽出
- ワーカー別報告数統計
- 報告種類別カウント
- 健全性スコア算出

### チェック間隔
10秒

## Window 5: 📋 TASK-QUEUE

### 機能
- ワーカービジー状態確認
- アイドルワーカー検出
- タスク自動割り当て
- 保留タスク管理

### チェック間隔
5秒

### タスク追加方法
```bash
echo 'タスク内容' >> /tmp/miyabi_pending_tasks.txt
```

## Window 6: 📡 COMM-HUB

### 機能
- 全ワーカー通信状態監視
- 無通信時間追跡
- ハートビート要求
- 通信復旧処理

### チェック間隔
60秒

### 最大無通信時間
120秒（超過時は自動復旧試行）

### 通信途絶時のアクション
1. ハートビート要求
2. 強制インタラプト
3. 緊急警告送信

## Window 7: 💓 HEALTH

### 機能
- システムリソース監視
- tmux健全性確認
- デーモン稼働状態確認
- Git状態確認
- MCP サーバー状態確認

### チェック間隔
20秒

## 起動スクリプト

### 完全起動
```bash
./scripts/orchestra-full-start.sh
```

### 個別デーモン起動
```bash
bash scripts/monitor-daemon.sh
bash scripts/water-spider-daemon.sh
bash scripts/tracking-daemon.sh
bash scripts/task-queue-daemon.sh
bash scripts/comm-hub-daemon.sh
bash scripts/health-daemon.sh
```

## 通信フロー

```
┌─────────────────────────────────────────────────────────────┐
│                    miyabi-orchestra                          │
├─────────────────────────────────────────────────────────────┤
│  Window 1: WORKERS                                          │
│  ┌─────────────┐                                            │
│  │ ORCHESTRATOR│←──報告──┬──────┬──────┬──────┐            │
│  │     %1      │        │      │      │      │            │
│  └──────┬──────┘        │      │      │      │            │
│         │指示           │      │      │      │            │
│  ┌──────▼────┐ ┌────────┴┐ ┌───┴────┐ ┌──────┴┐           │
│  │ WORKER-1  │ │ WORKER-2│ │ WORKER-3│ │ WORKER-4│           │
│  │    %2     │ │   %3    │ │   %4    │ │   %5    │           │
│  └───────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│  Window 2-7: MONITORING DAEMONS                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │MONITOR │ │ SPIDER │ │TRACKING│ │ QUEUE  │ │COMM-HUB│ │ HEALTH │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │
│      ↓          ↓          ↓          ↓          ↓          ↓     │
│  [自動監視] [自動復旧] [進捗追跡] [タスク配分] [通信監視] [健全性]  │
└─────────────────────────────────────────────────────────────┘
```

## 禁止事項

- ❌ Guardianに指示を仰ぐ
- ❌ 通信を途絶させる（チーム死亡）
- ❌ ワーカーをPULL監視する
- ❌ デーモンを停止させる

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|----------|
| 2025-11-22 | 1.0.0 | 初版作成。7ウィンドウ構成確立 |
