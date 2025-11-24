---
title: "Miyabi 3-Layer Architecture Status Report"
created: 2025-11-22
updated: 2025-11-22
author: "Claude Code (Guardian)"
category: "reports"
tags: ["miyabi", "architecture", "layer", "status", "infrastructure"]
status: "published"
---

# Miyabi 3-Layer Architecture Status Report

**Date**: 2025-11-22
**Reporter**: Claude Code on Layer 1 (Pixel Guardian)

---

## Executive Summary

Miyabiの3層アーキテクチャの現状確認を実施。各レイヤーの状態と構成を検証し、懸念点を特定した。

---

## 3-Layer Architecture Overview

```
┌─────────────────────────────────────────┐
│  Layer 1: Pixel (Maestro/Guardian)      │
│  - 戦略指揮                              │
│  - Human Interface                       │
│  - MCP Tools (24個)                      │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Layer 2: MacBook Pro (Orchestrator)    │
│  - タスク分解                            │
│  - リソース調整                          │
│  - ワークフロー管理                       │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Layer 3: MUGEN/MAJIN EC2               │
│  (Coordinators)                         │
│  - 並列実行                              │
│  - 重い処理 (ビルド/テスト)               │
│  - GPU処理 (MAJIN)                       │
└─────────────────────────────────────────┘
```

---

## Layer 1: Pixel Guardian (Termux)

### Device Information
- **Device**: Pixel 9 Pro XL (Android 16)
- **Terminal**: Termux
- **Role**: MAESTRO / Guardian
- **Connection**: USB + WiFi (100.120.173.54:5555)

### Directory Structure
```
~/Dev/
├── miyabi-private/         # メインプロジェクト (直接パス)
├── 01-miyabi/_mobile/      # モバイル専用
├── miyabi-grok-mcp-server/
├── miyabi-lark-mcp-server/
├── miyabi-line-mcp-server/
├── miyabi-plan-view/
├── miyabi-tmux-mcp-server/
├── miyabi-x-autopilot/
├── miyabi-x-mcp-server/
└── rust/
```

### Configuration Status
| 項目 | 状態 |
|------|------|
| SSH設定 | ✅ 正常 |
| MCP設定 (24サーバー) | ✅ 設定済み |
| 初期化スクリプト | ✅ 完備 |
| Claude設定 | ✅ 最適化済み (v5.0-Pixel) |

### SSH Configuration
```
Layer 2 (ORCHESTRATOR):
  orchestrator/mac/macbook → MacBook (100.112.127.63)

Layer 3 (COORDINATORS):
  mugen → EC2 (44.250.27.197)
  majin → EC2 (54.92.67.11)
```

---

## Layer 2: MacBook Pro (Orchestrator)

### Device Information
- **Device**: MacBook Pro
- **IP**: 100.112.127.63 (Tailscale)
- **Role**: ORCHESTRATOR
- **User**: shunsuke

### Project Path
```
/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
```

### Responsibilities
- タスク分解
- リソース調整
- ワークフロー管理
- Layer 3への作業配分

---

## Layer 3: MUGEN/MAJIN EC2 (Coordinators)

### MUGEN EC2 (44.250.27.197)

**System**: Linux Ubuntu 22.04 (AWS)

#### Miyabi Projects
| ディレクトリ | 用途 | 最終更新 |
|------------|------|---------|
| `miyabi-private/` | メインリポジトリ | Nov 21 01:27 |
| `miyabi-pr-worker-1/` | PR並列処理ワーカー1 | Nov 16 18:23 |
| `miyabi-pr-worker-2/` | PR並列処理ワーカー2 | Nov 16 18:23 |
| `miyabi-pr-worker-3/` | PR並列処理ワーカー3 | Nov 16 18:23 |
| `miyabi-pr-worker-4/` | PR並列処理ワーカー4 | Nov 12 02:52 |
| `miyabi-orchestra/` | オーケストラ管理 | Nov 15 02:22 |
| `miyabi-issue-887/` | Issue対応ワークツリー | Nov 16 08:30 |
| `mcp-servers/` | MCPサーバー群 | Nov 18 06:57 |
| `actions-runner/` | GitHub Actions Runner | Nov 21 02:41 |

#### Development Environment
- ✅ Rust toolchain (.cargo, .rustup)
- ✅ Claude Code (.claude)
- ✅ tmux設定済み
- ✅ GitHub Actions Runner

---

### MAJIN EC2 (54.92.67.11)

**System**: Linux Ubuntu 22.04 (AWS) + GPU

#### Miyabi Projects
| ディレクトリ | 用途 | 最終更新 |
|------------|------|---------|
| `miyabi-private/` | メインリポジトリ | Nov 17 17:57 |
| `miyabi-orchestra/` | オーケストラ管理 | Nov 15 02:22 |
| `miyabi-sse-mcp/` | SSE MCPサーバー (稼働中) | Nov 21 16:29 |
| `miyabi-lark-event-server/` | Larkイベントサーバー | Nov 21 03:19 |
| `actions-runner-majin/` | GitHub Actions Runner | Nov 21 02:41 |

#### Development Environment
- ✅ Rust toolchain (.cargo, .rustup)
- ✅ Claude Code (.claude)
- ⚠️ miyabi-privateが古い (Nov 17)

---

## Issues & Concerns

### Critical Issues

#### 1. MAJINのmiyabi-privateが古い
- **現状**: Nov 17更新
- **最新**: Nov 21 (MUGEN)
- **影響**: 古いコードでの実行リスク
- **対策**: `git pull` で同期が必要

### Medium Priority

#### 2. MUGENのPR Worker使用状況不明
- 4つのworkerディレクトリが存在
- 実際の稼働状況の確認が必要

#### 3. パス構成の差異
- **MacBook**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private`
- **Termux**: `~/Dev/miyabi-private` (直接)
- 決定: 現状維持 (モバイル専用構成として)

---

## Communication Flow

```
Human
  ↓ (指示)
Pixel (Layer 1 - Guardian/Maestro)
  ↓ ssh orchestrator
MacBook Pro (Layer 2 - Orchestrator)
  ↓ ssh mugen / ssh majin
MUGEN/MAJIN EC2 (Layer 3 - Coordinators)
  ↓ (実行結果)
Pixel (Layer 1) → Human
```

---

## Recommendations

### Immediate Actions

1. **MAJINのmiyabi-private同期**
   ```bash
   ssh majin "cd ~/miyabi-private && git pull"
   ```

2. **PR Workerの状態確認**
   ```bash
   ssh mugen "ls -la ~/miyabi-pr-worker-*/CLAUDE.md"
   ```

### Future Improvements

1. 自動同期スクリプトの導入
2. Layer間の状態監視ダッシュボード
3. Coordinator使用率のメトリクス収集

---

## Related Documents

- [[LAYER_ARCHITECTURE_ANALYSIS]]
- [[agents/AGENT_CHARACTERS]]
- [[architecture/3-layer-system]]

---

## Conclusion

3層アーキテクチャは基本的に正常に構成されている。MAJINのリポジトリ同期が必要な点を除き、各レイヤーの設定は適切。Guardian端末(Pixel)からの指揮系統は確立されており、Layer 2/3への通信も正常に機能している。

---

**Next Review**: 週次または構成変更時
**Owner**: Layer 1 Guardian (Pixel)
