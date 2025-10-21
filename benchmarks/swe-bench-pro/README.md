# SWE-bench Pro 評価環境

**目的**: Miyabiを世界標準ベンチマーク（SWE-bench Pro）で評価

**関連Issue**: [#396](https://github.com/ShunsukeHayashi/miyabi-private/issues/396), [#398](https://github.com/ShunsukeHayashi/miyabi-private/issues/398)

---

## 📁 ディレクトリ構成

```
benchmarks/swe-bench-pro/
├── docker/
│   ├── docker-compose.yml      # Docker Compose設定
│   └── .env                    # 環境変数（.gitignore）
├── scripts/
│   ├── download_dataset.py     # データセットダウンロード
│   └── verify_environment.sh   # 環境検証スクリプト
├── configs/                    # 設定ファイル
├── data/                       # データセット（.gitignore）
├── results/                    # 評価結果（.gitignore）
└── external/                   # 外部リポジトリ（.gitignore）
```

---

## 🚀 クイックスタート（ローカルテスト）

**最速・最簡単な方法**: 自動テストスクリプト

```bash
# 1. ローカルテストスクリプト実行（5インスタンス、並列度1）
cd benchmarks/swe-bench-pro
./scripts/run-local-test.sh 5 1

# 所要時間: 約50分〜1時間（環境により変動）
```

このスクリプトが自動的に：
- ✅ 環境チェック（Python, Docker, Rust）
- ✅ SWE-bench公式ハーネスインストール確認
- ✅ データセットダウンロード確認
- ✅ Miyabiビルド
- ✅ Predictions生成（プレースホルダー）
- ✅ 公式ハーネス実行
- ✅ 結果表示

### 手動セットアップ（オプション）

```bash
# 1. 環境検証
./scripts/verify_environment.sh

# 2. Docker イメージ取得
docker pull scaleai/swebench-pro:latest

# 3. Modal セットアップ
pip install modal
modal setup

# 4. データセットダウンロード
docker-compose -f docker/docker-compose.yml run dataset-loader

# 5. 環境起動
docker-compose -f docker/docker-compose.yml up -d swebench-pro

# 6. 動作確認
docker exec -it miyabi-swebench-pro bash
```

---

## 🎯 公式ハーネス統合（推奨）

**✅ Issue #400完了**: Miyabiは公式SWE-bench評価ハーネスと完全統合されました。

### 使用方法

#### 1. 公式ハーネスのインストール

```bash
# SWE-bench公式リポジトリをクローン
git clone https://github.com/princeton-nlp/SWE-bench.git
cd SWE-bench

# 依存関係インストール
pip install -e .

# Docker要件確認
# - ストレージ: 120GB以上
# - RAM: 16GB以上
# - CPU: 8コア以上
```

#### 2. Rustから公式ハーネスを使用

```rust
use miyabi_benchmark::evaluator::SWEBenchProEvaluator;
use miyabi_benchmark::dataset::SWEBenchDataset;
use std::path::Path;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 1. データセット読み込み
    let dataset = SWEBenchDataset::from_json(Path::new("data/swebench_pro.json"))?;
    let instances = dataset.sample(10); // 10インスタンスでテスト

    // 2. Evaluator作成
    let evaluator = SWEBenchProEvaluator::new()?;

    // 3. 公式ハーネスで評価（推奨）
    let results_dir = evaluator
        .evaluate_with_official_harness(&instances, Path::new("output"))
        .await?;

    println!("Results saved to: {:?}", results_dir);
    Ok(())
}
```

#### 3. 生成されるファイル

```
output/
├── predictions.jsonl        # Predictions JSONL（公式形式）
evaluation_results/
└── miyabi-v1.0.0-20251022-143000/
    ├── results.json         # 評価結果
    ├── logs/
    │   ├── build_images/    # Dockerビルドログ
    │   └── run_evaluation/  # 評価実行ログ
    └── test_output/         # テスト出力
```

### Predictions JSONL形式

各行が以下のJSON形式：

```json
{
  "instance_id": "django__django-12345",
  "model_name_or_path": "miyabi-v1.0.0",
  "model_patch": "diff --git a/django/auth.py b/django/auth.py\nindex abc123..def456 100644\n--- a/django/auth.py\n+++ b/django/auth.py\n@@ -10,6 +10,7 @@\n class User:\n+    # Fix authentication bug\n     pass"
}
```

### コマンドライン使用

```bash
# Predictions JSONL生成のみ
cargo run --bin miyabi-benchmark -- generate-predictions \
    --dataset data/swebench_pro.json \
    --output predictions.jsonl \
    --limit 10

# 公式ハーネスで評価
python -m swebench.harness.run_evaluation \
    --predictions_path predictions.jsonl \
    --max_workers 4 \
    --run_id miyabi-test-run

# 結果確認
cat evaluation_results/miyabi-test-run/results.json
```

---

## 🔄 CI/CD統合（自動ベンチマーク実行）

**✅ Issue #407完了**: GitHub Actionsで自動ベンチマーク実行が可能になりました。

### GitHub Actions ワークフロー

`.github/workflows/benchmark-swe-bench-pro.yml` - 公式ハーネスを使用した自動評価

**トリガー**:
1. **手動実行** (workflow_dispatch)
   - インスタンス数、並列度、Run IDをカスタマイズ可能
2. **スケジュール実行** (cron)
   - 毎週日曜日 00:00 UTC に自動実行

### 手動実行方法

#### GitHub UI経由

1. GitHubリポジトリの「Actions」タブを開く
2. 左サイドバーから「SWE-bench Pro Benchmark」を選択
3. 「Run workflow」をクリック
4. パラメータを設定：
   - **instance_limit**: 評価インスタンス数（デフォルト: 10）
   - **run_id**: カスタムRun ID（オプション）
   - **max_workers**: 並列Docker数（デフォルト: 2）
5. 「Run workflow」実行

#### gh CLI経由

```bash
# 10インスタンスで評価（デフォルト）
gh workflow run benchmark-swe-bench-pro.yml

# カスタムパラメータで実行
gh workflow run benchmark-swe-bench-pro.yml \
  -f instance_limit=50 \
  -f max_workers=4 \
  -f run_id=miyabi-production-v1.0.0

# 実行状況確認
gh run list --workflow=benchmark-swe-bench-pro.yml

# ログ確認
gh run view --log
```

### 生成されるアーティファクト

ワークフロー実行後、以下のアーティファクトがダウンロード可能：

1. **predictions-{run_id}** (90日保存)
   - `predictions.jsonl` - Miyabi生成のPredictions

2. **evaluation-results-{run_id}** (90日保存)
   - `evaluation_results/` - 公式ハーネスの評価結果
   - `evaluation.log` - 実行ログ

3. **evaluation-logs-{run_id}** (30日保存)
   - `logs/build_images/` - Dockerビルドログ
   - `logs/run_evaluation/` - 評価実行ログ

4. **benchmark-report** (90日保存)
   - `BENCHMARK_REPORT.md` - Markdownレポート

### ワークフロー詳細

```yaml
jobs:
  benchmark:
    # 1. 環境セットアップ
    - Checkout code
    - Free up disk space (120GB確保)
    - Setup Rust + Python
    - Install SWE-bench harness
    - Setup Docker

    # 2. データ準備
    - Download SWE-bench Pro dataset
    - Build Miyabi benchmark CLI

    # 3. 評価実行
    - Generate predictions (Miyabi)
    - Run official harness
    - Collect results

    # 4. 結果保存
    - Upload artifacts
    - Generate summary report

  report:
    # Markdown レポート生成
    - Download results
    - Generate report
    - Upload report artifact
```

### リソース要件

- **実行時間**: 最大8時間（480分タイムアウト）
- **ストレージ**: 120GB（SWE-bench Dockerイメージ）
- **RAM**: 16GB以上推奨
- **CPU**: 8コア推奨

### 注意事項

⚠️ **GitHub Actions無料枠**:
- Public repository: 無制限
- Private repository: 月2,000分まで
- ストレージ: 500MB（アーティファクト）

⚠️ **長時間実行**:
- 8時間タイムアウト設定済み
- 大規模評価（100+インスタンス）は複数回に分割推奨

---

## 📚 ドキュメント

詳細なセットアップ手順は以下を参照：

- **[環境セットアップガイド](../../docs/benchmarks/EVALUATION_ENVIRONMENT_SETUP.md)** - 完全なセットアップ手順
- **[親Issue #396](https://github.com/ShunsukeHayashi/miyabi-private/issues/396)** - SWE-bench Pro評価実装の全体像
- **[本Issue #398](https://github.com/ShunsukeHayashi/miyabi-private/issues/398)** - Phase 1: 環境構築

---

## 🎯 成功基準

- ✅ Docker環境が正常に動作
- ✅ Modal認証が完了
- ✅ 731インスタンスのデータセットをダウンロード
- ✅ 公式評価スクリプトがエラーなく実行
- ✅ gold patchで100%の解決率を達成

---

## 🔧 トラブルシューティング

問題が発生した場合は、[環境セットアップガイド](../../docs/benchmarks/EVALUATION_ENVIRONMENT_SETUP.md#トラブルシューティング)のトラブルシューティングセクションを参照してください。

---

**最終更新**: 2025-10-22
