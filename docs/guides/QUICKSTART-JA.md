# Miyabi クイックスタートガイド

## 🚀 5分でMiyabiを始める

### 前提条件

- Rust 1.75.0以上（既にインストール済み ✅）
- GitHub CLI（`gh`）がインストール・認証済み ✅

### ステップ1: プロジェクトのビルド

```bash
cargo build --release
```

### ステップ2: GitHub認証の確認

```bash
gh auth status
```

✅ 認証済みの場合、次へ進みます。

❌ 認証されていない場合:
```bash
gh auth login
```

### ステップ3: 初期セットアップ

```bash
./miyabi.sh setup --yes
```

これで以下が自動作成されます:
- `.env` - 環境設定ファイル
- `.miyabi.yml` - プロジェクト設定
- `.ai/logs/` - ログディレクトリ
- `.ai/parallel-reports/` - レポートディレクトリ
- `.worktrees/` - Git worktreeベースディレクトリ

### ステップ4: ステータス確認

```bash
./miyabi.sh status
```

✅ 全てが正常な場合、以下のように表示されます:

```
📊 Project Status

Miyabi Installation:
  ✅ Miyabi is installed

Environment:
  ✅ GITHUB_TOKEN is set

Git Repository:
  ✅ Git repository detected
```

## 📝 基本的な使い方

### プロジェクトステータスの確認

```bash
./miyabi.sh status
```

### エージェントの実行

```bash
# CoordinatorAgent - タスク分解と統括
./miyabi.sh agent run coordinator --issue 123

# CodeGenAgent - コード生成
./miyabi.sh agent run codegen --issue 123

# ReviewAgent - コードレビュー
./miyabi.sh agent run review --issue 123

# DeploymentAgent - デプロイ
./miyabi.sh agent run deployment --issue 123
```

### JSON形式での出力（CI/CD用）

```bash
./miyabi.sh status --json
./miyabi.sh agent run coordinator --issue 123 --json
```

## 🎯 キャラクター名でエージェントを呼び出す

技術名の代わりに親しみやすい日本語名も使えます:

```bash
# しきるん（CoordinatorAgent）
./miyabi.sh agent run しきるん --issue 123

# つくるん（CodeGenAgent）
./miyabi.sh agent run つくるん --issue 123

# めだまん（ReviewAgent）
./miyabi.sh agent run めだまん --issue 123
```

詳細は [AGENT_CHARACTERS.md](.claude/agents/AGENT_CHARACTERS.md) を参照。

## 🔧 トラブルシューティング

### GITHUB_TOKENが認識されない

**原因**: `gh` CLI が認証されていない、または無効なトークンが設定されている

**解決方法**:
```bash
# 認証状態を確認
gh auth status

# 再認証
gh auth login

# 再度Miyabiを実行
./miyabi.sh status
```

### miyabi.shが見つからない

**原因**: 実行権限がない

**解決方法**:
```bash
chmod +x miyabi.sh
./miyabi.sh status
```

### Rustコンパイラが見つからない

**原因**: PATHにcargoが含まれていない

**解決方法**:
```bash
export PATH="$HOME/.cargo/bin:$PATH"
source ~/.zshrc
```

## 📚 次のステップ

1. **ドキュメントを読む**
   - [ENTITY_RELATION_MODEL.md](docs/ENTITY_RELATION_MODEL.md) - システムアーキテクチャ
   - [LABEL_SYSTEM_GUIDE.md](docs/LABEL_SYSTEM_GUIDE.md) - 53ラベル体系
   - [AGENT_OPERATIONS_MANUAL.md](docs/AGENT_OPERATIONS_MANUAL.md) - Agent運用マニュアル

2. **実際にIssueを処理してみる**
   ```bash
   # GitHubでIssueを作成
   gh issue create --title "テスト" --body "Miyabiのテスト実行"

   # Issueを自動処理
   ./miyabi.sh agent run coordinator --issue <issue-number>
   ```

3. **並列実行を試す**
   ```bash
   ./miyabi.sh agent run coordinator --issues 1,2,3 --concurrency 3
   ```

## 🆘 サポート

問題が発生した場合:

1. [TROUBLESHOOTING.md](.claude/TROUBLESHOOTING.md) を確認
2. GitHubでIssueを作成: https://github.com/ShunsukeHayashi/miyabi-private/issues
3. ログを確認: `.ai/logs/` ディレクトリ

## 🎉 完了

これでMiyabiを使い始める準備が整いました！

詳細な機能については、[README.md](README.md) と [docs/](docs/) ディレクトリのドキュメントを参照してください。
