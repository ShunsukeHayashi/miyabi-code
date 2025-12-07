---
title: Investment Society Multi-Agent Architecture
created: '2025-12-04'
updated: '2025-12-04'
author: Claude Code
category: architecture
tags:
  - investment
  - multi-agent
  - orchestration
  - ec2
  - scalable
status: active
priority: P0
---
# Investment Society Multi-Agent Architecture

> EC2 MUGEN/MAJIN を活用した超スケーラブル市場トラッキングシステム

---

## 🏗️ システム概要

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INVESTMENT SOCIETY ORCHESTRATION                      │
│                         (Market Domination Mode)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   MUGEN EC2  │    │  Mac Mini    │    │   Claude.ai  │              │
│  │  (Compute)   │◄──►│  (Control)   │◄──►│  (Brain)     │              │
│  │  16C/124GB   │    │  10C/64GB    │    │  Opus 4.5    │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         ▲                   ▲                   ▲                       │
│         │                   │                   │                       │
│         ▼                   ▼                   ▼                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    MCP SERVER MESH                               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ invest  │ │  tmux   │ │ github  │ │obsidian │ │resource │   │   │
│  │  │ society │ │ comms   │ │  sync   │ │  vault  │ │ monitor │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 エージェント構成（21体）

### Layer 1: Coordinator（指揮官）- 1体
| Agent | 愛称 | 役割 | Pane |
|-------|------|------|------|
| InvestCoordinator | とうしきるん | 全体統括・意思決定 | %0 |

### Layer 2: Market Watchers（市場監視）- 5体
| Agent | 愛称 | 監視対象 | Pane |
|-------|------|----------|------|
| JP-Watcher | にほんみるん | 日本株式市場 | %1 |
| US-Watcher | あめりかみるん | 米国株式市場 | %2 |
| FX-Watcher | かわせみるん | 為替市場 | %3 |
| Crypto-Watcher | くりぷとみるん | 暗号資産市場 | %4 |
| Global-Watcher | せかいみるん | 世界指数・商品 | %5 |

### Layer 3: Sector Analysts（セクター分析）- 6体
| Agent | 愛称 | 担当セクター | Pane |
|-------|------|--------------|------|
| Tech-Analyst | てっくみるん | テクノロジー | %6 |
| Finance-Analyst | きんゆうみるん | 金融 | %7 |
| Healthcare-Analyst | いりょうみるん | ヘルスケア | %8 |
| Consumer-Analyst | しょうひみるん | 消費財 | %9 |
| Energy-Analyst | えねるぎーみるん | エネルギー | %10 |
| Industrial-Analyst | さんぎょうみるん | 産業 | %11 |

### Layer 4: Strategy Specialists（戦略担当）- 5体
| Agent | 愛称 | 専門戦略 | Pane |
|-------|------|----------|------|
| Technical-Master | ちゃーとみるん | テクニカル分析 | %12 |
| Fundamental-Master | ざいむみるん | ファンダメンタル分析 | %13 |
| Momentum-Hunter | もめんたむん | モメンタム戦略 | %14 |
| Value-Finder | ばりゅーみるん | バリュー投資 | %15 |
| Dividend-Collector | はいとうみるん | 高配当戦略 | %16 |

### Layer 5: Risk & Execution（リスク管理・執行）- 4体
| Agent | 愛称 | 役割 | Pane |
|-------|------|------|------|
| Risk-Guardian | りすくみるん | リスク監視 | %17 |
| Alert-Sender | あらーとくん | アラート通知 | %18 |
| Report-Generator | れぽーとくん | レポート生成 | %19 |
| Portfolio-Optimizer | さいてきかくん | ポートフォリオ最適化 | %20 |

---

## 📊 監視対象

### 日本市場（JP-Watcher担当）
- 日経225構成銘柄
- TOPIX Core30
- マザーズ/グロース主要銘柄
- J-REIT

### 米国市場（US-Watcher担当）
- S&P 500
- NASDAQ 100
- ダウ30
- 主要ETF (VOO, QQQ, SPY, VTI)

### 為替市場（FX-Watcher担当）
- USD/JPY, EUR/JPY, GBP/JPY
- EUR/USD, GBP/USD
- 主要通貨ペア10種

### 暗号資産（Crypto-Watcher担当）
- BTC, ETH, SOL, XRP
- 主要アルトコイン20種

---

## 🔧 セットアップコマンド

```bash
# EC2 MUGEN接続
ssh mugen

# tmuxセッション作成
tmux new-session -d -s miyabi-investment

# 21ペイン作成スクリプト
for i in {0..20}; do
  tmux split-window -t miyabi-investment
  tmux select-layout -t miyabi-investment tiled
done

# エージェント起動
codex -p "Start Investment Society agents"
```

---

## 📡 通信プロトコル

### A2A Message Format
```
[TYPE] AGENT_FROM > AGENT_TO: MESSAGE
```

### メッセージタイプ
- SIGNAL: 売買シグナル
- ALERT: リスクアラート
- DATA: 市場データ
- REPORT: レポート
- SYNC: 死活監視
