# PRD: Codex × Miyabi（Rust）統合 Phase 1

- date: 2025-10-16
- owner: Codex
- status: APPROVED (2025-10-17)

## 🎯 Epic
- name: Codex × Miyabi（Rust）統合 Phase 1
- goal:
  - Codex CLI から Miyabi Rust Edition を統合的に呼び出せる土台を整備し、単一バイナリ運用と高速ワークフローを実現する。
- success_metrics:
  - セットアップ所要時間: 50%短縮
  - 実行時間: 既存TS版比 50%短縮
  - メモリ使用量: 30%削減

## 🔭 Scope / Non-Goals
- in_scope:
  - `miyabi-integration` crate のスキャフォールディング
  - Codex CLI サブコマンド（`codex miyabi`）の設計・最小実装
  - Worktree/Git 連携のインタフェース定義
  - 基本ドキュメント（AGENTS.md, PRD, ARCH）の整備
- out_of_scope:
  - Rust MCP Server の本実装（Phase 3 で扱う）
  - 既存TS版の大規模リファクタ

## 📋 Stories

### Story 1: PRD/ARCH レビューと承認
- id: COD-MIY-RUST-P1-S1
- status: COMPLETED (2025-10-17)
- description: 本PRD/ARCHの初版を作成し、承認を得る。
- acceptance_criteria:
  - [x] `.ai/prd.md` と `.ai/arch.md` が作成され、README/AGENTから辿れる
  - [x] 進行中のEpic/Storyが一意に定義されている
  - [x] ユーザー承認コメントが記録される（Gitログまたは@memory-bank.mdc）
  - note: 2025-10-17 ユーザー承認（CLIレスポンス "OK"）

### Story 2: `miyabi-integration` crate スキャフォールディング
- id: COD-MIY-RUST-P1-S2
- status: PENDING
- description: 統合レイヤーcrateの雛形（lib, feature flags, minimal API）を作成。
- acceptance_criteria:
  - [ ] `miyabi-integration/Cargo.toml` と `src/lib.rs` を追加
  - [ ] `MiyabiClient` インタフェースの骨子（`execute_agent`, `status`）を定義
  - [ ] `cargo check` が通る

### Story 3: Codex CLI サブコマンド `codex miyabi`
- id: COD-MIY-RUST-P1-S3
- status: PENDING
- description: CLI から MiyabiClient を呼び出す最小コマンド群を追加。
- acceptance_criteria:
  - [ ] `codex miyabi status` が JSON で状態を返す
  - [ ] `codex miyabi agent run --type <name> --issue <N>` の雛形
  - [ ] `make test` 相当の最小テストを追加

### Story 4: WorktreeManager 連携
- id: COD-MIY-RUST-P1-S4
- status: PENDING
- description: miyabi-worktree と統合し、Issueごとの作業ツリー生成APIを提供。
- acceptance_criteria:
  - [ ] `WorktreeManager::create_worktrees()` の呼び出し経路を確立
  - [ ] 並列実行の基本パラメータを設定可能

## ⏱️ Milestones
- M1 (2025-10-17): PRD/ARCH 承認
- M2 (2025-10-20): crate 雛形と `cargo check`
- M3 (2025-10-23): CLI サブコマンド最小実装

## 🚧 Risks & Mitigations
- リスク: 既存TS版との依存関係の重複 → Mitigation: フィーチャーフラグでRust優先を制御
- リスク: Gitワークツリー周りの差分仕様 → Mitigation: 既存`miyabi-core`の関数群をAPI経由で再利用

## ✅ Exit Criteria (Phase 1)
- `codex miyabi status` がローカル環境で成功
- `miyabi-integration` の最小APIが安定
- AGENTS/PRD/ARCH ドキュメントが更新・承認済み
