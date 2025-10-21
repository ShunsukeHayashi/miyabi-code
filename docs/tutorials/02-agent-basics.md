# チュートリアル: Agent基本操作

**🎯 このチュートリアルのゴール**: Miyabiの21個のAgentを理解し、基本的な操作をマスターする

**対象**: チュートリアル「Miyabi入門」を修了した人

**所要時間**: 約20分

---

## 📚 この章で学ぶこと

1. ✅ Agentとは何か？
2. ✅ 21個のAgentの役割
3. ✅ キャラクター名システム
4. ✅ Agent実行の基本
5. ✅ Issue処理の流れ

---

## Agentとは？

### 基本概念

**Agent** は、特定のタスクを自動的に実行するAIアシスタントです。

**例えるなら**:
- **従来の開発**: あなたが全ての作業を手動で実行
- **Miyabi**: 21人の専門スタッフ（Agent）が自動で作業

---

### Miyabiの21個のAgent

Miyabiには、**7個のコーディングAgent**と**14個のビジネスAgent**があります。

#### 🔧 Coding Agents（7個）- 開発運用・自動化

| Agent名 | キャラクター名 | 役割 | 色分け |
|---------|--------------|------|--------|
| CoordinatorAgent | しきるん | タスク統括・分解 | 🔴 リーダー |
| CodeGenAgent | つくるん | コード生成 | 🟢 実行役 |
| ReviewAgent | めだまん | 品質レビュー | 🟢 実行役 |
| IssueAgent | みつけるん | Issue分析 | 🔵 分析役 |
| PRAgent | かくちゃん | PR自動作成 | 🟢 実行役 |
| DeploymentAgent | はこぶん | デプロイ自動化 | 🟡 サポート役 |
| RefresherAgent | みはるん | Issue監視 | 🔵 分析役 |

#### 💼 Business Agents（14個）- ビジネス戦略・マーケティング

| Agent名 | キャラクター名 | 役割 | 色分け |
|---------|--------------|------|--------|
| AIEntrepreneurAgent | あきんどさん | ビジネスプラン統括 | 🔴 リーダー |
| MarketResearchAgent | しらべるん | 市場調査 | 🔵 分析役 |
| PersonaAgent | ひとがたん | ペルソナ設定 | 🔵 分析役 |
| ProductConceptAgent | こんせぷん | 製品コンセプト設計 | 🟢 実行役 |
| ProductDesignAgent | でざいなん | サービス詳細設計 | 🟢 実行役 |
| ContentCreationAgent | こんてんつん | コンテンツ制作 | 🟢 実行役 |
| FunnelDesignAgent | じょうごん | 導線設計 | 🟢 実行役 |
| SNSStrategyAgent | えすえぬん | SNS戦略 | 🟢 実行役 |
| MarketingAgent | まーけん | マーケティング | 🟢 実行役 |
| SalesAgent | せーるすん | セールス | 🟢 実行役 |
| CRMAgent | しーあーるん | 顧客管理 | 🟢 実行役 |
| AnalyticsAgent | かぞえるん | データ分析 | 🔵 分析役 |
| YouTubeAgent | ゆーちゅん | YouTube運用 | 🟢 実行役 |
| SelfAnalysisAgent | じぶんぶん | 自己分析 | 🔵 分析役 |

---

## キャラクター名システム

### 4つの色分けルール

Agentは役割に応じて4つの色に分類されています：

#### 🔴 リーダー（2キャラ）
- **しきるん** (CoordinatorAgent)
- **あきんどさん** (AIEntrepreneurAgent)
- **役割**: 指示を出す、全体を見る
- **並列実行**: ❌ 不可（他のリーダーと同時実行NG）

#### 🟢 実行役（12キャラ）
- **つくるん**, **めだまん**, **かくちゃん** など
- **役割**: 実際に作業する
- **並列実行**: ✅ 可能（他の実行役と同時実行OK）

#### 🔵 分析役（5キャラ）
- **みつけるん**, **しらべるん**, **かぞえるん** など
- **役割**: 調べる、考える
- **並列実行**: ✅ 可能（他の分析役と同時実行OK）

#### 🟡 サポート役（3キャラ）
- **まとめるん**, **はこぶん**, **つなぐん**
- **役割**: 手伝う、つなぐ
- **並列実行**: ⚠️ 条件付き（依存関係による）

---

## Agent実行の基本

### ステップ 1: Issueを作成

まず、Agentに処理させるIssueを作成します。

```bash
# Issue作成（コマンドライン）
gh issue create \
  --title "Add Hello World API" \
  --body "GET /api/hello エンドポイントを追加する" \
  --label "✨ type:feature,📥 state:pending"
```

**期待される出力**:
```
Created issue #100
https://github.com/your-org/your-repo/issues/100
```

---

### ステップ 2: しきるん（CoordinatorAgent）を実行

Issue #100を「しきるん」に処理させます。

```bash
# 技術名で実行
miyabi agent run coordinator --issue 100

# または、キャラクター名で実行
miyabi agent run しきるん --issue 100
```

**期待される出力**:

```
🔴 しきるん 起動中...

📖 Issue #100 を分析中...
  タイトル: Add Hello World API
  内容: GET /api/hello エンドポイントを追加する
  ラベル: ✨ type:feature, 📥 state:pending

✂️ タスク分解中...
  Task 1: API実装（推定: 15分）
  Task 2: テスト作成（推定: 10分）
  Task 3: ドキュメント更新（推定: 5分）

🔄 依存関係を解決中...
  Task 1 → Task 2 → Task 3

✅ タスク分解完了！

🟢 つくるん (CodeGenAgent) に Task 1 を割り当て中...
```

---

### ステップ 3: つくるん（CodeGenAgent）が自動実行

しきるんがタスクを分解すると、自動的に「つくるん」が実行されます。

```
🟢 つくるん 起動中...

📝 Task 1 を実行中: API実装

  ファイル作成中: src/api/hello.rs
  ファイル作成中: tests/api/hello_test.rs

✅ Task 1 完了！

🟢 めだまん (ReviewAgent) に引き継ぎ中...
```

---

### ステップ 4: めだまん（ReviewAgent）が品質チェック

コードが生成されると、自動的に「めだまん」がレビューします。

```
🟢 めだまん 起動中...

🔍 品質レビュー中...

  ✅ cargo clippy: 警告なし
  ✅ cargo test: 全テスト合格
  ✅ カバレッジ: 85%

📊 品質スコア: 92点 / 100点

⭐ quality:excellent ラベルを付与

✅ レビュー完了！

🟢 かくちゃん (PRAgent) に引き継ぎ中...
```

---

### ステップ 5: かくちゃん（PRAgent）がPR作成

レビューが完了すると、自動的に「かくちゃん」がPRを作成します。

```
🟢 かくちゃん 起動中...

📝 PR作成中...

  タイトル: ✨ feat: Add Hello World API endpoint
  本文: Issue #100 を解決

  変更内容:
    - src/api/hello.rs: +45行
    - tests/api/hello_test.rs: +32行

✅ PR #101 を作成しました！
https://github.com/your-org/your-repo/pull/101

✅ 全タスク完了！
```

---

## Issue処理の完全なフロー

```
📥 Issue #100
    ↓
🔴 しきるん (CoordinatorAgent)
    ├─ 📖 Issue分析
    ├─ ✂️ タスク分解
    └─ 🔄 依存関係解決
    ↓
🟢 つくるん (CodeGenAgent)
    ├─ 📝 コード生成
    └─ 🧪 テスト作成
    ↓
🟢 めだまん (ReviewAgent)
    ├─ 🔍 品質チェック
    └─ 📊 スコアリング
    ↓
🟢 かくちゃん (PRAgent)
    ├─ 📝 PR作成
    └─ ✅ Issue Close
    ↓
✅ 完了！
```

---

## 並列実行の例

複数のAgentを同時に実行することも可能です。

### ✅ 可能な組み合わせ

```bash
# 🟢 実行役 + 🟢 実行役: OK
miyabi agent run つくるん,めだまん --issues 100,101

# 🟢 実行役 + 🔵 分析役: OK
miyabi agent run つくるん,しらべるん --issues 100,102

# 🔵 分析役 + 🔵 分析役: OK
miyabi agent run みつけるん,かぞえるん --issues 103,104
```

### ❌ 不可能な組み合わせ

```bash
# 🔴 リーダー + 🔴 リーダー: NG
miyabi agent run しきるん,あきんどさん --issues 100,101

# ❌ エラー: 複数のリーダーAgentは同時実行できません
```

---

## トラブルシューティング

### Q1. Agentが起動しない

**原因**: 環境変数が設定されていない

**解決方法**:

```bash
# GitHubトークンを設定
export GITHUB_TOKEN=ghp_your_token_here

# Anthropic APIキーを設定（オプション）
export ANTHROPIC_API_KEY=sk-ant-your_key_here

# 確認
miyabi status
```

---

### Q2. Issue分析に失敗する

**原因**: Issueに必須ラベルがない

**解決方法**:

```bash
# 最低限必要なラベル
# - type:* (feature, bug, docs など)
# - state:pending

# ラベルを追加
gh issue edit 100 --add-label "✨ type:feature,📥 state:pending"
```

---

### Q3. コード生成に失敗する

**原因**: Issueの説明が不明確

**解決方法**:

```bash
# Issueの本文を詳しく書き直す
gh issue edit 100 --body "$(cat <<'EOF'
## 目的
GET /api/hello エンドポイントを追加

## 仕様
- パス: `/api/hello`
- メソッド: GET
- レスポンス: `{"message": "Hello, World!"}`

## 受け入れ基準
- [ ] APIが実装されている
- [ ] テストが書かれている
- [ ] ドキュメントが更新されている
EOF
)"
```

---

## ベストプラクティス

### ✅ 推奨

1. **Issueに明確な説明を書く**
   ```markdown
   ## 目的
   何を実現したいか

   ## 仕様
   具体的な要件

   ## 受け入れ基準
   - [ ] 完了条件1
   - [ ] 完了条件2
   ```

2. **適切なラベルを付ける**
   ```bash
   # 必須ラベル
   --label "✨ type:feature,📥 state:pending"

   # 推奨ラベル（優先度）
   --label "⚠️ priority:P1-High"
   ```

3. **小さいIssueに分割する**
   ```bash
   # ❌ NG: 巨大なIssue
   "ユーザー管理システム全体を実装"

   # ✅ OK: 小さいIssue
   "ユーザー登録APIを実装"
   "ユーザーログインAPIを実装"
   "ユーザープロフィールAPIを実装"
   ```

---

### ❌ 避けるべき

1. **曖昧なIssueタイトル**
   ```bash
   # ❌ NG
   "バグ修正"

   # ✅ OK
   "Fix: ログイン時に500エラーが発生する問題"
   ```

2. **ラベルなしのIssue**
   ```bash
   # ❌ NG: ラベルなし
   gh issue create --title "..." --body "..."

   # ✅ OK: ラベル付き
   gh issue create --title "..." --body "..." --label "type:bug,state:pending"
   ```

3. **依存関係の無視**
   ```bash
   # ❌ NG: Issue #101 は Issue #100 に依存しているのに並列実行
   miyabi agent run つくるん --issues 100,101 --concurrency 2

   # ✅ OK: 順次実行
   miyabi agent run つくるん --issue 100
   miyabi agent run つくるん --issue 101
   ```

---

## 実践演習

### 演習1: 基本的なAgent実行

```bash
# 1. Issueを作成
gh issue create \
  --title "Add status API endpoint" \
  --body "GET /api/status を追加する" \
  --label "✨ type:feature,📥 state:pending"

# 2. しきるんを実行
miyabi agent run しきるん --issue [Issue番号]

# 3. 結果を確認
gh pr list
```

### 演習2: 複数Issueの処理

```bash
# 1. 3つのIssueを作成
for i in {1..3}; do
  gh issue create \
    --title "Add API endpoint $i" \
    --body "エンドポイント $i を追加" \
    --label "✨ type:feature,📥 state:pending"
done

# 2. 並列実行
miyabi parallel --issues [Issue番号1],[Issue番号2],[Issue番号3] --concurrency 2

# 3. 結果を確認
gh pr list
```

---

## 次のステップ

### このチュートリアルで学んだこと ✅

- ✅ Agentの基本概念
- ✅ 21個のAgentの役割
- ✅ キャラクター名システム
- ✅ Agent実行の基本
- ✅ Issue処理のフロー

### 次に学ぶこと

- [ ] **並列実行の実践** - Worktreeを使った高速処理
- [ ] **Label Systemの理解** - 53ラベル体系の活用
- [ ] **カスタムAgent作成** - 独自のAgentを実装

---

## 📚 参考ドキュメント

- **[Agent仕様](../.claude/agents/README.md)** - 全Agent詳細
- **[キャラクター図鑑](../.claude/agents/AGENT_CHARACTERS.md)** - 21キャラの詳細
- **[Label System Guide](../LABEL_SYSTEM_GUIDE.md)** - 53ラベル体系

---

**🚀 次のドキュメント**: [並列実行の実践](03-parallel-execution.md)

**⬅ 前のページ**: [Miyabi入門](01-introduction.md)

---

🤖 Generated with Claude Code
