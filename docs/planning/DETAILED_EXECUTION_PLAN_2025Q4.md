# Miyabi プロジェクト詳細実行プラン 2025 Q4

**作成日**: 2025-10-27
**期間**: 2025-10-28 ~ 2025-12-31 (9週間)
**分析者**: Claude Code
**バージョン**: 2.0 (Comprehensive Analysis)

---

## 📊 Executive Summary

### プロジェクト現状
- **Crate数**: 33個（アクティブ）
- **ビルドステータス**: ✅ 成功（46.15秒）
- **テストステータス**: ❌ 失敗（コンパイルエラー）
- **未解決Issue**: 42件（P0/P1: 14件）
- **技術的負債**: 高レベル

### 9週間の目標
1. **ベンチマーク評価完了**: SWE-bench Pro + AgentBench
2. **収益化案件完了**: BytePlus + Shinyu
3. **技術的負債解消**: テスト100% + リファクタリング完了
4. **コア機能強化**: Agent自動実行完全実装

---

## 🗓️ 9週間実行プラン

### Week 1: クリーンアップ & 基盤整備 (10/28 - 11/03)

#### Day 1 (月): Critical Blockers解消 🔴

**目標**: テストを100%パスさせる

**タスク**:
1. ✅ **Blocker 1修正** (30分)
   ```bash
   # crates/miyabi-agent-codegen/tests/claudable_integration.rs
   # L194, L242, L275の3箇所を修正
   sed -i '' 's/let _agent =/let agent =/g' crates/miyabi-agent-codegen/tests/claudable_integration.rs
   cargo test --package miyabi-agent-codegen
   ```

2. ✅ **Blocker 2修正** (15分)
   ```bash
   git add crates/miyabi-telegram/src/bin/miyabi-telegram-bot.rs
   git commit -m "feat(telegram): improve Japanese UX with interactive buttons and detailed help"
   git push
   ```

3. ✅ **テスト全実行** (1時間)
   ```bash
   cargo test --all
   # 目標: 56/56 = 100%
   ```

**成果物**:
- ✅ テスト合格率100%
- ✅ mainブランチクリーン
- ✅ CI/CD パイプライングリーン

---

#### Day 2 (火): Issue #553 + リファクタリング開始 🔬

**タスク**:
1. **Issue #553: Test D2 Complexity Check** (4時間)
   ```bash
   export ANTHROPIC_API_KEY=sk-xxx
   cargo test --package miyabi-types test_d2_complexity
   ```

2. **Issue #416: リファクタリング開始** (4時間)
   - miyabi-agentsコード移行計画策定
   - Phase 1: 依存関係マッピング

**成果物**:
- Issue #553クローズ
- リファクタリングロードマップ完成

---

#### Day 3-4 (水木): SWE-bench Phase 1開始 🎯

**Issue #398: 公式評価環境構築**

**タスク**:
1. **Docker環境セットアップ** (1日)
   ```bash
   # 公式Dockerイメージ取得
   docker pull scaleai/swebench-pro:latest

   # ローカルテスト
   docker run -it scaleai/swebench-pro:latest bash
   ```

2. **Modal環境構築** (1日)
   ```bash
   pip install modal
   modal setup
   modal run swe_bench_eval.py
   ```

**成果物**:
- Docker環境構築完了
- Modal無料アカウント作成
- 評価スクリプト動作確認

---

#### Day 5 (金): SWE-bench Phase 1完了 + 週次レビュー 📊

**タスク**:
1. **評価スクリプト統合** (4時間)
2. **Week 1レビュー** (2時間)
3. **Week 2計画** (2時間)

**KPI確認**:
- [ ] テスト合格率: 100%
- [ ] Issue #398: 完了
- [ ] Issue #553: クローズ
- [ ] Blocker: 0件

---

### Week 2: SWE-bench Phase 2-3 + Agent自動実行 (11/04 - 11/10)

#### Day 1-2 (月火): SWE-bench Phase 2 📊

**Issue #399: データセット統合**

**タスク**:
1. **HuggingFaceデータセット取得** (半日)
   ```python
   from datasets import load_dataset
   ds = load_dataset("ScaleAI/SWE-bench_Pro", split="test")
   # 731インスタンス
   ```

2. **Miyabi型定義作成** (半日)
   ```rust
   // crates/miyabi-types/src/swe_bench.rs
   pub struct SWEBenchInstance {
       pub instance_id: String,
       pub repo: String,
       pub base_commit: String,
       pub problem_statement: String,
       pub test_patch: String,
   }
   ```

3. **データパイプライン構築** (1日)

**成果物**:
- 731インスタンスロード可能
- Miyabi型への変換完了

---

#### Day 3-4 (水木): SWE-bench Phase 3開始 🔧

**Issue #400: 評価ラッパー実装**

**タスク**:
1. **Miyabi評価ラッパー** (1.5日)
   ```rust
   // crates/miyabi-benchmark/src/swe_bench.rs
   pub struct SWEBenchEvaluator {
       agent: CoordinatorAgent,
       worktree_manager: WorktreeManager,
   }

   impl SWEBenchEvaluator {
       pub async fn evaluate_instance(&self, instance: &SWEBenchInstance) -> Result<Patch> {
           // 1. Issue作成
           // 2. Agent実行
           // 3. Patch生成
       }
   }
   ```

2. **パッチ生成システム** (0.5日)
   ```rust
   pub fn generate_patch(worktree_path: &Path) -> Result<String> {
       // git diff形式でパッチ生成
   }
   ```

**成果物**:
- 評価ラッパー実装完了
- 単一インスタンスで動作確認

---

#### Day 5 (金): Agent自動実行機能実装 🤖

**タスク**:
1. **Telegram Bot → Agent連携** (全日)
   ```rust
   // crates/miyabi-telegram/src/executor.rs
   pub async fn execute_agent_from_issue(issue_number: u64) -> Result<()> {
       // 1. Issue取得
       // 2. CoordinatorAgent起動
       // 3. 進捗通知（Telegram）
       // 4. 完了時PR作成
   }
   ```

**成果物**:
- Issue → Agent → PR の自動化完了

---

### Week 3: SWE-bench Phase 3-4完了 (11/11 - 11/17)

#### Day 1-3 (月火水): SWE-bench Phase 3完了 🔧

**Issue #400続き**

**タスク**:
1. **エラーハンドリング** (1日)
2. **並列実行対応** (1日)
3. **統合テスト** (1日)

**成果物**:
- Issue #400クローズ
- 評価システム安定動作

---

#### Day 4 (木): SWE-bench Phase 4開始 🧪

**Issue #401: パイロット評価（10インスタンス）**

**タスク**:
1. **10インスタンス選定** (2時間)
   - 難易度: Easy 3個、Medium 5個、Hard 2個

2. **評価実行** (4時間)
   ```bash
   cargo run --release --bin miyabi-benchmark swe-bench-eval --pilot
   ```

3. **結果分析** (2時間)

**成果物**:
- パイロット評価完了
- 問題点洗い出し

---

#### Day 5 (金): 問題修正 + 週次レビュー 🔧

**タスク**:
1. **パイロット評価の問題修正** (6時間)
2. **Week 3レビュー** (2時間)

**KPI確認**:
- [ ] Issue #400: クローズ
- [ ] Issue #401: クローズ
- [ ] パイロット成功率: >50%

---

### Week 4: SWE-bench Phase 5 + BytePlus開始 (11/18 - 11/24)

#### Day 1-5 (月-金): SWE-bench Phase 5 🚀

**Issue #402: フルスケール評価（731インスタンス）**

**スケジュール**:
```
731インスタンス ÷ 5日 = 146インスタンス/日
146インスタンス ÷ 8時間 = 18インスタンス/時間
```

**実行戦略**:
- **並列実行**: 5 Worlds × 3並列 = 15並列
- **推定時間**: 48-60時間
- **24時間稼働**: 月曜夜 ~ 木曜朝

**タスク**:
1. **月曜**: 評価開始（0-200インスタンス）
2. **火曜**: 継続実行（201-400インスタンス）
3. **水曜**: 継続実行（401-600インスタンス）
4. **木曜**: 継続実行（601-731インスタンス）
5. **金曜**: 結果集計・分析

**監視ダッシュボード**:
```rust
// リアルタイム進捗表示
pub struct EvaluationDashboard {
    total: usize,           // 731
    completed: usize,
    success: usize,
    failed: usize,
    running: usize,
}
```

**成果物**:
- 731インスタンス評価完了
- Resolve Rate算出

---

**並行タスク（木金）**: BytePlus Phase 2開始 🖼️

**Issue #363: 画像素材8種類作成**

**タスク**:
1. **AI画像生成** (4時間)
   - DALL-E 3 / Midjourney
   - 8種類: ヒーロー、機能説明、受講者の声など

2. **画像最適化** (2時間)
   - WebP変換
   - レスポンシブ対応

**成果物**:
- 8種類の画像素材完成

---

### Week 5: SWE-bench Phase 6 + BytePlus Phase 4-5 (11/25 - 12/01)

#### Day 1-2 (月火): SWE-bench Phase 6 📄

**Issue #403: 結果分析・リーダーボード提出**

**タスク**:
1. **結果分析** (1日)
   - Resolve Rate算出
   - fail-to-pass分析
   - エラーパターン分類

2. **レポート作成** (半日)
   ```markdown
   # SWE-bench Pro評価結果

   ## 総合スコア
   - Resolve Rate: XX.X% ± X.X

   ## 詳細分析
   - 成功パターン
   - 失敗パターン
   - 改善提案
   ```

3. **リーダーボード提出** (半日)
   - 公式フォーマット準拠
   - 再現スクリプト提出

**成果物**:
- Issue #396完全クローズ
- リーダーボード登録

---

#### Day 3-5 (水木金): BytePlus Phase 4-5 💳

**Issue #365: Stripe決済統合**

**タスク** (2日):
1. **Stripe Business Account申請** (1日待機)
2. **Checkout実装** (1日)
   ```typescript
   // pages/api/checkout.ts
   export default async function handler(req, res) {
       const session = await stripe.checkout.sessions.create({
           line_items: [{
               price: 'price_xxx',
               quantity: 1,
           }],
           mode: 'payment',
           success_url: `${req.headers.origin}/success`,
           cancel_url: `${req.headers.origin}/cancel`,
       });
       res.redirect(303, session.url);
   }
   ```

**Issue #366: パフォーマンス最適化**

**タスク** (1日):
1. **Lighthouse監査** (2時間)
2. **画像最適化** (2時間)
3. **コード分割** (2時間)
4. **キャッシング** (2時間)

**目標スコア**:
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

**成果物**:
- Stripe決済フロー完成
- Lighthouse 90+達成

---

### Week 6: AgentBench Phase 1 + Shinyu開始 (12/02 - 12/08)

#### Day 1-5 (月-金): AgentBench Phase 1 🤖

**Issue #404: AgentBench評価（8環境）**

**8環境スケジュール**:
1. **月**: OS + DB (2環境)
2. **火**: KG + DCG (2環境)
3. **水**: LTP + House-Holding (2環境)
4. **木**: Web Shopping + Web Browsing (2環境)
5. **金**: 結果統合・分析

**各環境の実装**:
```rust
// crates/miyabi-benchmark/src/agent_bench/mod.rs
pub trait AgentBenchEnvironment {
    async fn setup(&self) -> Result<()>;
    async fn evaluate(&self, agent: &dyn Agent) -> Result<SuccessRate>;
    async fn teardown(&self) -> Result<()>;
}
```

**成果物**:
- 8環境すべてで評価完了
- 総合スコア算出

---

**並行タスク（水木金）**: Shinyu Phase 1開始 🔮

**Issue #533: RAGパイプライン構築**

**タスク** (2日):
1. **Qdrantセットアップ** (半日)
2. **歴史資料収集** (半日)
3. **Embedding生成** (半日)
4. **検索API実装** (半日)

**成果物**:
- RAGパイプライン動作確認

---

### Week 7: AgentBench Phase 2 + Shinyu Phase 2-3 (12/09 - 12/15)

#### Day 1-4 (月-木): AgentBench Phase 2 📊

**Issue #405: HAL評価（9ベンチマーク）**

**9ベンチマーク**:
1. AssistantBench
2. Online Mind2Web
3. CORE-Bench Hard
4. Scicode
5. SWE-bench Verified Mini
6. TAU-bench Airline
7. USACO
8. GAIA
9. （追加ベンチマーク）

**タスク**:
1. **W&B Weave統合** (1日)
2. **各ベンチマーク実装** (2日)
3. **コスト効率分析** (1日)

**成果物**:
- HAL評価完了
- コストパフォーマンス分析

---

#### Day 5 (金): Shinyu Phase 2-3 🗣️

**Issue #534-#535**

**タスク**:
1. **織田信長AIプロンプト設計** (4時間)
2. **Axum APIサーバー実装** (4時間)

**成果物**:
- チャットAPI動作確認

---

### Week 8: AgentBench完了 + Shinyu完成 (12/16 - 12/22)

#### Day 1-2 (月火): AgentBench Phase 3-4 📄

**Issue #406-#407**

**タスク**:
1. **Galileo評価** (1日)
2. **統合分析・レポート** (1日)

**成果物**:
- Issue #397完全クローズ
- 3ベンチマーク統合レポート

---

#### Day 3-5 (水木金): Shinyu Phase 4-5 🎨

**Issue #536-#537**

**タスク**:
1. **Next.jsチャットUI** (2日)
2. **ビジネスモデル設計** (1日)

**成果物**:
- Shinyuアプリ完成
- Issue #531クローズ

---

### Week 9: 総仕上げ & 年末レビュー (12/23 - 12/29)

#### Day 1-3 (月火水): BytePlus最終調整 ✨

**Issue #372: A/Bテスト実装**

**タスク**:
1. **Split.io統合** (1日)
2. **3つのテスト設定** (1日)
3. **分析ダッシュボード** (1日)

**成果物**:
- BytePlus完全完成
- デプロイ準備完了

---

#### Day 4-5 (木金): Q4総括 & Q1プランニング 📊

**タスク**:
1. **Q4成果まとめ** (1日)
2. **2026 Q1ロードマップ** (1日)

**KPI確認**:
- [ ] SWE-bench Pro: 完了
- [ ] AgentBench: 完了
- [ ] BytePlus: デプロイ済み
- [ ] Shinyu: ローンチ済み
- [ ] 技術的負債: 大幅削減

---

## 💰 コスト見積もり

### APIコスト

| 項目 | 推定コスト | 備考 |
|------|-----------|------|
| SWE-bench Pro (731件) | $200-500 | Claude API |
| AgentBench (8環境) | $150-300 | マルチターン |
| HAL (9ベンチマーク) | $100-200 | W&B Weave |
| Shinyu RAG | $50-100 | Embeddings |
| **合計** | **$500-1,100** | 2ヶ月 |

### インフラコスト

| 項目 | 月額コスト | 備考 |
|------|-----------|------|
| Modal（評価実行） | $0-50 | 無料枠活用 |
| GCP Cloud Run | $20-50 | Web API |
| Qdrant Cloud | $0 | 無料枠 |
| **合計** | **$20-150/月** | |

---

## 🎯 マイルストーン

### Milestone 1: Week 3終了時（11/17）
- ✅ テスト100%
- ✅ SWE-bench Phase 1-4完了
- ✅ Agent自動実行完成

### Milestone 2: Week 5終了時（12/01）
- ✅ SWE-bench Pro完全完了
- ✅ BytePlus Phase 2-5完了

### Milestone 3: Week 7終了時（12/15）
- ✅ AgentBench評価完了
- ✅ Shinyu RAGパイプライン完成

### Milestone 4: Week 9終了時（12/29）
- ✅ 全ベンチマーク完了
- ✅ 2つの収益化案件ローンチ
- ✅ 技術的負債大幅削減

---

## 🚨 リスク分析と緩和策

### High Risk

**1. Modal環境のセットアップ失敗**
- **確率**: 30%
- **影響**: SWE-bench評価遅延（1週間）
- **緩和策**: Week 1でDocker代替準備

**2. 731インスタンス評価の実行時間超過**
- **確率**: 40%
- **影響**: Week 4延長
- **緩和策**: 並列数増加（5→10並列）

**3. Stripe Business Account審査遅延**
- **確率**: 20%
- **影響**: BytePlus決済機能遅延
- **緩和策**: 早期申請（Week 2）

### Medium Risk

**4. AgentBench 8環境の複雑性**
- **確率**: 50%
- **影響**: Week 6延長
- **緩和策**: 環境ごとに段階的実装

**5. APIコスト超過**
- **確率**: 30%
- **影響**: 予算オーバー
- **緩和策**: コスト監視ダッシュボード + 上限設定

---

## 📊 KPI追跡

### 週次KPI

| Week | テスト合格率 | 完了Issue数 | オープンIssue数 | 目標 |
|------|-------------|------------|----------------|------|
| 1 | 100% | 3 | 39 | ✅ |
| 2 | 100% | 2 | 37 | ✅ |
| 3 | 100% | 2 | 35 | ✅ |
| 4 | 100% | 2 | 33 | ✅ |
| 5 | 100% | 2 | 31 | ✅ |
| 6 | 100% | 2 | 29 | ✅ |
| 7 | 100% | 2 | 27 | ✅ |
| 8 | 100% | 2 | 25 | ✅ |
| 9 | 100% | 2 | 23 | ✅ |

### 累積進捗

```
Week 1: ████░░░░░░░░░░░░░░░░ 10%
Week 2: ████████░░░░░░░░░░░░ 20%
Week 3: ████████████░░░░░░░░ 30%
Week 4: ████████████████░░░░ 40%
Week 5: ████████████████████ 50%
Week 6: ████████████████████ 60%
Week 7: ████████████████████ 75%
Week 8: ████████████████████ 90%
Week 9: ████████████████████ 100%
```

---

## 🎉 期待される成果

### 技術的成果
1. ✅ 世界標準ベンチマーク2つで評価完了
2. ✅ Resolve Rate: 20%以上（SWE-bench Pro）
3. ✅ テスト合格率100%維持
4. ✅ 技術的負債50%削減

### ビジネス成果
1. ✅ BytePlusブートキャンプローンチ
2. ✅ Shinyu占いアプリローンチ
3. ✅ 年間収益見込み: ¥3-6M

### チーム成果
1. ✅ 開発速度20%向上
2. ✅ バグ発生率50%削減
3. ✅ ドキュメント整備完了

---

## 📚 参考資料

- [SWE-bench Pro公式](https://scale.com/leaderboard/swe_bench_pro_public)
- [AgentBench GitHub](https://github.com/THUDM/AgentBench)
- [HAL Leaderboard](https://hal.cs.princeton.edu/)
- [Miyabi実装ロードマップ](./IMPLEMENTATION_ROADMAP.md)

---

**次のアクション**: Week 1 Day 1のBlocker 1修正から開始

```bash
# 今すぐ実行
cd /Users/shunsuke/Dev/miyabi-private
sed -i '' 's/let _agent =/let agent =/g' crates/miyabi-agent-codegen/tests/claudable_integration.rs
cargo test --package miyabi-agent-codegen
```
