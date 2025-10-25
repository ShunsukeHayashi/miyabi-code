# Miyabi Molecular Visualization - User Guide

**Version**: 2.0.0
**Last Updated**: 2025-10-26
**Server**: http://localhost:3003

---

## 🎯 What is Miyabi Visualization?

Miyabi Visualizationは、Rust Cargo Workspaceを**分子構造**として可視化するツールです。
29個のクレート（分子）とそれらの依存関係（結合）を3D空間で表現し、システムの構造を直感的に理解できるようにします。

---

## 🚀 Quick Start (5 Minutes)

### Step 1: データ生成
```bash
# ワークスペースのルートディレクトリで実行
cd /Users/shunsuke/Dev/miyabi-private

# 構造データを生成（Git履歴も含む完全版）
cargo run --package miyabi-viz --features cli --bin miyabi-viz -- \
  generate --output crates/miyabi-viz/frontend/public/structure.json

# 出力例
✓ Analyzed 29 crates
✓ Found 96 dependencies
✓ Detected 0 cycles
✓ Output: crates/miyabi-viz/frontend/public/structure.json
```

### Step 2: サーバー起動
```bash
cd crates/miyabi-viz/frontend
npm install  # 初回のみ
npm run dev
```

### Step 3: ブラウザで開く
```
http://localhost:3003
```

---

## 🎨 画面の見方

### メイン表示 (3D Graph View)

```
    [miyabi-cli] ← アプリケーション層 (上層)
       ↓ 依存
    [miyabi-core] ← 基盤層 (下層)
```

#### 色の意味
| 色 | カテゴリ | 説明 |
|---|----------|------|
| 🔴 Red | Core | 基盤ライブラリ (types, core) |
| 🔵 Cyan | Agent | AI Agent実装 |
| 💙 Blue | Integration | 外部連携 (GitHub, LLM) |
| 🟢 Green | Infrastructure | インフラ (Worktree, Knowledge) |
| 🟡 Yellow | Tool | ツール (CLI) |
| 🟣 Purple | Business | ビジネスロジック |
| ⚪ Gray | Test | テストコード |

#### サイズの意味
- **大きい球体** = コード量が多い (LOC: Lines of Code)
- **小さい球体** = シンプルなクレート

#### 矢印の意味
- **青い矢印** = Runtime依存 (実行時に必要)
- **灰色の矢印** = Dev依存 (開発時のみ)
- **金色の矢印** = Build依存 (ビルド時)

---

## 🖱️ 操作方法

### マウス操作
| 操作 | 動作 |
|------|------|
| **左ドラッグ** | カメラ回転 |
| **右ドラッグ** | カメラ移動 (Pan) |
| **ホイール** | ズーム |
| **クリック** | ノード選択 → 詳細表示 |
| **ダブルクリック** | カメラフォーカス |

### キーボードショートカット
| キー | 動作 |
|------|------|
| **Esc** | 選択解除 |
| **Space** | アニメーション一時停止 |
| **R** | カメラリセット |

---

## 📊 左パネル (Control Panel)

### Layout Mode
レイアウトを切り替えられます：

- **Bottom-Up** (推奨): 基盤が下、アプリケーションが上
- **Top-Down**: 逆配置
- **Left-Right / Right-Left**: 横配置
- **Radial Out/In**: 放射状配置
- **Force-Directed**: 自由配置

### Filter Categories
カテゴリ別に表示/非表示を切り替え：
- ☑ Core
- ☑ Agent
- ☑ Integration
- ☐ Test (非表示にしてスッキリ)

### Legend
- **Node Colors**: カテゴリ別の色
- **Link Colors**: 依存タイプ別の色

---

## 📋 右パネル (Info Panel)

ノードをクリックすると表示されます：

```
📦 miyabi-cli

Category: Tool
LOC: 1,234
Files: 15

📈 Health Metrics
├─ B-factor: 65 (Medium volatility)
├─ Test Coverage: 78%
├─ Complexity: 4.2 (Good)
└─ Dependencies: 12

🔗 Dependencies (5)
├─ miyabi-core
├─ miyabi-types
...

👥 Dependents (2)
├─ miyabi-orchestrator
...
```

---

## 🎓 使用シーン別ガイド

### Scene 1: 新規ユーザー「Miyabiって何？」

#### 目標
5分でMiyabiの全体構造を理解する

#### 手順
1. **視点を調整**
   - 左ドラッグで全体を回転
   - 上層（アプリケーション）と下層（基盤）を確認

2. **カテゴリを確認**
   - Legendを見て色の意味を理解
   - 🔴 Core (基盤) が最も依存される
   - 🔵 Agent (機能) が最も多い

3. **主要クレートをクリック**
   - `miyabi-cli` - ユーザーが使うCLIツール
   - `miyabi-types` - 共通の型定義
   - `miyabi-core` - 共通ユーティリティ

4. **依存の流れを追う**
   ```
   miyabi-cli
     ↓ 依存
   miyabi-agents
     ↓ 依存
   miyabi-types
   ```

#### 理解すべきポイント
- ✅ Coreレイヤーが基盤
- ✅ Agentレイヤーが機能実装
- ✅ CLIが最上位のインターフェース

---

### Scene 2: Agent開発者「新しいAgentを作りたい」

#### 目標
既存Agentの構造を理解し、パターンを学ぶ

#### 手順
1. **Agentカテゴリにフォーカス**
   - Filter: Agentのみ表示
   - 7つのAgentクレートを確認

2. **参考にするAgentを選ぶ**
   - `miyabi-agent-coordinator` - DAG実行制御
   - `miyabi-agent-codegen` - コード生成
   - クリックして詳細を確認

3. **依存パターンを確認**
   ```
   miyabi-agent-coordinator
     ↓ 依存
   miyabi-types (共通型)
   miyabi-core (ユーティリティ)
   miyabi-llm (LLM API)
   ```

4. **VSCodeで開く**
   - Info Panel → "Open in VSCode"
   - 実際のコードを読む

#### 新Agent作成のパターン
```rust
// 典型的な依存関係
[dependencies]
miyabi-types = { path = "../miyabi-types" }
miyabi-core = { path = "../miyabi-core" }
miyabi-llm = { path = "../miyabi-llm" }
serde = { version = "1.0", features = ["derive"] }
anyhow = "1.0"
```

---

### Scene 3: アーキテクト「技術的負債を発見したい」

#### 目標
リファクタリング候補を5分で特定

#### 手順
1. **God Cratesを探す**
   - 視覚的に大きいノードを探す
   - LOC > 5000 のクレート

2. **結合度を確認**
   - 多くの矢印が集まるノード = ハブ
   - 変更の影響が大きい

3. **不安定性を確認**
   - B-factor > 80 = 最近変更が多い
   - 不安定な可能性

4. **テストカバレッジを確認**
   - 透明なノード = カバレッジ低い
   - テスト追加が必要

#### リファクタリング優先度
```
High: 大きい + B-factor高い + Coverage低い
Medium: 2つ該当
Low: 1つ該当
```

---

### Scene 4: トラブルシューター「エラーの原因を探したい」

#### 前提
エラーログがある:
```
Error: failed to create worktree
  at miyabi-cli/src/commands/agent.rs:120
```

#### 手順
1. **エラー発生クレートを特定**
   - `miyabi-cli` をクリック

2. **依存関係を確認**
   - Dependencies: `miyabi-worktree` に依存
   - エラーの原因は `miyabi-worktree` の可能性

3. **最近の変更を確認**
   - B-factor: 100 (最近変更が非常に多い)
   - → 最近のコミットが原因の可能性

4. **影響範囲を確認**
   - "Show dependents" で影響範囲表示
   - 他のクレートへの影響を評価

#### デバッグの流れ
```
1. エラーログからクレート特定
2. 依存クレートを確認
3. 最近の変更を確認 (Git)
4. 影響範囲を評価
5. 修正・テスト
```

---

## 🔍 Tips & Tricks

### Tip 1: レイアウトの使い分け
- **Bottom-Up**: アーキテクチャ理解に最適
- **Force-Directed**: 密な依存関係の可視化
- **Radial Out**: 中心クレートからの影響範囲

### Tip 2: フィルタの活用
```
新規ユーザー: Core + Agent のみ表示
開発者: Test を非表示
アーキテクト: 全表示
```

### Tip 3: ダブルクリックでフォーカス
- ノードをダブルクリック → カメラがズーム
- 詳細を見やすくなる

### Tip 4: ホバーで即座に確認
- ノードにホバー → ツールチップ表示
- クリック不要で情報確認

### Tip 5: 色でカテゴリを覚える
```
🔴 Core = 基盤 (安定)
🔵 Agent = 機能 (拡張)
💙 Integration = 外部 (注意)
🟡 Tool = CLI (エントリ)
```

---

## ❓ FAQ

### Q1: 「データが表示されない」
**A**: structure.jsonを生成しましたか？
```bash
cargo run --package miyabi-viz --features cli --bin miyabi-viz -- \
  generate --output crates/miyabi-viz/frontend/public/structure.json
```

### Q2: 「全部赤色で表示される」
**A**: `--quick` モードを使っていませんか？完全モードで再生成してください：
```bash
# ❌ NG: --quick は Git 履歴を解析しない
cargo run ... -- generate --quick

# ✅ OK: 完全モード
cargo run ... -- generate --output structure.json
```

### Q3: 「ノードが小さすぎて見えない」
**A**: ブラウザをリロードしてください。最新版ではノードサイズが40%大きくなっています。

### Q4: 「循環依存はどう表示される？」
**A**: 循環がある場合、Force-Directedモードでループが形成されます。
現在のMiyabiには循環依存はありません（0 cycles detected）。

### Q5: 「Module Level (Level 1) はいつ実装される？」
**A**: Phase 2として2週間後を予定。ドリルダウン機能でディレクトリ構造まで可視化します。

---

## 🚧 Known Issues

### Issue 1: パフォーマンス
- 大規模プロジェクト (100+ crates) では重くなる可能性
- 対処: Filterで表示を絞る

### Issue 2: ラベルの重なり
- ノードが密集するとラベルが重なる
- 対処: ズームインする

### Issue 3: ブラウザ互換性
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ⚠️ 一部パフォーマンス低下

---

## 📚 関連ドキュメント

- [HIERARCHICAL_DESIGN.md](./HIERARCHICAL_DESIGN.md) - 階層的設計の詳細
- [USER_CENTERED_DESIGN.md](./USER_CENTERED_DESIGN.md) - ユーザー中心設計
- [CHANGELOG_V2.md](./CHANGELOG_V2.md) - バージョン2.0の変更点
- [README.md](../../crates/miyabi-viz/README.md) - 技術仕様

---

## 🆘 Support

### バグ報告
GitHub Issueを作成:
```
Title: [miyabi-viz] バグの簡潔な説明
Content:
- 再現手順
- 期待される動作
- 実際の動作
- スクリーンショット (任意)
```

### 機能リクエスト
```
Title: [miyabi-viz] 機能名
Content:
- 誰が使うか (Persona)
- なぜ必要か (Use case)
- どう動作すべきか (Expected behavior)
```

---

**Happy Visualizing! 🧬**
