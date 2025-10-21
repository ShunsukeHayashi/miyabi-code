# SWE-bench Pro 評価環境セットアップガイド

**バージョン**: 1.0.0
**最終更新**: 2025-10-22
**対象**: Issue #398 - Phase 1: SWE-bench Pro公式評価環境の構築

---

## 📋 目次

1. [必須要件](#必須要件)
2. [クイックスタート](#クイックスタート)
3. [詳細セットアップ手順](#詳細セットアップ手順)
4. [動作確認](#動作確認)
5. [トラブルシューティング](#トラブルシューティング)

---

## 必須要件

### システム要件

| 項目 | 要件 | 推奨 |
|------|------|------|
| **OS** | Linux / macOS / WSL2 | Ubuntu 22.04 / macOS 13+ |
| **Docker** | 20.10+ | 24.0+ |
| **Python** | 3.8+ | 3.11+ |
| **Memory** | 16GB+ | 32GB+ |
| **Storage** | 20GB+ | 50GB+ |
| **CPU** | 4 cores+ | 8 cores+ |

### 必須ツール

- [Docker](https://www.docker.com/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/) v2.0+
- [Modal](https://modal.com/) latest
- Python 3.8+
- Git 2.x+

---

## クイックスタート

**最速でセットアップを完了する手順（約30分）**

```bash
# 1. リポジトリのベンチマークディレクトリに移動
cd /path/to/miyabi-private/benchmarks/swe-bench-pro

# 2. 環境検証スクリプト実行
./scripts/verify_environment.sh

# 3. Docker イメージ取得
docker pull scaleai/swebench-pro:latest

# 4. Modal セットアップ
pip install modal
modal setup

# 5. データセットダウンロード
docker-compose run dataset-loader

# 6. 環境起動
docker-compose up -d swebench-pro

# 7. 動作確認
docker exec -it miyabi-swebench-pro bash
```

---

## 詳細セットアップ手順

### Step 1: Docker環境構築

#### 1.1 Docker インストール

**macOS**:
```bash
# Homebrewでインストール
brew install --cask docker

# Docker Desktop起動
open -a Docker
```

**Ubuntu/Debian**:
```bash
# 公式リポジトリからインストール
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# ユーザーをdockerグループに追加
sudo usermod -aG docker $USER
newgrp docker
```

#### 1.2 Docker 動作確認

```bash
# バージョン確認
docker --version
# 期待出力: Docker version 24.0.x

# Docker Compose確認
docker compose version
# 期待出力: Docker Compose version v2.x.x

# テスト実行
docker run --rm hello-world
```

#### 1.3 公式Dockerイメージ取得

```bash
# SWE-bench Pro公式イメージ
docker pull scaleai/swebench-pro:latest

# 取得確認
docker images | grep swebench-pro
```

**期待出力**:
```
scaleai/swebench-pro  latest  xxxxx  X days ago  X.XGB
```

---

### Step 2: Modal環境構築

#### 2.1 Modal インストール

```bash
# pipでインストール
pip install modal

# インストール確認
modal --version
```

#### 2.2 Modal 認証

```bash
# 認証フロー開始
modal setup

# ブラウザでModal認証
# https://modal.com/login にリダイレクトされます
```

**認証フロー**:
1. ブラウザでModal.comにログイン（GitHubアカウント推奨）
2. API トークンを承認
3. ターミナルに戻り、認証完了メッセージを確認

#### 2.3 認証確認

```bash
# 認証情報ファイル確認
cat ~/.modal.toml

# 期待出力（例）:
# [default]
# token_id = "ak-xxxxxxxx"
# token_secret = "as-yyyyyyyy"
```

#### 2.4 Modal動作確認

```bash
# テストアプリ実行
modal run -q python -c "import modal; print('Modal OK')"

# 期待出力: Modal OK
```

---

### Step 3: Python環境構築

#### 3.1 Python バージョン確認

```bash
# Python3 バージョン確認
python3 --version

# 3.8以上であることを確認
# 期待出力: Python 3.11.x
```

#### 3.2 仮想環境作成（推奨）

```bash
# venv作成
python3 -m venv venv-swebench

# 仮想環境有効化
source venv-swebench/bin/activate

# pip更新
pip install --upgrade pip
```

#### 3.3 必須パッケージインストール

```bash
# HuggingFace Datasets
pip install datasets

# HuggingFace Hub
pip install huggingface_hub

# その他依存関係
pip install requests tqdm
```

#### 3.4 パッケージ確認

```bash
# インストール済みパッケージ確認
python3 -c "import datasets; print(f'datasets: {datasets.__version__}')"
python3 -c "import huggingface_hub; print(f'huggingface_hub: {huggingface_hub.__version__}')"
```

---

### Step 4: SWE-bench Pro リポジトリクローン

#### 4.1 公式リポジトリ取得

```bash
# 作業ディレクトリ作成
mkdir -p benchmarks/swe-bench-pro/external
cd benchmarks/swe-bench-pro/external

# 公式リポジトリクローン
git clone https://github.com/scaleapi/SWE-bench_Pro-os.git
cd SWE-bench_Pro-os

# 最新版に更新
git pull origin main
```

#### 4.2 公式スクリプト確認

```bash
# 評価スクリプト確認
ls -la swe_bench_pro_eval.py

# 期待出力:
# -rw-r--r-- ... swe_bench_pro_eval.py
```

---

### Step 5: データセット取得

#### 5.1 自動ダウンロード（Docker経由）

```bash
# プロジェクトルートに戻る
cd /path/to/miyabi-private

# Docker Composeでデータセット取得
docker-compose -f benchmarks/swe-bench-pro/docker/docker-compose.yml run dataset-loader
```

**実行内容**:
- HuggingFaceから公式データセット取得（test split: 731インスタンス）
- JSON形式で保存: `benchmarks/swe-bench-pro/data/swebench_pro_test.json`
- サンプルデータ作成: `benchmarks/swe-bench-pro/data/swebench_pro_sample_10.json`

#### 5.2 データセット確認

```bash
# データファイル確認
ls -lh benchmarks/swe-bench-pro/data/

# 期待出力:
# swebench_pro_test.json       (約50MB)
# swebench_pro_sample_10.json  (約700KB)
```

#### 5.3 統計情報表示

```bash
# インスタンス数確認
python3 -c "import json; data = json.load(open('benchmarks/swe-bench-pro/data/swebench_pro_test.json')); print(f'Total: {len(data)} instances')"

# 期待出力: Total: 731 instances
```

---

### Step 6: Docker Compose環境起動

#### 6.1 環境変数設定

```bash
# .envファイル作成
cat > benchmarks/swe-bench-pro/.env << EOF
# Modal認証情報（~/.modal.tomlから取得）
MODAL_TOKEN_ID=your_token_id_here
MODAL_TOKEN_SECRET=your_token_secret_here
EOF
```

**重要**: `.env`ファイルは`.gitignore`に追加してください。

#### 6.2 Docker Compose起動

```bash
# 評価環境起動
cd benchmarks/swe-bench-pro
docker-compose up -d swebench-pro

# 起動確認
docker ps | grep miyabi-swebench-pro
```

#### 6.3 コンテナ接続

```bash
# コンテナに入る
docker exec -it miyabi-swebench-pro bash

# コンテナ内での作業
cd /workspace
ls -la
```

---

## 動作確認

### テスト1: gold patchで評価実行

**目的**: 公式評価スクリプトが正常に動作することを確認

```bash
# コンテナ内で実行
cd /workspace/external/SWE-bench_Pro-os

# gold patchで評価（100%の解決率が期待される）
python swe_bench_pro_eval.py \
  --raw_sample_path=external_hf_v2.csv \
  --patch_path=gold_patches.json \
  --output_dir=/workspace/results/gold_test/ \
  --num_workers=10
```

**期待結果**:
```
Evaluation complete!
Resolve Rate: 100.00% (X/X instances)
```

### テスト2: サンプルデータで評価

```bash
# サンプル10件で評価
# （Miyabiパッチ生成後に実行）
python swe_bench_pro_eval.py \
  --raw_sample_path=/workspace/data/swebench_pro_sample_10.json \
  --patch_path=/workspace/results/sample_patches.json \
  --output_dir=/workspace/results/sample_test/ \
  --num_workers=5
```

### テスト3: 環境検証スクリプト

```bash
# ホストマシンで実行
cd /path/to/miyabi-private
./benchmarks/swe-bench-pro/scripts/verify_environment.sh
```

**期待出力**:
```
🎉 すべての検証に合格しました！

次のステップ:
  1. Docker イメージ取得: docker pull scaleai/swebench-pro:latest
  2. データセットダウンロード: docker-compose run dataset-loader
  3. 環境起動: docker-compose up -d swebench-pro
```

---

## トラブルシューティング

### 問題1: Dockerイメージが取得できない

**症状**:
```
Error response from daemon: manifest for scaleai/swebench-pro:latest not found
```

**解決策**:
```bash
# Docker Hubログイン（必要に応じて）
docker login

# イメージを再取得
docker pull scaleai/swebench-pro:latest

# または、代替イメージ使用
docker pull python:3.11-slim
```

---

### 問題2: Modal認証が失敗する

**症状**:
```
modal.exception.AuthenticationError: Invalid token
```

**解決策**:
```bash
# 既存の認証情報削除
rm ~/.modal.toml

# 再認証
modal setup

# 認証情報確認
cat ~/.modal.toml
```

---

### 問題3: データセットダウンロードが遅い

**症状**: HuggingFaceからのダウンロードが数時間かかる

**解決策**:
```bash
# HuggingFace CLIでキャッシュ設定
export HF_DATASETS_CACHE="/path/to/large/storage/hf_cache"

# 並列ダウンロード有効化
export HF_HUB_ENABLE_HF_TRANSFER=1

# 再試行
docker-compose run dataset-loader
```

---

### 問題4: メモリ不足エラー

**症状**:
```
docker: Error response from daemon: OOM killed
```

**解決策**:
```bash
# Docker Desktop設定でメモリ上限を増やす（macOS）
# Settings → Resources → Memory: 16GB以上

# または、docker-compose.ymlのメモリ制限を調整
mem_limit: 8g  # 16gから8gに削減
```

---

### 問題5: ストレージ不足

**症状**:
```
no space left on device
```

**解決策**:
```bash
# Dockerの未使用データ削除
docker system prune -a

# 古いWorktreeを削除
rm -rf .worktrees/*

# ディスク容量確認
df -h
```

---

## 成果物チェックリスト

環境構築完了後、以下のファイルが存在することを確認してください：

### ディレクトリ構造

```
benchmarks/swe-bench-pro/
├── docker/
│   ├── docker-compose.yml             ✅
│   └── .env                           ✅（.gitignore追加済み）
├── scripts/
│   ├── download_dataset.py            ✅
│   └── verify_environment.sh          ✅
├── configs/
├── data/
│   ├── swebench_pro_test.json         ✅（731インスタンス）
│   └── swebench_pro_sample_10.json    ✅（10インスタンス）
├── results/
│   └── gold_test/                     ✅（gold patch評価結果）
└── external/
    └── SWE-bench_Pro-os/              ✅（公式リポジトリ）
```

### ドキュメント

```
docs/benchmarks/
└── EVALUATION_ENVIRONMENT_SETUP.md    ✅（本ファイル）
```

---

## 次のステップ

環境構築完了後は、Issue #399（Phase 2: データセット統合）に進んでください。

### Phase 2: データセット統合
- Rust型定義作成（`crates/miyabi-types/src/benchmark.rs`）
- データローダー実装（`crates/miyabi-benchmark/src/dataset.rs`）
- 単体テスト作成

### Phase 3: 評価ラッパー実装
- `miyabi-benchmark` crate作成
- `SWEBenchProEvaluator` 実装
- パッチフォーマット検証

---

## 参考リソース

### 公式ドキュメント

- **SWE-bench Pro公式**: https://github.com/scaleapi/SWE-bench_Pro-os
- **HuggingFaceデータセット**: https://huggingface.co/datasets/ScaleAI/SWE-bench_Pro
- **Modal公式ドキュメント**: https://modal.com/docs
- **Docker公式ドキュメント**: https://docs.docker.com/

### 関連Issue

- **Issue #396**: SWE-bench Pro評価実装（親Issue）
- **Issue #398**: Phase 1: 環境構築（本Issue）
- **Issue #399**: Phase 2: データセット統合
- **Issue #400**: Phase 3: 評価ラッパー実装

---

**環境構築完了おめでとうございます！🎉**
