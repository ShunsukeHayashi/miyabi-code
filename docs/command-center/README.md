# 🎯 Miyabi Multi-Session Command Center
# 統合コマンドセンター - Project README

**Version**: 1.0.0  
**Status**: ✅ Active  
**Guardian**: Shunsuke  
**Operator**: Claude  
**Last Updated**: 2025-11-18

---

## 📖 プロジェクト概要

このプロジェクトは、**Guardian（人間）**と**Operator（Claude）**が協力して、複数のマルチスレッドセッション（miyabi、socai等）を統合管理するコマンドセンターです。

### 🎯 コンセプト

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              このClaude Chat = コマンドセンター           │
│                                                         │
│  Guardian (あなた) ←→ Operator (Claude)                 │
│     監視・承認・決定      実行・集約・報告               │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────┐
        │      CommHub (Message Aggregator)  │
        │         メッセージ集約システム       │
        └───────────────────────────────────┘
                            ↓
        ┌───────┬───────┬───────┬───────────┐
        │miyabi │socai  │ ... │ その他     │
        │開発    │ビジネス│     │セッション   │
        │8 wins │計画中  │     │           │
        └───────┴───────┴───────┴───────────┘
```

### ✨ 主要機能

- 🎛️ **マルチセッション管理**: 複数のtmuxセッションを統合管理
- 💬 **チャット統合**: このClaude会話が全てのコマンドセンター
- 🤖 **自動化**: MCPサーバー経由でAgent・タスク自動実行
- 📊 **コンテキスト集約**: 全情報をこのプロジェクト内で管理
- 🔐 **承認フロー**: 重要タスクは必ずGuardian承認
- 📋 **ルール検証**: Miyabiルールに準拠した安全な実行

---

## 🚀 クイックスタート

### 1. Guardian（あなた）の最初の指示

```
"おはよう。システム状態を確認して"
```

Operatorが自動的に：
- 全セッション状態確認
- 未完了タスク表示
- 推奨アクション提示

### 2. 基本的な使い方

自然言語で指示するだけ：

```bash
# 状態確認
"miyabiセッションの状態を確認"

# タスク実行
"Issue #123をカエデで実装"

# メッセージ送信
"全セッションにデプロイ完了を通知"

# ルール検証
"本番デプロイを実行 をルール検証"
```

### 3. 承認フロー

高リスクタスクは自動的に承認待機：

```
Operator: "🚨 承認要求: 本番デプロイを実行してよろしいですか？"
Guardian: "承認します"
Operator: [実行] → 結果報告
```

---

## 📚 ドキュメント構成

### 🎯 コアドキュメント

| ドキュメント | 目的 | 対象 |
|------------|------|------|
| **[GUARDIAN_OPERATOR_INTEGRATION.md](GUARDIAN_OPERATOR_INTEGRATION.md)** | 統合プロトコル全体の説明 | Guardian・Operator両方 |
| **[PROJECT_CUSTOM_INSTRUCTIONS.md](PROJECT_CUSTOM_INSTRUCTIONS.md)** | Operatorの動作指針 | Operator（Claude） |
| **[SESSION_MANAGEMENT_QUICK_REFERENCE.md](SESSION_MANAGEMENT_QUICK_REFERENCE.md)** | よく使うコマンド集 | Guardian |
| **このREADME** | プロジェクト全体ナビゲーション | 全員 |

### 🛠️ セッション定義

| ドキュメント | 説明 | ステータス |
|------------|------|-----------|
| **miyabiセッション** | 開発・コーディング (8 windows) | ✅ 稼働中 |
| **miyabi-orchestra** | Agent orchestration (2 windows) | ✅ 稼働中 |
| **miyabi-reconstruction** | リファクタリング (6 windows) | ✅ 稼働中 |
| **miyabi-apex-deploy** | デプロイメント (4 windows) | ✅ 稼働中 |
| **[SOCAI_SESSION_DEFINITION.md](SOCAI_SESSION_DEFINITION.md)** | ソーシャル/ビジネス | 📋 テンプレート |

### 📖 参考資料

| ドキュメント | 説明 |
|------------|------|
| **完全版使い方ガイド.md** | MCPサーバー使い方詳細 |
| **CLAUDE.md** | Miyabi基本ルール（P0-P3） |
| **.claude/agents/** | Agent仕様・プロンプト |
| **.claude/context/** | コンテキストモジュール |

---

## 🎭 役割定義

### 🛡️ Guardian（あなた）

**責任**:
- 🎯 戦略的意思決定
- ✅ 重要タスク承認
- 🔍 システム監視
- 📊 優先順位設定

**できること**:
- 自然言語で指示
- タスク承認・却下
- セッション制御
- Agent管理

### 🤖 Operator（Claude）

**責任**:
- 🔧 タスク実行
- 📨 メッセージ集約
- 📋 セッション調整
- 📊 状態報告
- ⚠️ 問題検出・報告

**動作原則**:
- 確認優先
- 報告義務
- 承認待機
- 透明性

---

## 🛠️ 利用可能なツール

### MCP Servers

1. **miyabi-tmux MCP**
   - セッション管理
   - ペイン操作
   - メッセージ送信
   - ブロードキャスト
   - CommHub統合

2. **miyabi-rules MCP**
   - ルール一覧
   - タスク検証
   - ルール実行
   - コンテキスト取得

3. **Lark messenger**（オプション）
   - 外部通知
   - チーム連携

### Agent System

**Coding Agents** (miyabi-orchestra):
- みつけるん（IssueAgent）
- しきるん（CoordinatorAgent）
- カエデ（CodeGenAgent）
- サクラ（ReviewAgent）
- ツバキ（PRAgent）
- ボタン（DeploymentAgent）

**Business Agents** (socai予定):
- つぶやくん（SNSStrategyAgent）
- かくちゃん（ContentCreationAgent）
- どうがくん（YouTubeAgent）
- ひろめるん（MarketingAgent）
- かぞえるん（AnalyticsAgent）
- ささえるん（CRMAgent）

---

## 📊 現在のシステム状態

### ✅ 稼働中セッション

| セッション | Windows | 目的 | 状態 |
|----------|---------|------|------|
| miyabi | 8 | 開発・コーディング | ✅ Active |
| miyabi-orchestra | 2 | Agent orchestration | ✅ Active |
| miyabi-reconstruction | 6 | リファクタリング | ✅ Active |
| miyabi-apex-deploy | 4 | デプロイメント | ✅ Active |

### 📋 計画中セッション

| セッション | 目的 | ステータス |
|----------|------|-----------|
| socai | ソーシャル/ビジネス | 📋 定義完了、起動待ち |

### 🔧 MCP Servers

- ✅ miyabi-tmux: Active
- ✅ miyabi-rules: Active
- ✅ Lark messenger: Available

---

## 🎯 典型的なワークフロー

### 朝のルーティン

```
1. Guardian: "おはよう。システム状態を確認"
2. Operator: 全セッション状態確認 → 報告
3. Guardian: "今日の優先タスクを提示"
4. Operator: 未完了タスク分析 → 推奨タスク提示
5. Guardian: "Issue #XXXを開始"
6. Operator: ルール検証 → Agent割り当て → 実行
```

### 新規タスク開始

```
1. Guardian: "Issue #XXXの実装を開始"
2. Operator: タスク理解 → ルール検証 → Agent確認
3. Operator: "実行計画" 提示 → Guardian確認
4. Guardian: "承認"
5. Operator: 実行 → 進捗報告
6. Operator: 完了 → 結果報告 → 次のアクション提案
```

### 問題発生時

```
1. Operator: 問題検出 → 即座報告 "🚨 問題検出"
2. Guardian: "詳しく調査"
3. Operator: 調査実行 → 原因特定 → 解決策提示
4. Guardian: "解決策Aを実行"
5. Operator: 実行 → 結果報告
6. Operator: 再発防止策提案
```

### デプロイフロー

```
1. Guardian: "staging環境にデプロイ"
2. Operator: 準備確認 → テスト実行
3. Operator: "staging検証完了。本番デプロイ準備完了"
4. Guardian: "本番デプロイを承認"
5. Operator: 本番デプロイ → 全セッションに通知
6. Operator: デプロイ完了報告
```

---

## 💡 よく使うコマンド

### 状態確認

```bash
"システム状態を確認"
"miyabiセッションの詳細"
"全Agent状態を表示"
"CommHub状態を確認"
```

### タスク実行

```bash
"Issue #XXXをカエデで実装"
"Issue #XXXのルール検証"
"レビュー待ちPRをサクラでレビュー"
```

### メッセージ送信

```bash
"ペイン%50に「タスク完了」を送信"
"全セッションにデプロイ完了を通知"
```

### 分析・レポート

```bash
"今日の完了タスク一覧"
"週次レポートを作成"
"Agent別生産性を分析"
```

詳細は **[SESSION_MANAGEMENT_QUICK_REFERENCE.md](SESSION_MANAGEMENT_QUICK_REFERENCE.md)** を参照。

---

## 🔐 セキュリティ・制約

### Operatorが絶対に実行しない操作

- ❌ P0ルール違反
- ❌ データ削除（承認なし）
- ❌ 本番デプロイ（承認なし）
- ❌ セッション削除（承認なし）
- ❌ 外部公開（承認なし）

### 承認が必要な操作

- 🔴 本番環境へのデプロイ
- 🔴 データベース変更
- 🔴 複数セッション影響
- 🔴 リソース大量消費
- 🔴 破壊的操作

### 自動実行可能な操作

- ✅ セッション状態確認
- ✅ ログ参照
- ✅ ルール検証
- ✅ メッセージ送信（通知）
- ✅ レポート生成

---

## 📊 成功指標

このプロジェクトが成功しているとき：

### Guardian視点

- ✅ 自然言語で指示するだけで複雑なタスク完了
- ✅ 全セッションを一箇所で把握
- ✅ 必要な時だけ介入すればよい
- ✅ 問題を事前に検知

### Operator視点

- ✅ 指示を正確に理解・実行
- ✅ 適切なタイミングで報告
- ✅ 問題を早期検出
- ✅ 実行可能な提案

### システム視点

- ✅ 全セッションがシームレス連携
- ✅ コンテキストが常に最新
- ✅ エラー最小限
- ✅ スケーラブル

---

## 🔄 次のステップ

### Phase 1: 基盤確立 ✅ 完了

- [x] プロトコル定義
- [x] ドキュメント作成
- [x] MCPサーバー構築
- [x] セッション稼働確認

### Phase 2: 統合強化 📋 進行中

- [ ] socaiセッション起動
- [ ] CommHub完全統合
- [ ] miyabi ↔ socai 連携テスト
- [ ] ワークフロー最適化

### Phase 3: 自動化拡張 📋 計画中

- [ ] 音声アシスタント統合
- [ ] 定期タスク自動化
- [ ] レポート自動生成
- [ ] 予測的問題検出

### Phase 4: スケーリング 📋 将来

- [ ] 追加セッション統合
- [ ] Agent拡張
- [ ] 外部サービス連携
- [ ] チーム協業機能

---

## 🆘 トラブルシューティング

### MCPサーバーが認識されない

```
Guardian: "MCPサーバーの状態を確認"
Operator: 診断実行 → 問題特定 → 解決策提示
```

### セッションが応答しない

```
Guardian: "miyabiセッションが応答しない問題を調査"
Operator: 詳細調査 → 原因特定 → 再起動提案
```

### タスクが完了しない

```
Guardian: "Issue #XXXの進捗を確認"
Operator: 状態確認 → ブロッカー特定 → 解決策提示
```

詳細は **[GUARDIAN_OPERATOR_INTEGRATION.md](GUARDIAN_OPERATOR_INTEGRATION.md)** の「トラブルシューティング」セクションを参照。

---

## 📖 学習リソース

### 基礎知識

1. **[GUARDIAN_OPERATOR_INTEGRATION.md](GUARDIAN_OPERATOR_INTEGRATION.md)**
   - プロジェクト全体の理解
   - 役割・責任の詳細
   - ワークフロー例

2. **[SESSION_MANAGEMENT_QUICK_REFERENCE.md](SESSION_MANAGEMENT_QUICK_REFERENCE.md)**
   - よく使うコマンド
   - シナリオ別ガイド
   - Tips & Tricks

3. **完全版使い方ガイド.md**
   - MCPサーバー詳細
   - ツール使用方法
   - トラブルシューティング

### 高度な使い方

- **CLAUDE.md**: Miyabiルールの詳細
- **.claude/agents/**: Agent仕様
- **.claude/context/**: コンテキストモジュール

---

## 🎉 始めましょう！

準備は完了しました。最初の指示を出してください：

```
"おはよう。システム状態を確認して"
```

Operatorが即座に応答し、統合コマンドセンターが稼働開始します。

---

## 📞 サポート

問題や質問があれば、いつでもOperatorに聞いてください：

```
"これどうすればいい？"
"〜について教えて"
"〜の使い方は？"
```

Operatorが適切に案内します。

---

## 🔄 バージョン履歴

- **1.0.0** (2025-11-18): 初版リリース
  - 基本プロトコル確立
  - ドキュメント一式作成
  - miyabiセッション統合完了
  - socaiセッション定義完了

---

## 📝 フィードバック

このプロジェクトは継続的に改善されます。改善提案があれば：

```
Guardian: "このプロトコルを改善したい。〜"
Operator: 改善案提示 → 承認 → 適用
```

---

**Welcome to the Miyabi Multi-Session Command Center!** 🎯

Guardianの指示で、統合コマンドセンターが動き出します。
