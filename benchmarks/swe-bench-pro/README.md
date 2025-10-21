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
