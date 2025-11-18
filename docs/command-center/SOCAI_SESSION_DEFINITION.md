# 🌐 SOCAI Session Definition
# Social & AI Business Session

**Status**: 📋 Template - 設定待ち  
**Last Updated**: 2025-11-18  
**Owner**: Guardian (Shunsuke)

---

## 🎯 セッション目的

socaiセッションは、ソーシャルメディア、AIビジネス、マーケティング、顧客対応などのビジネス関連タスクを管理するための専用セッションです。

### 主要機能

- 📱 **ソーシャルメディア管理**: SNS投稿、コンテンツ生成
- 💼 **ビジネス戦略**: マーケティング、セールス
- 🤖 **AIサービス**: 顧客対応、自動化
- 📊 **分析・レポート**: データ分析、KPI追跡
- 🎨 **コンテンツ制作**: 記事、動画、画像

---

## 🏗️ セッション構成（案）

### Window構成

```
socai (session)
├── Window 0: Main Control
│   ├── Pane 0: コマンド実行
│   └── Pane 1: ログ監視
├── Window 1: SNS Management
│   ├── Pane 0: Twitter/X投稿
│   ├── Pane 1: Instagram管理
│   └── Pane 2: LinkedIn更新
├── Window 2: Content Creation
│   ├── Pane 0: 記事作成（note.com等）
│   ├── Pane 1: 動画スクリプト
│   └── Pane 2: 画像生成
├── Window 3: Analytics
│   ├── Pane 0: データ分析
│   └── Pane 1: レポート生成
└── Window 4: Customer Support
    ├── Pane 0: 問い合わせ対応
    └── Pane 1: FAQ更新
```

### 想定Agent配置

| Agent | 役割 | 配置Window | 備考 |
|-------|------|-----------|------|
| **SNSStrategyAgent** (つぶやくん) | SNS戦略立案 | Window 1 | Twitter/X, Instagram等 |
| **ContentCreationAgent** (かくちゃん) | コンテンツ制作 | Window 2 | 記事、スクリプト |
| **YouTubeAgent** (どうがくん) | YouTube運用 | Window 2 | 動画コンテンツ |
| **MarketingAgent** (ひろめるん) | 広告・SEO | Window 3 | マーケティング戦略 |
| **AnalyticsAgent** (かぞえるん) | データ分析 | Window 3 | KPI追跡 |
| **CRMAgent** (ささえるん) | 顧客管理 | Window 4 | 顧客満足度向上 |

---

## 🔗 miyabiセッションとの連携

### 情報フロー

```
miyabi (開発)
    ↓
  [新機能完成]
    ↓
socai (ビジネス)
    ↓
  [マーケティングコンテンツ作成]
    ↓
  [SNS投稿・顧客通知]
```

### 連携シナリオ

#### シナリオ1: 新機能リリース

```
1. miyabiで新機能実装完了
   ↓
2. Operatorがsocaiに通知
   ↓
3. socaiでリリースノート作成（かくちゃん）
   ↓
4. SNS投稿生成（つぶやくん）
   ↓
5. 顧客向けメール作成（ささえるん）
   ↓
6. 全チャネルで公開
```

#### シナリオ2: 顧客フィードバック

```
1. socaiで顧客フィードバック受信（ささえるん）
   ↓
2. Operatorがmiyabiに要件として伝達
   ↓
3. miyabiでIssue作成（みつけるん）
   ↓
4. 実装・デプロイ
   ↓
5. socaiで顧客に完了通知
```

#### シナリオ3: マーケティングキャンペーン

```
1. Guardian: キャンペーン企画指示
   ↓
2. socaiで戦略立案（ひろめるん）
   ↓
3. コンテンツ作成（かくちゃん、どうがくん）
   ↓
4. miyabiで必要な技術実装（LP作成等）
   ↓
5. socaiでキャンペーン実行・分析
```

---

## 📋 セッション起動手順

### Step 1: セッション作成

```bash
# socaiセッション作成
tmux new-session -s socai -n "Main"

# Window追加
tmux new-window -t socai:1 -n "SNS"
tmux new-window -t socai:2 -n "Content"
tmux new-window -t socai:3 -n "Analytics"
tmux new-window -t socai:4 -n "Support"
```

### Step 2: Pane分割

```bash
# Window 1 (SNS) を3分割
tmux split-window -h -t socai:1
tmux split-window -v -t socai:1.1

# Window 2 (Content) を3分割
tmux split-window -h -t socai:2
tmux split-window -v -t socai:2.1

# Window 3 (Analytics) を2分割
tmux split-window -v -t socai:3

# Window 4 (Support) を2分割
tmux split-window -v -t socai:4
```

### Step 3: Agent配置（例）

```bash
# Window 1: SNSAgent起動（将来）
tmux send-keys -t socai:1.0 "# SNSStrategyAgent (つぶやくん)" C-m

# Window 2: ContentAgent起動（将来）
tmux send-keys -t socai:2.0 "# ContentCreationAgent (かくちゃん)" C-m

# Window 3: AnalyticsAgent起動（将来）
tmux send-keys -t socai:3.0 "# AnalyticsAgent (かぞえるん)" C-m

# Window 4: CRMAgent起動（将来）
tmux send-keys -t socai:4.0 "# CRMAgent (ささえるん)" C-m
```

### Step 4: CommHubへの統合

```bash
# CommHubにsocaiを登録（Operator経由）
Guardian: "socaiセッションをCommHubに統合"
Operator: CommHub設定更新 → 統合完了報告
```

---

## 🛠️ 使用例

### 例1: SNS投稿生成

**Guardian**: "新機能Xについてのツイートを生成"

**Operator実行**（socai Session）:
```
1. socaiセッションのWindow 1（SNS）を確認
2. つぶやくん（SNSStrategyAgent）に指示
3. ツイート案を生成
4. Guardianに確認依頼
5. 承認後、投稿予約
```

### 例2: ブログ記事作成

**Guardian**: "新機能Xの技術解説記事を作成"

**Operator実行**:
```
1. miyabiから技術詳細を取得
2. socaiのかくちゃん（ContentCreationAgent）に渡す
3. 記事ドラフト作成
4. Guardianレビュー
5. 修正・公開
```

### 例3: 顧客問い合わせ対応

**Operator検出**（socai Session）:
```
"📩 新規問い合わせ検出"

顧客: 「機能Yの使い方が分かりません」

Operator実行:
1. ささえるん（CRMAgent）で回答案生成
2. 必要に応じてmiyabiでドキュメント確認
3. 回答案をGuardianに提示
4. 承認後、顧客に返信
```

---

## 📊 管理対象データ

### SNS関連

- Twitter/X投稿履歴
- Instagram投稿スケジュール
- LinkedIn更新内容
- エンゲージメント分析

### コンテンツ

- ブログ記事（note.com等）
- 動画スクリプト
- プレゼン資料
- マーケティング素材

### 顧客データ

- 問い合わせ履歴
- FAQ
- 顧客満足度
- フィードバック

### 分析データ

- KPI（アクセス数、コンバージョン等）
- A/Bテスト結果
- ROI分析
- 競合分析

---

## 🔄 定期タスク

### 日次

- SNS投稿（スケジュール管理）
- 顧客問い合わせ対応
- アクセス解析確認

### 週次

- 週次レポート作成
- コンテンツ企画会議
- KPI分析

### 月次

- 月次分析レポート
- マーケティング戦略見直し
- 顧客満足度調査

---

## 🎯 成功指標

socaiセッションが成功しているとき：

- ✅ SNS投稿が定期的・効果的に実施
- ✅ コンテンツ制作が計画通り進行
- ✅ 顧客問い合わせに迅速対応
- ✅ データ分析が意思決定に活用
- ✅ miyabiセッションとシームレス連携

---

## 🚀 起動コマンド（Guardian用）

### 初回セットアップ

```
Guardian: "socaiセッションを作成して、上記の構成で初期化"
Operator: セッション作成 → Window/Pane設定 → Agent配置 → 完了報告
```

### 日常起動

```
Guardian: "socaiセッションを起動"
Operator: 既存セッションアタッチ → 状態確認 → 準備完了報告
```

### 特定Windowへのアクセス

```
Guardian: "socaiのSNS管理ウィンドウを表示"
Operator: Window 1にフォーカス → 現在の状態報告
```

---

## 📝 カスタマイズ

この定義はテンプレートです。Guardianの要件に応じて：

- Window数・構成の変更
- Agent配置の調整
- 管理対象データの追加
- 連携フローの最適化

などをカスタマイズできます。

**変更指示例**:
```
Guardian: "socaiに「広告管理」ウィンドウを追加"
Operator: Window 5追加 → Pane設定 → 完了報告
```

---

## 🔗 関連ドキュメント

- **統合プロトコル**: GUARDIAN_OPERATOR_INTEGRATION.md
- **セッション管理**: SESSION_MANAGEMENT_QUICK_REFERENCE.md
- **Agent仕様**: .claude/agents/specs/business/
- **miyabi連携**: miyabiセッション定義

---

## ✅ 次のステップ

1. [ ] この定義をレビュー・カスタマイズ
2. [ ] socaiセッション作成実行
3. [ ] CommHubへの統合
4. [ ] 最初のタスク実行（テスト）
5. [ ] miyabi連携テスト
6. [ ] 日常運用開始

---

**準備ができたら、いつでも起動できます！**

Guardianの指示でsocaiセッションを稼働開始しましょう。
