# Next Sprint Plan - Hooks Integration & CLI Enhancement

**作成日**: 2025-10-17
**作成者**: Claude Code
**前提**: Phase 1-3 & 6 完了済み（Clippy 100%クリーン、Domain Model強化、WorktreePool拡張、Git Push完了）

---

## 📋 スプリント概要

### スプリント目標
1. **Hook統合完全化**: CoordinatorAgentへのHook適用
2. **CLI実行フロー改善**: 全AgentでHookライフサイクル統一
3. **統合テスト構築**: Hooks + WorktreePool + fail_fast の E2E テスト

### 完了済みの基盤
✅ **Phase 1**: Clippy 100%クリーン達成
✅ **Phase 2**: Task + AgentConfig validation（36テスト）
✅ **Phase 3**: WorktreePool fail-fast + 11種類統計メソッド
✅ **Phase 6**: Git Push成功（6コミット）

### 既存のHook infrastructure
- ✅ `AgentHook` trait定義済み (`crates/miyabi-agents/src/hooks.rs:23-43`)
- ✅ `HookedAgent<A>` wrapper実装済み (`crates/miyabi-agents/src/hooks.rs:46-116`)
- ✅ 3種類の具象Hook実装:
  - `EnvironmentCheckHook` - 環境変数検証
  - `MetricsHook` - 実行メトリクス記録
  - `AuditLogHook` - 監査ログファイル出力 (`.ai/logs/{date}.md`)

### 既存のCLI Hook適用状況
- ✅ CodeGenAgent: Lines 367-370 in `agent.rs`
- ✅ ReviewAgent: Lines 423-426
- ✅ IssueAgent: Lines 481-484
- ✅ PRAgent: Lines 562-565
- ✅ DeploymentAgent: Lines 633-636
- ❌ **CoordinatorAgent: 未適用** (Line 315 - 直接インスタンス化)

---

## 🎯 Task 分解

### Task 1: CoordinatorAgent への Hook 統合 (2h)

**優先度**: P0 (Critical)
**担当Agent**: CodeGenAgent

**実装内容**:
1. `crates/miyabi-cli/src/commands/agent.rs:307-356` の `run_coordinator_agent()` メソッドを変更
2. 現在の実装:
   ```rust
   let agent = CoordinatorAgentWithLLM::new(config);
   let result = agent.execute(&task).await?;
   ```
3. 変更後:
   ```rust
   let log_dir = config.log_directory.clone();
   let mut agent = HookedAgent::new(CoordinatorAgentWithLLM::new(config));
   agent.register_hook(MetricsHook::new());
   agent.register_hook(EnvironmentCheckHook::new(["GITHUB_TOKEN"]));
   agent.register_hook(AuditLogHook::new(log_dir));
   let result = agent.execute(&task).await?;
   ```

**テスト**:
- CoordinatorAgent実行前に環境変数チェックが動作
- `.ai/logs/{date}.md` にCoordinatorAgent実行ログが出力
- MetricsHookでタスクID・実行時間が記録

**受け入れ条件**:
- [ ] `miyabi agent run coordinator --issue 123` 実行時にHookが動作
- [ ] 環境変数未設定時に適切なエラーメッセージ
- [ ] 監査ログに実行開始・完了が記録

---

### Task 2: CLI のHook登録パターンを統一 (1.5h)

**優先度**: P1 (High)
**担当Agent**: CodeGenAgent + ReviewAgent

**実装内容**:
1. 全Agent実行メソッドで共通のHook登録ヘルパーを作成
2. `crates/miyabi-cli/src/commands/agent.rs` に追加:
   ```rust
   impl AgentCommand {
       /// Register standard lifecycle hooks for agents
       fn register_standard_hooks<A: BaseAgent>(
           &self,
           agent: &mut HookedAgent<A>,
           config: &AgentConfig,
       ) {
           agent.register_hook(MetricsHook::new());
           agent.register_hook(EnvironmentCheckHook::new(["GITHUB_TOKEN"]));
           agent.register_hook(AuditLogHook::new(config.log_directory.clone()));
       }
   }
   ```
3. 各Agent実行メソッドでこのヘルパーを使用
4. コードの重複を削減（DRY原則）

**テスト**:
- 全Agentで統一されたHook登録ロジックが動作
- ヘルパーメソッドの単体テスト追加

**受け入れ条件**:
- [ ] 全Agent実行メソッドで `register_standard_hooks()` 使用
- [ ] コード重複が削減（LoC削減: 約30行）
- [ ] Clippy警告0件維持

---

### Task 3: WorktreePool + Hooks 統合テスト (2h)

**優先度**: P1 (High)
**担当Agent**: CodeGenAgent

**実装内容**:
1. `crates/miyabi-worktree/tests/hooks_integration_test.rs` 作成
2. テストシナリオ:
   - **Scenario 1**: 複数Worktree並列実行時のHookログ確認
   - **Scenario 2**: fail-fast発火時のon_error Hook呼び出し確認
   - **Scenario 3**: 統計メソッドとHook Metricsの整合性確認

**テストコード例**:
```rust
#[tokio::test]
async fn test_worktree_pool_with_hooks() {
    // Setup: Create hooked agents
    let config = create_test_config();
    let mut agent = HookedAgent::new(CodeGenAgent::new(config));

    // Register recording hook
    let events = Arc::new(Mutex::new(Vec::new()));
    agent.register_hook(RecordingHook::new(events.clone()));

    // Execute in WorktreePool
    let pool = WorktreePool::new(/* ... */);
    pool.execute_with_fail_fast(/* ... */).await;

    // Assert hooks were called in correct order
    let recorded = events.lock().unwrap();
    assert_eq!(recorded.len(), 4); // pre, post for 2 tasks
}
```

**受け入れ条件**:
- [ ] 3つのテストシナリオが全てpass
- [ ] Worktree並列実行時のHookログが衝突しない
- [ ] fail_fastトリガー時にon_errorが呼ばれる

---

### Task 4: AuditLogHook の並行書き込み安全性確保 (1.5h)

**優先度**: P2 (Medium)
**担当Agent**: ReviewAgent

**実装内容**:
1. `crates/miyabi-agents/src/hooks.rs:189-261` の `AuditLogHook` を検証
2. 現在の実装:
   ```rust
   let mut file = OpenOptions::new()
       .create(true)
       .append(true)
       .open(&path)
       .await
       .map_err(MiyabiError::Io)?;

   file.write_all(entry.as_bytes()).await.map_err(MiyabiError::Io)?;
   ```
3. 問題点:
   - 複数Worktreeから同時に同じログファイルへ書き込むと競合の可能性
   - `tokio::fs::OpenOptions::append(true)` はOS依存の原子性保証

**対策案**:
- **Option A**: Mutex wrapperで排他制御（シンプル、パフォーマンス低下）
- **Option B**: Worktree毎に別ファイル（`{date}-worktree-{id}.md`）
- **Option C**: トランザクションログライブラリ（`tracing-appender`）

**推奨**: **Option B** - Worktree IDを含むファイル名で分離

**受け入れ条件**:
- [ ] 並行書き込み時のデータ欠損なし
- [ ] レースコンディションが発生しない
- [ ] テストでファイルI/O競合を再現・検証

---

### Task 5: E2E統合テスト - 完全フローテスト (2.5h)

**優先度**: P1 (High)
**担当Agent**: CodeGenAgent + ReviewAgent

**実装内容**:
1. `crates/miyabi-cli/tests/e2e_coordinator_hooks_test.rs` 作成
2. テストフロー:
   ```
   1. CoordinatorAgent実行（Issue分解）
      ↓ Hooks: pre-execute, post-execute
   2. WorktreePool並列実行（3 worktrees）
      ↓ 各Worktreeで CodeGenAgent/ReviewAgent実行
      ↓ Hooks: 各Agentのライフサイクル
   3. fail_fast発火（1つのWorktreeで意図的失敗）
      ↓ Hooks: on_error呼び出し
   4. ログファイル検証
      ↓ `.ai/logs/{date}.md` の内容確認
   5. 統計情報検証
      ↓ WorktreePool統計とHook Metricsの整合性
   ```

**テストコード構造**:
```rust
#[tokio::test]
#[ignore] // CI環境で実行不可のためignore
async fn test_e2e_coordinator_with_hooks_and_worktree_pool() {
    // 1. Setup
    let config = create_test_config();
    let temp_dir = create_temp_git_repo();

    // 2. Execute Coordinator
    let coordinator = create_hooked_coordinator(config.clone());
    let decomposition = coordinator.execute(/* ... */).await;

    // 3. Execute WorktreePool with hooked agents
    let pool = WorktreePool::new(/* ... */);
    let result = pool.execute_with_fail_fast(/* ... */).await;

    // 4. Verify logs
    let log_content = read_audit_log(&config.log_directory).await;
    assert!(log_content.contains("🔄 Agent CoordinatorAgent starting"));
    assert!(log_content.contains("✅ Agent CoordinatorAgent completed"));
    assert!(log_content.contains("❌ Agent CodeGenAgent failed"));

    // 5. Verify statistics
    assert_eq!(result.failed_count, 1);
    assert!(result.has_failures());
}
```

**受け入れ条件**:
- [ ] E2Eテストが全フローをカバー
- [ ] 監査ログに全Agent実行履歴が記録
- [ ] fail_fast時のエラーハンドリング検証
- [ ] テスト実行時間 < 30秒

---

## 📊 タイムライン

| Task | 担当Agent | 優先度 | 推定時間 | 依存関係 |
|------|-----------|--------|----------|----------|
| Task 1: CoordinatorAgent Hook統合 | CodeGenAgent | P0 | 2h | なし |
| Task 2: CLI Hook統一パターン | CodeGenAgent | P1 | 1.5h | Task 1完了後 |
| Task 3: WorktreePool統合テスト | CodeGenAgent | P1 | 2h | Task 1完了後 |
| Task 4: AuditLogHook並行安全性 | ReviewAgent | P2 | 1.5h | なし（並行実行可） |
| Task 5: E2E統合テスト | CodeGenAgent + ReviewAgent | P1 | 2.5h | Task 1-4完了後 |

**総推定時間**: 9.5時間
**クリティカルパス**: Task 1 → Task 2 → Task 5 = 6時間
**並行実行可能**: Task 3とTask 4（2時間削減可能）

**最短完了時間**: 7時間（並行実行時）

---

## 🎯 成功基準

### 機能要件
- [ ] CoordinatorAgent実行時にHookライフサイクルが動作
- [ ] 全AgentでHook登録パターンが統一
- [ ] WorktreePool並列実行時のHookログが正常に記録
- [ ] fail_fast発火時にon_errorが呼ばれる
- [ ] 監査ログファイルが正しく生成される

### 非機能要件
- [ ] Clippy警告0件維持
- [ ] 全テスト通過（cargo test --all）
- [ ] コードカバレッジ 80%以上維持
- [ ] E2Eテスト実行時間 < 30秒

### ドキュメント
- [ ] Hook統合ガイド更新（CLAUDE.md）
- [ ] E2Eテストのトラブルシューティングガイド作成
- [ ] 監査ログフォーマット仕様書作成（`.ai/logs/FORMAT.md`）

---

## 🚀 実行コマンド

### 開発フロー
```bash
# Task 1: CoordinatorAgent Hook統合
cargo check
cargo test --package miyabi-cli -- run_coordinator_agent
git commit -m "feat(cli): Add lifecycle hooks to CoordinatorAgent execution"

# Task 2: CLI Hook統一パターン
cargo clippy -- -D warnings
cargo test --package miyabi-cli
git commit -m "refactor(cli): Unify hook registration pattern across all agents"

# Task 3: WorktreePool統合テスト
cargo test --package miyabi-worktree -- hooks_integration
git commit -m "test(worktree): Add hooks integration tests with parallel execution"

# Task 4: AuditLogHook並行安全性
cargo test --package miyabi-agents -- hooks::tests
git commit -m "fix(agents): Ensure AuditLogHook thread-safety for concurrent writes"

# Task 5: E2E統合テスト
cargo test --package miyabi-cli -- e2e_coordinator_hooks_test --ignored
git commit -m "test(e2e): Add comprehensive coordinator+hooks+worktree flow test"

# 最終確認
cargo test --all
cargo clippy -- -D warnings
git push
```

### 動作確認
```bash
# CoordinatorAgent + Hooks実行
miyabi agent run coordinator --issue 270

# 監査ログ確認
cat .ai/logs/$(date +%Y-%m-%d).md

# WorktreePool統計確認
cargo run --bin miyabi -- agent run coordinator --issues 270,271,272 --concurrency 3
```

---

## 📝 リスクと対策

### リスク 1: Hook並行書き込み時のファイル破損
**影響度**: High
**対策**: Task 4でWorktree IDベースのファイル分離実装

### リスク 2: E2Eテストの実行時間超過
**影響度**: Medium
**対策**: モックGitHub APIクライアント使用、テストデータ最小化

### リスク 3: CoordinatorAgentWithLLM のHook統合時の型エラー
**影響度**: Low
**対策**: BaseAgent trait実装確認済み、HookedAgent<T: BaseAgent>でジェネリック対応

---

## 📚 参考資料

- **Hooks仕様**: `crates/miyabi-agents/src/hooks.rs`
- **既存Hook統合例**: `crates/miyabi-cli/src/commands/agent.rs:367-370`
- **WorktreePool実装**: `crates/miyabi-worktree/src/pool.rs`
- **BaseAgent trait**: `crates/miyabi-agents/src/base.rs`
- **fail_fast実装**: `crates/miyabi-worktree/src/pool.rs:171-197`

---

**作成者**: Claude Code
**最終更新**: 2025-10-17
