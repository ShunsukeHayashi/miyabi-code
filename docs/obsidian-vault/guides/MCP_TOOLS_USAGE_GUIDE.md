---
title: "Miyabi MCP Tools - Complete Usage Guide"
created: 2025-11-19
updated: 2025-11-19
author: "Claude Code"
category: "guides"
tags: ["miyabi", "mcp", "tools", "integration"]
status: "published"
---

# 🔌 Miyabi MCP ツール群 - 完全使い分けガイド

**Version**: 2.0.0
**Last Updated**: 2025-11-19
**Total MCP Servers**: 30+ (7 configured, 23+ in development)

---

## 📊 全体マップ - 6つのカテゴリー

Miyabi MCP ツールは以下の6カテゴリーに分類されます:

| カテゴリー | サーバー数 | 主な用途 |
|-----------|-----------|----------|
| 🤖 **AI/LLM** | 3 | コンテンツ生成、UI/UX設計、適応的思考 |
| 💼 **ビジネス** | 2 | 商業エージェント、OpenAI統合 |
| 🛠️ **開発ツール** | 9 | Git、GitHub、ファイル操作、監視 |
| 📚 **ドキュメント** | 2 | Obsidian、Lark Wiki |
| 🎛️ **システム制御** | 5 | tmux、ルール管理、SSEゲートウェイ |
| 📱 **デバイス統合** | 1 | Android Pixel |

---

## 🎯 シナリオ別使い分け

### シナリオ 1: コーディング作業中

**使用するMCP**:
1. **miyabi-git-inspector** - Git状態監視
2. **miyabi-github** - Issue/PR管理
3. **miyabi-file-access** - ファイル操作
4. **miyabi-tmux** - セッション制御

**ワークフロー**:
```
1. miyabi-tmux で開発セッション開始
   → tmux pane を Claude に通知

2. miyabi-git-inspector で現在のブランチ状態確認
   → 変更ファイル、コミット履歴取得

3. miyabi-file-access でコード編集
   → セキュアなファイル読み書き

4. miyabi-github で Issue/PR作成
   → 自動でリンク、ラベル付け
```

---

### シナリオ 2: ドキュメント執筆

**使用するMCP**:
1. **miyabi-obsidian-server** - Obsidian連携
2. **gemini3-general** - コンテンツ生成
3. **lark-wiki-agents** - Lark Wiki同期

**ワークフロー**:
```
1. gemini3-general でドキュメント草案生成
   → 高度な思考レベルで構造化

2. miyabi-obsidian-server で Vault に保存
   → 自動でタグ、リンク、フロントマター追加

3. lark-wiki-agents でチーム共有
   → Lark Wiki に同期アップロード
```

---

### シナリオ 3: システム監視・デバッグ

**使用するMCP**:
1. **miyabi-resource-monitor** - CPU/メモリ/ディスク監視
2. **miyabi-process-inspector** - プロセス詳細
3. **miyabi-network-inspector** - ネットワーク状態
4. **miyabi-log-aggregator** - ログ集約

**ワークフロー**:
```
1. miyabi-resource-monitor で異常検知
   → CPU 90%超え、メモリ逼迫を通知

2. miyabi-process-inspector でプロセス特定
   → 重いプロセスのPID、コマンド取得

3. miyabi-log-aggregator で原因調査
   → エラーログを時系列で検索

4. miyabi-network-inspector で通信確認
   → 外部接続、ポート状況チェック
```

---

### シナリオ 4: UI/UX 設計

**使用するMCP**:
1. **gemini3-uiux-designer** - UI/UX専門家
2. **gemini3-adaptive-runtime** - 適応的思考
3. **miyabi-file-access** - デザインファイル保存

**ワークフロー**:
```
1. gemini3-uiux-designer に要件伝達
   → ユーザーペルソナ、カスタマージャーニー生成

2. gemini3-adaptive-runtime で検証
   → 複数の代替案を深く思考

3. miyabi-file-access でコンポーネント保存
   → React/Vue コンポーネント生成
```

---

### シナリオ 5: ビジネス戦略立案

**使用するMCP**:
1. **miyabi-commercial-agents** - 14ビジネスエージェント
2. **gemini3-general** - 戦略文書生成
3. **miyabi-obsidian-server** - ナレッジ蓄積

**ワークフロー**:
```
1. miyabi-commercial-agents の SelfAnalysisAgent 実行
   → 自己分析、強み・弱み抽出

2. MarketResearchAgent で市場調査
   → 競合20社分析、TAM/SAM/SOM計算

3. ProductConceptAgent でプロダクト設計
   → USP、収益モデル、BMC作成

4. gemini3-general で事業計画書生成
   → 投資家向け資料作成

5. miyabi-obsidian-server に保存
   → 戦略ドキュメントとして管理
```

---

### シナリオ 6: リモートサーバー操作

**使用するMCP**:
1. **miyabi-sse-gateway** - SSEゲートウェイ
2. **miyabi-pixel-mcp** (リモート経由) - Pixel制御
3. **miyabi-mcp** - Miyabi統合管理

**ワークフロー**:
```
1. miyabi-sse-gateway で HTTP/SSE接続確立
   → MUGEN/MAJIN サーバーにアクセス

2. miyabi-mcp でリモートMCP管理
   → 200並列Agentの状態取得

3. miyabi-pixel-mcp で Android操作
   → Pixelデバイス上のタスク実行
```

---

## 📚 カテゴリー別詳細

### 🤖 AI/LLM カテゴリー

#### 1. gemini3-general
**用途**: 汎用AI思考・コンテンツ生成

**主な機能**:
- 高度な推論（thinking level: high）
- 長文生成（レポート、ドキュメント）
- データ分析・要約

**使用例**:
```javascript
// Gemini 3 Pro による戦略分析
const analysis = await gemini3.analyze({
  prompt: "競合分析結果から差別化戦略を3つ提案",
  thinkingLevel: "high",
  outputFormat: "markdown"
});
```

**設定** (`.mcp.json`):
```json
{
  "gemini3-general": {
    "type": "stdio",
    "command": "node",
    "args": ["mcp-servers/gemini3-general/dist/index.js"],
    "env": {
      "GEMINI_API_KEY": "YOUR_API_KEY",
      "GEMINI_MODEL": "gemini-3-pro-preview",
      "GEMINI_THINKING_LEVEL": "high"
    }
  }
}
```

---

#### 2. gemini3-uiux-designer
**用途**: UI/UX専門家としての設計支援

**主な機能**:
- ペルソナ設計
- ワイヤーフレーム生成
- アクセシビリティチェック
- デザインシステム提案

**使用例**:
```javascript
// ユーザーペルソナ生成
const persona = await gemini3UiUx.createPersona({
  targetMarket: "SaaS developers",
  ageRange: "25-40",
  painPoints: ["複雑なCI/CD", "ドキュメント不足"]
});

// UI改善提案
const suggestions = await gemini3UiUx.analyzeUI({
  screenshot: "./dashboard.png",
  focusAreas: ["accessibility", "information-architecture"]
});
```

**いつ使う?**:
- 新機能のUI設計時
- 既存UIの改善提案時
- ユーザーテストのシナリオ作成時

---

#### 3. gemini3-adaptive-runtime
**用途**: 適応的思考・マルチステップ推論

**主な機能**:
- 複雑な問題の段階的解決
- 複数の代替案提示
- リアルタイム思考プロセス可視化

**使用例**:
```javascript
// 複雑な技術選定
const decision = await gemini3Adaptive.solve({
  problem: "新プロダクトのインフラ構成を決定",
  constraints: ["コスト月5万円以内", "99.9%可用性", "グローバル展開"],
  thinkingStyle: "step-by-step-with-alternatives"
});
```

**いつ使う?**:
- 技術選定・アーキテクチャ決定
- トレードオフ分析が必要な場面
- 複数の解決策を比較したい時

---

### 💼 ビジネスカテゴリー

#### 4. miyabi-commercial-agents
**用途**: 14種のビジネスAgentによる包括的支援

**含まれるAgent**:
1. **SelfAnalysisAgent** - 自己分析（キャリア、スキル、実績）
2. **MarketResearchAgent** - 市場調査（競合20社+）
3. **PersonaAgent** - ペルソナ設計（3-5人）
4. **ProductConceptAgent** - プロダクト構想（USP、収益モデル）
5. **ProductDesignAgent** - サービス詳細設計（6ヶ月分）
6. **ContentCreationAgent** - コンテンツ制作（動画、記事、教材）
7. **FunnelDesignAgent** - 導線設計（認知→購入→LTV）
8. **SNSStrategyAgent** - SNS戦略（Twitter/Instagram/YouTube）
9. **MarketingAgent** - マーケティング（広告、SEO、SNS）
10. **SalesAgent** - セールス（リード→顧客転換）
11. **CRMAgent** - CRM（顧客満足度、LTV最大化）
12. **AnalyticsAgent** - データ分析（KPI、PDCA）
13. **YouTubeAgent** - YouTube運用（チャンネル設計→投稿計画）
14. **AIEntrepreneurAgent** - AI起業家支援（包括的ビジネスプラン）

**使用例**:
```bash
# 1. 市場調査 → ペルソナ → プロダクト構想の流れ
miyabi-commercial-agents execute MarketResearchAgent \
  --market "SaaS for developers" \
  --competitors 20

miyabi-commercial-agents execute PersonaAgent \
  --target-customers 5 \
  --based-on market-research-output.json

miyabi-commercial-agents execute ProductConceptAgent \
  --persona persona-output.json \
  --output business-model-canvas.md

# 2. コンテンツ戦略立案
miyabi-commercial-agents execute ContentCreationAgent \
  --content-types "blog,youtube,tutorial" \
  --frequency "weekly"

miyabi-commercial-agents execute SNSStrategyAgent \
  --platforms "twitter,linkedin" \
  --posting-calendar calendar.json
```

**統合シナリオ** (全14Agent連携):
```
Phase 1: 自己分析・市場調査 (Week 1-2)
  ├─ SelfAnalysisAgent → キャリア棚卸し
  └─ MarketResearchAgent → 競合分析、市場規模

Phase 2: ターゲット・プロダクト設計 (Week 3-4)
  ├─ PersonaAgent → 詳細ペルソナ作成
  ├─ ProductConceptAgent → USP、収益モデル
  └─ ProductDesignAgent → 6ヶ月分の開発計画

Phase 3: コンテンツ・マーケティング (Week 5-8)
  ├─ ContentCreationAgent → 実コンテンツ制作
  ├─ FunnelDesignAgent → 導線最適化
  ├─ SNSStrategyAgent → 投稿カレンダー
  └─ MarketingAgent → 広告・SEO戦略

Phase 4: セールス・CRM (Week 9-12)
  ├─ SalesAgent → セールスプロセス構築
  ├─ CRMAgent → 顧客管理体制
  └─ AnalyticsAgent → データ分析・PDCA

Ongoing: YouTube運用
  └─ YouTubeAgent → チャンネル最適化（13ワークフロー）
```

**ライセンス**: Commercial License必須（月額$99/年額$999）

---

#### 5. miyabi-openai-assistant
**用途**: OpenAI Assistants API統合

**主な機能**:
- GPT-4 Assistants実行
- ファイルアップロード・検索
- Function Calling統合

**使用例**:
```javascript
// OpenAI Assistant実行
const result = await openaiAssistant.run({
  assistantId: "asst_abc123",
  prompt: "このデータセットから異常値を検出",
  files: ["./data.csv"]
});
```

---

### 🛠️ 開発ツールカテゴリー

#### 6. miyabi-git-inspector
**用途**: Git リポジトリ監視・分析

**主な機能**:
- リアルタイムGit状態監視
- コミット履歴分析
- ブランチ比較
- Diff詳細取得

**使用例**:
```javascript
// 現在のGit状態取得
const status = await gitInspector.getStatus();
// → { branch: "main", modified: 25, staged: 0, commits: "1 ahead" }

// コミット履歴（過去24時間）
const commits = await gitInspector.getRecentCommits({ since: "24 hours" });

// ブランチ間Diff
const diff = await gitInspector.compareBranches({
  base: "main",
  head: "feature/new-api"
});
```

**いつ使う?**:
- 毎朝のInitial Sequence
- PR作成前の確認
- マージ競合の調査

---

#### 7. miyabi-github
**用途**: GitHub API統合

**主な機能**:
- Issue/PR作成・更新
- ラベル管理（57ラベル体系）
- Milestone管理
- GitHub Actions トリガー

**使用例**:
```javascript
// Issue作成（自動ラベル推論）
const issue = await miyabiGitHub.createIssue({
  title: "Fix authentication bug",
  body: "User cannot login with SSO",
  autoInferLabels: true // → priority:P1-High, type:bug, area:auth
});

// PR作成
const pr = await miyabiGitHub.createPR({
  title: "Add dark mode support",
  base: "main",
  head: "feature/dark-mode",
  autoDraft: true
});
```

---

#### 8. miyabi-file-access
**用途**: セキュアなファイル操作

**主な機能**:
- ファイル読み書き（権限管理付き）
- ディレクトリ監視
- 一括操作（grep、置換）

**使用例**:
```javascript
// セキュアなファイル読み込み
const content = await fileAccess.read({
  path: "/secure/config.json",
  validatePermissions: true
});

// 一括置換
await fileAccess.replaceAll({
  pattern: "oldAPI",
  replacement: "newAPI",
  paths: ["src/**/*.ts"]
});
```

---

#### 9. miyabi-file-watcher
**用途**: ファイル変更監視

**主な機能**:
- リアルタイムファイル監視
- 変更イベント通知
- ホットリロードトリガー

**使用例**:
```javascript
// ディレクトリ監視開始
await fileWatcher.watch({
  paths: ["src/", "docs/"],
  events: ["create", "modify", "delete"],
  callback: (event) => {
    console.log(`${event.type}: ${event.path}`);
  }
});
```

---

#### 10. miyabi-log-aggregator
**用途**: ログ集約・検索

**主な機能**:
- 複数ログファイル集約
- 時系列検索
- エラーパターン検出

**使用例**:
```javascript
// 過去1時間のエラーログ検索
const errors = await logAggregator.search({
  pattern: "ERROR|FATAL",
  since: "1 hour ago",
  sources: ["app.log", "api.log", "worker.log"]
});

// エラー頻度分析
const analysis = await logAggregator.analyze({
  groupBy: "error_type",
  timeWindow: "24h"
});
```

---

#### 11. miyabi-resource-monitor
**用途**: システムリソース監視

**主な機能**:
- CPU/メモリ/ディスク使用率
- プロセス一覧
- アラート設定

**使用例**:
```javascript
// リアルタイム監視
const metrics = await resourceMonitor.getMetrics();
// → { cpu: 45%, memory: "12GB/64GB", disk: "1.2TB/2TB" }

// アラート設定
await resourceMonitor.setAlert({
  metric: "cpu",
  threshold: 90,
  action: "notify"
});
```

---

#### 12. miyabi-process-inspector
**用途**: プロセス詳細調査

**主な機能**:
- プロセス一覧・詳細
- CPU/メモリ使用量
- プロセスツリー

**使用例**:
```javascript
// 重いプロセスTop 10
const topProcesses = await processInspector.getTop({
  sortBy: "cpu",
  limit: 10
});

// プロセス詳細
const details = await processInspector.inspect({
  pid: 12345
});
```

---

#### 13. miyabi-network-inspector
**用途**: ネットワーク状態監視

**主な機能**:
- アクティブ接続一覧
- ポート状態確認
- 帯域幅監視

**使用例**:
```javascript
// アクティブ接続取得
const connections = await networkInspector.getConnections({
  protocol: "tcp",
  state: "ESTABLISHED"
});

// ポート確認
const portStatus = await networkInspector.checkPort({
  port: 8080,
  protocol: "tcp"
});
```

---

#### 14. miyabi-codex
**用途**: AI駆動コード生成・分析

**主な機能**:
- コード生成（Claude Sonnet 4）
- コードレビュー
- リファクタリング提案

**使用例**:
```javascript
// コード生成
const code = await codex.generate({
  spec: "REST API for user authentication with JWT",
  language: "rust",
  framework: "axum"
});

// コードレビュー
const review = await codex.review({
  files: ["src/main.rs"],
  focusAreas: ["security", "performance"]
});
```

---

### 📚 ドキュメントカテゴリー

#### 15. miyabi-obsidian-server
**用途**: Obsidian Vault統合

**主な機能**:
- Vault内検索・作成・更新
- 自動タグ付け
- WikiLink管理
- フロントマター自動生成

**使用例**:
```javascript
// ドキュメント作成
await obsidian.createNote({
  title: "API Architecture Design",
  content: "# API設計...",
  folder: "architecture/",
  tags: ["api", "design", "rest"],
  autoLink: true // 既存ノートへの自動リンク
});

// Vault検索
const results = await obsidian.search({
  query: "authentication AND jwt",
  folder: "technical/"
});
```

**いつ使う?**:
- 技術ドキュメント作成
- 議事録・レポート保存
- ナレッジベース構築

**Obsidian形式ルール**:
```markdown
---
title: "ドキュメントタイトル"
created: 2025-11-19
tags: ["tag1", "tag2"]
---

# 内容

[[関連ドキュメント]] へのリンク
```

---

#### 16. lark-wiki-agents
**用途**: Lark Wiki統合（チーム共有）

**主な機能**:
- Wiki作成・更新
- 権限管理
- コメント・承認フロー

**使用例**:
```javascript
// Wikiページ作成
await larkWiki.createPage({
  title: "Q4 Product Roadmap",
  content: "...",
  space: "product-team",
  permissions: ["team-members-read"]
});

// ページ同期（Obsidian → Lark）
await larkWiki.syncFromObsidian({
  obsidianPath: "product/roadmap.md",
  larkSpace: "product-team"
});
```

---

### 🎛️ システム制御カテゴリー

#### 17. miyabi-tmux-server
**用途**: tmux セッション通信・制御

**主な機能**:
- Pane間メッセージ送信
- セッション状態取得
- コマンド実行

**使用例**:
```javascript
// Agent間通信
await tmux.sendMessage({
  targetPane: "%8", // ツバキAgentのPane
  message: "[カエデ→ツバキ] Issue #123 完了。レビュー依頼"
});

// セッション状態取得
const sessions = await tmux.listSessions();
// → [{ name: "miyabi", windows: 8, panes: 42 }]

// Pane作成
await tmux.createPane({
  session: "miyabi",
  direction: "vertical",
  startDirectory: "/path/to/project"
});
```

**いつ使う?**:
- Miyabi Orchestra（200並列Agent）での通信
- Agent間タスク引継ぎ
- セッション管理

---

#### 18. miyabi-rules-server
**用途**: ルール・ポリシー管理

**主な機能**:
- ルールエンジン
- バリデーション
- ポリシー適用

**使用例**:
```javascript
// ルール定義
await rules.define({
  name: "commit-message-format",
  rule: "Conventional Commits準拠",
  validator: (msg) => /^(feat|fix|docs|chore):/.test(msg)
});

// バリデーション実行
const result = await rules.validate({
  rule: "commit-message-format",
  input: "feat: add user authentication"
});
// → { valid: true }
```

---

#### 19. miyabi-sse-gateway
**用途**: SSEゲートウェイ（リモートMCPアクセス）

**主な機能**:
- HTTP/SSE プロキシ
- リモートMCP接続
- 認証・セキュリティ

**使用例**:
```javascript
// SSEゲートウェイ起動
await sseGateway.start({
  port: 3100,
  allowedOrigins: ["http://localhost:5173"],
  mcpServers: ["miyabi-pixel-mcp", "miyabi-commercial-agents"]
});

// リモート接続（MUGEN/MAJINから）
const remoteClient = await sseGateway.connect({
  url: "http://localhost:3100/sse",
  auth: "Bearer TOKEN"
});
```

**Phase 0 Migration**:
- 現在11個のMCPサーバーをリモート対応中
- MUGEN/MAJINサーバー上で200並列Agent実行時に使用

---

#### 20. miyabi-mcp
**用途**: Miyabi統合管理

**主な機能**:
- MCP一元管理
- ヘルスチェック
- 設定同期

**使用例**:
```javascript
// 全MCPサーバー状態取得
const status = await miyabiMcp.getStatus();
// → { lark: "connected", gemini3: "connected", ... }

// 設定リロード
await miyabiMcp.reloadConfig({
  configPath: ".mcp.json"
});
```

---

#### 21. miyabi-claude-code
**用途**: Claude Code専用統合

**主な機能**:
- Claude Code API呼び出し
- セッション管理
- コンテキスト同期

---

### 📱 デバイス統合カテゴリー

#### 22. miyabi-pixel-mcp
**用途**: Android Pixel統合

**主な機能**:
- ADB経由でPixel操作
- スクリーンショット取得
- アプリ起動・操作

**使用例**:
```javascript
// スクリーンショット取得
const screenshot = await pixelMcp.screenshot({
  device: "Pixel 9 Pro XL"
});

// アプリ起動
await pixelMcp.launchApp({
  package: "com.termux",
  activity: ".app.TermuxActivity"
});

// コマンド実行
await pixelMcp.execCommand({
  command: "miyabi status",
  shell: "termux"
});
```

**デバイス対応**:
- Pixel 9 Pro XL
- Pixel 9 Fold
- Pixel Tablet (計画中)

---

## 🔄 統合ワークフロー例

### ワークフロー 1: 朝のInitial Sequence

```bash
# 1. システム状態確認
miyabi-resource-monitor check
miyabi-process-inspector top --limit 10

# 2. Git状態確認
miyabi-git-inspector status
miyabi-git-inspector commits --since "24h"

# 3. GitHub Issue確認
miyabi-github list-issues --state open --priority P0,P1

# 4. Worktree確認
miyabi-git-inspector worktrees

# 5. MCP接続確認
miyabi-mcp health-check

# 6. ログチェック
miyabi-log-aggregator errors --since "24h"

# 7. レポート生成（Obsidian保存）
miyabi-obsidian create-note \
  --title "Daily Status $(date +%Y-%m-%d)" \
  --template daily-status \
  --folder reports/
```

---

### ワークフロー 2: 新機能開発（フルサイクル）

```bash
# Phase 1: 要件定義・設計
gemini3-uiux-designer create-persona \
  --feature "Dark Mode" \
  --target-users 3

gemini3-adaptive-runtime analyze \
  --problem "Dark mode implementation strategy" \
  --constraints "No breaking changes, backward compatible"

# Phase 2: Issue作成
miyabi-github create-issue \
  --title "Implement Dark Mode" \
  --body "$(cat dark-mode-spec.md)" \
  --auto-labels

# Phase 3: Worktree作成・コーディング
miyabi-git-inspector create-worktree \
  --name "feature-dark-mode" \
  --branch "feature/dark-mode"

miyabi-codex generate \
  --spec "Dark mode toggle component (React)" \
  --output "src/components/DarkModeToggle.tsx"

# Phase 4: レビュー
miyabi-codex review \
  --files "src/components/**/*.tsx" \
  --focus security,accessibility

# Phase 5: PR作成
miyabi-github create-pr \
  --title "feat: Add dark mode support" \
  --base main \
  --head feature/dark-mode

# Phase 6: ドキュメント化
miyabi-obsidian create-note \
  --title "Dark Mode Implementation" \
  --folder "features/" \
  --link-to "[[Architecture]]"
```

---

### ワークフロー 3: ビジネス戦略立案（フル14Agent）

```bash
# Week 1: 自己分析・市場調査
miyabi-commercial-agents run SelfAnalysisAgent
miyabi-commercial-agents run MarketResearchAgent \
  --market "Developer Tools SaaS" \
  --competitors 20

# Week 2: ペルソナ・プロダクト構想
miyabi-commercial-agents run PersonaAgent \
  --count 5 \
  --based-on market-research.json

miyabi-commercial-agents run ProductConceptAgent \
  --persona personas.json \
  --output business-model-canvas.md

# Week 3-4: サービス設計
miyabi-commercial-agents run ProductDesignAgent \
  --concept business-model-canvas.md \
  --timeline "6 months"

# Week 5-6: コンテンツ戦略
miyabi-commercial-agents run ContentCreationAgent \
  --types "blog,youtube,tutorial"

miyabi-commercial-agents run SNSStrategyAgent \
  --platforms "twitter,linkedin,youtube"

# Week 7-8: マーケティング
miyabi-commercial-agents run FunnelDesignAgent
miyabi-commercial-agents run MarketingAgent \
  --channels "SEO,PPC,Content"

# Week 9-10: セールス・CRM
miyabi-commercial-agents run SalesAgent
miyabi-commercial-agents run CRMAgent

# Week 11-12: 分析・最適化
miyabi-commercial-agents run AnalyticsAgent \
  --kpis "CAC,LTV,NRR,churn"

# YouTube運用（継続）
miyabi-commercial-agents run YouTubeAgent \
  --workflow "all-13-workflows"
```

---

### ワークフロー 4: リモートサーバー（MUGEN/MAJIN）操作

```bash
# 1. SSEゲートウェイ起動（ローカル）
miyabi-sse-gateway start \
  --port 3100 \
  --mcps "miyabi-commercial-agents,miyabi-pixel-mcp"

# 2. リモート接続（MUGEN/MAJINから）
ssh mugen "curl http://your-local-ip:3100/sse"

# 3. リモートMCP呼び出し（200並列Agent）
for i in {1..200}; do
  miyabi-mcp remote-call \
    --gateway "http://your-local-ip:3100" \
    --mcp "miyabi-commercial-agents" \
    --agent "MarketResearchAgent" \
    --instance "$i" &
done
wait

# 4. 結果集約
miyabi-log-aggregator collect \
  --pattern "MarketResearchAgent-*" \
  --output "aggregated-research.json"
```

---

## 📊 優先順位マトリクス

使用頻度 × 重要度で分類:

### 🔴 High Priority（毎日使う）
1. **miyabi-git-inspector** - Git状態監視
2. **miyabi-github** - Issue/PR管理
3. **miyabi-obsidian-server** - ドキュメント管理
4. **miyabi-tmux** - セッション制御
5. **gemini3-general** - AI思考・生成

### 🟠 Medium Priority（週数回）
6. **miyabi-resource-monitor** - システム監視
7. **miyabi-log-aggregator** - ログ分析
8. **miyabi-file-access** - ファイル操作
9. **miyabi-codex** - コード生成・レビュー
10. **gemini3-uiux-designer** - UI/UX設計

### 🟡 Low Priority（必要時）
11. **miyabi-commercial-agents** - ビジネス戦略
12. **miyabi-sse-gateway** - リモート操作
13. **miyabi-pixel-mcp** - Android操作
14. **miyabi-network-inspector** - ネットワーク調査
15. **gemini3-adaptive-runtime** - 深い思考が必要な時

---

## ⚙️ 設定ファイル完全版

`.mcp.json` の完全設定（30サーバー対応）:

```json
{
  "mcpServers": {
    "miyabi-git-inspector": {
      "command": "node",
      "args": ["mcp-servers/miyabi-git-inspector/dist/index.js"]
    },
    "miyabi-github": {
      "command": "node",
      "args": ["mcp-servers/miyabi-github/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "YOUR_TOKEN"
      }
    },
    "miyabi-obsidian": {
      "command": "node",
      "args": ["mcp-servers/miyabi-obsidian-server/dist/index.js"],
      "env": {
        "OBSIDIAN_VAULT": "/path/to/vault"
      }
    },
    "miyabi-tmux": {
      "command": "node",
      "args": ["mcp-servers/miyabi-tmux-server/dist/index.js"]
    },
    "miyabi-commercial-agents": {
      "command": "node",
      "args": ["mcp-servers/miyabi-commercial-agents/dist/index.js"],
      "env": {
        "LICENSE_KEY": "YOUR_LICENSE_KEY"
      }
    },
    "gemini3-general": {
      "command": "node",
      "args": ["mcp-servers/gemini3-general/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "YOUR_API_KEY",
        "GEMINI_MODEL": "gemini-3-pro-preview",
        "GEMINI_THINKING_LEVEL": "high"
      }
    },
    "gemini3-uiux-designer": {
      "command": "node",
      "args": ["mcp-servers/gemini3-uiux-designer/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "YOUR_API_KEY"
      }
    },
    "gemini3-adaptive-runtime": {
      "command": "node",
      "args": ["mcp-servers/gemini3-adaptive-runtime/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "YOUR_API_KEY"
      }
    },
    "miyabi-sse-gateway": {
      "command": "node",
      "args": ["mcp-servers/miyabi-sse-gateway/dist/index.js"],
      "env": {
        "PORT": "3100"
      }
    },
    "lark-wiki-agents": {
      "command": "node",
      "args": ["mcp-servers/lark-wiki-mcp-agents/dist/index.js"],
      "env": {
        "LARK_APP_ID": "YOUR_APP_ID",
        "LARK_APP_SECRET": "YOUR_APP_SECRET"
      }
    }
  }
}
```

---

## 🚀 クイックスタート

### 初回セットアップ（5分）

```bash
# 1. 必須サーバーのインストール
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers

# 必須5サーバー
for server in miyabi-git-inspector miyabi-github miyabi-obsidian-server miyabi-tmux-server gemini3-general; do
  cd "$server" && npm install && npm run build && cd ..
done

# 2. 設定ファイル作成
cp .mcp.json.example .mcp.json
# 環境変数を編集（API KEY等）

# 3. 接続確認
claude mcp list
```

### 推奨インストール順序

**Phase 1: 必須（Week 1）**
1. miyabi-git-inspector
2. miyabi-github
3. miyabi-obsidian-server
4. miyabi-tmux-server
5. gemini3-general

**Phase 2: 開発強化（Week 2）**
6. miyabi-file-access
7. miyabi-log-aggregator
8. miyabi-resource-monitor
9. miyabi-codex

**Phase 3: 専門機能（Week 3+）**
10. gemini3-uiux-designer
11. miyabi-commercial-agents
12. miyabi-sse-gateway

---

## 🔧 トラブルシューティング

### Q1: MCPサーバーが接続しない
```bash
# デバッグモードで起動確認
node mcp-servers/miyabi-xxx/dist/index.js

# ログ確認
tail -f ~/Library/Logs/Claude/mcp-server-xxx.log
```

### Q2: ビルドエラー
```bash
# 依存関係再インストール
cd mcp-servers/miyabi-xxx
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Q3: 環境変数が読まれない
```json
// .mcp.json の env セクション確認
{
  "env": {
    "API_KEY": "actual-value-not-env-var-name"
  }
}
```

---

## 📝 まとめ

### 使い分けの基本ルール

1. **AI思考が必要** → Gemini3系
2. **Git/GitHub操作** → miyabi-git/github
3. **ドキュメント作成** → miyabi-obsidian
4. **システム監視** → miyabi-resource/process/network
5. **ビジネス戦略** → miyabi-commercial-agents
6. **セッション制御** → miyabi-tmux
7. **リモート操作** → miyabi-sse-gateway

### 1日の典型的な使用パターン

**朝（Initial Sequence）**:
- miyabi-git-inspector → 状態確認
- miyabi-github → Issue確認
- miyabi-resource-monitor → システムチェック

**日中（開発作業）**:
- miyabi-codex → コード生成
- gemini3-general → 思考支援
- miyabi-file-access → ファイル操作

**夕方（まとめ）**:
- miyabi-obsidian → ドキュメント化
- miyabi-log-aggregator → ログ確認
- miyabi-github → PR作成

---

**Next Steps**:
1. 必須5サーバーをインストール
2. 1週間使ってみる
3. 必要に応じて追加サーバーを導入

**Full Documentation**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/MIYABI_MCP_QUICKSTART.md`
