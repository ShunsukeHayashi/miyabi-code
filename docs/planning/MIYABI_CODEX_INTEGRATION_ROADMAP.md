# Miyabi × Codex Integration Roadmap

**作成日**: 2025-10-26
**目的**: Miyabi を Codex アーキテクチャに沿って機能拡張
**モード**: Miyabi Infinity - 完了するまで止まらない

---

## 🎯 統合ビジョン

**"Miyabi を Codex レベルの TUI + Sandbox + Apply-Patch システムに進化させる"**

### 統合の目標

1. **TUI強化**: Codex の洗練された TUI を参考に Miyabi TUI を本格実装
2. **Apply-Patch統合**: `codex-apply-patch` を `miyabi-apply-patch` として移植
3. **Sandbox統合**: Linux/macOS Sandbox 機能を統合
4. **完全自律動作**: 音声実況しながら自動実装

---

## 📊 現状分析

### Codex アーキテクチャ (既存)

**Workspace構成**: 40+ crates

**主要コンポーネント**:
- **`codex-tui`**: 55ファイル、大規模TUI実装
  - `app.rs` (27KB) - メインアプリケーション
  - `chatwidget.rs` (94KB) - チャットウィジェット
  - `history_cell.rs` (77KB) - 履歴セル
  - `markdown_render.rs` (20KB) - Markdownレンダリング
  - `diff_render.rs` (23KB) - Diff表示
  - `pager_overlay.rs` (30KB) - ページャー

- **`codex-apply-patch`**: Patch適用システム
  - `similar` crate使用
  - tree-sitter統合
  - バイナリ + ライブラリ提供

- **`codex-linux-sandbox`**: Linux sandboxing
  - Landlock実装
  - Seccomp統合

**技術スタック**:
- ratatui 0.29.0
- crossterm 0.28.1
- tree-sitter 0.25.10
- similar 2.7.0
- pulldown-cmark 0.10

### Miyabi アーキテクチャ (現状)

**Workspace構成**: 15+ crates

**TUI現状**:
- `crates/miyabi-tui/src/lib.rs` のみ（最小限）
- MVP実装前の状態

**強み**:
- 14個の Business Agents 実装済み
- Worktree並列実行基盤
- GitHub OS アーキテクチャ
- VOICEVOX音声通知統合

---

## 🚀 統合ロードマップ

### Phase 0: 環境準備（30分）

**タスク**:
1. Codex プロジェクトの詳細分析完了 ✅
2. 統合ドキュメント作成 ✅
3. 音声実況システム確認 ✅

**成果物**:
- `MIYABI_CODEX_INTEGRATION_ROADMAP.md` ✅

---

### Phase 1: TUI基礎実装（3-4時間）

**目標**: Codex レベルの基本 TUI 実装

**参考実装**: `codex-rs/tui/src/`

**実装ファイル**:
1. **`crates/miyabi-tui/src/app.rs`**
   - 参考: `codex-rs/tui/src/app.rs`
   - メインアプリケーション構造
   - イベントループ
   - 状態管理

2. **`crates/miyabi-tui/src/tui.rs`**
   - 参考: `codex-rs/tui/src/tui.rs`
   - Terminal初期化
   - Raw mode管理
   - クリーンアップ

3. **`crates/miyabi-tui/src/widgets/mod.rs`**
   - Header widget
   - Message list widget
   - Input composer widget
   - Status bar widget

4. **`crates/miyabi-tui/src/events.rs`**
   - キーボードイベント
   - マウスイベント
   - カスタムイベント

**依存関係追加** (`Cargo.toml`):
```toml
[dependencies]
ratatui = { version = "0.29.0", features = [
    "scrolling-regions",
    "unstable-backend-writer",
    "unstable-rendered-line-info",
    "unstable-widget-ref",
] }
crossterm = { version = "0.28.1", features = ["bracketed-paste", "event-stream"] }
pulldown-cmark = "0.10"
tree-sitter-highlight = "0.25.10"
tree-sitter-bash = "0.25"
```

**実装時間**: 3-4時間
**音声通知**: "Phase 1: TUI基礎実装開始！"

---

### Phase 2: Markdown & Syntax Highlighting（2-3時間）

**目標**: Markdownレンダリングとシンタックスハイライト

**参考実装**:
- `codex-rs/tui/src/markdown_render.rs`
- `codex-rs/tui/src/chatwidget.rs`

**実装ファイル**:
1. **`crates/miyabi-tui/src/markdown.rs`**
   - Markdown parser (pulldown-cmark)
   - レンダリングロジック

2. **`crates/miyabi-tui/src/syntax.rs`**
   - tree-sitter highlight
   - 言語別ハイライト設定

**実装時間**: 2-3時間
**音声通知**: "Phase 2: Markdownレンダリング実装中！"

---

### Phase 3: Apply-Patch システム移植（4-5時間）

**目標**: `codex-apply-patch` を `miyabi-apply-patch` として移植

**参考実装**: `codex-rs/apply-patch/`

**新規クレート作成**:
```bash
cargo new --lib crates/miyabi-apply-patch
```

**実装ファイル**:
1. **`crates/miyabi-apply-patch/src/lib.rs`**
   - 参考: `codex-rs/apply-patch/src/lib.rs`
   - Patch parser
   - Apply logic

2. **`crates/miyabi-apply-patch/src/parser.rs`**
   - Hunk parsing
   - Diff parsing

3. **`crates/miyabi-apply-patch/src/main.rs`**
   - CLI binary

**依存関係**:
```toml
[dependencies]
similar = "2.7.0"
tree-sitter = "0.25.10"
tree-sitter-bash = "0.25"
anyhow = "1"
thiserror = { workspace = true }
```

**テスト**:
```bash
cargo test --package miyabi-apply-patch
```

**実装時間**: 4-5時間
**音声通知**: "Phase 3: Apply-Patchシステム移植開始！"

---

### Phase 4: Sandbox 統合（6-8時間）

**目標**: Linux/macOS Sandbox 機能を統合

**参考実装**:
- `codex-rs/linux-sandbox/`
- `codex-rs/process-hardening/`

**新規クレート作成**:
```bash
cargo new --lib crates/miyabi-sandbox
```

**実装ファイル**:
1. **Linux Sandbox** (`src/linux.rs`)
   - Landlock実装
   - Seccomp filters

2. **macOS Sandbox** (`src/macos.rs`)
   - Seatbelt profiles
   - sandbox-exec統合

3. **統合API** (`src/lib.rs`)
   - プラットフォーム抽象化
   - 統一インターフェース

**依存関係**:
```toml
[dependencies]
landlock = "0.4.1"
seccompiler = "0.5.0"

[target.'cfg(target_os = "macos")'.dependencies]
# macOS specific deps
```

**実装時間**: 6-8時間
**音声通知**: "Phase 4: Sandbox統合実装中！"

---

### Phase 5: 高度なTUI機能（4-5時間）

**目標**: Diff表示、ページャー、ファイル検索

**参考実装**:
- `codex-rs/tui/src/diff_render.rs`
- `codex-rs/tui/src/pager_overlay.rs`
- `codex-rs/tui/src/file_search.rs`

**実装ファイル**:
1. **`crates/miyabi-tui/src/diff_render.rs`**
   - Unified diff表示
   - Split diff表示

2. **`crates/miyabi-tui/src/pager.rs`**
   - ページャーオーバーレイ
   - スクロール機能

3. **`crates/miyabi-tui/src/file_search.rs`**
   - Fuzzy file search
   - ファイルピッカー

**実装時間**: 4-5時間
**音声通知**: "Phase 5: 高度なTUI機能実装中！"

---

### Phase 6: CLI統合（2-3時間）

**目標**: `miyabi` CLIに TUI機能を統合

**変更ファイル**:
1. **`crates/miyabi-cli/Cargo.toml`**
   ```toml
   [dependencies]
   miyabi-tui = { path = "../miyabi-tui", optional = true }
   miyabi-apply-patch = { path = "../miyabi-apply-patch" }
   miyabi-sandbox = { path = "../miyabi-sandbox" }

   [features]
   tui = ["miyabi-tui"]
   sandbox = ["miyabi-sandbox"]
   ```

2. **`crates/miyabi-cli/src/main.rs`**
   ```rust
   #[cfg(feature = "tui")]
   use miyabi_tui;

   match cli.command {
       Commands::Chat { prompt, tui } => {
           if tui {
               #[cfg(feature = "tui")]
               {
                   miyabi_tui::run_tui().await?;
                   return Ok(());
               }
           }
           // Existing CLI mode
       }
   }
   ```

**実装時間**: 2-3時間
**音声通知**: "Phase 6: CLI統合完了間近！"

---

### Phase 7: テスト & ドキュメント（3-4時間）

**目標**: 統合テストとドキュメント整備

**テスト実装**:
1. **TUIテスト**
   - `crates/miyabi-tui/tests/integration_test.rs`
   - vt100 emulator使用

2. **Apply-Patchテスト**
   - `crates/miyabi-apply-patch/tests/`
   - 各種patch形式テスト

3. **Sandboxテスト**
   - `crates/miyabi-sandbox/tests/`
   - 権限チェック

**ドキュメント**:
1. **README更新**
   - TUI使用方法
   - Apply-Patch使用例
   - Sandbox設定

2. **統合完了レポート**
   - `docs/CODEX_INTEGRATION_COMPLETE.md`
   - 実装詳細
   - パフォーマンス指標

**実装時間**: 3-4時間
**音声通知**: "Phase 7: テスト & ドキュメント作成中！"

---

## 📊 実装タイムライン

| Phase | 内容 | 時間 | 累計 |
|-------|------|------|------|
| Phase 0 | 環境準備 | 0.5h | 0.5h |
| Phase 1 | TUI基礎実装 | 3-4h | 4-4.5h |
| Phase 2 | Markdown & Syntax | 2-3h | 6-7.5h |
| Phase 3 | Apply-Patch移植 | 4-5h | 10-12.5h |
| Phase 4 | Sandbox統合 | 6-8h | 16-20.5h |
| Phase 5 | 高度なTUI機能 | 4-5h | 20-25.5h |
| Phase 6 | CLI統合 | 2-3h | 22-28.5h |
| Phase 7 | テスト & ドキュメント | 3-4h | 25-32.5h |
| **合計** | | **25-32.5時間** | |

**並列実行なし**: 25-32.5時間
**カレンダー日数** (8h/day): **3-4日**

---

## 🎤 音声実況ポイント

### フェーズ開始時
```
"Phase X: [タスク名] 開始！"
```

### 進捗報告 (30分ごと)
```
"現在 Phase X 実装中。進捗 Y%"
```

### フェーズ完了時
```
"Phase X: [タスク名] 完了！次のPhaseに進みます"
```

### 最終完了時
```
"🎉 Miyabi × Codex 統合完了！全Phase実装終了です！"
```

---

## ✅ 成功基準

### Phase 1-2 完了基準
- [ ] `miyabi chat --tui` で TUI起動
- [ ] Markdownレンダリング動作
- [ ] シンタックスハイライト表示

### Phase 3 完了基準
- [ ] `miyabi apply-patch` コマンド動作
- [ ] Patch適用成功
- [ ] テスト全てPass

### Phase 4 完了基準
- [ ] Linux Sandbox動作（Landlock + Seccomp）
- [ ] macOS Sandbox動作（Seatbelt）
- [ ] 権限制限確認

### Phase 5-6 完了基準
- [ ] Diff表示機能動作
- [ ] ファイル検索動作
- [ ] CLI統合完了

### Phase 7 完了基準
- [ ] 全テストPass（90%+ coverage）
- [ ] ドキュメント完成
- [ ] ビルド成功

---

## 🚨 リスク管理

### 高リスク項目

1. **Sandbox実装の複雑性**
   - 軽減策: Codexの実装を忠実に移植
   - 代替策: まずLinuxのみ実装、macOSは後回し

2. **TUI実装の大規模性**
   - 軽減策: MVP機能から段階的実装
   - 代替策: Codexの一部機能のみ移植

3. **依存関係の競合**
   - 軽減策: Codexと同じバージョン使用
   - 代替策: 独立したクレートとして分離

---

## 📚 参考リソース

### Codex実装
- **TUI**: `/Users/shunsuke/Dev/codex_dev/codex/codex-rs/tui/`
- **Apply-Patch**: `/Users/shunsuke/Dev/codex_dev/codex/codex-rs/apply-patch/`
- **Sandbox**: `/Users/shunsuke/Dev/codex_dev/codex/codex-rs/linux-sandbox/`

### Miyabi既存ドキュメント
- **MVP Roadmap**: `docs/CODEX_INTEGRATION_MVP_ROADMAP.md`
- **Implementation Details**: `docs/MIYABI_CODEX_IMPLEMENTATION_DETAILS.md`
- **Infinity Mode**: `.claude/commands/miyabi-infinity.md`

---

## 🎯 次のアクション

**即座に開始**:
1. Phase 1: TUI基礎実装
   - `crates/miyabi-tui/src/app.rs` 作成
   - `crates/miyabi-tui/src/tui.rs` 作成
   - 基本イベントループ実装

**音声通知**:
```
"統合ロードマップ作成完了！Phase 1 TUI基礎実装を開始します！"
```

---

**作成日**: 2025-10-26
**ステータス**: 🚀 Phase 0 完了 → Phase 1 開始準備完了
**モード**: Miyabi Infinity - 完了するまで止まらない

🤖 Generated with [Claude Code](https://claude.com/claude-code)
