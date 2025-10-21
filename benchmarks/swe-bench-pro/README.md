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

## 🚀 クイックスタート

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
