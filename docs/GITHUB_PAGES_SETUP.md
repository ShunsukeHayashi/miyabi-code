# GitHub Pages セットアップ手順

**作成日**: 2025-10-23
**対象**: miyabi-private リポジトリ
**目的**: Rust API Reference の自動公開

---

## 📋 前提条件

- ✅ `.github/workflows/docs.yml` 作成済み
- ✅ `README.md` に API Reference リンク追加済み
- ✅ リポジトリへのAdmin権限

---

## 🚀 セットアップ手順

### 1. GitHub Pages を有効化

1. GitHub リポジトリページにアクセス:
   ```
   https://github.com/customer-cloud/miyabi-private
   ```

2. **Settings** タブをクリック

3. 左サイドバーから **Pages** をクリック

4. **Source** セクションで以下を選択:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`

5. **Save** ボタンをクリック

### 2. 初回ビルドのトリガー

GitHub Actions ワークフローを手動実行:

1. **Actions** タブをクリック

2. 左サイドバーから **Documentation** ワークフローを選択

3. **Run workflow** ボタンをクリック
   - Branch: `main`
   - **Run workflow** 確認

4. ワークフロー実行完了まで待機（約2-3分）

### 3. 公開URLの確認

1. **Settings** → **Pages** に戻る

2. 「Your site is live at」メッセージと共に URL が表示されます:
   ```
   https://customer-cloud.github.io/miyabi-private/
   ```

3. URLをクリックして API ドキュメントを確認

---

## 📚 公開されるドキュメント

### URL構造

- **トップページ**: `https://customer-cloud.github.io/miyabi-private/`
  - → `miyabi_cli/index.html` にリダイレクト

- **各クレートのドキュメント**:
  - `miyabi_cli/` - CLI ツール
  - `miyabi_types/` - コア型定義
  - `miyabi_core/` - コア機能
  - `miyabi_agents/` - Agent システム
  - `miyabi_github/` - GitHub 統合
  - その他27クレート

### ドキュメント内容

- **Public API**: 全ての public 関数・構造体・trait
- **Private items**: `--document-private-items` により内部実装も含む
- **Examples**: Rustdoc の `# Examples` セクション
- **Search機能**: インデックスページによる全文検索

---

## 🔄 自動更新

### 更新トリガー

以下のイベントで自動的にドキュメントが再生成されます：

1. **`main` ブランチへの push**
   ```bash
   git push origin main
   ```

2. **Pull Request のマージ**
   - PR が `main` にマージされると自動実行

3. **手動実行**
   - Actions → Documentation → Run workflow

### 更新フロー

```
コミット → GitHub Actions → cargo doc → gh-pages ブランチ → GitHub Pages
   ↓           (2-3分)          ↓            ↓                  ↓
 push                        target/doc    force push        公開URL更新
```

---

## ⚠️ トラブルシューティング

### 問題1: GitHub Pages が有効化されない

**症状**: Settings → Pages で gh-pages ブランチが選択できない

**解決策**:
1. 一度ワークフローを手動実行して `gh-pages` ブランチを作成
2. ブランチ作成後、Settings → Pages で選択可能になる

**確認コマンド**:
```bash
git ls-remote --heads origin gh-pages
```

### 問題2: ドキュメントが更新されない

**症状**: push してもドキュメントが古いまま

**解決策**:
1. Actions タブでワークフローが成功しているか確認
2. キャッシュをクリア:
   ```bash
   git push origin --delete gh-pages
   # 次回push時に再生成
   ```

3. ブラウザのキャッシュをクリア（Cmd+Shift+R）

### 問題3: 404 Not Found エラー

**症状**: URL にアクセスすると404エラー

**解決策**:
1. `gh-pages` ブランチに `index.html` が存在するか確認:
   ```bash
   git fetch origin gh-pages
   git ls-tree origin/gh-pages | grep index.html
   ```

2. ワークフローログで `target/doc/index.html` 生成を確認

3. `peaceiris/actions-gh-pages@v3` のログを確認

---

## 🔐 アクセス権限

### パブリックリポジトリの場合

- ✅ 誰でもアクセス可能
- URL: `https://customer-cloud.github.io/miyabi-private/`

### プライベートリポジトリの場合

- ⚠️ GitHub Pro/Team/Enterprise が必要
- 組織メンバーのみアクセス可能
- 認証が必要

**miyabi-private の現状**: プライベートリポジトリ
→ 組織メンバーのみアクセス可能

---

## 📊 確認チェックリスト

- [ ] GitHub Pages が有効化されている（Settings → Pages）
- [ ] `gh-pages` ブランチが作成されている
- [ ] ワークフローが成功している（Actions タブ）
- [ ] 公開URLにアクセスできる
- [ ] README.md のリンクが正しい
- [ ] ドキュメントが最新の状態

---

## 🔗 関連リソース

- **GitHub Pages ドキュメント**: https://docs.github.com/en/pages
- **peaceiris/actions-gh-pages**: https://github.com/peaceiris/actions-gh-pages
- **cargo doc**: https://doc.rust-lang.org/cargo/commands/cargo-doc.html
- **Issue #473**: [P4-004] API Reference自動生成CI

---

**実施者**: ユーザー（GitHub Admin権限必須）
**作成者**: Claude Code

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
