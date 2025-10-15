# RefresherAgent Self-Hosted Runner セットアップガイド

## 📋 概要

RefresherAgentをself-hosted runnerで稼働させるための設定手順です。

**RefresherAgent**は1時間ごとにIssueステータスを自動更新するAgentです。Self-hosted runnerで実行することで、GitHub Actionsの実行時間課金を完全に回避できます。

---

## 🚀 セットアップ手順

### Step 1: Self-hosted runnerのセットアップ

まだself-hosted runnerをセットアップしていない場合は、[SELF_HOSTED_RUNNER_SETUP.md](./SELF_HOSTED_RUNNER_SETUP.md)を参照してください。

**確認事項**:
- ✅ Self-hosted runnerが起動している
- ✅ Runnerのステータスが "Idle" (待機中)
- ✅ ラベル: `self-hosted,macOS,ARM64,miyabi`

**確認方法**:
```
https://github.com/ShunsukeHayashi/miyabi-private/settings/actions/runners
```

---

### Step 2: 環境変数の設定

GitHubの**Settings > Secrets and variables > Actions > Variables**で以下の変数を設定します。

#### RUNNER_TYPE

RefresherAgentをself-hosted runnerで実行するには、`RUNNER_TYPE`変数を設定します。

**設定手順**:
1. GitHubリポジトリの**Settings**にアクセス:
   ```
   https://github.com/ShunsukeHayashi/miyabi-private/settings/variables/actions
   ```

2. **"New repository variable"**ボタンをクリック

3. **変数を設定**:
   - **Name**: `RUNNER_TYPE`
   - **Value**: `self-hosted` または `[self-hosted, macOS]`

4. **"Add variable"**をクリック

**推奨値**:
```yaml
RUNNER_TYPE: self-hosted
```

または、より詳細な指定:
```yaml
RUNNER_TYPE: [self-hosted, macOS, ARM64, miyabi]
```

---

### Step 3: 動作確認

#### 手動実行テスト

1. **GitHub Actionsページ**にアクセス:
   ```
   https://github.com/ShunsukeHayashi/miyabi-private/actions/workflows/refresher-agent.yml
   ```

2. **"Run workflow"**ボタンをクリック

3. **ドライランモード**を選択（初回テスト推奨）:
   - **Dry run mode**: `true`

4. **"Run workflow"**をクリック

5. **実行ログを確認**:
   - Runner Type が `self-hosted` になっているか
   - OS が `macOS` になっているか
   - Architecture が `arm64` または `x86_64` になっているか

**期待される出力**:
```
📊 RefresherAgent Execution Summary
====================================
Runner: macOS (miyabi-runner-macbook)
Execution Time: 2025-10-15T12:00:00.000Z
Total Issues: 137
Updates: 0 issues (DRY RUN MODE)

Phase Status:
  Phase 3 (miyabi-types): done
  Phase 4 (miyabi-cli): reviewing
  Phase 5 (miyabi-agents): implementing

⚠️  DRY RUN MODE - No updates applied

🏃 Runner Info:
  - Runner Type: self-hosted
  - OS: macOS
  - Architecture: arm64
```

---

### Step 4: 本番実行

テストが成功したら、ドライランモードをオフにして本番実行します。

1. **GitHub Actionsページ**にアクセス:
   ```
   https://github.com/ShunsukeHayashi/miyabi-private/actions/workflows/refresher-agent.yml
   ```

2. **"Run workflow"**ボタンをクリック

3. **ドライランモード**をオフに:
   - **Dry run mode**: `false`

4. **"Run workflow"**をクリック

5. **実行ログを確認**:
   - Issueが正しく更新されたか
   - エラーがないか

**期待される出力**:
```
📊 RefresherAgent Execution Summary
====================================
Runner: macOS (miyabi-runner-macbook)
Execution Time: 2025-10-15T12:00:00.000Z
Total Issues: 137
Updates: 20 issues

Phase Status:
  Phase 3 (miyabi-types): done
  Phase 4 (miyabi-cli): reviewing
  Phase 5 (miyabi-agents): implementing

✅ RefresherAgent completed successfully
```

---

## 🔄 自動実行の確認

RefresherAgentは1時間ごとに自動実行されます。

**確認方法**:
1. **GitHub Actionsページ**にアクセス:
   ```
   https://github.com/ShunsukeHayashi/miyabi-private/actions/workflows/refresher-agent.yml
   ```

2. **最新の実行履歴**を確認:
   - 1時間ごとに新しい実行が追加されるか
   - Runner Type が `self-hosted` になっているか

**自動実行スケジュール**:
```yaml
on:
  schedule:
    - cron: '0 */1 * * *'  # 1時間ごと (UTC時間)
```

---

## 🛠️ トラブルシューティング

### Runnerが見つからない

**エラー**:
```
No runner matching the specified labels was found: self-hosted, macOS
```

**解決方法**:
1. Self-hosted runnerが起動しているか確認:
   ```bash
   cd ~/actions-runner
   ./run.sh --check
   ```

2. Runnerのステータスを確認:
   ```
   https://github.com/ShunsukeHayashi/miyabi-private/settings/actions/runners
   ```

3. Runnerが停止している場合は再起動:
   ```bash
   cd ~/actions-runner
   sudo ./svc.sh start
   ```

### GitHub CLIが見つからない

**エラー**:
```
gh: command not found
```

**解決方法（macOS）**:
```bash
# Homebrewでインストール
brew install gh

# パスを確認
which gh

# Runnerを再起動
cd ~/actions-runner
sudo ./svc.sh restart
```

### Rustが見つからない

**エラー**:
```
cargo: command not found
```

**解決方法（macOS）**:
```bash
# Rustupをインストール
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Pathを通す
source $HOME/.cargo/env

# Runnerを再起動
cd ~/actions-runner
sudo ./svc.sh restart
```

### Issue更新が失敗する

**エラー**:
```
Error: Resource not accessible by integration
```

**解決方法**:
1. GitHub Tokenに `issues: write` 権限があるか確認
2. Workflow permissionsを確認:
   ```
   Settings > Actions > General > Workflow permissions
   ```
   → **"Read and write permissions"**を選択

---

## 📊 実行コストの比較

### GitHub-hosted runner（従来）

| 項目 | コスト |
|------|--------|
| 実行時間 | 5-10秒/回 |
| 実行頻度 | 1時間ごと |
| 月間実行回数 | 約720回 |
| 月間実行時間 | 約1-2時間 |
| **月額コスト** | **約$0.08-$0.16** (無料枠超過時) |

### Self-hosted runner（新）

| 項目 | コスト |
|------|--------|
| 実行時間 | 5-10秒/回 |
| 実行頻度 | 1時間ごと |
| 月間実行回数 | 約720回 |
| 月間実行時間 | 約1-2時間 |
| **月額コスト** | **$0 (完全無料)** ✅ |

**削減額**: 月額$0.08-$0.16 → 年間約$1-$2の削減

---

## 🔐 セキュリティのベストプラクティス

RefresherAgentは**読み取り専用**に近い操作のみ実行します：

✅ **安全な操作**:
- Issueの取得
- コードベースの確認（読み取りのみ）
- Issueラベルの更新

⚠️ **注意事項**:
- コードの変更は行いません
- PRの作成は行いません
- デプロイは行いません

**推奨設定**:
- Privateリポジトリでのみ使用
- Pull Requestからのworkflow実行を制限

---

## 📝 次のステップ

1. ✅ Self-hosted runnerのセットアップ完了
2. ✅ `RUNNER_TYPE`変数の設定完了
3. ✅ RefresherAgentの手動実行テスト完了
4. ✅ 自動実行の確認
5. 📊 実行ログとIssueステータスの定期確認

---

## 🎯 メリットのまとめ

RefresherAgentをself-hosted runnerで実行することで、以下のメリットがあります：

1. **完全無料** - GitHub Actions実行時間の課金なし
2. **高速実行** - ローカルマシンのリソースを活用
3. **キャッシュの永続化** - Rustビルドキャッシュが永続化され、高速化
4. **プライベート環境** - ローカルマシンで完結

---

**作成日**: 2025年10月15日
**最終更新**: 2025年10月15日
**バージョン**: 1.0
