# Miyabi Desktop - 実装計画とロードマップ

**作成日**: 2025-10-31
**バージョン**: 1.0.0
**ステータス**: Active

---

## 📋 目次

1. [エグゼクティブサマリー](#エグゼクティブサマリー)
2. [実装優先順位マトリクス](#実装優先順位マトリクス)
3. [Phase 1: リアルタイムログストリーミング修正（Week 1）](#phase-1-リアルタイムログストリーミング修正week-1)
4. [Phase 2: ビジネスエージェントUI統合（Week 2-3）](#phase-2-ビジネスエージェントui統合week-2-3)
5. [Phase 3: 初回セットアップウィザード（Week 4）](#phase-3-初回セットアップウィザードweek-4)
6. [Phase 4: WorkflowDAGリアルタイム更新（Week 5-6）](#phase-4-workflowdagリアルタイム更新week-5-6)
7. [Phase 5: エラーハンドリング改善（Week 7）](#phase-5-エラーハンドリング改善week-7)
8. [Phase 6: 並列実行プログレスバー（Week 8）](#phase-6-並列実行プログレスバーweek-8)
9. [技術スタック詳細](#技術スタック詳細)
10. [開発環境セットアップ](#開発環境セットアップ)
11. [テスト戦略](#テスト戦略)
12. [リリース戦略](#リリース戦略)

---

## エグゼクティブサマリー

### プロジェクト概要

Miyabi DesktopはAI駆動型の完全自律開発プラットフォームのデスクトップアプリケーションです。現在、基本機能の実装は完了しており、UXストーリーで特定された5つの主要ペインポイントを解決するための実装計画を策定します。

### 実装期間

**総期間**: 8週間（約2ヶ月）

**開始日**: 2025-11-01（想定）
**完了予定日**: 2025-12-27（想定）

### 実装スコープ

| カテゴリ | 項目数 | 状態 |
|---------|-------|------|
| 🔴 High Priority | 1機能 | 修正中 |
| 🟡 Medium Priority | 3機能 | 未実装 |
| 🟢 Low Priority | 2機能 | 未実装 |
| **合計** | **6機能** | **Phase 1-6** |

### 成功指標（KPI）

1. **ユーザー満足度**: NPS（Net Promoter Score）スコア 80+
2. **実行成功率**: エージェント実行成功率 95%以上
3. **応答時間**: リアルタイムログ遅延 < 100ms
4. **バグ発生率**: Critical/High bugが週1件以下
5. **コード品質**: テストカバレッジ 80%以上

---

## 実装優先順位マトリクス

### 影響度 vs 実装難易度マトリクス

```
影響度
 ↑
High│  Phase1     Phase2
    │  [🔴]      [🟡]
    │  Log       Business
    │  Stream    Agents
    │
Med │  Phase5     Phase3
    │  [🟡]      [🟡]
    │  Error     Setup
    │  Handle    Wizard
    │
Low │  Phase6     Phase4
    │  [🟢]      [🟢]
    │  Progress  DAG
    │  Bar       Update
    └─────────────────────→
      Easy    Medium   Hard
           実装難易度
```

### 優先順位ランキング

| 順位 | Phase | 機能 | 影響度 | 難易度 | 期間 | 優先度 |
|-----|-------|------|-------|-------|------|-------|
| 1 | Phase 1 | リアルタイムログストリーミング | 🔴 High | Easy | 1週間 | 🔴 Critical |
| 2 | Phase 2 | ビジネスエージェントUI統合 | 🟡 Med | Medium | 2週間 | 🟡 High |
| 3 | Phase 3 | 初回セットアップウィザード | 🟡 Med | Easy | 1週間 | 🟡 High |
| 4 | Phase 5 | エラーハンドリング改善 | 🟡 Med | Easy | 1週間 | 🟡 Medium |
| 5 | Phase 4 | WorkflowDAGリアルタイム更新 | 🟢 Low | Hard | 2週間 | 🟢 Low |
| 6 | Phase 6 | 並列実行プログレスバー | 🟢 Low | Easy | 1週間 | 🟢 Low |

---

## Phase 1: リアルタイムログストリーミング修正（Week 1）

### 🎯 目標

エージェント実行中のログをリアルタイムで表示し、ユーザーに進捗の透明性と安心感を提供する。

### 📊 現在の状況

**実装状況**: 🔧 修正中
- ✅ バックエンド修正完了（`agent.rs` L248-285）
- ✅ フロントエンド修正完了（`AgentExecutionPanel.tsx` L109-125）
- ⚠️ 手動テストが必要

**問題点**:
- ログが実行完了後に一括表示される
- リアルタイムストリーミングが動作していない
- ユーザーは実行中に何が起きているか分からない

### 📋 実装タスク

#### タスク 1.1: 手動テスト実行（1日）

**担当**: QAエンジニア / 開発者

**手順**:
1. `MANUAL_UX_TEST_GUIDE.md` に従ってテスト実行
2. 3-way監視（UI、Chrome Console、Terminal）
3. デバッグログの確認
   - `[DEBUG] Setting up output listener for execution: <id>`
   - `[DEBUG] Received agent output: <line>`
   - `[DEBUG] Output listener setup complete`

**期待結果**:
- ✅ ログが1行ずつリアルタイム表示される
- ✅ 自動スクロールが機能する
- ✅ デバッグログがConsoleに表示される

**成功基準**:
- ログ表示遅延 < 100ms
- 10行のログがすべて表示される
- スクロール位置が最下部に維持される

---

#### タスク 1.2: バグ修正（必要に応じて）（2-3日）

**想定される問題と対処法**:

**問題A: イベントリスナーが登録されていない**

```typescript
// デバッグログ確認
console.log('[DEBUG] Event listener registered:', executionId);

// 修正例
useEffect(() => {
  if (!activeExecution?.executionId) {
    console.warn('[WARN] No active execution ID');
    return;
  }

  // リスナー登録処理...
}, [activeExecution?.executionId]);
```

**問題B: Rust側のイベント発行タイミング**

```rust
// src-tauri/src/agent.rs
// 修正前（問題）
let _ = handle.await; // await後にイベント発行
eprintln!("[DEBUG] stdout handler completed");

// 修正後（推奨）
tokio::spawn(async move {
    // リアルタイムでイベント発行
    for line in reader.lines() {
        app_handle.emit(&event_name, line).ok();
    }
});
```

**問題C: イベント名の不一致**

```typescript
// フロントエンド
const unlisten = await listen<string>(
  `agent-output-${executionId}`, // ← イベント名を確認
  (event) => callback(event.payload)
);

// バックエンド（Rust）
app_handle.emit(
  &format!("agent-output-{}", execution_id), // ← 一致を確認
  line
).ok();
```

---

#### タスク 1.3: E2Eテスト追加（2日）

**テストケース**:

```typescript
// tests/e2e/real-time-log-streaming.spec.ts
import { test, expect } from '@playwright/test';

test('リアルタイムログストリーミングが動作する', async ({ page }) => {
  await page.goto('http://localhost:1420');

  // 1. エージェント選択
  await page.click('[data-testid="agent-card-coordinator"]');

  // 2. Issue選択
  await page.selectOption('[data-testid="issue-dropdown"]', '270');

  // 3. Execute Agentクリック
  await page.click('[data-testid="execute-agent-button"]');

  // 4. ログが1行ずつ表示されることを確認
  const logContainer = page.locator('[data-testid="log-output"]');

  // 最初の1行が表示されるまで待機
  await expect(logContainer).toContainText('[INFO]', { timeout: 5000 });

  // 複数行が順次表示されることを確認
  await page.waitForFunction(() => {
    const logs = document.querySelectorAll('[data-testid="log-line"]');
    return logs.length > 3; // 3行以上表示されたらOK
  }, { timeout: 10000 });

  // 5. 実行完了を確認
  await expect(page.locator('[data-testid="execution-status"]'))
    .toContainText('Success', { timeout: 60000 });
});
```

---

#### タスク 1.4: パフォーマンス最適化（1日）

**最適化項目**:

1. **ログバッファリング**: 大量ログ対策
```typescript
const [logBuffer, setLogBuffer] = useState<string[]>([]);
const flushInterval = 100; // ms

useEffect(() => {
  const timer = setInterval(() => {
    if (logBuffer.length > 0) {
      setActiveExecution((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          output: [...prev.output, ...logBuffer],
        };
      });
      setLogBuffer([]);
    }
  }, flushInterval);

  return () => clearInterval(timer);
}, [logBuffer]);
```

2. **仮想スクロール**: 1000行以上のログ対策
```typescript
import { FixedSizeList as List } from 'react-window';

<List
  height={600}
  itemCount={activeExecution.output.length}
  itemSize={20}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {activeExecution.output[index]}
    </div>
  )}
</List>
```

---

### 📦 成果物

1. ✅ リアルタイムログストリーミング機能の完全動作
2. ✅ E2Eテストスイート（Playwright）
3. ✅ パフォーマンステストレポート
4. 📝 テスト結果ドキュメント

### 🎯 成功基準

- [ ] ログが100ms以内にUI反映される
- [ ] 1000行のログでもパフォーマンス劣化なし
- [ ] E2Eテストが100%パスする
- [ ] 手動UXテストでユーザーが満足する

---

## Phase 2: ビジネスエージェントUI統合（Week 2-3）

### 🎯 目標

14個のビジネスエージェントをUIに統合し、ユーザーがCodingエージェントと同様に選択・実行できるようにする。

### 📊 現在の状況

**実装状況**: ⚠️ 未実装
- ✅ バックエンド: 14個のビジネスエージェント実装済み（Rust）
- ❌ フロントエンド: UIに表示されていない
- ❌ カテゴリフィルター: 実装されていない

**問題点**:
- ビジネスエージェントが存在するのに、アクセス方法がない
- さくらさん（ペルソナ2）とけんたさん（ペルソナ3）が使えない

### 📋 実装タスク

#### タスク 2.1: カテゴリフィルターUI実装（3日）

**設計**: タブ形式のカテゴリ切り替え

```tsx
// src/components/AgentExecutionPanel.tsx
import { Code, Briefcase, TrendingUp, Users } from "lucide-react";

type AgentCategory = "all" | "coding" | "business-strategy" | "business-marketing" | "business-sales";

export function AgentExecutionPanel() {
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory>("all");

  const categories = [
    { id: "all", name: "All Agents", icon: <div className="text-xl">🤖</div>, count: 21 },
    { id: "coding", name: "Coding", icon: <Code size={18} />, count: 7 },
    { id: "business-strategy", name: "Strategy", icon: <Briefcase size={18} />, count: 6 },
    { id: "business-marketing", name: "Marketing", icon: <TrendingUp size={18} />, count: 5 },
    { id: "business-sales", name: "Sales", icon: <Users size={18} />, count: 3 },
  ];

  const filteredAgents = selectedCategory === "all"
    ? AVAILABLE_AGENTS
    : getAgentsByCategory(selectedCategory);

  return (
    <div className="h-full flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header with Category Tabs */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-light text-gray-900 mb-4">エージェント</h2>

          {/* Category Tabs */}
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as AgentCategory)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                  selectedCategory === category.id
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {category.icon}
                  <span className="text-sm font-light">{category.name}</span>
                </div>
                <span className="text-xs font-light opacity-60">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Agent Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.type} agent={agent} />
          ))}
        </div>
      </div>

      {/* Right Panel - 既存のコード */}
    </div>
  );
}
```

---

#### タスク 2.2: ビジネスエージェントカード表示（2日）

**agent-api.ts の拡張**:

```typescript
// src/lib/agent-api.ts

// 既存のAVAILABLE_AGENTSに追加
export const AVAILABLE_AGENTS: AgentMetadata[] = [
  // ... Coding Agents（既存7個）

  // Business Agents - Strategy & Planning (6個)
  {
    type: "product_design_agent",
    displayName: "プロダクト詳細設計Agent",
    characterName: "設計士",
    category: "business-strategy",
    description: "6ヶ月分のコンテンツ・技術スタック・MVP定義",
    color: "#06b6d4", // Cyan
  },
  {
    type: "funnel_design_agent",
    displayName: "導線設計Agent",
    characterName: "導線デザイナー",
    category: "business-strategy",
    description: "認知→購入→LTVまでの顧客導線最適化",
    color: "#8b5cf6", // Violet
  },
  {
    type: "persona_agent",
    displayName: "ペルソナ設定Agent",
    characterName: "ペルソナ",
    category: "business-strategy",
    description: "ターゲット顧客の詳細ペルソナ（3-5人）設計",
    color: "#ec4899", // Pink
  },

  // Business Agents - Marketing & Content (5個)
  {
    type: "sns_strategy_agent",
    displayName: "SNS戦略Agent",
    characterName: "SNS戦略",
    category: "business-marketing",
    description: "Twitter/Instagram/YouTube等のSNS戦略立案",
    color: "#3b82f6", // Blue
  },
  {
    type: "youtube_agent",
    displayName: "YouTube運用Agent",
    characterName: "YouTube",
    category: "business-marketing",
    description: "チャンネルコンセプト設計から投稿計画まで13ワークフロー",
    color: "#ef4444", // Red
  },

  // ... 残りのビジネスエージェントも追加
];
```

---

#### タスク 2.3: ビジネスエージェント用のアイコン追加（1日）

**カテゴリ別アイコンマッピング**:

```tsx
// src/components/AgentCard.tsx
import {
  Briefcase,    // Strategy
  TrendingUp,   // Marketing
  Users,        // Sales
  Target,       // Persona
  Layout,       // Design
  BarChart,     // Analytics
} from "lucide-react";

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "business-strategy":
      return <Briefcase size={16} className="text-purple-500" />;
    case "business-marketing":
      return <TrendingUp size={16} className="text-orange-500" />;
    case "business-sales":
      return <Users size={16} className="text-green-500" />;
    default:
      return null;
  }
};

function AgentCard({ agent }: { agent: AgentMetadata }) {
  return (
    <button className="...">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agent.color }} />
        {getCategoryIcon(agent.category)}
        <span className="font-light">{agent.characterName}</span>
      </div>
      {/* ... 残りのコード */}
    </button>
  );
}
```

---

#### タスク 2.4: エージェント検索機能実装（2日）

**インクリメンタル検索**:

```tsx
// src/components/AgentExecutionPanel.tsx
import { Search } from "lucide-react";

export function AgentExecutionPanel() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = AVAILABLE_AGENTS
    .filter((agent) => {
      // カテゴリフィルター
      if (selectedCategory !== "all" && agent.category !== selectedCategory) {
        return false;
      }

      // 検索クエリフィルター
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          agent.displayName.toLowerCase().includes(query) ||
          agent.characterName.toLowerCase().includes(query) ||
          agent.description.toLowerCase().includes(query) ||
          agent.type.toLowerCase().includes(query)
        );
      }

      return true;
    });

  return (
    <div className="...">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 text-sm font-light"
          />
        </div>
      </div>

      {/* Agent Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredAgents.length > 0 ? (
          filteredAgents.map((agent) => <AgentCard key={agent.type} agent={agent} />)
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm font-light">No agents found</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

#### タスク 2.5: ビジネスエージェント実行フロー確認（3日）

**Issue番号なし実行の対応**:

```typescript
// ビジネスエージェントはIssue番号が不要な場合が多い
const handleExecuteAgent = async () => {
  if (!selectedAgent) return;

  const agentMetadata = AVAILABLE_AGENTS.find((a) => a.type === selectedAgent);
  const requiresIssue = agentMetadata?.category === "coding";

  // Coding Agentsの場合はIssue番号を推奨
  if (requiresIssue && !issueNumber) {
    const confirmNoIssue = window.confirm(
      "Coding Agentsは通常Issue番号が必要です。Issue番号なしで実行しますか？"
    );
    if (!confirmNoIssue) return;
  }

  try {
    const result = await executeAgent({
      agent_type: selectedAgent,
      issue_number: issueNumber ? parseInt(issueNumber) : undefined,
      args: [],
    });

    // ... 既存のコード
  } catch (error) {
    console.error("Failed to execute agent:", error);
  }
};
```

---

### 📦 成果物

1. ✅ カテゴリフィルターUI（4カテゴリ）
2. ✅ 14個のビジネスエージェントカード表示
3. ✅ エージェント検索機能
4. ✅ ビジネスエージェント実行フロー
5. 📝 ビジネスエージェント使用ガイド

### 🎯 成功基準

- [ ] 21個すべてのエージェントがUIに表示される
- [ ] カテゴリフィルターが正常に動作する
- [ ] 検索機能で目的のエージェントがすぐに見つかる
- [ ] ビジネスエージェントの実行が成功する（少なくとも3種類）

---

## Phase 3: 初回セットアップウィザード（Week 4）

### 🎯 目標

新規ユーザーが初めてアプリを起動した際に、スムーズにセットアップを完了できるウィザードUIを提供する。

### 📊 現在の状況

**実装状況**: ⚠️ 未実装
- ✅ Settingsパネルで設定可能
- ❌ 初回起動時のウィザードなし
- ❌ GitHub Token取得ガイドなし

**問題点**:
- 初回ユーザーがどこから設定すればいいか分からない
- GitHub Tokenの取得方法が不明確
- セットアップ失敗時のエラーが分かりにくい

### 📋 実装タスク

#### タスク 3.1: Welcome画面の実装（2日）

**4ステップウィザード設計**:

```tsx
// src/components/SetupWizard.tsx
import { useState } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";

type SetupStep = "welcome" | "github-token" | "repository" | "complete";

export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState<SetupStep>("welcome");
  const [githubToken, setGithubToken] = useState("");
  const [repoName, setRepoName] = useState("");

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="max-w-2xl w-full p-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <StepIndicator step={1} active={currentStep === "welcome"} completed={["github-token", "repository", "complete"].includes(currentStep)} />
          <div className="w-16 h-0.5 bg-gray-200" />
          <StepIndicator step={2} active={currentStep === "github-token"} completed={["repository", "complete"].includes(currentStep)} />
          <div className="w-16 h-0.5 bg-gray-200" />
          <StepIndicator step={3} active={currentStep === "repository"} completed={currentStep === "complete"} />
          <div className="w-16 h-0.5 bg-gray-200" />
          <StepIndicator step={4} active={currentStep === "complete"} completed={false} />
        </div>

        {/* Step Content */}
        {currentStep === "welcome" && (
          <WelcomeStep onNext={() => setCurrentStep("github-token")} />
        )}
        {currentStep === "github-token" && (
          <GitHubTokenStep
            value={githubToken}
            onChange={setGithubToken}
            onNext={() => setCurrentStep("repository")}
            onBack={() => setCurrentStep("welcome")}
          />
        )}
        {currentStep === "repository" && (
          <RepositoryStep
            value={repoName}
            onChange={setRepoName}
            onNext={() => setCurrentStep("complete")}
            onBack={() => setCurrentStep("github-token")}
          />
        )}
        {currentStep === "complete" && (
          <CompleteStep onFinish={onComplete} />
        )}
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl font-extralight text-gray-900 mb-4">M</div>
      <h1 className="text-3xl font-light text-gray-900">
        Welcome to Miyabi Desktop
      </h1>
      <p className="text-gray-600 font-light max-w-md mx-auto">
        AI駆動型の完全自律開発プラットフォーム。21種類のAIエージェントで開発を加速します。
      </p>
      <button
        onClick={onNext}
        className="px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 flex items-center space-x-2 mx-auto"
      >
        <span>Get Started</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
```

---

#### タスク 3.2: GitHub Token設定ステップ（2日）

**詳細ガイド付きUI**:

```tsx
function GitHubTokenStep({ value, onChange, onNext, onBack }: StepProps) {
  const [isValid, setIsValid] = useState(false);
  const [validating, setValidating] = useState(false);

  const validateToken = async () => {
    setValidating(true);
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${value}` },
      });
      setIsValid(response.ok);
    } catch {
      setIsValid(false);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-light text-gray-900 mb-2">
          GitHub Personal Access Token
        </h2>
        <p className="text-sm text-gray-600 font-light">
          MiyabiがGitHub APIにアクセスするために必要です
        </p>
      </div>

      {/* Token Input */}
      <div className="space-y-4">
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 text-sm font-mono"
        />

        {isValid && (
          <div className="flex items-center space-x-2 text-green-600 text-sm">
            <CheckCircle size={16} />
            <span>Token verified successfully!</span>
          </div>
        )}

        <button
          onClick={validateToken}
          disabled={!value || validating}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-light"
        >
          {validating ? "Validating..." : "Validate Token"}
        </button>
      </div>

      {/* How to Get Token Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-medium text-blue-900">
          📖 GitHub Tokenの取得方法
        </h3>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
          <li>GitHub設定ページを開く</li>
          <li>Developer settings → Personal access tokens → Tokens (classic)</li>
          <li>「Generate new token (classic)」をクリック</li>
          <li>以下の権限を選択:
            <ul className="ml-6 mt-1 space-y-0.5">
              <li>• repo (Full control of private repositories)</li>
              <li>• workflow (Update GitHub Action workflows)</li>
            </ul>
          </li>
          <li>「Generate token」をクリックしてトークンをコピー</li>
        </ol>
        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
        >
          <span>Open GitHub Settings</span>
          <ArrowRight size={14} />
        </a>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

#### タスク 3.3: リポジトリ設定ステップ（1日）

```tsx
function RepositoryStep({ value, onChange, onNext, onBack }: StepProps) {
  const [repos, setRepos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // GitHub APIから自分のリポジトリ一覧を取得
  const fetchRepositories = async () => {
    setLoading(true);
    try {
      // localStorage から token を取得
      const token = localStorage.getItem("github-token");
      const response = await fetch('https://api.github.com/user/repos', {
        headers: { Authorization: `token ${token}` },
      });
      const data = await response.json();
      setRepos(data.map((repo: any) => repo.full_name));
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-light text-gray-900 mb-2">
          Repository Selection
        </h2>
        <p className="text-sm text-gray-600 font-light">
          Miyabiが管理するGitHubリポジトリを選択してください
        </p>
      </div>

      {/* Repository Dropdown */}
      <div className="space-y-4">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 text-sm font-light"
        >
          <option value="">Select a repository...</option>
          {repos.map((repo) => (
            <option key={repo} value={repo}>
              {repo}
            </option>
          ))}
        </select>

        {/* Manual Input Option */}
        <div className="text-center text-xs text-gray-500">
          or
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="owner/repository"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 text-sm font-light"
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button onClick={onBack} className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

#### タスク 3.4: 完了画面とローカルストレージ保存（1日）

```tsx
function CompleteStep({ onFinish }: { onFinish: () => void }) {
  const handleFinish = () => {
    // 設定をlocalStorageに保存
    const settings = {
      setupCompleted: true,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem("miyabi-settings", JSON.stringify(settings));

    onFinish();
  };

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle size={48} className="text-green-600" />
      </div>

      <h2 className="text-2xl font-light text-gray-900">
        Setup Complete!
      </h2>

      <p className="text-gray-600 font-light max-w-md mx-auto">
        Miyabi Desktopの初期設定が完了しました。今すぐエージェントを実行して開発を加速しましょう。
      </p>

      <div className="bg-gray-50 rounded-xl p-6 space-y-3 max-w-md mx-auto">
        <h3 className="text-sm font-medium text-gray-900">💡 次のステップ</h3>
        <ul className="text-sm text-gray-600 space-y-2 text-left">
          <li>1. サイドバーからエージェントを選択</li>
          <li>2. Issue番号を選択（任意）</li>
          <li>3. 「Execute Agent」をクリック</li>
          <li>4. リアルタイムログを確認</li>
        </ul>
      </div>

      <button
        onClick={handleFinish}
        className="px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 mx-auto flex items-center space-x-2"
      >
        <span>Start Using Miyabi</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
```

---

### 📦 成果物

1. ✅ 4ステップセットアップウィザード
2. ✅ GitHub Token取得ガイド
3. ✅ リポジトリ自動取得機能
4. ✅ 設定保存機能（localStorage）
5. 📝 セットアップガイドドキュメント

### 🎯 成功基準

- [ ] 初回ユーザーが5分以内にセットアップ完了できる
- [ ] GitHub Tokenの検証が正常に動作する
- [ ] リポジトリ一覧が正しく取得される
- [ ] セットアップ完了後、設定が保存される

---

## Phase 4: WorkflowDAGリアルタイム更新（Week 5-6）

### 🎯 目標

静的なサンプルDAGではなく、実際のエージェント実行状況をリアルタイムでWorkflowDAGに反映する。

### 📊 現在の状況

**実装状況**: ⚠️ 未実装
- ✅ React Flowによる基本表示
- ✅ サンプルワークフローデータ
- ❌ リアルタイム更新機能なし
- ❌ 実行中エージェントのアニメーションなし

**問題点**:
- DAGが静的で、実行状況が反映されない
- 並列実行時の進捗が把握できない

### 📋 実装タスク

#### タスク 4.1: エージェント実行状態管理の拡張（3日）

**Global State管理（Zustand使用）**:

```typescript
// src/stores/agentExecutionStore.ts
import { create } from 'zustand';

interface AgentExecutionNode {
  id: string;
  agentType: AgentType;
  status: "idle" | "running" | "completed" | "failed";
  startTime?: number;
  duration?: number;
  dependencies: string[]; // 依存する他のノードID
}

interface AgentExecutionStore {
  nodes: Map<string, AgentExecutionNode>;
  edges: Array<{ source: string; target: string }>;

  // Actions
  addNode: (node: AgentExecutionNode) => void;
  updateNodeStatus: (id: string, status: AgentExecutionNode["status"]) => void;
  addEdge: (source: string, target: string) => void;
  clear: () => void;
}

export const useAgentExecutionStore = create<AgentExecutionStore>((set) => ({
  nodes: new Map(),
  edges: [],

  addNode: (node) => set((state) => {
    const newNodes = new Map(state.nodes);
    newNodes.set(node.id, node);
    return { nodes: newNodes };
  }),

  updateNodeStatus: (id, status) => set((state) => {
    const newNodes = new Map(state.nodes);
    const node = newNodes.get(id);
    if (node) {
      newNodes.set(id, { ...node, status });
    }
    return { nodes: newNodes };
  }),

  addEdge: (source, target) => set((state) => ({
    edges: [...state.edges, { source, target }],
  })),

  clear: () => set({ nodes: new Map(), edges: [] }),
}));
```

---

#### タスク 4.2: リアルタイムDAG更新機能（4日）

**WorkflowDAGViewerの拡張**:

```tsx
// src/components/WorkflowDAGViewer.tsx
import { useAgentExecutionStore } from "../stores/agentExecutionStore";
import { useEffect } from "react";
import { listenToAgentStatus } from "../lib/agent-api";

export function WorkflowDAGViewer() {
  const executionStore = useAgentExecutionStore();

  // React Flowのノードに変換
  const nodes: Node<AgentNodeData>[] = Array.from(executionStore.nodes.values()).map((node) => {
    const agent = AVAILABLE_AGENTS.find((a) => a.type === node.agentType)!;
    return {
      id: node.id,
      type: "agentNode",
      position: calculatePosition(node), // 自動レイアウト計算
      data: {
        agent,
        status: node.status,
        duration: node.duration,
      },
    };
  });

  const edges: Edge[] = executionStore.edges.map((edge, index) => ({
    id: `e-${index}`,
    source: edge.source,
    target: edge.target,
    animated: isAnimated(edge.source, executionStore.nodes),
    markerEnd: { type: MarkerType.ArrowClosed },
  }));

  // エージェント実行イベントをリッスン
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listenToAgentStatus((result) => {
        // ノード追加または更新
        executionStore.addNode({
          id: result.execution_id,
          agentType: result.agent_type,
          status: result.status,
          duration: result.duration_ms,
          dependencies: [], // TODO: 依存関係の抽出
        });
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col">
      {/* ... Header */}

      <div className="flex-1 bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

// ノードの位置を自動計算（階層的レイアウト）
function calculatePosition(node: AgentExecutionNode): { x: number; y: number } {
  // Dagre.jsなどのレイアウトライブラリを使用
  // または簡易的な実装
  const level = node.dependencies.length;
  const x = 400;
  const y = level * 150 + 50;
  return { x, y };
}

// エッジのアニメーション判定
function isAnimated(sourceId: string, nodes: Map<string, AgentExecutionNode>): boolean {
  const sourceNode = nodes.get(sourceId);
  return sourceNode?.status === "running" || false;
}
```

---

#### タスク 4.3: 依存関係の自動検出（3日）

**CoordinatorAgentからの依存情報取得**:

```rust
// src-tauri/src/agent.rs
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct AgentDependencyInfo {
    pub execution_id: String,
    pub dependencies: Vec<String>, // 依存する他の execution_id
}

// CoordinatorAgent実行時に依存関係を発行
app_handle.emit("agent-dependency-graph", AgentDependencyInfo {
    execution_id: execution_id.clone(),
    dependencies: vec![
        "codegen-1".to_string(),
        "codegen-2".to_string(),
    ],
}).ok();
```

**フロントエンドで依存関係を受信**:

```typescript
// src/components/WorkflowDAGViewer.tsx
useEffect(() => {
  const setupDependencyListener = async () => {
    await listen<AgentDependencyInfo>("agent-dependency-graph", (event) => {
      const { execution_id, dependencies } = event.payload;

      // エッジを追加
      dependencies.forEach((depId) => {
        executionStore.addEdge(depId, execution_id);
      });
    });
  };

  setupDependencyListener();
}, []);
```

---

### 📦 成果物

1. ✅ リアルタイムDAG更新機能
2. ✅ エージェント実行状態の可視化
3. ✅ 依存関係の自動検出
4. ✅ 並列実行の可視化
5. 📝 DAG可視化ガイド

### 🎯 成功基準

- [ ] エージェント実行がリアルタイムでDAGに反映される
- [ ] 並列実行時の依存関係が正しく表示される
- [ ] アニメーションが滑らかに動作する
- [ ] 10個以上のノードでもパフォーマンスが保たれる

---

## Phase 5: エラーハンドリング改善（Week 7）

### 🎯 目標

エラー発生時に、ユーザーフレンドリーなメッセージとトラブルシューティングガイドを表示する。

### 📋 実装タスク

#### タスク 5.1: エラーメッセージの改善（2日）

```typescript
// src/lib/error-messages.ts
export const ERROR_MESSAGES: Record<string, { title: string; message: string; actions: string[] }> = {
  "github_token_invalid": {
    title: "GitHub Token が無効です",
    message: "入力されたGitHub Personal Access Tokenが無効、または期限切れの可能性があります。",
    actions: [
      "Settings → GitHub Tokenを確認してください",
      "新しいTokenを生成してください: https://github.com/settings/tokens",
      "Token権限に「repo」と「workflow」が含まれているか確認してください",
    ],
  },
  "repository_not_found": {
    title: "リポジトリが見つかりません",
    message: "指定されたGitHubリポジトリが存在しないか、アクセス権限がありません。",
    actions: [
      "Settings → Repositoryを確認してください",
      "リポジトリ名が「owner/repository」形式であることを確認してください",
      "GitHubでリポジトリが存在するか確認してください",
    ],
  },
  "agent_execution_failed": {
    title: "エージェント実行が失敗しました",
    message: "エージェントの実行中にエラーが発生しました。詳細はログを確認してください。",
    actions: [
      "ターミナルパネルで詳細ログを確認してください",
      "Issue番号が正しいか確認してください",
      "もう一度実行してみてください",
    ],
  },
};

export function getErrorMessage(errorCode: string): typeof ERROR_MESSAGES[string] {
  return ERROR_MESSAGES[errorCode] || {
    title: "エラーが発生しました",
    message: "予期しないエラーが発生しました。",
    actions: ["ターミナルでログを確認してください", "もう一度実行してみてください"],
  };
}
```

---

#### タスク 5.2: エラーモーダルコンポーネント（2日）

```tsx
// src/components/ErrorModal.tsx
import { AlertCircle, ExternalLink, X } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  errorCode: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function ErrorModal({ isOpen, errorCode, onClose, onRetry }: ErrorModalProps) {
  if (!isOpen) return null;

  const error = getErrorMessage(errorCode);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h2 className="text-xl font-light text-gray-900">{error.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-600 font-light">{error.message}</p>

        {/* Actions */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-900">💡 解決方法</h3>
          <ul className="space-y-2">
            {error.actions.map((action, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                <span className="text-blue-600 font-medium">{index + 1}.</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200"
            >
              Retry
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
          >
            Close
          </button>
        </div>

        {/* Help Link */}
        <div className="text-center">
          <a
            href="https://github.com/ShunsukeHayashi/Miyabi/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <span>サポートが必要ですか？</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

### 📦 成果物

1. ✅ ユーザーフレンドリーなエラーメッセージ
2. ✅ エラーモーダルコンポーネント
3. ✅ Re-runボタン
4. ✅ トラブルシューティングガイドリンク
5. 📝 エラーハンドリングガイド

### 🎯 成功基準

- [ ] エラーメッセージが分かりやすい
- [ ] Re-runボタンで簡単に再実行できる
- [ ] トラブルシューティングガイドへのリンクが機能する

---

## Phase 6: 並列実行プログレスバー（Week 8）

### 🎯 目標

複数エージェントの並列実行時に、全体の進捗を視覚的に表示する。

### 📋 実装タスク

#### タスク 6.1: プログレスバーコンポーネント（2日）

```tsx
// src/components/ParallelExecutionProgress.tsx
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ParallelExecutionProgressProps {
  executions: AgentExecution[];
}

export function ParallelExecutionProgress({ executions }: ParallelExecutionProgressProps) {
  const total = executions.length;
  const completed = executions.filter((e) => e.status === "success").length;
  const failed = executions.filter((e) => e.status === "failed").length;
  const running = executions.filter((e) => e.status === "running").length;
  const progress = (completed + failed) / total * 100;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-light text-gray-900">並列実行進捗</h3>
        <span className="text-xs text-gray-500">
          {completed + failed} / {total} completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-4 text-xs">
        <div className="flex items-center space-x-1 text-green-600">
          <CheckCircle size={14} />
          <span>{completed} success</span>
        </div>
        <div className="flex items-center space-x-1 text-blue-600">
          <Clock size={14} />
          <span>{running} running</span>
        </div>
        {failed > 0 && (
          <div className="flex items-center space-x-1 text-red-600">
            <AlertCircle size={14} />
            <span>{failed} failed</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### 📦 成果物

1. ✅ 並列実行プログレスバー
2. ✅ 完了数/総数の表示
3. ✅ 成功/実行中/失敗の内訳
4. 📝 並列実行ガイド

### 🎯 成功基準

- [ ] プログレスバーが正確に進捗を反映する
- [ ] 並列実行時の全体像が把握できる

---

## 技術スタック詳細

### フロントエンド

| 技術 | バージョン | 用途 |
|-----|----------|------|
| React | 18.x | UI構築 |
| TypeScript | 5.x | 型安全性 |
| Vite | 7.x | ビルドツール |
| TailwindCSS | 3.x | スタイリング |
| React Flow | 11.x | DAG可視化 |
| Lucide React | latest | アイコン |
| Zustand | latest | 状態管理 |

### バックエンド

| 技術 | バージョン | 用途 |
|-----|----------|------|
| Rust | 2021 Edition | バックエンドロジック |
| Tauri | 2.0 | デスクトップフレームワーク |
| Tokio | latest | 非同期ランタイム |
| Serde | latest | シリアライゼーション |

### テスト

| 技術 | バージョン | 用途 |
|-----|----------|------|
| Playwright | latest | E2Eテスト |
| Vitest | latest | ユニットテスト |
| React Testing Library | latest | コンポーネントテスト |

---

## 開発環境セットアップ

### 必要な環境

- Node.js: v20.19以上
- Rust: 2021 Edition (Stable)
- pnpm: 最新版

### セットアップコマンド

```bash
# 1. リポジトリクローン
cd /Users/shunsuke/Dev/miyabi-private/miyabi-desktop

# 2. 依存関係インストール
pnpm install

# 3. Tauri CLI インストール（グローバル）
cargo install tauri-cli

# 4. 開発サーバー起動
pnpm tauri dev

# 5. ビルド
pnpm tauri build
```

---

## テスト戦略

### 1. ユニットテスト（Component Level）

```bash
# 実行
pnpm test

# カバレッジ
pnpm test:coverage
```

### 2. E2Eテスト（Application Level）

```bash
# Playwright実行
pnpm test:e2e

# ヘッドレスモード
pnpm test:e2e:headless
```

### 3. 手動UXテスト

```bash
# テストガイドを参照
cat MANUAL_UX_TEST_GUIDE.md
```

---

## リリース戦略

### Phase完了ごとのリリース

| Phase | リリース | バージョン | リリース日（想定） |
|-------|---------|-----------|-----------------|
| Phase 1 | Alpha 1 | v0.2.0 | 2025-11-08 |
| Phase 2 | Alpha 2 | v0.3.0 | 2025-11-22 |
| Phase 3 | Beta 1 | v0.4.0 | 2025-11-29 |
| Phase 4-6 | Beta 2 | v0.5.0 | 2025-12-27 |
| Final | v1.0.0 | v1.0.0 | 2026-01-15 |

### リリースチェックリスト

- [ ] すべてのE2Eテストがパスする
- [ ] 手動UXテストを完了する
- [ ] CHANGELOGを更新する
- [ ] READMEを更新する
- [ ] GitHubリリースノートを作成する
- [ ] バイナリを生成する（macOS/Windows/Linux）

---

**作成者**: Miyabi Team
**最終更新**: 2025-10-31
**ステータス**: Active
**フィードバック**: GitHub Issue #[TBD]
