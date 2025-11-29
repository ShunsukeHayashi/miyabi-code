# Lambda CI/CD クイックスタートガイド

**5分でセットアップ完了！**

---

## 🚀 最速セットアップ（5ステップ）

### ステップ1: IAMユーザー作成（2分）

```bash
# ユーザー作成
aws iam create-user --user-name github-actions-lambda-deploy

# ポリシーアタッチ（管理ポリシーで簡易セットアップ）
aws iam attach-user-policy \
  --user-name github-actions-lambda-deploy \
  --policy-arn arn:aws:iam::aws:policy/AWSLambda_FullAccess

# アクセスキー作成
aws iam create-access-key --user-name github-actions-lambda-deploy
```

**出力をコピー**:
- `AccessKeyId`: `AKIA...`
- `SecretAccessKey`: `wJalr...`

---

### ステップ2: GitHub Secrets設定（1分）

**リポジトリ → Settings → Secrets and variables → Actions → New repository secret**

以下の3つを追加:

| 名前 | 値 |
|------|-----|
| `AWS_ACCESS_KEY_ID` | `AKIA...`（ステップ1でコピー） |
| `AWS_SECRET_ACCESS_KEY` | `wJalr...`（ステップ1でコピー） |
| `AWS_REGION` | `us-east-1` |

---

### ステップ3: Lambda関数を作成（1分）

**Rust Lambda (Web API)**:

```bash
aws lambda create-function \
  --function-name miyabi-api-dev \
  --runtime provided.al2 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler bootstrap \
  --architectures arm64 \
  --zip-file fileb://$(pwd)/target/lambda/lambda-api/bootstrap.zip
```

**Python Lambda (MCP Server)**:

```bash
aws lambda create-function \
  --function-name miyabi-mcp-server-dev \
  --runtime python3.12 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler lambda_handler.handler \
  --architectures arm64 \
  --zip-file fileb://$(pwd)/dist/python-lambda.zip
```

> **注意**: 初回は空のzipファイルでOK。CI/CDが自動更新します。

---

### ステップ4: ワークフローファイル確認（30秒）

`.github/workflows/lambda-ci-cd.yml` が存在することを確認:

```bash
ls -la .github/workflows/lambda-ci-cd.yml
```

✅ 存在すればOK！（すでに作成済み）

---

### ステップ5: デプロイテスト（30秒）

**手動トリガー**:

```bash
gh workflow run lambda-ci-cd.yml \
  -f environment=dev \
  -f deploy_rust=true \
  -f deploy_python=true
```

または**GitHub UI**:
1. Actions タブ
2. Lambda CI/CD Pipeline
3. Run workflow
4. environment: `dev`
5. Run workflow 実行

---

## ✅ 動作確認

### GitHub Actionsログ確認

**Actions → Lambda CI/CD Pipeline → 最新のrun**

全ジョブが✅になればOK：
- ✅ Detect Changes
- ✅ Test Rust Lambda
- ✅ Test Python Lambda
- ✅ Build Rust Lambda
- ✅ Build Python Lambda
- ✅ Deploy to AWS
- ✅ Verify Deployment

### Lambda関数確認

```bash
# 関数リスト
aws lambda list-functions --query 'Functions[?contains(FunctionName, `miyabi`)].FunctionName'

# 関数詳細
aws lambda get-function --function-name miyabi-api-dev
```

### API動作確認

```bash
# Lambda invoke
aws lambda invoke \
  --function-name miyabi-api-dev \
  --payload '{"httpMethod":"GET","path":"/health"}' \
  response.json

cat response.json
```

---

## 🎯 次のステップ

### 1. 本番環境セットアップ

```bash
# 本番環境を作成
aws lambda create-function \
  --function-name miyabi-api-production \
  --runtime provided.al2 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler bootstrap \
  --architectures arm64 \
  --zip-file fileb://$(pwd)/target/lambda/lambda-api/bootstrap.zip
```

### 2. GitHub Environment設定

**Settings → Environments → New environment**

環境名: `production`

**Protection rules**:
- ✅ Required reviewers: 1人以上
- ✅ Wait timer: 5 minutes

### 3. 自動デプロイ有効化

mainブランチへのマージで自動デプロイ:

```bash
git checkout -b feature/update-lambda
# コード変更
git commit -m "feat: update lambda function"
git push origin feature/update-lambda

# PR作成・マージ → 自動デプロイ！
```

---

## 💡 Tips

### Tip 1: ローカルテスト

```bash
# Rust Lambda
cargo lambda build --release
cargo lambda watch  # ローカルサーバー起動

# Python Lambda
cd openai-apps/miyabi-app/server
uvicorn main:app --reload
```

### Tip 2: 高速ビルド

```yaml
# キャッシュ活用でビルド時間短縮
- uses: actions/cache@v4
  with:
    path: |
      ~/.cargo/registry
      ~/.cargo/git
      target
    key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
```

### Tip 3: Discord通知

```bash
# Webhook URL追加
# Settings → Secrets and variables → Actions → Variables
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## 🐛 よくあるエラー

### エラー1: `ResourceNotFoundException`

**原因**: Lambda関数が存在しない

**解決策**:
```bash
# 関数を作成（ステップ3参照）
aws lambda create-function ...
```

---

### エラー2: `AccessDenied`

**原因**: IAMポリシーが不足

**解決策**:
```bash
# フル権限を一時的に付与（開発環境のみ）
aws iam attach-user-policy \
  --user-name github-actions-lambda-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

---

### エラー3: ビルドタイムアウト

**原因**: 初回ビルドが遅い

**解決策**: 待つ（キャッシュが効いた2回目から高速化）

---

## 📚 詳細ドキュメント

より詳しい情報は完全版ガイドを参照:
- **[LAMBDA_CICD_SETUP.md](./LAMBDA_CICD_SETUP.md)** - 完全セットアップガイド

---

## 🎉 完了！

おめでとうございます！Lambda CI/CDパイプラインが稼働中です。

**次にやること**:
1. ✅ コードを変更してPR作成
2. ✅ CIが自動実行されることを確認
3. ✅ mainにマージで自動デプロイ
4. ✅ 本番環境セットアップ

Happy Deploying! 🚀
