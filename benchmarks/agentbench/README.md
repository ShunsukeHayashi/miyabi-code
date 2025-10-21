# AgentBench 評価環境

**目的**: Miyabiを汎用エージェントベンチマーク（AgentBench FC）で評価

**関連Issue**: [#397](https://github.com/ShunsukeHayashi/miyabi-private/issues/397), [#404](https://github.com/ShunsukeHayashi/miyabi-private/issues/404)

---

## 📁 ディレクトリ構成

```
benchmarks/agentbench/
├── AgentBench/              # 公式リポジトリ（クローン済み）
│   ├── src/                 # ソースコード
│   ├── data/                # データセット
│   ├── configs/             # 設定ファイル
│   ├── extra/               # Docker Compose設定
│   └── requirements.txt     # Python依存関係
└── README.md               # 本ファイル
```

---

## 🌐 AgentBench FC 概要

**バージョン**: Function Calling版（2025.10.10リリース）

**統合**: [AgentRL](https://github.com/THUDM/AgentRL) - マルチタスク・マルチターンLLM Agent RLフレームワーク

### 5つの評価環境（Dockerサポート）

| 環境 | コード | 説明 | RAM要件 |
|------|--------|------|---------|
| **ALFWorld** | AF | 家庭環境タスク | ~2GB |
| **DBBench** | DB | SQLクエリとDB操作 | ~1GB |
| **KnowledgeGraph** | KG | グラフDBクエリ | ~2GB |
| **OS Interaction** | OS | Linux環境での操作 | ~1GB |
| **WebShop** | WS | ECサイトでの購買 | ~16GB ⚠️ |

**合計**: 約22GB RAM（全環境同時実行時）

---

## 🚀 クイックスタート（TODO）

**注意**: 本格的なセットアップはIssue #404で実施予定

### Step 1: 必須Dockerイメージ準備

```bash
cd benchmarks/agentbench/AgentBench

# DBBench用
docker pull mysql:8

# OS Interaction用（ビルド必要）
docker build -t local-os/default -f ./data/os_interaction/res/dockerfiles/default data/os_interaction/res/dockerfiles
docker build -t local-os/packages -f ./data/os_interaction/res/dockerfiles/packages data/os_interaction/res/dockerfiles
docker build -t local-os/ubuntu -f ./data/os_interaction/res/dockerfiles/ubuntu data/os_interaction/res/dockerfiles
```

### Step 2: Freebaseデータ準備（KG環境用）

```bash
# Freebaseデータダウンロード（約XGB）
# https://github.com/dki-lab/Freebase-Setup

# データ配置
# ./virtuoso_db/virtuoso.db に配置
```

### Step 3: Docker Compose起動

```bash
docker compose -f extra/docker-compose.yml up
```

**起動されるサービス**:
- AgentRL Controller
- alfworld task worker (x1)
- dbbench task worker (x1)
- knowledgegraph task worker (x1)
- os_interaction task worker (x1)
- webshop task worker (x1)
- freebase server（KG用）
- Redis server（コンテナ割り当て用）

---

## ⚠️ 重要な注意事項

### リソース要件

- **WebShop環境**: 16GB RAM必須
- **ALFWorld**: メモリリーク問題あり（定期的なworker再起動推奨）
- **合計推奨RAM**: 32GB以上

### 既知の問題

1. **ALFWorld メモリリーク**: タスクworker再起動まで継続
2. **WebShop 高メモリ消費**: 16GB RAM必要

---

## 📊 ベンチマーク結果（参考）

AgentBench FC リーダーボード: https://docs.google.com/spreadsheets/d/e/2PACX-1vRR3Wl7wsCgHpwUw1_eUXW_fptAPLL3FkhnW_rua0O1Ji_GIVrpTjY5LaKAhwO-WeARjnY_KNw0SYNJ/pubhtml

**結果提出先**: agentbench_fc@googlegroups.com

---

## 📚 ドキュメント

- **公式リポジトリ**: https://github.com/THUDM/AgentBench
- **AgentRL**: https://github.com/THUDM/AgentRL
- **論文**: https://arxiv.org/abs/2308.03688
- **Website**: https://llmbench.ai

---

## 🎯 次のステップ（Issue #404）

1. Python依存関係インストール
2. 必須Dockerイメージビルド
3. Freebaseデータ準備
4. Docker Compose環境起動
5. サンプルタスクでの動作確認
6. Miyabi統合

---

## 📝 ステータス

- ✅ リポジトリクローン完了（2025-10-22）
- ⏳ 環境セットアップ（Issue #404で実施予定）
- ⏳ Miyabi統合（Issue #404で実施予定）
- ⏳ 評価実行（Issue #404で実施予定）

---

**最終更新**: 2025-10-22
**関連Issue**: #397（親）, #404（本Issue）
