# Miyabi Visualization - ユーザー中心設計ドキュメント

## 🎯 可視化の目的

**Miyabiを使って開発する人が、システムの動きと構造を直感的に理解できるようにする**

---

## 👥 対象ユーザーとニーズ

### Persona 1: 新規ユーザー (Miyabi初心者)
**背景**: Miyabiを初めて使う開発者。AIエージェントベースの開発に興味がある。

**質問**:
- ❓ Miyabiって何？どんな構造になっているの？
- ❓ どのコンポーネントが何をしているの？
- ❓ 自分のプロジェクトに使えそう？

**必要な情報**:
1. **全体像**: Miyabiのコンポーネント構成
2. **カテゴリ理解**: Core, Agent, Integration...の役割
3. **依存関係**: どのコンポーネントがどう連携しているか
4. **規模感**: 各コンポーネントの大きさ（LOC）

**提供する可視化**:
```
Level 0: Crate Level (現在実装済み)
├─ 全29クレートを一望
├─ カテゴリ別の色分け (8色)
├─ サイズ = 複雑さの指標
└─ 矢印 = 依存方向

ホバー時:
├─ クレート名
├─ カテゴリ
├─ LOC
└─ 依存数

視点: Bottom-Up (基盤 → アプリケーション)
```

**Success Criteria**:
- ✅ 5分でMiyabiの全体構造を把握できる
- ✅ 「Core層が基盤で、Agent層が機能実装」と理解できる
- ✅ 主要な依存関係の流れが分かる

---

### Persona 2: Agent開発者
**背景**: MiyabiのAgentを開発・カスタマイズしたい。新しいAgentを追加したい。

**質問**:
- ❓ CoordinatorAgentはどこにあって、何をしているの？
- ❓ 新しいAgentを作る時、どのコンポーネントに依存すべき？
- ❓ 既存Agentのコード構造は？

**必要な情報**:
1. **Agent構造**: miyabi-agent-*クレートの内部構造
2. **依存パターン**: 典型的なAgent依存関係
3. **ファイル配置**: どこに何のコードがあるか
4. **関数構成**: 主要な関数とその役割

**提供する可視化**:
```
Level 0: Crate Level
├─ Agentクレートをハイライト表示
└─ クリック → Level 1へ遷移

Level 1: Module Level (Directory)
例: miyabi-agent-coordinator
├─ src/
│   ├─ lib.rs [Entry Point] 🟡
│   ├─ dag/ [DAG構築ロジック] 🔵
│   ├─ executor/ [実行制御] 🟢
│   └─ task_parser/ [タスク分解] 🟣
├─ tests/ [テストコード] 🔘
└─ examples/ [サンプル] ⚪

ホバー時:
├─ モジュール名
├─ 役割説明 ("DAG構築ロジック")
├─ ファイル数
└─ LOC

ダブルクリック → Level 2 (File Level)
```

**Success Criteria**:
- ✅ 既存Agentの構造を10分で理解できる
- ✅ 新Agentを作る時の参考になる
- ✅ 「dag/モジュールがDAG構築を担当」と理解できる

---

### Persona 3: システムアーキテクト
**背景**: Miyabiのアーキテクチャを理解・改善したい。技術的負債を発見したい。

**質問**:
- ❓ 循環依存はないか？
- ❓ どのコンポーネントが過度に結合しているか？
- ❓ リファクタリングすべき箇所は？
- ❓ テストカバレッジが低いのはどこ？

**必要な情報**:
1. **依存グラフ**: 循環依存の検出
2. **結合度**: 多くのコンポーネントに依存されているハブ
3. **複雑度**: 大きすぎる・複雑すぎるコンポーネント
4. **健全性指標**: テストカバレッジ、B-factor (変更頻度)

**提供する可視化**:
```
Level 0: Crate Level + Analytics Overlay
├─ 循環依存を赤線で表示
├─ ハブノードを大きく強調
├─ B-factor (変更頻度) をヒートマップ表示
└─ テストカバレッジを透明度で表示

Filter機能:
├─ "Show only public dependencies" (開発依存を除外)
├─ "Highlight God Crates" (LOC > threshold)
├─ "Highlight Unstable Hubs" (B-factor > 80)
└─ "Show test coverage" (カバレッジ50%未満を強調)

Stats Panel:
├─ Total Crates: 29
├─ Cyclic dependencies: 0
├─ God Crates (>5000 LOC): 3
├─ Unstable Hubs (B-factor>80): 5
└─ Average test coverage: 67%
```

**Success Criteria**:
- ✅ 5分で技術的負債候補を発見できる
- ✅ リファクタリング優先順位を判断できる
- ✅ 改善前後の比較ができる

---

### Persona 4: トラブルシューター (バグ調査)
**背景**: 本番環境でエラーが発生。原因を特定したい。

**質問**:
- ❓ このエラーはどのコンポーネントで起きているか？
- ❓ 関連するコンポーネントは？
- ❓ 最近変更されたコードは？
- ❓ どの関数が呼ばれているか？

**必要な情報**:
1. **エラー発生箇所**: クレート → モジュール → ファイル → 関数
2. **Call Chain**: 呼び出し経路のトレース
3. **最近の変更**: B-factorが高い（最近変更が多い）箇所
4. **関連コンポーネント**: 依存している/されている箇所

**提供する可視化**:
```
Level 0 → Level 3: 階層的ドリルダウン

Example: "miyabi-cli で AgentCommand実行時エラー"

Step 1: Crate Level
├─ miyabi-cli をクリック
└─ 依存関係をハイライト表示

Step 2: Module Level (miyabi-cli内)
├─ src/commands/ をクリック
└─ エラーログから推測される場所を赤く表示

Step 3: File Level (src/commands/内)
├─ agent.rs をダブルクリック
└─ 最近変更された関数を黄色で表示 (Git blame)

Step 4: Function Level (agent.rs内)
├─ pub fn run() を表示
├─ Call chainを矢印で表示
│   run() → execute_agent() → worktree::create()
└─ エラー発生箇所を赤で強調

Timeline機能:
├─ 最近のcommit履歴を表示
└─ "2日前に execute_agent() が変更された" を表示
```

**Success Criteria**:
- ✅ エラー発生箇所を10分で特定できる
- ✅ 影響範囲を把握できる
- ✅ 最近の変更と関連付けできる

---

### Persona 5: Miyabi貢献者 (OSS Contributor)
**背景**: Miyabiに機能追加・バグ修正のPRを出したい。

**質問**:
- ❓ この機能はどこに実装すべき？
- ❓ 既存のコードスタイルは？
- ❓ テストはどこに書く？
- ❓ 影響範囲はどこまで？

**必要な情報**:
1. **コード配置規約**: 似た機能がどこにあるか
2. **テスト構造**: テストファイルの場所
3. **影響範囲**: 変更が波及する箇所
4. **コード例**: 参考になる既存実装

**提供する可視化**:
```
Level 1 + 2: Module & File Level with Search

Search: "similar to CoordinatorAgent"
├─ miyabi-agent-coordinator をハイライト
├─ 同じパターンのAgentを表示
└─ 推奨される実装場所を提案

File Structure View:
miyabi-agent-new/
├─ src/
│   ├─ lib.rs ✅ Required
│   ├─ config.rs ⚠️ Optional
│   └─ executor.rs ✅ Required
├─ tests/
│   ├─ integration_test.rs ✅ Required
│   └─ unit_test.rs ⚠️ Recommended
└─ examples/
    └─ basic.rs ⚠️ Recommended

Template Code:
├─ "Copy from CoordinatorAgent" ボタン
└─ スケルトンコードを生成
```

**Success Criteria**:
- ✅ 適切な実装場所が分かる
- ✅ 既存コードパターンを参照できる
- ✅ PRのスコープを適切に設定できる

---

## 📊 各レベルで提供する情報の詳細

### Level 0: Crate Level (全ユーザー共通)

#### 表示情報:
| 項目 | 表現 | 目的 |
|------|------|------|
| **Crate名** | 大きなラベル (14px, bold) | 識別 |
| **カテゴリ** | 色分け (8色) + `[Agent]`形式 | 役割理解 |
| **サイズ (LOC)** | 球体の大きさ + "1,234 LOC"ラベル | 複雑さの把握 |
| **位置 (Layer)** | Bottom-Up配置 | アーキテクチャ理解 |
| **依存関係** | 矢印の向き + 青色 | データフロー理解 |
| **変更頻度** | B-factor (0-100) → 色の濃さ | 不安定性の把握 |
| **テストカバレッジ** | Occupancy (0-1.0) → 透明度 | 品質の把握 |

#### インタラクション:
- **ホバー**: 詳細情報をツールチップ表示
- **クリック**: 右パネルに詳細表示
- **ダブルクリック**: Level 1 (Module Level)へズーム
- **右クリック**: コンテキストメニュー
  - "Show dependents" (このクレートに依存している箇所)
  - "Show dependencies" (このクレートが依存している箇所)
  - "Open in VSCode"
  - "View on GitHub"

#### 実装例:
```typescript
interface CrateNodeInfo {
  // 基本情報
  name: string;              // "miyabi-cli"
  category: CrateCategory;   // "Tool"
  loc: number;               // 1234

  // アーキテクチャ情報
  layer: 'foundation' | 'core' | 'application';
  dependencies: string[];    // ["miyabi-core", "miyabi-types"]
  dependents: string[];      // ["miyabi-orchestrator"]

  // 健全性指標
  bfactor: number;           // 0-100 (変更頻度)
  test_coverage: number;     // 0-1.0
  cyclomatic_complexity: number;

  // メタ情報
  path: string;              // "crates/miyabi-cli"
  github_url: string;
  last_modified: Date;
  primary_maintainer: string;

  // ドリルダウン
  has_modules: boolean;
  module_count: number;
}
```

---

### Level 1: Module Level (Agent開発者 & Contributor向け)

#### 表示情報:
| 項目 | 表現 | 目的 |
|------|------|------|
| **モジュール名** | `src/commands/` | 配置理解 |
| **役割** | "DAG構築ロジック" | 責務理解 |
| **ドメイン** | Command/UI/Error/Infrastructure | 機能分類 |
| **ファイル数** | "12 files" | 規模感 |
| **LOC** | "850 LOC" | 複雑さ |
| **mod依存** | 矢印 (mod宣言から) | モジュール間結合 |

#### ユースケース別表示:

**Agent開発者向け**:
```
miyabi-agent-coordinator [Focus Node]
├─ src/lib.rs [🟡 Entry] (120 LOC)
│   ├─ pub struct CoordinatorAgent
│   ├─ pub fn new()
│   └─ pub fn run()
├─ src/dag/ [🔵 Core Logic] (480 LOC)
│   ├─ Task graph construction
│   ├─ Dependency resolution
│   └─ Cycle detection
├─ src/executor/ [🟢 Execution] (320 LOC)
└─ tests/ [🔘 Tests] (220 LOC)

Recommended Pattern for New Agent:
✅ lib.rs で pub struct定義
✅ 複雑なロジックはサブモジュールに分離
✅ tests/ に統合テスト配置
```

**トラブルシューター向け**:
```
miyabi-cli > src/commands/
[Error Context: AgentCommand実行時エラー]

Recent Changes (Last 7 days):
├─ agent.rs [⚠️ Modified 2 days ago]
│   └─ fn execute_agent() ← Likely error location
├─ worktree.rs [Modified 5 days ago]
└─ error.rs [Modified 6 days ago]

Call Chain Visualization:
main() → run() → execute_agent() → worktree::create() [❌ Error]
```

---

### Level 2: File Level (詳細分析)

#### 表示情報:
| 項目 | 表現 | 目的 |
|------|------|------|
| **ファイル名** | `agent.rs` | 識別 |
| **役割 (Amino Acid Type)** | 🔷 Arg (Public API) | ファイルの性格 |
| **LOC** | "450 LOC" | 規模 |
| **Pub関数数** | "12 pub fn" | Public API表面積 |
| **Import数** | "8 use statements" | 外部依存度 |
| **Complexity** | Average 4.2 | 複雑さ |

#### Amino Acid Mapping (役割の可視化):
```rust
// Entry Point (main.rs, lib.rs)
🟡 Met (メチオニン) - 開始コドン
   → 「このファイルから処理が始まる」

// Public API (多数のpub fn/struct)
🔷 Arg (アルギニン) - 塩基性・公開API
   → 「外部から呼ばれる重要なインターフェース」

// Internal Implementation
⚪ Ala (アラニン) - 小型・内部実装
   → 「ヘルパー関数・内部ロジック」

// Error Handling
🟠 Cys (システイン) - ジスルフィド結合
   → 「エラーハンドリング・Result型多用」

// Configuration/Data
🟢 Ser (セリン) - 極性・データ構造
   → 「設定ファイル・データモデル」

// Complex Logic
🟣 Trp (トリプトファン) - 大型・複雑
   → 「複雑なアルゴリズム・高Cyclomatic Complexity」
```

#### ユースケース:

**Agent開発者**:
"agent.rsは🔷 Argタイプ → Public APIが多い → 外部インターフェース層"

**アーキテクト**:
"🟣 Trpタイプが多い → リファクタリング候補"

**トラブルシューター**:
"エラーが🟠 Cysファイルで起きている → エラーハンドリング層の問題"

---

### Level 3: Function Level (デバッグ & 詳細分析)

#### 表示情報:
| 項目 | 表現 | 目的 |
|------|------|------|
| **関数名** | `pub fn run()` | 識別 |
| **Visibility** | pub / pub(crate) / private | アクセス制御 |
| **原子団タイプ** | ⚛️ -NH2 (アミノ基) | 関数の性格 |
| **LOC** | "45 LOC" | 規模 |
| **Complexity** | Cyclomatic 6 | 複雑さ |
| **Parameters** | `&self, config: Config` | 入力 |
| **Return Type** | `Result<Output>` | 出力 |
| **Call Count** | "Called by 3 functions" | 利用頻度 |

#### Function Group Mapping:
```rust
// Public Entry Point
⚛️ -NH2 (アミノ基) - pub fn
   → 「外部から呼び出されるエントリーポイント」
   Example: pub fn run()

// Internal Helper
⚛️ -CH3 (メチル基) - private fn
   → 「内部ヘルパー関数」
   Example: fn parse_args()

// Main/Entry
⚛️ -COOH (カルボキシル基) - fn main()
   → 「プログラムのエントリーポイント」

// Data Structure
⚛️ -OH (ヒドロキシル基) - struct
   → 「データ構造定義」
   Example: struct AgentConfig

// Implementation
⚛️ -SH (チオール基) - impl block
   → 「メソッド実装」

// Interface
⚛️ -NH-CO- (ペプチド結合) - trait
   → 「インターフェース定義」
```

#### Call Chain Visualization:
```
[Error Trace Mode]

main()
 └─> run()
      └─> execute_agent() ← Last successful
           └─> worktree::create() ❌ Error occurred here
                └─> git2::Repository::init() [External crate]

Stack Trace:
1. worktree::create() at worktree.rs:45
2. execute_agent() at agent.rs:120
3. run() at agent.rs:78
4. main() at main.rs:12

Suggested Fix:
├─ Check git2 version compatibility
├─ Verify file permissions
└─ Add error handling in worktree::create()
```

---

## 🎨 UI/UX Design

### Main View Layout
```
┌─────────────────────────────────────────────────────────┐
│ 🧬 Miyabi Molecular Visualization                       │
├────────┬────────────────────────────────────┬───────────┤
│        │                                    │           │
│ Left   │         3D Graph View              │  Right    │
│ Panel  │                                    │  Panel    │
│        │  [Interactive 3D visualization]    │           │
│ - Mode │                                    │ - Details │
│ - Zoom │                                    │ - Stats   │
│ - Filt │                                    │ - Actions │
│        │                                    │           │
├────────┴────────────────────────────────────┴───────────┤
│ 🏠 Workspace > miyabi-cli > src/commands > agent.rs     │
│ [Breadcrumb Navigation]                                 │
└─────────────────────────────────────────────────────────┘
```

### Left Panel (Control Panel)
```
🎮 View Mode
  ○ Overview (Level 0)
  ● Focused (Current node)
  ○ Drill-down (子階層)

🔍 Zoom Level
  [====|--------] Level 1/4

🎨 Visual Settings
  ☑ Show labels
  ☑ Show dependencies
  ☐ Show dev dependencies
  ☑ Highlight selected

📊 Filters
  ☑ Core
  ☑ Agent
  ☐ Test
  ☐ Infrastructure

⚠️ Highlight
  ○ None
  ● God Crates (LOC > 5000)
  ○ Unstable (B-factor > 80)
  ○ Low Coverage (< 50%)
```

### Right Panel (Info Panel)
```
📦 miyabi-cli

Category: Tool
LOC: 1,234
Files: 15
Functions: 89

📈 Health Metrics
├─ B-factor: 65 (Medium)
├─ Test Coverage: 78%
├─ Complexity: 4.2 (Good)
└─ Dependencies: 12

🔗 Dependencies (5)
├─ miyabi-core
├─ miyabi-types
├─ miyabi-agents
├─ miyabi-github
└─ miyabi-knowledge

👥 Dependents (2)
├─ miyabi-orchestrator
└─ miyabi-web-api

⚡ Actions
[Open in VSCode]
[View on GitHub]
[Run Tests]
[Generate Docs]
```

### Bottom Panel (Breadcrumb + Context)
```
🏠 Workspace > miyabi-cli > src/commands > agent.rs > fn run()

💡 Context: You are viewing a public entry function
   - This function is called by 3 other modules
   - Last modified: 2 days ago by @user
   - Cyclomatic Complexity: 6 (Medium)

⚠️ Suggestion: Consider refactoring - complexity exceeds threshold (5)
```

---

## 📖 Documentation & Tutorial

### Quick Start Guide (新規ユーザー向け)
```
# Miyabi Visualization クイックスタート

## Step 1: 全体を見る (3分)
1. http://localhost:3003 を開く
2. 3D空間を回転・ズーム
3. 色の意味を理解 (Legend参照)
4. Bottom-Up配置を理解
   - 下層: 基盤 (types, core)
   - 上層: アプリケーション (cli, agents)

## Step 2: 気になるクレートをクリック (5分)
1. "miyabi-cli" をクリック
2. 右パネルで詳細を確認
3. 依存関係を辿る
4. VSCodeで開いてコードを読む

## Step 3: 深掘りする (10分)
1. "miyabi-cli" をダブルクリック
2. Module Levelにズーム
3. "src/commands/" を選択
4. File Levelまでドリルダウン
5. "agent.rs" の構造を理解

🎯 Goal: 15分でMiyabiの構造を80%理解できる
```

### Troubleshooting Guide (トラブルシューター向け)
```
# エラー調査フロー

## 前提: エラーログを準備
```
Error: failed to create worktree
  at miyabi-cli/src/commands/agent.rs:120
  caused by: git2::Error: permission denied
```

## Step 1: エラー発生クレートを特定
1. Visualization を開く
2. Search: "miyabi-cli"
3. クレートをハイライト

## Step 2: モジュールレベルに絞り込み
1. "miyabi-cli" をダブルクリック
2. "src/commands" モジュールを選択
3. Recent Changesフィルタをオン
4. 黄色で表示される最近変更ファイルを確認

## Step 3: ファイルレベルで詳細調査
1. "agent.rs" をダブルクリック
2. Function Level表示
3. "execute_agent()" を選択
4. Call Chainを表示

## Step 4: 影響範囲を確認
1. "Show dependents" で影響範囲表示
2. テスト不足箇所を確認 (Low Coverage filter)
3. 修正優先度を判断

🎯 Goal: 10分でエラー原因を特定
```

---

## 🚀 Implementation Priority (ユーザーニーズ順)

### Phase 1: Level 0 強化 (全ユーザー) ⭐⭐⭐⭐⭐
**期間**: 1週間
**対象**: 新規ユーザー、アーキテクト

**実装内容**:
- ✅ 現在の可視化を完成 (ほぼ完了)
- ✅ Filter機能の追加
  - God Crates highlight
  - Unstable Hubs highlight
  - Low Coverage highlight
- ✅ Stats Panelの実装
- ✅ Search機能

**ユーザー価値**:
- 新規ユーザーが全体像を把握
- アーキテクトが問題箇所を発見

---

### Phase 2: Level 1 (Module Level) ⭐⭐⭐⭐
**期間**: 2週間
**対象**: Agent開発者、Contributor

**実装内容**:
- Module解析ツール実装
- ドリルダウン機能
- Module依存関係可視化
- Role/Domain分類

**ユーザー価値**:
- Agent開発者がコード配置を理解
- Contributorが実装場所を判断

---

### Phase 3: Level 2 (File Level) ⭐⭐⭐
**期間**: 3週間
**対象**: Agent開発者、トラブルシューター

**実装内容**:
- File解析ツール (syn crate)
- Amino Acid Type推論
- File依存関係可視化
- Recent Changes highlight

**ユーザー価値**:
- 詳細なコード理解
- エラー調査の効率化

---

### Phase 4: Level 3 (Function Level) ⭐⭐
**期間**: 4週間
**対象**: トラブルシューター、上級開発者

**実装内容**:
- Function解析ツール
- Call Chain visualization
- Cyclomatic Complexity計算
- Atomic Group分類

**ユーザー価値**:
- デバッグの高速化
- リファクタリング箇所の特定

---

## 📊 Success Metrics

### 新規ユーザー
- ✅ 初回訪問から5分以内にMiyabiの全体構造を理解
- ✅ 「どのコンポーネントが何をしているか」を説明できる
- ✅ Visualizationを見ずにドキュメントを読むより80%速く理解

### Agent開発者
- ✅ 新Agent作成時の迷いが50%減少
- ✅ 既存Agentの構造理解時間が70%短縮
- ✅ "どこに実装すべきか"の質問が減少

### アーキテクト
- ✅ 技術的負債の発見時間が80%短縮
- ✅ リファクタリング優先度を明確に判断できる
- ✅ アーキテクチャレビュー時の議論が可視化ベースに

### トラブルシューター
- ✅ バグ調査時間が60%短縮
- ✅ 影響範囲の特定が迅速化
- ✅ 修正箇所の判断精度が向上

---

## 🎓 Educational Value

この可視化は、以下の教育的価値も提供します:

1. **ソフトウェアアーキテクチャ教育**
   - 良い設計と悪い設計の違いが視覚的に分かる
   - 依存関係の方向性の重要性を理解

2. **Rust エコシステムの理解**
   - Cargo Workspaceの構造
   - クレート分割のベストプラクティス

3. **複雑系の理解**
   - システムの創発的な複雑さを体感
   - 局所的な変更が全体に与える影響

4. **チーム協働**
   - 共通の視覚言語でコミュニケーション
   - "miyabi-cliの依存関係を見て"で話が通じる

---

**この設計により、Miyabi Visualizationは単なる"見た目が面白いツール"ではなく、実際の開発に役立つ"実用的なツール"になります。**
