# 🔐 AWS Security Group設定手順 - Port 3002開放

**目的**: Miyabi Mobile AppからMUGEN APIに接続できるようにする

---

## 📋 必要情報

- **Instance ID**: `i-0403a2243764ac279`
- **Security Group**: `aimovie-dev-sg`
- **Region**: `us-west-2`
- **開放するPort**: `3002` (Miyabi Management API)

---

## 🚀 設定手順

### Step 1: AWS Consoleにログイン

1. ブラウザで https://console.aws.amazon.com/ にアクセス
2. IAMユーザーまたはルートアカウントでログイン
3. Region が **US West (Oregon) us-west-2** になっていることを確認

### Step 2: EC2 Security Groupsに移動

1. 画面上部の検索バーに「EC2」と入力
2. **EC2** サービスをクリック
3. 左サイドバーの **Network & Security** → **Security Groups** をクリック

### Step 3: Security Groupを選択

1. Security Group一覧から **aimovie-dev-sg** を探す
2. チェックボックスをクリックして選択
3. 下部のタブから **Inbound rules** を選択
4. **Edit inbound rules** ボタンをクリック

### Step 4: Port 3002のルールを追加

**新しいルールを追加:**

| 項目 | 設定値 |
|------|--------|
| Type | Custom TCP |
| Protocol | TCP |
| Port range | **3002** |
| Source | **0.0.0.0/0** (Anywhere-IPv4) |
| Description | Miyabi Management API - Mobile App Access |

**手順:**
1. **Add rule** ボタンをクリック
2. **Type**: "Custom TCP" を選択
3. **Port range**: `3002` を入力
4. **Source**: "Anywhere-IPv4" を選択 (または `0.0.0.0/0` を入力)
5. **Description**: `Miyabi Management API - Mobile App Access` を入力

### Step 5: 設定を保存

1. 画面右下の **Save rules** ボタンをクリック
2. 成功メッセージが表示されることを確認

---

## ✅ 設定確認

設定完了後、以下のコマンドでAPIに接続できるか確認：

```bash
# Termux/MacBookから実行
curl -H "X-API-Key: 93304e039eea24d50c7d91f6a7cb5d581e931357e04c2c19dce1ae6d3b309d89" \
  http://44.250.27.197:3002/miyabi/status
```

**期待される結果:**
```json
{"status":"ok","timestamp":"..."}
```

---

## 📱 Mobile Appテスト

設定完了後、Pixel 9 Pro XL で以下を確認：

1. **Dashboard画面**:
   - MUGEN Server status が "RUNNING" と表示される
   - Connection status が "Connected" と表示される
   - Workers情報が表示される

2. **Workers画面**:
   - Worker一覧が表示される
   - Start/Stop/Restartボタンが機能する

3. **Logs画面**:
   - "Failed to fetch logs" エラーが消える
   - ログエントリが表示される

---

## ⚠️ セキュリティ注意事項

**現在の設定 (0.0.0.0/0):**
- **利点**: どこからでもアクセス可能（テスト・開発に便利）
- **欠点**: インターネット全体に公開される

**本番環境では以下を推奨:**

### Option 1: 特定IPのみ許可
```
Source: <あなたのIP>/32
```

### Option 2: VPCプライベートアクセス
- VPN接続
- AWS Systems Manager Session Manager
- API Gateway + Lambda

---

## 🔧 トラブルシューティング

### 問題: curlでタイムアウト
**原因**: Security Group設定が反映されていない
**対処**:
1. AWS Consoleで設定を再確認
2. 1-2分待ってから再試行
3. インスタンスを再起動 (最終手段)

### 問題: "Connection refused"
**原因**: Miyabi APIが起動していない
**対処**:
```bash
ssh mugen
cd ~/miyabi-private/crates/miyabi-management-api
cargo run --release
```

### 問題: Mobile Appで"Network Error"
**原因**: API KeyまたはURL設定が間違っている
**対処**: `MiyabiAPIService.ts` の設定を確認

---

## 📞 サポート

問題が解決しない場合:
1. Security Group設定のスクリーンショットを確認
2. `ssh mugen 'sudo iptables -L -n'` でファイアウォール確認
3. `ssh mugen 'netstat -tuln | grep 3002'` でポート待受確認

---

**作成日**: 2025-11-14
**対象Issue**: #860
