# 🖥️ Mac mini Self-hosted Runners 戦略

## メリット

1. **完全無料**: Self-hosted runners は無料枠にカウントされない
2. **高速実行**: ローカルネットワークでの実行（キャッシュ共有可能）
3. **リソース活用**: Mac mini の余剰リソースを有効活用
4. **並列実行**: 2台のMac miniで並列実行可能

## アーキテクチャ

```
┌─────────────────────────────────────────┐
│ GitHub Actions (クラウド)                │
│ - Issue/PR トリガー                      │
│ - ワークフロー管理                        │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌───────▼────────┐
│ Mac mini #1    │  │ Mac mini #2    │
│ (192.168.3.27) │  │ (192.168.3.26) │
│                │  │                │
│ Runner: macmini│  │ Runner: macmini2│
│ Labels:        │  │ Labels:        │
│ - self-hosted  │  │ - self-hosted  │
│ - macOS        │  │ - macOS        │
│ - rust         │  │ - rust         │
│ - docker       │  │ - docker       │
└────────────────┘  └────────────────┘
```

## 移行すべきワークフロー（優先順位順）

### 🔴 最優先（高頻度・高コスト）

1. **RefresherAgent** (1時間ごと)
   - 現在: GitHub-hosted (1,440分/月)
   - 移行後: Self-hosted (0分消費)
   - 節約: **1,440分/月**

2. **Docker Build & Publish**
   - 現在: GitHub-hosted (変動)
   - 移行後: Self-hosted + Docker cache共有
   - 節約: **300-500分/月**

3. **Deploy Pages** (6時間ごと)
   - 現在: GitHub-hosted (120分/月)
   - 移行後: Self-hosted
   - 節約: **120分/月**

### 🟡 次優先（長時間実行）

4. **Benchmark SWE-bench Pro**
   - 長時間実行（10-30分）
   - Self-hosted で高速化可能

5. **CodeQL Security Scan**
   - 長時間実行（5-15分）
   - Self-hosted で定期実行可能

6. **Rust CI** (ビルド・テスト)
   - ビルドキャッシュをローカル共有
   - 高速化 + コスト削減

### 📊 推定効果

| 項目 | GitHub-hosted | Self-hosted | 節約 |
|------|--------------|-------------|------|
| RefresherAgent | 1,440分/月 | 0分 | **1,440分** |
| Docker | 300分/月 | 0分 | **300分** |
| Deploy Pages | 120分/月 | 0分 | **120分** |
| その他 | 200分/月 | 0分 | **200分** |
| **合計** | **2,060分/月** | **0分** | **2,060分/月** |

**結果**: GitHub Actions 無料枠を **100%節約**

## セットアップ手順

### Step 1: Runner登録トークン取得

```bash
# 組織レベルでRunnerを追加
# https://github.com/organizations/customer-cloud/settings/actions/runners/new
```

### Step 2: Mac mini #1 でRunner起動

```bash
# SSH接続
ssh macmini  # 192.168.3.27

# Runnerダウンロード
mkdir actions-runner && cd actions-runner
curl -o actions-runner-osx-arm64-2.321.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-osx-arm64-2.321.0.tar.gz
tar xzf actions-runner-osx-arm64-2.321.0.tar.gz

# Runner設定
./config.sh --url https://github.com/customer-cloud \
  --token YOUR_REGISTRATION_TOKEN \
  --name macmini \
  --labels self-hosted,macOS,arm64,rust,docker

# サービスとして起動（自動起動）
./svc.sh install
./svc.sh start
```

### Step 3: Mac mini #2 でRunner起動

```bash
# SSH接続
ssh macmini2  # 192.168.3.26

# 同様の手順でRunnerセットアップ
# ラベル: macmini2
```

### Step 4: ワークフロー修正

```yaml
# Before
jobs:
  build:
    runs-on: ubuntu-latest  # GitHub-hosted

# After
jobs:
  build:
    runs-on: self-hosted  # Self-hosted (Mac mini)
```

または、特定のRunner指定：

```yaml
jobs:
  build:
    runs-on: [self-hosted, macOS, rust]  # Mac mini with Rust
```

## 注意事項

1. **セキュリティ**: Public リポジトリでは使用禁止（悪意のあるコード実行リスク）
2. **メンテナンス**: Runnerのアップデート・監視が必要
3. **ネットワーク**: Mac miniが24時間稼働している必要あり
4. **依存関係**: 各Mac miniに必要なツール（Rust, Docker等）をインストール

## 監視

```bash
# Runner状態確認
./run.sh  # フォアグラウンド実行（テスト用）

# サービス状態確認
./svc.sh status

# ログ確認
tail -f _diag/Runner_*.log
```


---

## 🎮 Windows PC (GPU) の活用

### スペック
- GPU: NVIDIA GeForce RTX 4070 / RTX 4060
- 用途: GPU加速ワークロード

### 最適なワークフロー

1. **AI/ML ベンチマーク**
   - SWE-bench Pro（AIモデル評価）
   - Claude Code性能テスト
   - GPU加速でベンチマーク時間を大幅短縮

2. **Windowsクロスプラットフォームビルド**
   - Rust Windows ビルド
   - Windows固有のテスト実行
   - クロスプラットフォーム検証

3. **Docker Build（GPU加速）**
   - NVIDIA Container Toolkit統合
   - GPU対応Dockerイメージのビルド

### セットアップ（Windows）

```powershell
# PowerShell（管理者権限）

# Runnerダウンロード
mkdir actions-runner; cd actions-runner
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-win-x64-2.321.0.zip -OutFile actions-runner-win-x64-2.321.0.zip
Expand-Archive -Path actions-runner-win-x64-2.321.0.zip -DestinationPath .

# Runner設定
.\config.cmd --url https://github.com/customer-cloud `
  --token YOUR_REGISTRATION_TOKEN `
  --name windows-gpu `
  --labels self-hosted,Windows,X64,gpu,rtx4070,docker

# サービスとして起動
.\svc.cmd install
.\svc.cmd start
```

### GPU活用ワークフロー例

```yaml
name: GPU Benchmark

on:
  schedule:
    - cron: '0 0 * * 0'  # 週1回
  workflow_dispatch:

jobs:
  benchmark:
    runs-on: [self-hosted, Windows, gpu]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: GPU情報表示
        run: nvidia-smi
      
      - name: SWE-bench Pro実行（GPU加速）
        run: |
          cargo run --release --bin miyabi-benchmark -- \
            --benchmark swe-bench-pro \
            --use-gpu
```

## 📊 3台構成での最終推奨構成

| Runner | 用途 | 移行ワークフロー |
|--------|------|-----------------|
| **Mac mini #1** | 定期実行・軽量ビルド | RefresherAgent, Deploy Pages, CI Status |
| **Mac mini #2** | Docker Build, Rust CI | Docker Build/Publish, Rust CI |
| **Windows GPU** | ベンチマーク, Windows Build | SWE-bench Pro, CodeQL, Windows Tests |

### コスト削減シミュレーション（3台構成）

| 項目 | GitHub-hosted | 3台Self-hosted | 節約 |
|------|--------------|----------------|------|
| RefresherAgent (Mac mini #1) | 1,440分 | 0分 | **1,440分** |
| Docker (Mac mini #2) | 500分 | 0分 | **500分** |
| Benchmark (Windows GPU) | 120分 | 0分 | **120分** |
| その他 (Mac mini #1/#2) | 300分 | 0分 | **300分** |
| **合計** | **2,360分/月** | **0分** | **2,360分/月** |

**月額節約**: $0（無料枠内） → 将来的な拡張時に節約効果大

