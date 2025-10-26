# FANZA 新着作品トラッキング - セットアップガイド

**作成日**: 2025-10-27
**バージョン**: v1.0.0

このガイドでは、FANZA（旧DMM.R18）の新着作品情報を自動取得する機能のセットアップ手順を説明します。

---

## 🎯 概要

**機能**:
- FANZA動画の新着作品情報を毎日自動取得
- Markdown + JSON形式で保存（Git管理可能）
- 音声実況付き実行（VOICEVOX連携）
- cron/GitHub Actionsで定期実行可能

**使用技術**:
- DMM Web API (Affiliate API v3)
- Bash script
- jq (JSON processor)
- VOICEVOX (オプション)

---

## 📋 セットアップ手順

### Step 1: DMM API ID/Affiliate IDの取得

#### 1-1. DMMアカウント作成
https://www.dmm.com/ でアカウントを作成（既にある場合はスキップ）

#### 1-2. DMMアフィリエイト登録
https://affiliate.dmm.com/ でアフィリエイトプログラムに登録

#### 1-3. API利用申請
1. アフィリエイト管理画面にログイン
2. 「API利用」セクションへ移動
3. 利用規約に同意してAPI利用を申請
4. **API ID** と **Affiliate ID** をメモ

**重要**: API IDは即時発行されますが、審査に数日かかる場合があります。

---

### Step 2: 環境変数設定

#### 2-1. テンプレートをコピー

```bash
cd /Users/shunsuke/Dev/miyabi-private
cp .env.fanza.template .env.fanza
```

#### 2-2. API情報を入力

```bash
# エディタで開く
vim .env.fanza
# または
code .env.fanza
```

**入力内容**:
```bash
# .env.fanza
DMM_API_ID=your_actual_api_id_here
DMM_AFFILIATE_ID=your_actual_affiliate_id_here
```

**例**:
```bash
DMM_API_ID=abcd1234efgh5678
DMM_AFFILIATE_ID=miyabi-999
```

#### 2-3. 環境変数を読み込み

```bash
source .env.fanza
```

#### 2-4. 設定確認

```bash
echo $DMM_API_ID
echo $DMM_AFFILIATE_ID
```

---

### Step 3: 依存ツールのインストール

#### 3-1. jqのインストール（JSONパーサー）

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# 確認
jq --version
```

#### 3-2. curlの確認（通常はプリインストール済み）

```bash
curl --version
```

---

### Step 4: 動作確認

#### 4-1. スクリプト単体で実行

```bash
./tools/fanza_fetch_new_releases.sh 5
```

**期待される出力**:
```
🔍 FANZA新着作品を取得中...
   取得件数: 5
   出力先: data/fanza/new_releases_20251027.md

✅ JSON保存完了: data/fanza/new_releases_20251027.json
✅ Markdown保存完了: data/fanza/new_releases_20251027.md

📊 取得作品数: 5
📄 ファイルサイズ:
   JSON: 15K
   Markdown: 8.2K

🎉 完了！
```

#### 4-2. 生成されたファイルを確認

```bash
# Markdownをプレビュー
cat data/fanza/new_releases_$(date +%Y%m%d).md

# JSONを整形表示
cat data/fanza/new_releases_$(date +%Y%m%d).json | jq .
```

#### 4-3. スラッシュコマンドで実行

```bash
/track-fanza 10
```

---

## 🎤 VOICEVOX連携（オプション）

音声実況付きで実行したい場合のセットアップ。

### VOICEVOX Engine起動

#### Docker版（推奨）

```bash
docker run --rm -p '127.0.0.1:50021:50021' voicevox/voicevox_engine:cpu-latest
```

#### ローカル版

```bash
cd ~/voicevox_engine
python run.py --enable_mock
```

### 接続確認

```bash
curl http://127.0.0.1:50021/version
# → "0.24.1" のようなバージョン情報が返ればOK
```

### 音声付き実行

```bash
/track-fanza 20
# → 各ステップで音声コメントが流れます
```

---

## 🔄 定期実行設定

### cron設定（毎日12時に自動実行）

#### 1. cronファイルを編集

```bash
crontab -e
```

#### 2. 以下を追加

```cron
# FANZA新着作品トラッキング（毎日12:00）
0 12 * * * cd /Users/shunsuke/Dev/miyabi-private && source .env.fanza && ./tools/fanza_fetch_new_releases.sh 30 >> logs/fanza_cron.log 2>&1
```

#### 3. cron登録確認

```bash
crontab -l
```

#### 4. ログディレクトリ作成

```bash
mkdir -p logs
```

---

### GitHub Actions設定（リポジトリで自動実行）

#### 1. Secretsを設定

GitHub Repository Settings → Secrets and variables → Actions → New repository secret

- `DMM_API_ID`: あなたのAPI ID
- `DMM_AFFILIATE_ID`: あなたのAffiliate ID

#### 2. Workflowファイル作成

`.github/workflows/fanza-tracking.yml`

```yaml
name: FANZA Daily Tracking

on:
  schedule:
    # 毎日12時（UTC 3:00 = JST 12:00）
    - cron: '0 3 * * *'
  workflow_dispatch:  # 手動実行も可能

jobs:
  track-new-releases:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup jq
        run: sudo apt-get update && sudo apt-get install -y jq

      - name: Fetch FANZA new releases
        env:
          DMM_API_ID: ${{ secrets.DMM_API_ID }}
          DMM_AFFILIATE_ID: ${{ secrets.DMM_AFFILIATE_ID }}
        run: |
          chmod +x tools/fanza_fetch_new_releases.sh
          ./tools/fanza_fetch_new_releases.sh 30

      - name: Commit and push results
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/fanza/
          git diff --cached --quiet || git commit -m "chore(fanza): daily tracking $(date +%Y-%m-%d)"
          git push
```

#### 3. 手動実行テスト

GitHub Actions → FANZA Daily Tracking → Run workflow

---

## 📊 データ分析例

### 最新10件の作品タイトルを抽出

```bash
cat data/fanza/new_releases_*.json | jq -r '.result.items[].title' | head -10
```

### レビュー評価が高い作品を表示

```bash
cat data/fanza/new_releases_*.json | jq -r '.result.items[] | select(.review.average >= 4.5) | "\(.title) - \(.review.average)点"'
```

### 特定女優の作品を検索

```bash
grep -r "波多野結衣" data/fanza/*.md
```

### 月次統計（取得作品数の推移）

```bash
for file in data/fanza/new_releases_*.json; do
  DATE=$(basename "$file" .json | sed 's/new_releases_//')
  COUNT=$(jq '.result.items | length' "$file")
  echo "$DATE: $COUNT件"
done
```

---

## 🐛 トラブルシューティング

### Q1: APIエラー「Invalid API ID」

**原因**: API IDまたはAffiliate IDが間違っている

**対処**:
```bash
# 環境変数を再確認
echo $DMM_API_ID
echo $DMM_AFFILIATE_ID

# .env.fanzaを再編集
vim .env.fanza

# 再読み込み
source .env.fanza
```

---

### Q2: JSONパースエラー

**原因**: APIレスポンスが不正（rate limit等）

**対処**:
```bash
# 生のレスポンスを確認
cat data/fanza/new_releases_*.json

# エラーメッセージを確認
cat data/fanza/new_releases_*.json | jq '.result'
```

---

### Q3: 作品が0件取得される

**原因**: APIパラメータの問題

**対処**:
```bash
# スクリプト内のAPI URLを確認
cat tools/fanza_fetch_new_releases.sh | grep "API_URL"

# 手動でcurl実行してレスポンス確認
curl -s "https://api.dmm.com/affiliate/v3/ItemList?api_id=${DMM_API_ID}&affiliate_id=${DMM_AFFILIATE_ID}&site=FANZA&service=digital&floor=videoa&hits=5&sort=date&output=json" | jq .
```

---

## 📚 参考リンク

### 公式ドキュメント
- **DMM Affiliate API**: https://affiliate.dmm.com/api/
- **DMM Web API仕様**: https://affiliate.dmm.com/api/v3/

### 技術記事
- FANZAの作品データを取得（note）: https://note.com/note_kasegu/n/n0c81144bb23a
- DMM APIの使い方まとめ: https://review-of-my-life.blogspot.com/2017/09/dmm-api.html

### ツール
- jq公式: https://jqlang.github.io/jq/
- VOICEVOX: https://voicevox.hiroshiba.jp/

---

## 🔐 セキュリティ注意事項

### ❌ 絶対にやってはいけないこと

1. **API KeyをGitにコミット**
   ```bash
   # .gitignoreに必ず追加
   echo ".env.fanza" >> .gitignore
   ```

2. **公開リポジトリでSecrets未設定のまま実行**
   - GitHub ActionsでSecretsを必ず使用

3. **API Keyをログに出力**
   - エラーメッセージにAPI Keyが含まれないよう注意

### ✅ 推奨セキュリティ対策

1. **環境変数ファイルの権限設定**
   ```bash
   chmod 600 .env.fanza
   ```

2. **定期的なAPI Keyローテーション**
   - 3ヶ月ごとに再発行を推奨

3. **アクセスログの監視**
   - DMM管理画面でAPI使用状況を定期確認

---

## 🎉 完了！

これでFANZA新着作品の自動トラッキングシステムが完成しました！

**次のステップ**:
- [ ] 毎日12時にcron実行を確認
- [ ] 1週間分のデータを蓄積
- [ ] トレンド分析スクリプトを作成
- [ ] Miyabi AgentでFANZAAgent実装

**質問・問題がある場合**:
- GitHub Issue: https://github.com/ShunsukeHayashi/Miyabi/issues
- プロジェクトCLAUDE.md: `/Users/shunsuke/Dev/miyabi-private/CLAUDE.md`

---

**Happy Tracking! 🚀**
