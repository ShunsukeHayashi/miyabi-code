# ベンチマーク実装チェックリスト

**目的**: 世界標準規格・ベンチマーク実装時の必須チェック項目

**適用対象**: SWE-bench Pro, AgentBench, HAL, Galileo等の公式ベンチマーク

---

## ⚠️ 実装開始前の必須チェック（STOP & CHECK）

### Phase 1: 公式プロトコル調査（30分確保）

- [ ] **公式リポジトリの確認**
  - GitHub URLを確認: `https://github.com/[org]/[repo]`
  - README.mdを熟読
  - `docs/` ディレクトリ確認
  - `examples/` ディレクトリ確認

- [ ] **公式評価ハーネスの存在確認**
  - 評価スクリプトの有無: `run_evaluation.py`, `evaluate.sh`等
  - 標準コマンドの確認: `python -m [module].harness`
  - 公式CLIツールの有無
  - **存在する場合は必ず使用（独自実装禁止）**

- [ ] **Docker要件の確認**
  - `Dockerfile`の有無
  - `docker-compose.yml`の有無
  - Docker必須かどうか
  - **Docker必須の場合は必ず使用（ローカル実行禁止）**

- [ ] **データセット形式の確認**
  - 入力形式: JSON, JSONL, CSV等
  - 出力形式: Predictions, Results等
  - **公式形式に完全準拠（独自形式禁止）**

- [ ] **依存関係の確認**
  - `requirements.txt`, `package.json`, `Cargo.toml`
  - Python version, Node version, Rust version
  - システム要件: RAM, Storage, CPU
  - **⚠️ 外部コードの取り込み**: Context7使用必須（コピー&ペースト禁止）

#### 🔍 Context7の使用（外部依存の取り込み）⭐NEW

**Context7とは**: Model Context Protocol (MCP) サーバー - 20,000以上のライブラリの最新ドキュメントを動的取得

**適用ケース（必須）**:
- ✅ 公式ベンチマークハーネスのコード参照
- ✅ 評価スクリプトの実装パターン確認
- ✅ Docker設定ファイルの標準パターン取得
- ✅ データセット形式の最新仕様確認
- ✅ 外部ライブラリのAPI仕様確認

**使用方法**:
```bash
# Claude Codeでの指示例
Use context7 to get the latest SWE-bench Pro evaluation harness code

Use context7 to get the latest AgentBench Docker setup

Use context7 to get the latest HAL dataset format specification

Use context7 to get the latest Galileo benchmark protocol
```

**禁止事項**:
- ❌ Context7なしで外部コードを再実装（古いAPIリスク）
- ❌ 公式ハーネスのコードを直接コピー&ペースト（ライセンス違反リスク）
- ❌ 手動でStack Overflowから古いコードを検索（再現性欠如リスク）

**セットアップ（初回のみ）**:
```bash
# MCPサーバー追加
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key YOUR_API_KEY

# API Key取得: https://context7.com/ でアカウント作成（無料）
```

**トラブルシューティング**:
- Context7が見つからない: `claude mcp list` で確認、再インストール
- API Keyエラー: `~/.config/claude/claude_desktop_config.json` を確認

**詳細**: [CLAUDE.md](../../CLAUDE.md) の「## 📚 外部依存関係の取り扱い - Context7の使用」セクションを参照

### Phase 2: ユーザー確認（必須）

- [ ] **実装方針の確認**
  ```
  ユーザー様へ確認:

  調査結果:
  - 公式ハーネス: [存在する/存在しない]
  - Docker要件: [必須/任意/不要]
  - 標準コマンド: [コマンド例]

  実装方針:
  Option 1: 公式ハーネス使用（推奨）
  Option 2: Docker統合
  Option 3: 独自実装（非推奨、要確認）

  どの方針で進めますか？
  ```

- [ ] **リソース要件の確認**
  - 必要なRAM/Storage/CPU
  - 実行時間の見積もり
  - コストの見積もり

### Phase 3: 実装設計（チェックポイント）

- [ ] **公式プロトコル準拠**
  - 公式ハーネスを使用する場合: ✅
  - Docker環境を使用する場合: ✅
  - 独自実装の場合: ❌（原則禁止）

- [ ] **入出力形式の準拠**
  - 入力: 公式形式に完全準拠
  - 出力: 公式形式に完全準拠
  - 独自形式は追加のみ（置き換え禁止）

- [ ] **評価基準の準拠**
  - メトリクス定義: 公式定義に完全準拠
  - 計算方法: 公式実装に完全準拠
  - 独自メトリクスは追加のみ

### Phase 4: 実装中のチェック

- [ ] **公式ドキュメント参照**
  - 実装中に不明点があれば必ず公式ドキュメント確認
  - Stack Overflow等ではなく公式情報を優先

- [ ] **テストケース実行**
  - 公式テストケースが存在する場合は必ず実行
  - `gold` predictions等でバリデーション

- [ ] **ログ・デバッグ情報**
  - 公式ハーネスと同じログ形式
  - デバッグ情報の互換性

### Phase 5: 実装後の検証

- [ ] **公式ハーネスとの比較**
  - 同じデータセットで結果比較
  - 差異があれば原因調査

- [ ] **再現性の確認**
  - 同じ入力で同じ出力
  - 環境依存の排除

- [ ] **ドキュメント作成**
  - 公式プロトコルとの対応関係を明記
  - 差異があれば理由を明記
  - 使用方法を明記

---

## 🚨 絶対禁止事項

### ❌ ショートカット禁止

- ❌ 「独自実装の方が速い」→ 禁止
- ❌ 「公式ハーネスは面倒」→ 禁止
- ❌ 「自分で作った方が良い」→ 禁止

### ❌ 勝手な判断禁止

- ❌ ユーザー確認なしで独自実装
- ❌ 公式プロトコル無視
- ❌ 標準形式の変更

### ❌ 虚偽表示禁止

- ❌ 「世界標準規格」と嘘をつく
- ❌ 「公式準拠」と嘘をつく
- ❌ 独自実装を標準実装と偽る

---

## ✅ 正しい実装パターン

### Pattern 1: 公式ハーネス使用（最推奨）

```bash
# 1. 公式リポジトリクローン
git clone https://github.com/[org]/[repo]

# 2. Miyabi側でPredictions生成
cargo run --bin miyabi-benchmark -- generate-predictions \
    --dataset data.json \
    --output predictions.jsonl

# 3. 公式ハーネスで評価
python -m [module].harness.run_evaluation \
    --predictions_path predictions.jsonl \
    --run_id miyabi-v1.0.0
```

### Pattern 2: Docker統合（推奨）

```yaml
# docker-compose.yml
services:
  benchmark-evaluator:
    image: [official-image]
    volumes:
      - ./predictions:/predictions
      - ./results:/results
    command: [official-command]
```

### Pattern 3: 独自実装（最終手段・要確認）

**条件**:
- 公式ハーネスが存在しない
- Docker環境が利用不可
- ユーザー様の明示的な承認

**必須要件**:
- 公式ドキュメント完全準拠
- 入出力形式完全準拠
- 評価基準完全準拠
- 再現性検証済み

---

## 📋 実装完了チェックリスト

- [ ] 公式プロトコルに完全準拠
- [ ] Docker要件を満たす（必須の場合）
- [ ] 公式ハーネスを使用（存在する場合）
- [ ] 入出力形式が公式準拠
- [ ] 評価基準が公式準拠
- [ ] 再現性を確認
- [ ] ドキュメント作成完了
- [ ] ユーザー様の承認取得

---

## 🔄 過去の失敗例（学習用）

### Case 1: SWE-bench Pro独自実装事件（2025-10-22）

**何をしたか**:
- 公式ハーネス無視して独自実装
- ローカル環境で直接テスト実行
- Docker要件無視

**なぜダメか**:
- 再現性ゼロ
- 比較不可能
- 公式リーダーボード提出不可
- 世界標準規格ではない

**正しい方法**:
- 公式ハーネス使用必須
- Docker環境必須
- 標準プロトコル厳守

---

**最終更新**: 2025-10-22
**次回更新**: 新たな失敗例が発生した場合、即座に追加

---

## 使い方

### 実装開始時

```bash
# このチェックリストを開く
cat .claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md

# Phase 1-5を順番に実行
# 各チェックボックスを確認
```

### 実装中

```bash
# 迷ったらこのファイルを再確認
# 「絶対禁止事項」を再確認
```

### 実装完了時

```bash
# 「実装完了チェックリスト」を全て確認
# 1つでも✗があれば完了とみなさない
```
