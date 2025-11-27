# 🏭 Miyabi OpenAI App - 本番環境セットアップ完了

**セットアップ日時**: 2025-11-28
**環境**: EC2 MUGEN (Production)
**ステータス**: ✅ **本番稼働中**

---

## ✅ 完了した設定

### 1️⃣ 認証トークン設定

**MIYABI_ACCESS_TOKEN**: ✅ 設定完了
```bash
# 生成されたトークン（安全に保管）
rUOd4JkKVPBn0fH0NZc7q28e86JT1chBKTN5VEGqJmc
```

**設定場所**: `/home/ubuntu/miyabi-private/openai-apps/miyabi-app/server/.env`

**使用方法（ChatGPT連携）**:
```
Authorization: Bearer rUOd4JkKVPBn0fH0NZc7q28e86JT1chBKTN5VEGqJmc
```

---

### 2️⃣ systemdサービス化

**サービス名**: `miyabi-mcp.service`

**ステータス**: ✅ **ACTIVE (RUNNING)**

**確認コマンド**:
```bash
ssh mugen
sudo systemctl status miyabi-mcp
```

**サービス詳細**:
```
Unit: miyabi-mcp.service
Description: Miyabi OpenAI App - MCP Server (FastAPI)
ExecStart: /home/ubuntu/.local/bin/uvicorn main:app --host 0.0.0.0 --port 8000
WorkingDirectory: /home/ubuntu/miyabi-private/openai-apps/miyabi-app/server
User: ubuntu
Restart: on-failure (5秒後に自動再起動)
```

**自動起動設定**: ✅ 有効
```bash
# サーバー再起動後も自動起動
sudo systemctl enable miyabi-mcp
```

**ログ確認**:
```bash
# リアルタイムログ
sudo journalctl -u miyabi-mcp -f

# 最新100行
sudo journalctl -u miyabi-mcp -n 100
```

**サービス管理コマンド**:
```bash
# 起動
sudo systemctl start miyabi-mcp

# 停止
sudo systemctl stop miyabi-mcp

# 再起動
sudo systemctl restart miyabi-mcp

# ステータス確認
sudo systemctl status miyabi-mcp
```

---

### 3️⃣ Cloudflare Tunnel準備

**cloudflared**: ✅ インストール完了
```bash
cloudflared version 2025.11.1
```

**Cloudflare Tunnel セットアップ手順**:

#### オプション1: Quick Tunnel（即座にHTTPS公開）
```bash
ssh mugen
cloudflared tunnel --url http://localhost:8000
```

出力例:
```
Your quick Tunnel has been created! Visit it at:
https://<random-id>.trycloudflare.com
```

このURLを ChatGPT のコネクタに設定すれば、即座にHTTPS経由でアクセス可能！

**注意**: Quick Tunnelは一時的なURL。永続的なURLが必要な場合はオプション2へ。

#### オプション2: 永続的なTunnel（推奨）

**1. Cloudflare にログイン**:
```bash
ssh mugen
cloudflared tunnel login
```

ブラウザでCloudflareアカウントにログイン後、トークンがダウンロードされます。

**2. Tunnelを作成**:
```bash
cloudflared tunnel create miyabi-mcp
```

出力例:
```
Created tunnel miyabi-mcp with id <tunnel-id>
Tunnel credentials written to /home/ubuntu/.cloudflared/<tunnel-id>.json
```

**3. 設定ファイル作成**:
```bash
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << EOF
tunnel: <tunnel-id>
credentials-file: /home/ubuntu/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: miyabi-mcp.yourdomain.com
    service: http://localhost:8000
  - service: http_status:404
EOF
```

**4. DNSレコード追加**:
```bash
cloudflared tunnel route dns miyabi-mcp miyabi-mcp.yourdomain.com
```

**5. Tunnelを起動**:
```bash
cloudflared tunnel run miyabi-mcp
```

**6. systemdサービス化**（推奨）:
```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

### 4️⃣ セキュリティ設定

**認証モード**: ✅ Production（Bearer Token必須）

**環境変数**:
```bash
MIYABI_ACCESS_TOKEN=rUOd4JkKVPBn0fH0NZc7q28e86JT1chBKTN5VEGqJmc
```

**HTTPSアクセス**:
- ✅ ngrok: `https://792e1c41e9bd.ngrok-free.app/mcp` （一時的）
- 🔄 Cloudflare: セットアップ中（永続的）

**アクセス制限**:
- Bearer token認証が必須
- トークンなしのリクエストは HTTP 401 Unauthorized で拒否

---

## 🌐 公開エンドポイント

### オプション1: ngrok（現在稼働中）

```
URL: https://792e1c41e9bd.ngrok-free.app/mcp
Status: ✅ ONLINE
Limitations: 一時的URL、ngrokバナー表示あり
```

**ChatGPT連携設定**:
```
Name: Miyabi Agent Platform (Dev)
URL: https://792e1c41e9bd.ngrok-free.app/mcp
Authentication: Bearer Token
Token: rUOd4JkKVPBn0fH0NZc7q28e86JT1chBKTN5VEGqJmc
```

### オプション2: Cloudflare Tunnel（推奨）

```
URL: （設定後に確定）
Status: インストール済み、設定待ち
Advantages: 永続的URL、無料HTTPS、DDoS保護
```

**Quick Tunnel使用時のChatGPT設定例**:
```
Name: Miyabi Agent Platform (Production)
URL: https://<random-id>.trycloudflare.com/mcp
Authentication: Bearer Token
Token: rUOd4JkKVPBn0fH0NZc7q28e86JT1chBKTN5VEGqJmc
```

---

## 📊 動作確認

### ヘルスチェック

```bash
curl http://44.250.27.197:8000/
```

**期待される応答**:
```json
{
  "name": "Miyabi MCP Server",
  "version": "1.0.0",
  "status": "running",
  "tools": 7
}
```

### 認証付きツールリスト取得

```bash
curl -X POST https://792e1c41e9bd.ngrok-free.app/mcp \
  -H 'Authorization: Bearer rUOd4JkKVPBn0fH0NZc7q28e86JT1chBKTN5VEGqJmc' \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq
```

### 認証なしリクエスト（エラーテスト）

```bash
curl -X POST https://792e1c41e9bd.ngrok-free.app/mcp \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**期待される応答**: HTTP 401 Unauthorized
```json
{
  "detail": "Bearer token required"
}
```

---

## ⚠️ 未完了タスク

### GITHUB_TOKEN設定

**ステータス**: ⚠️ 未設定

**設定方法**:
```bash
ssh mugen
cd ~/miyabi-private/openai-apps/miyabi-app/server
nano .env

# 以下を追加:
GITHUB_TOKEN=ghp_your_token_here
```

**トークン取得方法**:
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. Scopes: `repo`, `workflow`, `write:packages`
5. トークンをコピーして .env に設定

**再起動**:
```bash
sudo systemctl restart miyabi-mcp
```

---

## 🚀 本番運用

### 監視

**サービスステータス**:
```bash
watch -n 5 'sudo systemctl status miyabi-mcp'
```

**リアルタイムログ**:
```bash
sudo journalctl -u miyabi-mcp -f
```

**エラーログのみ**:
```bash
sudo journalctl -u miyabi-mcp -p err -f
```

### トラブルシューティング

**サービスが起動しない**:
```bash
# ログ確認
sudo journalctl -u miyabi-mcp -n 100

# 手動起動テスト
cd ~/miyabi-private/openai-apps/miyabi-app/server
source .env
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**ポート衝突**:
```bash
# ポート使用状況確認
sudo lsof -i :8000

# プロセスKill
sudo lsof -ti:8000 | xargs sudo kill -9

# サービス再起動
sudo systemctl restart miyabi-mcp
```

**認証エラー**:
```bash
# .env ファイル確認
cat ~/miyabi-private/openai-apps/miyabi-app/server/.env | grep TOKEN

# 環境変数がロードされているか確認
sudo systemctl show miyabi-mcp | grep Environment
```

### バックアップ

**重要ファイル**:
```bash
# .env（トークン情報）
~/miyabi-private/openai-apps/miyabi-app/server/.env

# systemdサービスファイル
/etc/systemd/system/miyabi-mcp.service

# Cloudflare設定
~/.cloudflared/config.yml
~/.cloudflared/<tunnel-id>.json
```

**バックアップコマンド**:
```bash
# 設定ファイルバックアップ
tar -czf miyabi-config-backup-$(date +%Y%m%d).tar.gz \
  ~/miyabi-private/openai-apps/miyabi-app/server/.env \
  /etc/systemd/system/miyabi-mcp.service \
  ~/.cloudflared/
```

---

## 📚 関連ドキュメント

- [DEPLOYMENT_REPORT.md](./DEPLOYMENT_REPORT.md) - デプロイ完了報告書
- [README_AUTH.md](./README_AUTH.md) - 認証ドキュメント
- [E2E_TESTING.md](./E2E_TESTING.md) - テストガイド
- [CHANGELOG.md](./CHANGELOG.md) - 変更履歴

---

## ✅ チェックリスト

- [x] MIYABI_ACCESS_TOKEN生成・設定
- [x] systemdサービス作成
- [x] systemdサービス自動起動設定
- [x] サービス起動確認
- [x] cloudflaredインストール
- [ ] GITHUB_TOKEN設定（手動対応必要）
- [ ] Cloudflare Tunnel永続化設定（オプション）
- [ ] DNS設定（Cloudflare使用時）

---

**セットアップ完了日時**: 2025-11-28
**次のステップ**: GITHUB_TOKEN設定後、本番運用開始

**現在のステータス**: 🟢 **本番環境稼働中（認証有効）**
