# npm パッケージ Deprecation 手順書

**作成日**: 2025-10-23
**対象パッケージ**: `miyabi` (TypeScript CLI)
**理由**: Rust版への移行完了

---

## 📋 実施手順

### 1. npm ログイン確認

```bash
npm whoami
```

**期待される出力**: npm アカウント名（例: `shunsukehayashi`）

ログインしていない場合:
```bash
npm login
```

### 2. パッケージ所有権確認

```bash
npm owner ls miyabi
```

**期待される出力**:
```
shunsukehayashi <supernovasyun@gmail.com>
```

### 3. Deprecation 警告の追加

```bash
npm deprecate miyabi "⚠️ DEPRECATED: This TypeScript version of Miyabi has been migrated to Rust. Please use the new Rust-based implementation at https://github.com/customer-cloud/miyabi-private. This package is no longer maintained."
```

**期待される出力**:
```
+ miyabi@0.14.0-dev.0 deprecated
```

### 4. 全バージョンの Deprecation（オプション）

全バージョンをdeprecateする場合:
```bash
npm deprecate miyabi@* "⚠️ DEPRECATED: Migrated to Rust. See https://github.com/customer-cloud/miyabi-private"
```

### 5. 確認

npm registry で deprecation 警告が表示されることを確認:

```bash
npm view miyabi
```

または、ブラウザで確認:
```
https://www.npmjs.com/package/miyabi
```

**期待される表示**: 赤い ⚠️ 警告バナーが表示される

---

## 🔄 TypeScript パッケージリスト

以下のパッケージが `archive/typescript-legacy/packages/` に存在します：

| パッケージ名 | ディレクトリ | npm 公開 | Deprecate 必要 |
|-------------|------------|---------|---------------|
| `miyabi` | `cli/` | ✅ 公開済み | ✅ 必要 |
| `miyabi-agent-sdk` | `miyabi-agent-sdk/` | ❓ 要確認 | ❓ |
| その他 | `core/`, `github-projects/` 等 | ❌ 未公開 | ❌ 不要 |

### 追加確認が必要なパッケージ

```bash
# miyabi-agent-sdk が公開されているか確認
npm view miyabi-agent-sdk

# 公開されている場合は deprecate
npm deprecate miyabi-agent-sdk "⚠️ DEPRECATED: Migrated to Rust-based Miyabi. See https://github.com/customer-cloud/miyabi-private"
```

---

## ⚠️ 注意事項

### やってはいけないこと

❌ **`npm unpublish`** - 既存ユーザーに影響を与える、npm ポリシー違反の可能性
❌ **全バージョン削除** - npm レジストリから削除すると復元不可能

### 推奨される方法

✅ **`npm deprecate`** - 警告表示のみ、パッケージは残る
✅ **README 更新** - 既に完了（DEPRECATED 警告追加済み）
✅ **リダイレクト通知** - Rust 版への移行を促す

---

## 📊 実施チェックリスト

- [x] README.md に DEPRECATED 警告追加（2025-10-23完了）
- [ ] npm ログイン確認
- [ ] `npm deprecate miyabi` 実行
- [ ] npm registry で警告確認
- [ ] `miyabi-agent-sdk` の公開状況確認
- [ ] 必要に応じて追加パッケージ deprecate
- [ ] Issue #476 をクローズ

---

## 🔗 関連リソース

- **npm deprecate ドキュメント**: https://docs.npmjs.com/cli/v8/commands/npm-deprecate
- **Rust 版リポジトリ**: https://github.com/customer-cloud/miyabi-private
- **Issue #476**: [P4-007] npm packages削除・アーカイブ

---

**実施者**: ユーザー（npm 権限必須）
**作成者**: Claude Code

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
