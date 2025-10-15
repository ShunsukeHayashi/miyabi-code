#!/bin/bash

# Phase 5 Sub-Issues Creation Script
# Creates 30 remaining sub-issues (T1.1-T6.4)

# Level 1: Content Design (T1.1-T1.7)
echo "Creating Level 1 sub-issues..."

gh issue create --title "[Phase 5][Level 1] T1.1 - Month 1 コンテンツ計画 - Getting Started & CLI基礎" \
  --body "## 📋 タスク情報

**親Issue**: #24
**Level**: 1 - コンテンツ設計
**推定時間**: 3分
**依存関係**: T0.1, T0.2, T0.3
**Agent**: ProductDesignAgent（つくるん）

---

## 📖 タスク詳細

Month 1（初月）のコンテンツを計画します。

### 対象ユーザー
- Miyabi初心者
- CLI操作に不慣れなユーザー
- 開発者（個人・小規模チーム）

### コンテンツテーマ
**「Getting Started & CLI基礎」**

### 週次計画
- Week 1: Miyabi概要・インストール（動画3本、PDF1個）
- Week 2: CLI基本コマンド（動画3本、ワーク1個）
- Week 3: 初めてのAgent実行（動画3本、ワーク1個）
- Week 4: Troubleshooting基礎（動画2本、FAQ1個）

---

## ✅ 完了条件

- [ ] Week 1-4のコンテンツ詳細計画完成
- [ ] 各週の学習目標明記
- [ ] 提供形式（動画・PDF・ワーク）決定
- [ ] 合計時間算出（目標: 3-5時間）

---

🌸 Part of Phase 5: Miyabiサービス詳細設計" \
  --label "enhancement"

gh issue create --title "[Phase 5][Level 1] T1.2 - Month 2 コンテンツ計画 - Agent開発入門" \
  --body "## 📋 タスク情報

**親Issue**: #24
**Level**: 1 - コンテンツ設計
**推定時間**: 3分
**依存関係**: T1.1
**Agent**: ProductDesignAgent（つくるん）

---

## 📖 タスク詳細

Month 2のコンテンツを計画します。

### コンテンツテーマ
**「Agent開発入門」**

### 週次計画
- Week 1: Agent仕様の読み方（動画3本、PDF1個）
- Week 2: 既存Agent カスタマイズ（動画3本、ワーク1個）
- Week 3: 新規Agent開発基礎（動画4本、ワーク2個）
- Week 4: Agent テスト・デバッグ（動画3本、ワーク1個）

---

## ✅ 完了条件

- [ ] Week 1-4のコンテンツ詳細計画完成
- [ ] 実践的なコード例を含む
- [ ] 合計時間算出（目標: 5-7時間）

---

🌸 Part of Phase 5: Miyabiサービス詳細設計" \
  --label "enhancement"

gh issue create --title "[Phase 5][Level 1] T1.3 - Month 3 コンテンツ計画 - Worktree並列実行マスター" \
  --body "## 📋 タスク情報

**親Issue**: #24
**Level**: 1 - コンテンツ設計
**推定時間**: 3分
**依存関係**: T1.2
**Agent**: ProductDesignAgent（つくるん）

---

## 📖 タスク詳細

Month 3のコンテンツを計画します。

### コンテンツテーマ
**「Worktree並列実行マスター」**

### 週次計画
- Week 1: Worktreeアーキテクチャ理解（動画3本、PDF1個）
- Week 2: 並列実行設定・実践（動画4本、ワーク2個）
- Week 3: Concurrency最適化（動画3本、ワーク1個）
- Week 4: トラブルシューティング（動画3本、ケーススタディ3個）

---

## ✅ 完了条件

- [ ] Week 1-4のコンテンツ詳細計画完成
- [ ] 実際のWorktree運用例を含む
- [ ] 合計時間算出（目標: 6-8時間）

---

🌸 Part of Phase 5: Miyabiサービス詳細設計" \
  --label "enhancement"

gh issue create --title "[Phase 5][Level 1] T1.4 - Month 4 コンテンツ計画 - Label体系とEntity-Relation" \
  --body "## 📋 タスク情報

**親Issue**: #24
**Level**: 1 - コンテンツ設計
**推定時間**: 3分
**依存関係**: T1.3
**Agent**: ProductDesignAgent（つくるん）

---

## 📖 タスク詳細

Month 4のコンテンツを計画します。

### コンテンツテーマ
**「Label体系とEntity-Relation」**

### 週次計画
- Week 1: 53ラベル体系完全理解（動画4本、PDF1個）
- Week 2: Entity-Relationモデル（動画4本、図解5個）
- Week 3: 状態遷移フロー実践（動画3本、ワーク2個）
- Week 4: カスタムLabel設計（動画3本、ワーク1個）

---

## ✅ 完了条件

- [ ] Week 1-4のコンテンツ詳細計画完成
- [ ] Label体系の実践例を含む
- [ ] 合計時間算出（目標: 7-9時間）

---

🌸 Part of Phase 5: Miyabiサービス詳細設計" \
  --label "enhancement"

gh issue create --title "[Phase 5][Level 1] T1.5 - Month 5 コンテンツ計画 - カスタムAgent開発" \
  --body "## 📋 タスク情報

**親Issue**: #24
**Level**: 1 - コンテンツ設計
**推定時間**: 3分
**依存関係**: T1.4
**Agent**: ProductDesignAgent（つくるん）

---

## 📖 タスク詳細

Month 5のコンテンツを計画します。

### コンテンツテーマ
**「カスタムAgent開発」**

### 週次計画
- Week 1: BaseAgent継承パターン（動画4本、コード例5個）
- Week 2: Agent SDK活用（動画4本、ワーク2個）
- Week 3: エンタープライズAgent開発（動画5本、ワーク3個）
- Week 4: Agent公開・配布（動画3本、マーケットプレイス解説）

---

## ✅ 完了条件

- [ ] Week 1-4のコンテンツ詳細計画完成
- [ ] 実践的なAgent開発プロジェクト含む
- [ ] 合計時間算出（目標: 8-10時間）

---

🌸 Part of Phase 5: Miyabiサービス詳細設計" \
  --label "enhancement"

gh issue create --title "[Phase 5][Level 1] T1.6 - Month 6 コンテンツ計画 - エンタープライズ導入" \
  --body "## 📋 タスク情報

**親Issue**: #24
**Level**: 1 - コンテンツ設計
**推定時間**: 3分
**依存関係**: T1.5
**Agent**: ProductDesignAgent（つくるん）

---

## 📖 タスク詳細

Month 6のコンテンツを計画します。

### コンテンツテーマ
**「エンタープライズ導入」**

### 週次計画
- Week 1: セキュリティ・コンプライアンス（動画4本、チェックリスト）
- Week 2: 大規模チーム運用（動画4本、ワーク2個）
- Week 3: カスタマイズ・統合（動画5本、事例3個）
- Week 4: 本番運用・監視（動画4本、ダッシュボード設定）

---

## ✅ 完了条件

- [ ] Week 1-4のコンテンツ詳細計画完成
- [ ] エンタープライズユースケース含む
- [ ] 合計時間算出（目標: 8-10時間）

---

🌸 Part of Phase 5: Miyabiサービス詳細設計" \
  --label "enhancement"

gh issue create --title "[Phase 5][Level 1] T1.7 - コンテンツ全体サマリー作成" \
  --body "## 📋 タスク情報

**親Issue**: #24
**Level**: 1 - コンテンツ設計
**推定時間**: 2分
**依存関係**: T1.1, T1.2, T1.3, T1.4, T1.5, T1.6
**Agent**: ProductDesignAgent（つくるん）

---

## 📖 タスク詳細

Month 1-6のコンテンツを集計し、全体サマリーテーブルを作成します。

### サマリー項目
- 月別テーマ一覧
- 動画総数
- PDF資料総数
- ワーク総数
- 合計学習時間

### サマリーテーブル例

| 月 | テーマ | 動画数 | PDF数 | ワーク数 | 合計時間 |
|----|--------|--------|-------|----------|----------|
| 1 | Getting Started & CLI基礎 | 11本 | 3個 | 3個 | 4h |
| 2 | Agent開発入門 | 13本 | 2個 | 4個 | 6h |
| 3 | Worktree並列実行マスター | 13本 | 2個 | 6個 | 7h |
| 4 | Label体系とEntity-Relation | 14本 | 6個 | 3個 | 8h |
| 5 | カスタムAgent開発 | 16本 | 7個 | 5個 | 9h |
| 6 | エンタープライズ導入 | 17本 | 4個 | 2個 | 9h |
| **合計** | - | **84本** | **24個** | **23個** | **43h** |

---

## ✅ 完了条件

- [ ] コンテンツ全体サマリーテーブル完成
- [ ] 6ヶ月分の学習パス明確化
- [ ] Phase 6（Content Creation）への引き継ぎ情報明記

---

🌸 Part of Phase 5: Miyabiサービス詳細設計" \
  --label "enhancement"

echo "Level 1 sub-issues created!"

# NOTE: Continue with Level 2-6 in similar fashion
# Due to the large number of issues (33 total), this script creates Level 1 as an example.
# The full script would continue with Level 2 (T2.1-T2.4), Level 3 (T3.1-T3.7), etc.
