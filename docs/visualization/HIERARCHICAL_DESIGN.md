# Miyabi Molecular Visualization - 階層的ブレイクダウン設計

## 🧬 分子生物学的比喩の拡張

### 現在の実装 (Level 0: Protein Complex)
```
Crate = タンパク質複合体 (Protein Complex)
  └─ 依存関係 = ペプチド結合 (Peptide Bonds)
```

### 提案する階層構造

```
Level 0: Protein Complex (タンパク質複合体)
  └─ miyabi-cli, miyabi-core, miyabi-types
      ↓ ズームイン
Level 1: Domain (ドメイン)
  └─ src/commands/, src/display/, src/error/
      ↓ ズームイン
Level 2: Residue (アミノ酸残基)
  └─ agent.rs, chat.rs, exec.rs
      ↓ ズームイン
Level 3: Atomic Group (原子団)
  └─ fn run(), fn execute(), struct AgentConfig
      ↓ ズームイン
Level 4: Atom (原子)
  └─ 変数、パラメータ、フィールド
```

---

## 📊 各レベルの詳細設計

### Level 0: Crate Level (現在実装済み)
**生物学的比喩**: タンパク質複合体 (Protein Complex)

```
表現:
- Node Size: LOC (Lines of Code)
- Node Color: Category (Core, Agent, Integration...)
- Links: Cargo.toml dependencies
- Position: Architectural layer (bottom-up)

視覚化:
🔴 miyabi-cli (Tool)
🔵 miyabi-agents (Agent)
🟢 miyabi-types (Core)
```

---

### Level 1: Module/Directory Level
**生物学的比喩**: ドメイン (Domain) / サブユニット (Subunit)

```rust
miyabi-cli/ (Protein Complex)
├─ src/commands/     [🟦 Command Domain]
├─ src/display/      [🟨 UI Domain]
├─ src/error/        [🟥 Error Domain]
└─ src/worktree/     [🟩 Worktree Domain]
```

**視覚化**:
- **Node**: ディレクトリ = 球体（サイズはディレクトリ内LOC）
- **Color**: 機能ドメインで色分け
  - Command: 青系
  - UI/Display: 黄系
  - Error Handling: 赤系
  - Infrastructure: 緑系
- **Links**: `mod` / `use` 文による依存関係
- **Layout**: クレート内でクラスター化

**データ収集**:
```rust
// src/analyzer/module_analyzer.rs (新規実装)
pub struct ModuleNode {
    pub path: PathBuf,           // "src/commands"
    pub parent_crate: String,    // "miyabi-cli"
    pub loc: usize,
    pub file_count: usize,
    pub domain: DomainType,      // Command, UI, Error...
}

pub enum DomainType {
    Command,
    UI,
    Error,
    Infrastructure,
    Business,
    Integration,
}
```

---

### Level 2: File Level (Residue)
**生物学的比喩**: アミノ酸残基 (Amino Acid Residue)

```rust
src/commands/ [Command Domain]
├─ agent.rs          [🔷 Arg - Arginine - 塩基性残基]
├─ chat.rs           [🔶 Gly - Glycine - 小型残基]
├─ exec.rs           [🔵 Lys - Lysine - 塩基性残基]
└─ init.rs           [🟢 Ser - Serine - 極性残基]
```

**アミノ酸タイプのマッピング**:
| ファイル特性 | アミノ酸タイプ | 色 | 説明 |
|------------|--------------|-----|------|
| Entry point (main.rs) | Met (メチオニン) | 🟡 | 開始コドン |
| Public API | Arg (アルギニン) | 🔷 | 塩基性・public多数 |
| Internal logic | Ala (アラニン) | ⚪ | 小型・疎水性 |
| Error handling | Cys (システイン) | 🟠 | ジスルフィド結合 |
| Config/Data | Ser (セリン) | 🟢 | 極性・データ保持 |
| Complex logic | Trp (トリプトファン) | 🟣 | 大型・複雑 |

**視覚化**:
- **Node**: ファイル = 球体（サイズはファイルLOC）
- **Color**: ファイルの役割で色分け（アミノ酸タイプ）
- **Shape**: アミノ酸の形状を模倣
  - 小型ファイル: 小さい球体 (Gly, Ala)
  - 大型ファイル: 大きい球体 (Trp, Tyr)
  - Entry point: 特殊形状（立方体？）
- **Links**:
  - `use` 文 → 共有結合 (Covalent Bond)
  - `mod` 文 → ペプチド結合 (Peptide Bond)
  - Function call → 水素結合 (Hydrogen Bond)

**データ収集**:
```rust
pub struct FileNode {
    pub path: PathBuf,              // "src/commands/agent.rs"
    pub parent_module: String,      // "src/commands"
    pub loc: usize,
    pub function_count: usize,
    pub pub_function_count: usize,
    pub import_count: usize,        // use statements
    pub export_count: usize,        // pub items
    pub amino_acid_type: AminoAcidType,
    pub complexity: f32,            // Cyclomatic complexity average
}

pub enum AminoAcidType {
    Met, // Entry point
    Arg, // Public API
    Ala, // Internal
    Cys, // Error handling
    Ser, // Config/Data
    Trp, // Complex logic
    // ... 20種類定義
}
```

---

### Level 3: Function Level (Atomic Group)
**生物学的比喩**: 原子団 (Functional Group) / 側鎖 (Side Chain)

```rust
// agent.rs ファイル (アミノ酸残基)
├─ pub fn run()              [⚛️ -NH2 アミノ基 - Entry]
├─ fn execute_agent()        [⚛️ -COOH カルボキシル基 - Core]
├─ fn parse_config()         [⚛️ -OH ヒドロキシル基 - Helper]
└─ struct AgentCommand       [⚛️ -SH チオール基 - Data]
```

**原子団タイプのマッピング**:
| 関数特性 | 原子団 | 記号 | 説明 |
|---------|-------|------|------|
| pub fn | -NH2 (アミノ基) | 🔵 | Public interface |
| fn (internal) | -CH3 (メチル基) | ⚪ | Hydrophobic core |
| fn main() | -COOH (カルボキシル基) | 🔴 | Entry/Exit point |
| struct | -OH (ヒドロキシル基) | 🟢 | Data structure |
| impl | -SH (チオール基) | 🟡 | Implementation |
| trait | -NH-CO- (ペプチド結合) | 🟣 | Interface bond |

**視覚化**:
- **Node**: 関数/型 = 小さな球体または多面体
- **Color**: 可視性と役割
  - Public: 明るい色
  - Private: 暗い色
  - Entry point: 特殊色
- **Size**: 関数の行数 or Cyclomatic Complexity
- **Links**:
  - Function calls → 矢印
  - Struct field access → 点線
  - Trait implementation → 太線

**データ収集**:
```rust
pub struct FunctionNode {
    pub name: String,               // "run"
    pub parent_file: PathBuf,       // "src/commands/agent.rs"
    pub visibility: Visibility,     // pub, pub(crate), private
    pub kind: FunctionKind,         // Function, Method, Struct, Trait
    pub loc: usize,
    pub complexity: f32,            // Cyclomatic complexity
    pub param_count: usize,
    pub return_type: Option<String>,
    pub calls: Vec<String>,         // Called functions
    pub called_by: Vec<String>,     // Callers
    pub atomic_group: AtomicGroupType,
}

pub enum FunctionKind {
    Function,
    Method,
    Struct,
    Enum,
    Trait,
    Impl,
}

pub enum AtomicGroupType {
    Amino,      // -NH2 (pub fn)
    Methyl,     // -CH3 (private fn)
    Carboxyl,   // -COOH (main/entry)
    Hydroxyl,   // -OH (struct)
    Thiol,      // -SH (impl)
    Peptide,    // -NH-CO- (trait)
}
```

---

### Level 4: Variable/Field Level (Atom)
**生物学的比喩**: 原子 (Atom)

```rust
struct AgentCommand {
    name: String,        // [C] 炭素 - Core data
    issues: Vec<u64>,    // [N] 窒素 - Collection
    concurrency: usize,  // [O] 酸素 - Parameter
    dry_run: bool,       // [H] 水素 - Flag
}
```

**原子タイプのマッピング**:
| 変数特性 | 原子 | 記号 | 説明 |
|---------|-----|------|------|
| Core data (String, i32) | C (炭素) | ⚫ | Main structure |
| Collections (Vec, HashMap) | N (窒素) | 🔵 | Multiplicity |
| Parameters (usize, f64) | O (酸素) | 🔴 | Configuration |
| Flags (bool) | H (水素) | ⚪ | Simple state |
| References (&T) | S (硫黄) | 🟡 | Bonds |
| Generic (T, U) | P (リン) | 🟠 | Energy/Flexibility |

**視覚化**:
- **Node**: 変数/フィールド = 小球体（原子の大きさに比例）
- **Color**: データ型で色分け（元素記号）
- **Links**:
  - Field access → 共有結合
  - Reference → イオン結合
  - Borrow (&) → 水素結合

---

## 🎮 インタラクション設計

### ズーム/ドリルダウン機能
```
[Crate View]
  ↓ Double-click on "miyabi-cli"
[Module View - miyabi-cli内のディレクトリ]
  ↓ Double-click on "src/commands"
[File View - commands内のファイル]
  ↓ Double-click on "agent.rs"
[Function View - agent.rs内の関数]
  ↓ Double-click on "run()"
[Variable View - run()内の変数と制御フロー]
```

### ブレッドクラム表示
```
🏠 Workspace > miyabi-cli > src/commands > agent.rs > fn run()
```

### Level of Detail (LOD) 制御
- **Camera距離に応じて自動調整**
- 遠い: Crateレベルのみ表示
- 中間: Moduleラベル表示開始
- 近い: Fileレベル表示
- 最接近: Functionレベル表示

---

## 🔬 解析ツールの実装

### Phase 1: Module Level解析
```rust
// crates/miyabi-viz/src/analyzer/module_analyzer.rs
pub struct ModuleAnalyzer {
    workspace_root: PathBuf,
}

impl ModuleAnalyzer {
    pub fn analyze_modules(&self, crate_path: &Path) -> Result<Vec<ModuleNode>> {
        // 1. ディレクトリ構造をスキャン
        // 2. 各ディレクトリのLOCを計算
        // 3. mod.rs / lib.rs を解析して依存関係抽出
        // 4. DomainTypeを推論（ディレクトリ名から）
    }
}
```

### Phase 2: File Level解析
```rust
// crates/miyabi-viz/src/analyzer/file_analyzer.rs
pub struct FileAnalyzer {
    module_path: PathBuf,
}

impl FileAnalyzer {
    pub fn analyze_files(&self) -> Result<Vec<FileNode>> {
        // 1. .rsファイルをスキャン
        // 2. syn crateでASTパース
        // 3. pub item数、use数をカウント
        // 4. AminoAcidTypeを推論
    }
}
```

### Phase 3: Function Level解析
```rust
// crates/miyabi-viz/src/analyzer/function_analyzer.rs
pub struct FunctionAnalyzer {
    file_path: PathBuf,
}

impl FunctionAnalyzer {
    pub fn analyze_functions(&self) -> Result<Vec<FunctionNode>> {
        // 1. syn crateでASTから関数抽出
        // 2. 呼び出し関係をトレース
        // 3. Cyclomatic Complexityを計算
        // 4. AtomicGroupTypeを推論
    }
}
```

### Phase 4: Variable Level解析 (オプション)
```rust
// crates/miyabi-viz/src/analyzer/variable_analyzer.rs
pub struct VariableAnalyzer {
    function_ast: ItemFn,
}

impl VariableAnalyzer {
    pub fn analyze_variables(&self) -> Result<Vec<VariableNode>> {
        // 1. 関数内のローカル変数抽出
        // 2. 型情報から原子タイプ推論
        // 3. データフローグラフ構築
    }
}
```

---

## 📦 データ形式の拡張

### 現在のstructure.json
```json
{
  "level": "crate",
  "nodes": [
    {"id": "miyabi-cli", "val": 1.77, "group": "Tool"}
  ],
  "links": [
    {"source": "miyabi-cli", "target": "miyabi-core"}
  ]
}
```

### 拡張されたHierarchical JSON
```json
{
  "level": "crate",
  "nodes": [
    {
      "id": "miyabi-cli",
      "val": 1.77,
      "group": "Tool",
      "children_url": "/api/structure/miyabi-cli/modules",
      "children": {
        "level": "module",
        "nodes": [
          {
            "id": "src/commands",
            "val": 0.85,
            "domain": "Command",
            "children_url": "/api/structure/miyabi-cli/commands/files",
            "children": {
              "level": "file",
              "nodes": [
                {
                  "id": "agent.rs",
                  "val": 0.3,
                  "amino_acid": "Arg",
                  "children_url": "/api/structure/miyabi-cli/commands/agent/functions"
                }
              ]
            }
          }
        ]
      }
    }
  ]
}
```

---

## 🎨 視覚化の実装

### Frontend変更
```typescript
// types/hierarchical-graph.ts
export interface HierarchicalNode extends CrateNode {
  level: 'crate' | 'module' | 'file' | 'function' | 'variable';
  children?: HierarchicalNode[];
  children_url?: string;
  parent_id?: string;
}

export interface ViewState {
  currentLevel: 'crate' | 'module' | 'file' | 'function';
  focusedNode: string | null;
  breadcrumb: string[];
}
```

### Zoom機能の実装
```typescript
// components/HierarchicalMiyabiViewer.tsx
const handleNodeDoubleClick = async (node: HierarchicalNode) => {
  if (node.children_url) {
    // Fetch next level data
    const childrenData = await fetch(node.children_url).then(r => r.json());

    // Animate zoom into node
    zoomToNode(node);

    // Replace graph data with children
    setGraphData(childrenData);

    // Update breadcrumb
    setBreadcrumb([...breadcrumb, node.id]);
  }
};
```

---

## 📊 実装優先度

### Priority 1: Module Level (最優先)
- ✅ 分かりやすい構造
- ✅ データ収集が比較的簡単
- ✅ 即座に価値がある
- 実装時間: 2-3日

### Priority 2: File Level
- ✅ アミノ酸比喩が面白い
- ⚠️ syn crateでのAST解析が必要
- 実装時間: 3-5日

### Priority 3: Function Level
- ✅ 詳細な依存関係分析
- ⚠️ 複雑度計算が必要
- ⚠️ データ量が大きい
- 実装時間: 5-7日

### Priority 4: Variable Level (オプション)
- ⚠️ データ量が膨大
- ⚠️ 実用性が不明
- 実装時間: 7-10日

---

## 🧪 Expected Results

### Module Level View
```
miyabi-cli [Protein Complex]
  ├─ src/commands/ [🟦 Command Domain] (850 LOC)
  │   ├─ depends on → src/display/
  │   └─ depends on → src/error/
  ├─ src/display/ [🟨 UI Domain] (320 LOC)
  └─ src/error/ [🟥 Error Domain] (180 LOC)
```

### File Level View
```
src/commands/ [Command Domain]
  ├─ agent.rs [🔷 Arg - Public API] (450 LOC)
  │   ├─ uses → error.rs
  │   └─ uses → worktree.rs
  ├─ chat.rs [🔶 Gly - Simple] (120 LOC)
  └─ exec.rs [🔵 Lys - Complex] (280 LOC)
```

### Function Level View
```
agent.rs [Arg Residue]
  ├─ pub fn run() [⚛️ -NH2 Entry] (45 LOC)
  │   ├─ calls → execute_agent()
  │   └─ calls → parse_config()
  ├─ fn execute_agent() [⚛️ -COOH Core] (120 LOC)
  └─ struct AgentCommand [⚛️ -OH Data]
```

---

## 💡 Key Insights

この階層的可視化により、以下が可能になります:

1. **マクロからミクロへの視点移動**
   - ワークスペース全体 → 個別関数の実装詳細

2. **適切な抽象化レベルの選択**
   - アーキテクチャ議論: Crateレベル
   - モジュール設計: Moduleレベル
   - リファクタリング: Fileレベル
   - デバッグ: Functionレベル

3. **依存関係の多層的理解**
   - Cargo依存 (Crate)
   - mod依存 (Module)
   - use依存 (File)
   - Call依存 (Function)

4. **ホットスポットの発見**
   - 大きいノード = リファクタ候補
   - 多くのリンク = 結合度が高い
   - 深い階層 = 複雑度が高い

---

## 🚀 Implementation Roadmap

### MVP: Module Level (Week 1-2)
1. ModuleAnalyzerの実装
2. Module依存関係の抽出
3. 基本的なズーム機能

### Phase 2: File Level (Week 3-4)
1. FileAnalyzerの実装
2. syn crateでのAST解析
3. アミノ酸タイプの推論ロジック

### Phase 3: Function Level (Week 5-6)
1. FunctionAnalyzerの実装
2. Call graphの構築
3. Cyclomatic Complexityの計算

### Phase 4: Polish (Week 7-8)
1. パフォーマンス最適化
2. UI/UXの洗練
3. ドキュメント作成

---

**このアプローチにより、Miyabiプロジェクトを「言葉空間の分子構造」として完全に可視化できます！**
