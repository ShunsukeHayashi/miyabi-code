# ⚡ YouTube Live Quick Start Guide
## 48時間で配信準備を完了する実行プラン

**Target**: 2025-12-08 20:00 JST Go Live
**Current**: 2025-12-07 18:30 JST
**Time Available**: 25.5 hours ⏰

---

## 🎯 TODAY (Dec 7 Evening): 3-4 hours

### Priority 1: OBS Setup (60 min)
```bash
# OBS起動
open -a OBS

# Scene作成
Scene 1: "Opening"
  - Add: Image → docs/youtube-live-slides/01-tmux-system-overview.png
  - Add: Video Capture Device (Webcam)
    - Position: Bottom-right
    - Size: 320x240 (20%)

Scene 2: "Terminal Demo"
  - Add: Window Capture → Terminal
    - Filter: "tmux"
  - Add: Video Capture Device (Webcam)
    - Position: Bottom-right
    - Size: 320x240 (20%)

Scene 3: "Slides"
  - Add: Image Slideshow
    - Folder: docs/youtube-live-slides/
    - Transition: Fade (500ms)
  - Add: Video Capture Device (Webcam)
    - Position: Bottom-left
    - Size: 240x180 (15%)

# Audio設定
Settings → Audio:
  - Mic/Auxiliary: 選択
  - Desktop Audio: 選択（音量20%）

Filters (Mic):
  - Noise Suppression
  - Noise Gate (-30dB threshold)
  - Compressor
  - Limiter

# 録画設定（バックアップ用）
Settings → Output → Recording:
  - Format: MP4
  - Encoder: Same as stream
```

**Test**:
```
1. 各シーン切り替え確認（3回）
2. マイク音声録音して再生確認
3. Webcamフレーミング確認
4. 10秒録画テスト
```

### Priority 2: GitHub Repo Setup (30 min)
```bash
# 新規リポジトリ作成
cd ~/Dev/01-miyabi/_core
mkdir miyabi-rust-claude-guide
cd miyabi-rust-claude-guide

git init
git branch -M main

# 基本ファイル作成
cat > README.md << 'EOF'
# Miyabi Rust × Claude Guide

Rust + Claude AI開発のベストプラクティス。58クレートの実績から生まれた包括的ガイド。

## 概要

このリポジトリは、YouTube Live「Rust × Claude AI開発ベストプラクティス」の
内容をまとめたものです。

### 主要コンテンツ

- `MIYABI_OVERVIEW.md`: プロジェクト概要集約戦略
- `RUST_CHEATSHEET.md`: Rustエラーハンドリングパターン
- `scripts/`: tmuxオーケストレーション
- `docs/`: 詳細ドキュメント

## クイックスタート

[TODO: 配信後に追加]

## ライセンス

MIT OR Apache-2.0

## 謝辞

[YouTube Live視聴者、Contributors]
EOF

# LICENSE作成
cat > LICENSE-MIT << 'EOF'
MIT License

Copyright (c) 2025 Miyabi Labs

[標準MITライセンステキスト]
EOF

cat > LICENSE-APACHE << 'EOF'
Apache License 2.0

[標準Apache 2.0ライセンステキスト]
EOF

# .gitignore
cat > .gitignore << 'EOF'
target/
.DS_Store
*.log
EOF

# Initial commit
git add .
git commit -m "Initial commit: Miyabi Rust × Claude Guide"

# GitHubでリポジトリ作成（gh CLI使用）
gh repo create miyabi-rust-claude-guide --public \
  --description "Rust + Claude AI Development Best Practices" \
  --source . \
  --push
```

### Priority 3: Dry Run (90 min)
```bash
# 準備
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private

# tmuxクリーンアップ
./scripts/tmux-cleanup.sh

# タイマー起動（別ターミナル）
# 90分カウントダウン
timer 90m

# 台本に沿って実演
# - Part 1: イントロ（10分）
# - Part 2: 背景説明（15分）
# - Part 3: 環境構築デモ（20分）
# - Part 4: プロトコルデモ（15分）
# - Part 5: ドキュメント（15分）
# - Part 6: OSS計画（10分）
# - Part 7: Q&A（5分）

# メモを取る
echo "改善点:" > dry_run_notes.txt
# - 時間超過した箇所
# - 説明が長すぎた部分
# - つまずいた箇所
```

**Tonight's Goal**:
```
- [ ] OBS 3シーン完成
- [ ] 音声テスト完了
- [ ] GitHub repo作成
- [ ] Dry run 1回完了
```

---

## 🌅 TOMORROW MORNING (Dec 8 AM): 2-3 hours

### Priority 4: Content Finalization (60 min)
```bash
# YouTube概要欄作成
cat > youtube_description.txt << 'EOF'
🦀 Rust × 🤖 Claude AI開発のベストプラクティスを完全公開！
58クレートの実績から生まれた、マルチエージェント開発の秘密を解説。

📌 この動画の内容
0:00 イントロ - なぜRust × Claude？
10:25 Dioxus Labs事例 - 6時間でvSphereクローン
25:45 ライブデモ - tmuxオーケストレーション環境構築
45:00 通信プロトコル - P0.2 PUSH戦略
1:00:15 ドキュメント解説 - MIYABI_OVERVIEW.md活用法
1:15:25 OSS公開計画 - コミュニティと創る未来
1:25:00 Q&A

🔗 関連リンク
GitHub (OSS公開): https://github.com/miyabi-labs/miyabi-rust-claude-guide
Dioxus Labs Reference: https://x.com/jkelleyrtp/status/1868067086705037395
Anthropic Claude Code: https://www.anthropic.com/engineering

📚 Resources
- MIYABI_OVERVIEW.md: コンテキスト集約戦略
- RUST_CHEATSHEET.md: エラーハンドリングパターン
- tmuxオーケストレーション: マルチエージェント通信

🏷️ Tags
#Rust #Claude #AI開発 #OSS #tmux #マルチエージェント #Dioxus
#プログラミング #開発効率化 #ベストプラクティス

---

Rust開発にClaude AIを活用する包括的ガイドをOSS公開。
Dioxus Labsの6時間vSphereクローン戦略を58クレートで実証。
tmux永続ペインID、P0.2通信プロトコル、overview.md戦略など、
実戦で磨かれたテクニックを完全解説します。
EOF

# サムネイル作成（Canva/Photoshop/Figma等で）
# Version A: Rust crab + Claude logo
# Version B: tmuxターミナル画面
# Version C: OSSコミュニティイメージ

# X告知ツイート作成
cat > x_announcement.txt << 'EOF'
Tweet 1 (配信30分前):
🎬 30分後、20:00からYouTube Live開始！

Rust × Claude AI開発の全てを公開
✅ 58クレートの実績
✅ tmuxオーケストレーション
✅ OSS完全公開

お見逃しなく！
[YouTube LINK]

#Rust #ClaudeAI #ライブ配信

---

Tweet 2 (配信開始時):
🔴 LIVE配信中！

Rust × Claude AI開発ベストプラクティス
今ならリアルタイムで質問できます

[YouTube LINK]

#Rust #ClaudeAI #プログラミング

---

Tweet 3 (配信終了後):
配信終了しました！ご視聴ありがとうございました🙏

📺 アーカイブ: [LINK]
🐙 GitHub公開: [LINK]

58クレートの実績を完全OSS化
Star⭐お願いします！

#Rust #ClaudeAI #OSS
EOF
```

### Priority 5: Technical Validation (45 min)
```bash
# tmux環境確認
./scripts/tmux-cleanup.sh
./scripts/init-miyabi-oss.sh

# ペインID確認
cat ~/.miyabi/pane_map.txt

# 全スクリプト権限確認
chmod +x ./scripts/*.sh
ls -la ./scripts/*.sh

# テストメッセージ送信
# （P0.2プロトコル実演用）

# OBS再確認
# - 全シーン動作
# - 音声レベル
# - Webcamフレーミング

# YouTube Studio設定
# 1. https://studio.youtube.com 開く
# 2. 左メニュー「ライブ配信」
# 3. 「作成」→「ライブ配信を開始」
# 4. タイトル設定
# 5. 説明貼り付け
# 6. サムネイルアップロード
# 7. 「子ども向けではない」選択
# 8. 「保存」
```

### Priority 6: Second Dry Run (60 min)
```bash
# 前回の改善点を反映して再実行
# より流れをスムーズに
# 時間配分を調整

# チェックポイント
# ✓ 各パート時間内に収まるか
# ✓ デモが成功するか
# ✓ 説明がわかりやすいか
# ✓ 自然な流れか
```

**Morning Goal**:
```
- [ ] YouTube概要欄完成
- [ ] サムネイル3種作成
- [ ] X告知ツイート準備
- [ ] tmux環境最終確認
- [ ] Dry run 2回目完了
```

---

## 🌆 TOMORROW AFTERNOON (Dec 8 PM): Final Prep

### 18:00 (T-2h): Environment Setup
```bash
# OBS起動
open -a OBS

# YouTube Studio確認
open "https://studio.youtube.com"

# ターミナル準備
# - フォントサイズ: 24pt
# - カラースキーム: 見やすいもの
# - tmuxセッションクリア済み

# 水・飲み物準備
# スマホをマナーモード
# 家族に告知
```

### 19:00 (T-1h): Final Check
```bash
# OBS全シーンテスト（5分）
# 音声テスト（録音→再生）（5分）
# Webcamフレーミング確認（2分）
# スライド読み込み確認（3分）

# YouTube Studio
# - ライブ配信予約確認
# - ストリームキー確認
# - Chat有効化確認

# 台本最終確認（10分）
# 深呼吸・リラックス（5分）
```

### 19:30 (T-30m): Launch Prep
```bash
# X告知ツイート投稿
# （30分前告知）

# OBS録画開始（バックアップ）

# YouTube Studio
# 「ライブ配信を開始」ボタン準備

# タイマー90分設定

# 最後のトイレ休憩
# 水を手元に配置
# 深呼吸×3
```

### 19:55 (T-5m): Final Countdown
```
- Opening slideをOBSに表示
- YouTube Studio: ライブ配信開始待機
- 深呼吸
- 笑顔の練習
- "Let's go!"
```

---

## 🚀 20:00: GO LIVE

```
[YouTube Studio] → 「ライブ配信を開始」クリック

Opening slide表示確認
Webcam確認
マイク音量確認

深呼吸

「こんばんは！Miyabiです。
今日はRust × Claude AI開発のベストプラクティスを
完全公開します。よろしくお願いします！」

[Part 1開始]
```

---

## 📋 MINIMAL CHECKLIST (必須のみ)

### 今夜（Dec 7）
```
□ OBS 3シーン作成
□ 音声テスト
□ GitHub repo作成
□ Dry run 1回
```

### 明日午前（Dec 8 AM）
```
□ YouTube概要欄
□ サムネイル1つ以上
□ tmux動作確認
□ Dry run 2回目
```

### 明日午後（Dec 8 PM）
```
□ 全シーン最終確認
□ YouTube Studio設定
□ X告知準備
□ 深呼吸
```

---

## 🎯 SUCCESS MINDSET

```
完璧である必要はない。
でも、準備は万全に。

技術的なトラブルが起きても、
それも学びの一部。

視聴者はあなたの知識と情熱を求めている。
スライドの美しさではなく。

緊張は自然。
深呼吸して、楽しもう。

あなたは58クレートを構築した。
配信なんて簡単だ。

Let's go live! 🚀
```

---

## 🆘 EMERGENCY SHORTCUTS

### 配信中に迷ったら
```
1. 深呼吸（3秒）
2. 台本を見る
3. 「次は〜について話します」
4. 続ける
```

### 技術的トラブル
```
1. チャットに「少々お待ちください」
2. 最大3分で修復試行
3. ダメなら代替手段
4. それでもダメなら正直に説明
```

### 時間超過
```
60分時点でPart 4未完了
→ Part 5スキップ、Part 6へ

75分時点でPart 6未到達
→ 残りを要約、Q&Aへ

90分
→ 終了、続きは次回
```

---

## ⏰ TIME BUDGET

```
Available: 25.5 hours
Needed:
  - OBS setup: 1h
  - GitHub: 0.5h
  - Dry run 1: 1.5h
  - Sleep: 8h
  - Morning prep: 3h
  - Dry run 2: 1h
  - Final prep: 2h
  - Buffer: 3h
  Total: 20.5h

余裕: 5 hours ✅
```

---

**Status**: READY TO START ✅

**First Action**: OBS起動して Scene 1作成

**Let's begin! 🚀**
