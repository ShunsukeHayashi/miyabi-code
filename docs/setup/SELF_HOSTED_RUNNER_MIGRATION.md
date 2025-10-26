# Self-Hosted Runner 移行ガイド

## 📋 概要

GitHub Actionsの課金問題を解決するため、全ワークフローをself-hosted runnerで実行できるように変更しました。

**変更日**: 2025年10月15日
**対象ワークフロー**: 4ワークフロー、合計10ジョブを更新
**Phase**: Phase 1-10完了（Rust CI/CD完全最適化含む）

---

## ✅ 実施した変更

### 1. ワークフローの柔軟な切り替え対応

全てのワークフローで`runs-on`を変数化し、環境変数で切り替え可能にしました。

**Before**:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
```

**After**:
```yaml
jobs:
  build:
    runs-on: ${{ vars.RUNNER_TYPE || 'ubuntu-latest' }}
```

**メリット**:
- GitHub Settings > Variables で`RUNNER_TYPE`を設定するだけで全ワークフローが切り替わる
- デフォルトは`ubuntu-latest`（GitHub-hosted runner）
- `RUNNER_TYPE=self-hosted`に設定すればローカルrunnerで実行

### 2. 更新したワークフロー

#### ✅ integrated-system-ci.yml
- 全6ジョブを更新
- `lint-and-typecheck`, `unit-tests`, `e2e-integrated-tests`, `feedback-loop-validation`, `build`, `integration-report`

#### ✅ rust.yml
- ✅ `check`ジョブを更新（Phase 1-7）
- ✅ `coverage`, `security`, `benchmark`ジョブを更新（Phase 8追加）
- ℹ️ `test`, `build`ジョブはmatrix strategyでクロスプラットフォームテスト維持

#### ✅ security-audit.yml
- `security-scan`ジョブを更新

#### ✅ autonomous-agent.yml
- `execute-agents`ジョブを更新

### 3. テストワークフローの作成

#### `.github/workflows/test-self-hosted.yml`

self-hosted runnerの環境を確認するための専用テストワークフローを作成。

**機能**:
- ✅ システム情報の表示（OS、アーキテクチャ、ホスト名）
- ✅ Runner情報の表示（OS、名前、パス）
- ✅ Node.js / pnpm のチェック
- ✅ Rust / cargo のチェック
- ✅ Git のチェック
- ✅ ディスク空き容量の確認
- ✅ メモリ使用量の確認
- ✅ Composite Actions（setup-pnpm）のテスト

**実行方法**:
```bash
# 手動実行
gh workflow run test-self-hosted.yml

# または、mainブランチにpushすると自動実行
```

---

## 🚀 セットアップ手順

### Step 1: Self-Hosted Runnerのインストール

詳細は [`SELF_HOSTED_RUNNER_SETUP.md`](./SELF_HOSTED_RUNNER_SETUP.md) を参照してください。

**クイックスタート**:
```bash
# 1. GitHubでRunnerを登録
https://github.com/ShunsukeHayashi/miyabi-private/settings/actions/runners

# 2. ローカルでRunnerをセットアップ
cd ~
mkdir actions-runner && cd actions-runner

# Apple Silicon (M1/M2/M3)
curl -o actions-runner-osx-arm64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-arm64-2.311.0.tar.gz
tar xzf ./actions-runner-osx-arm64-2.311.0.tar.gz

# 3. Runnerを設定（GitHubから提供されたトークンを使用）
./config.sh --url https://github.com/ShunsukeHayashi/miyabi-private --token YOUR_TOKEN

# 4. Runnerを起動
./run.sh

# または、サービスとして起動（推奨）
sudo ./svc.sh install
sudo ./svc.sh start
```

### Step 2: 環境変数の設定

GitHubリポジトリの**Settings > Secrets and variables > Actions > Variables**で設定:

**変数名**: `RUNNER_TYPE`
**値**: `self-hosted`

または、macOSでラベルを指定する場合:
**値**: `["self-hosted", "macOS", "ARM64"]`

**設定手順**:
1. https://github.com/ShunsukeHayashi/miyabi-private/settings/variables/actions にアクセス
2. "New repository variable"をクリック
3. Name: `RUNNER_TYPE`
4. Value: `self-hosted`
5. "Add variable"をクリック

### Step 3: テストワークフローの実行

```bash
# テストワークフローを実行して環境を確認
gh workflow run test-self-hosted.yml

# 実行状況を確認
gh run list --workflow=test-self-hosted.yml

# ログを確認
gh run view --log
```

**期待される結果**:
- ✅ Runner情報が表示される
- ✅ Node.js / pnpm が検出される
- ✅ ディスク・メモリ情報が表示される
- ✅ Composite Actionsが正常に動作する

### Step 4: 本番ワークフローの実行

テストが成功したら、通常のワークフローも自動的にself-hosted runnerで実行されます。

```bash
# 例: integrated-system-ciを実行
git add .
git commit -m "test: self-hosted runner"
git push

# ワークフローの実行を確認
gh run list
```

---

## 🔄 GitHub-hosted runnerに戻す方法

self-hosted runnerを使用したくない場合、環境変数を削除するだけです。

**方法1: 環境変数を削除**
1. https://github.com/ShunsukeHayashi/miyabi-private/settings/variables/actions にアクセス
2. `RUNNER_TYPE`変数の削除ボタンをクリック

**方法2: 環境変数を変更**
- `RUNNER_TYPE`の値を`ubuntu-latest`に変更

これで全ワークフローが自動的にGitHub-hosted runnerで実行されるようになります。

---

## 📊 想定される効果

### コスト削減

**Before（GitHub-hosted runner）**:
- 月間実行時間: 2,000分
- 課金: $16/月（超過分）

**After（self-hosted runner）**:
- 月間実行時間: 無制限
- 課金: **$0/月** 🎉

### パフォーマンス

**キャッシュの永続化**:
- GitHub-hosted: 毎回クリーンな環境（キャッシュはGitHub Actions Cacheのみ）
- Self-hosted: ローカルディスクに永続化（より高速）

**期待される改善**:
- 依存関係インストール: **50-70%高速化**（キャッシュヒット時）
- Rustビルド: **30-50%高速化**（target/キャッシュの永続化）

---

## 🔧 トラブルシューティング

### ワークフローがself-hosted runnerで実行されない

**確認事項**:
1. `RUNNER_TYPE`変数が正しく設定されているか
2. Runnerがオンライン状態か（GitHub Settings > Runners で確認）
3. Runnerのラベルが正しいか

### 依存関係が見つからない

**エラー例**:
```
pnpm: command not found
```

**解決方法**:
```bash
# pnpmをグローバルインストール
npm install -g pnpm

# Runnerを再起動
sudo ./svc.sh restart
```

### ディスク容量不足

**確認**:
```bash
# 作業ディレクトリのサイズ確認
du -sh ~/actions-runner/_work

# クリーンアップ
cd ~/actions-runner/_work
rm -rf _temp
rm -rf _actions
```

---

## 📚 関連ドキュメント

- [SELF_HOSTED_RUNNER_SETUP.md](./SELF_HOSTED_RUNNER_SETUP.md) - 詳細なセットアップガイド
- [WORKFLOW_OPTIMIZATION_2025.md](./WORKFLOW_OPTIMIZATION_2025.md) - ワークフロー最適化レポート

---

## ✅ チェックリスト

- [x] Phase 1: セットアップガイド作成
- [x] Phase 2: ワークフローの柔軟な切り替え対応（4ワークフロー）
- [x] Phase 3: テストワークフロー作成
- [x] Phase 4: ドキュメント作成
- [ ] **ユーザー実施**: Runnerのセットアップ
- [ ] **ユーザー実施**: 環境変数の設定
- [ ] **ユーザー実施**: テストワークフローの実行
- [ ] **ユーザー実施**: 本番運用開始

---

**作成者**: Claude Code
**最終更新**: 2025年10月15日
**バージョン**: 1.0
