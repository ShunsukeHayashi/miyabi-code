# 🚀 GitHub Actions自動実行ガイド

Miyabi開発進捗音声ガイドをGitHub Actionsで自動生成する方法

---

## 📋 概要

GitHub Actionsワークフローにより、以下のタイミングで自動的に音声ガイドを生成できます：

1. **Pushトリガー**: `main`ブランチへのpush時
2. **日次スケジュール**: 毎日18:00（JST）に自動実行
3. **手動実行**: GitHub UIから任意のタイミングで実行

---

## 🎯 ワークフロー構成

### ファイル

```
.github/workflows/miyabi-narration.yml
```

### 処理フロー

```
1. 環境セットアップ
   ├─ Python 3.11
   ├─ uv (パッケージマネージャ)
   └─ Git履歴取得

2. VOICEVOX Engine起動
   └─ Docker: voicevox/voicevox_engine:cpu-latest

3. 台本生成
   └─ Git commits → Markdown台本

4. 音声合成
   └─ VOICEVOX API → WAVファイル

5. 成果物保存
   └─ GitHub Artifacts (30日保持)
```

---

## 🚀 使用方法

### 1. 自動実行（Pushトリガー）

```bash
# mainブランチにpush
git add .
git commit -m "feat: add new feature"
git push origin main

# → 自動的にワークフローが実行される
```

**トリガー対象パス**:
- `crates/**`
- `tools/**`
- `.github/workflows/miyabi-narration.yml`

---

### 2. 手動実行（Workflow Dispatch）

#### GitHub UI から実行

1. GitHub リポジトリページを開く
2. **Actions** タブをクリック
3. 左サイドバーから **「🎤 Miyabi開発進捗 - ゆっくり解説音声ガイド自動生成」** を選択
4. 右側の **「Run workflow」** ボタンをクリック
5. オプションで `days`（収集日数）を指定
6. **「Run workflow」** をクリック

#### GitHub CLI から実行

```bash
# デフォルト（3日分）
gh workflow run miyabi-narration.yml

# 7日分を指定
gh workflow run miyabi-narration.yml -f days=7

# 14日分を指定
gh workflow run miyabi-narration.yml -f days=14
```

---

### 3. 日次自動実行（Cron Schedule）

**実行時刻**: 毎日 18:00 JST (09:00 UTC)

```yaml
schedule:
  - cron: '0 9 * * *'  # UTC 09:00 = JST 18:00
```

**スケジュール変更方法**:

`.github/workflows/miyabi-narration.yml` を編集：

```yaml
# 例: 毎日12:00 JST (03:00 UTC)
schedule:
  - cron: '0 3 * * *'

# 例: 月曜日と金曜日の18:00 JST
schedule:
  - cron: '0 9 * * 1,5'
```

**Cron構文リファレンス**:
```
* * * * *
│ │ │ │ │
│ │ │ │ └─ 曜日 (0-6: 日曜日=0)
│ │ │ └─── 月 (1-12)
│ │ └───── 日 (1-31)
│ └─────── 時 (0-23)
└───────── 分 (0-59)
```

---

## 📥 成果物のダウンロード

### GitHub UIからダウンロード

1. **Actions** タブを開く
2. 実行履歴から該当のワークフローをクリック
3. **Artifacts** セクションまでスクロール
4. **`miyabi-narration-{run_number}`** をクリックしてダウンロード

### GitHub CLIからダウンロード

```bash
# 最新のArtifactsをダウンロード
gh run list --workflow=miyabi-narration.yml --limit 1
gh run download {RUN_ID}

# ダウンロードされたファイル
ls miyabi-narration-*/
# → SUMMARY.md
# → script.md
# → voicevox_requests.json
# → audio/*.wav
```

---

## 📊 成果物の内容

### ディレクトリ構造

```
miyabi-narration-{run_number}/
├── SUMMARY.md                  # 実行サマリー
├── script.md                   # ゆっくり解説台本
├── voicevox_requests.json      # VOICEVOX APIリクエスト
└── audio/                      # 音声ファイル
    ├── speaker0_000.wav  (霊夢)
    ├── speaker1_001.wav  (魔理沙)
    └── ...
```

### SUMMARY.md

実行統計情報が含まれます：

```markdown
# 🎤 Miyabi開発進捗レポート

**生成日時**: 2025-10-23 09:00:00 UTC
**対象期間**: 過去3日分

## 📊 統計情報

- **音声ファイル数**: 14件
- **合計サイズ**: 4.2MB
- **Commit数**: 167件

## 🎬 生成された台本

...
```

---

## 🔧 カスタマイズ

### 1. 収集日数の変更

デフォルトは3日分ですが、変更可能：

```yaml
# .github/workflows/miyabi-narration.yml
workflow_dispatch:
  inputs:
    days:
      default: '7'  # 7日分に変更
```

### 2. 話者IDの変更

`yukkuri-narration-generator.py`を編集：

```python
class YukkuriScriptGenerator:
    def __init__(self):
        self.reimu_speaker_id = 3  # ずんだもん
        self.marisa_speaker_id = 6  # 四国めたん（ツンツン）
```

### 3. トリガーパスの追加

```yaml
on:
  push:
    paths:
      - 'crates/**'
      - 'tools/**'
      - 'docs/**'  # ドキュメント変更時も実行
```

### 4. Artifacts保持期間の変更

```yaml
- name: 📤 Upload Narration Output
  uses: actions/upload-artifact@v4
  with:
    retention-days: 90  # 90日間保持
```

---

## 🐛 トラブルシューティング

### Q1: ワークフローが実行されない

**原因**:
- トリガー対象パス外での変更
- ワークフローファイルの構文エラー

**対処法**:
```bash
# 手動実行で確認
gh workflow run miyabi-narration.yml

# ワークフロー構文チェック
gh workflow view miyabi-narration.yml
```

---

### Q2: Docker Engineエラー

**エラー例**:
```
Error: Cannot connect to the Docker daemon
```

**原因**: GitHub Actionsランナーは通常Dockerが利用可能ですが、稀に問題が発生

**対処法**:
```yaml
# Docker起動確認ステップを追加
- name: 🔍 Verify Docker
  run: |
    docker --version
    docker ps
```

---

### Q3: 音声合成に失敗

**エラー例**:
```
❌ VOICEVOX Engineに接続できません
```

**原因**:
- Engineの起動待機時間不足
- ネットワークエラー

**対処法**:

`.github/workflows/miyabi-narration.yml`を編集：

```yaml
# 待機時間を延長
for i in {1..60}; do  # 30 → 60秒に延長
  if curl -s http://127.0.0.1:50021/version > /dev/null; then
    break
  fi
  sleep 2
done
```

---

### Q4: Git履歴が取得できない

**エラー例**:
```
fatal: your current branch 'main' does not have any commits yet
```

**原因**: `fetch-depth: 0`が指定されていない

**対処法**:

```yaml
- name: 📥 Checkout repository
  uses: actions/checkout@v4
  with:
    fetch-depth: 0  # 必須：全履歴取得
```

---

## 📈 実行状況の確認

### ワークフロー実行履歴

```bash
# 最近の実行履歴を表示
gh run list --workflow=miyabi-narration.yml --limit 10

# 特定の実行のログを表示
gh run view {RUN_ID}

# 失敗した実行のみ表示
gh run list --workflow=miyabi-narration.yml --status failure
```

### ステップ別のログ確認

```bash
# 全ログを表示
gh run view {RUN_ID} --log

# 特定のジョブのログ
gh run view {RUN_ID} --log --job generate-narration
```

---

## 🎬 次のステップ

### Phase 9: YouTube配信自動化

生成された音声ファイルを自動的にYouTubeにアップロード：

```yaml
- name: 📤 Upload to YouTube
  env:
    YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
  run: |
    python3 tools/youtube-uploader.py \
      --video output/narration.mp4 \
      --title "Miyabi開発進捗 $(date +%Y-%m-%d)"
```

### Phase 10: Slack/Discord通知

完了通知を送信：

```yaml
- name: 📢 Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "🎤 Miyabi音声ガイド生成完了！"
      }
```

---

## 📚 参考資料

- **GitHub Actions Docs**: https://docs.github.com/actions
- **Workflow Syntax**: https://docs.github.com/actions/reference/workflow-syntax-for-github-actions
- **VOICEVOX Engine Docker**: https://hub.docker.com/r/voicevox/voicevox_engine
- **GitHub CLI**: https://cli.github.com/

---

**作成日**: 2025-10-23
**バージョン**: v1.0.0
