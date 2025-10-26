# Self-Hosted Runner セットアップガイド

## 📋 概要

GitHub Actionsの課金を回避するため、ローカルマシン（MacBook）でself-hosted runnerを実行する手順です。

**メリット**:
- ✅ GitHub Actions実行時間の課金なし（完全無料）
- ✅ ローカルマシンのリソースを活用
- ✅ キャッシュの永続化（ビルド高速化）
- ✅ プライベートな環境での実行

**デメリット**:
- ⚠️ マシンが起動している必要がある
- ⚠️ セキュリティリスク（publicリポジトリでは非推奨）
- ⚠️ ネットワーク接続が必要

---

## 🚀 セットアップ手順

### Step 1: GitHubでRunnerを登録

1. **GitHubリポジトリのSettings**にアクセス:
   ```
   https://github.com/ShunsukeHayashi/miyabi-private/settings/actions/runners
   ```

2. **"New self-hosted runner"**ボタンをクリック

3. **OS選択**: macOS を選択

4. **アーキテクチャ選択**:
   - Apple Silicon (M1/M2/M3): ARM64
   - Intel Mac: X64

5. **表示されるコマンドをコピー**（次のステップで使用）

---

### Step 2: Runnerのダウンロードとインストール

#### macOS (Apple Silicon - M1/M2/M3)

```bash
# ホームディレクトリに移動
cd ~

# actions-runnerディレクトリを作成
mkdir actions-runner && cd actions-runner

# 最新のrunnerをダウンロード
curl -o actions-runner-osx-arm64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-arm64-2.311.0.tar.gz

# ダウンロードしたファイルを解凍
tar xzf ./actions-runner-osx-arm64-2.311.0.tar.gz
```

#### macOS (Intel)

```bash
# ホームディレクトリに移動
cd ~

# actions-runnerディレクトリを作成
mkdir actions-runner && cd actions-runner

# 最新のrunnerをダウンロード
curl -o actions-runner-osx-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-x64-2.311.0.tar.gz

# ダウンロードしたファイルを解凍
tar xzf ./actions-runner-osx-x64-2.311.0.tar.gz
```

---

### Step 3: Runnerの設定

```bash
# GitHubから提供されたトークンを使用して設定
./config.sh --url https://github.com/ShunsukeHayashi/miyabi-private --token YOUR_TOKEN_HERE

# プロンプトに従って設定
# Runner名: miyabi-runner-macbook (推奨)
# Runnerグループ: Default
# ラベル: self-hosted,macOS,ARM64 (または X64)
# 作業ディレクトリ: _work (デフォルト)
```

**ラベルの設定例**:
```
self-hosted,macOS,ARM64,miyabi
```

これにより、ワークフローで以下のように指定できます:
```yaml
runs-on: [self-hosted, macOS, ARM64, miyabi]
```

---

### Step 4: Runnerの起動

#### 手動起動（テスト用）

```bash
./run.sh
```

**出力例**:
```
√ Connected to GitHub

2024-10-15 12:00:00Z: Listening for Jobs
```

#### サービスとして起動（推奨 - 自動起動）

```bash
# サービスとしてインストール
sudo ./svc.sh install

# サービスを起動
sudo ./svc.sh start

# サービスのステータス確認
sudo ./svc.sh status

# （必要に応じて）サービスを停止
sudo ./svc.sh stop

# （必要に応じて）サービスをアンインストール
sudo ./svc.sh uninstall
```

**サービス化のメリット**:
- Mac起動時に自動でrunnerが起動
- バックグラウンドで動作
- クラッシュ時に自動再起動

---

### Step 5: 動作確認

1. **GitHub Settings**でRunnerのステータスを確認:
   ```
   https://github.com/ShunsukeHayashi/miyabi-private/settings/actions/runners
   ```

   ✅ **"Idle"**と表示されていればOK（ジョブ待機中）

2. **テストワークフローを実行**:

   ```yaml
   # .github/workflows/test-self-hosted.yml
   name: Test Self-Hosted Runner

   on: workflow_dispatch

   jobs:
     test:
       runs-on: [self-hosted, macOS]
       steps:
         - name: Test runner
           run: |
             echo "Hello from self-hosted runner!"
             uname -a
             which node
             which pnpm
             which cargo
   ```

3. **ワークフローを手動実行**:
   ```bash
   gh workflow run test-self-hosted.yml
   ```

---

## 🔧 環境のセットアップ

self-hosted runnerでワークフローを実行するには、必要なツールがインストールされている必要があります。

### 必須ツール

#### Node.js & pnpm

```bash
# Homebrewでインストール
brew install node

# pnpmをインストール
npm install -g pnpm
```

#### Rust（Rustワークフロー用）

```bash
# Rustupをインストール
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Pathを通す
source $HOME/.cargo/env
```

#### その他のツール

```bash
# GitHub CLI
brew install gh

# その他の便利ツール
brew install jq         # JSON処理
brew install git        # Git（通常は既にインストール済み）
```

---

## 📝 ワークフローの変更

### Before（GitHub-hosted runner）

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm & Node.js
        uses: ./.github/actions/setup-pnpm
```

### After（self-hosted runner）

```yaml
jobs:
  build:
    runs-on: [self-hosted, macOS]
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm & Node.js
        uses: ./.github/actions/setup-pnpm
```

### 条件付きrunner（推奨）

環境変数で切り替え可能にする:

```yaml
jobs:
  build:
    runs-on: ${{ vars.RUNNER_TYPE || 'ubuntu-latest' }}
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm & Node.js
        uses: ./.github/actions/setup-pnpm
```

GitHubの**Settings > Variables**で`RUNNER_TYPE`を設定:
- `self-hosted` - ローカルrunnerで実行
- （設定なし） - GitHub-hosted runnerで実行

---

## 🔐 セキュリティのベストプラクティス

### ⚠️ 重要な注意事項

1. **Publicリポジトリでは使用しない**
   - 任意のPull Requestからコードが実行される
   - セキュリティリスクが高い

2. **Privateリポジトリのみで使用**
   - 信頼できるコントリビューターのみ
   - PRからのworkflow実行を制限

3. **専用マシンを使用**（推奨）
   - 個人的なファイルが含まれないマシン
   - 仮想マシンやDockerコンテナ内で実行

4. **定期的なクリーンアップ**
   ```bash
   # 作業ディレクトリのクリーンアップ
   cd ~/actions-runner/_work
   rm -rf *
   ```

---

## 🛠️ トラブルシューティング

### Runnerが起動しない

**確認事項**:
1. トークンが有効か
2. ネットワーク接続があるか
3. Runnerプロセスが既に起動していないか

**解決方法**:
```bash
# プロセス確認
ps aux | grep Runner.Listener

# 既存プロセスを終了
pkill -f Runner.Listener

# 再起動
./run.sh
```

### ジョブが開始されない

**確認事項**:
1. Runnerがオンラインか（GitHub Settingsで確認）
2. ワークフローの`runs-on`ラベルが正しいか
3. Runnerのラベルとワークフローのラベルが一致しているか

**解決方法**:
```bash
# Runnerのステータス確認
./run.sh --check

# ラベルの再設定
./config.sh --url https://github.com/ShunsukeHayashi/miyabi-private --token YOUR_NEW_TOKEN --labels self-hosted,macOS,ARM64,miyabi
```

### 依存関係が見つからない

**エラー例**:
```
pnpm: command not found
cargo: command not found
```

**解決方法**:
```bash
# Pathを確認
echo $PATH

# ~/.bashrc または ~/.zshrc にPathを追加
export PATH="$HOME/.cargo/bin:$PATH"
export PATH="/usr/local/bin:$PATH"

# Runnerを再起動
sudo ./svc.sh restart
```

---

## 📊 リソース使用量の監視

### ディスク使用量の確認

```bash
# 作業ディレクトリのサイズ
du -sh ~/actions-runner/_work

# クリーンアップ
cd ~/actions-runner/_work
rm -rf _actions  # アクションキャッシュ
rm -rf _temp     # 一時ファイル
```

### メモリ使用量の確認

```bash
# Runnerプロセスのメモリ使用量
ps aux | grep Runner.Listener | awk '{print $4}'
```

---

## 🔄 アップデート

Runnerの新しいバージョンがリリースされたら:

```bash
# 現在のRunnerを停止
sudo ./svc.sh stop

# 新しいバージョンをダウンロード
curl -o actions-runner-osx-arm64-2.XXX.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.XXX.0/actions-runner-osx-arm64-2.XXX.0.tar.gz

# 解凍（既存ファイルを上書き）
tar xzf ./actions-runner-osx-arm64-2.XXX.0.tar.gz

# Runnerを再起動
sudo ./svc.sh start
```

---

## 🎯 次のステップ

1. ✅ Runnerのセットアップ完了
2. ✅ テストワークフローの実行確認
3. 🔄 主要ワークフローを`self-hosted`に変更
4. 📊 実行時間とコスト削減を確認

---

## 📚 参考リンク

- [GitHub Docs: Self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners)
- [GitHub Docs: Adding self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/adding-self-hosted-runners)
- [GitHub Docs: Using self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/using-self-hosted-runners-in-a-workflow)

---

**作成日**: 2025年10月15日
**最終更新**: 2025年10月15日
**バージョン**: 1.0
