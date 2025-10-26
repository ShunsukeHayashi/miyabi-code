# 3分でわかるMiyabi - 動画台本

**Issue**: #344
**Status**: Phase 1 Complete (Script)
**Duration**: 3:00 (180 seconds)
**Date**: 2025-10-22

---

## 📊 動画情報

**タイトル（日本語）**:
```
3分でわかるMiyabi - 完全自律型AI開発フレームワーク
```

**タイトル（英語）**:
```
Miyabi in 3 Minutes - Fully Autonomous AI Development Framework
```

**説明文**:
```
Miyabiは、GitHub as OSアーキテクチャに基づく完全自律型AI開発フレームワークです。
Issue作成からコード実装、PR作成、デプロイまでを完全自動化します。

🎯 特徴:
- 21個の専門Agentが自律実行
- Git Worktreeベースの並列処理
- Claude Code統合でLLM活用
- GitHub Projects V2でデータ永続化

🚀 デモ: Issue #270 (TypeScript strict mode有効化) を自動処理

📚 詳細: https://github.com/ShunsukeHayashi/Miyabi
```

**タグ**:
```
#AI #Automation #GitHub #Development #Claude #Rust #OpenSource #DevOps
```

---

## 🎬 タイムライン詳細

### 0:00-0:30 イントロ（30秒）

**画面**: タイトルスライド → Miyabiロゴ → GitHub画面

**ナレーション（日本語）**:
```
開発者の皆さん、こんにちは。
今日は、Issue作成からPR完成まで完全自動化する
「Miyabi」をご紹介します。

Miyabiは21個の専門AIAgentが協力して、
あなたが寝ている間にコードを書き、
テストを実行し、Pull Requestまで作成します。
```

**Narration (English)**:
```
Hello developers!
Today, I'll introduce "Miyabi" -
a framework that automates everything from Issue creation to PR completion.

Miyabi has 21 specialized AI Agents working together
to write code, run tests, and create Pull Requests
while you sleep.
```

**字幕**:
- 0:05 "完全自律型AI開発フレームワーク"
- 0:15 "21個のAI Agent"
- 0:25 "Issue → コード → PR まで自動"

**画面遷移**:
1. (0:00-0:10) タイトルカード
2. (0:10-0:20) GitHub Issue画面
3. (0:20-0:30) Pull Request画面

---

### 0:30-1:00 インストール実演（30秒）

**画面**: ターミナル画面（フルスクリーン）

**ナレーション（日本語）**:
```
使い方は簡単です。
たった2つのコマンドでMiyabiが起動します。

まず、GitHubトークンを環境変数に設定。
次に、miyabi work-on コマンドでIssue番号を指定するだけ。

これで、Coordinatorが自動的にタスクを分解し、
専門Agentに割り振ります。
```

**Narration (English)**:
```
It's simple to use.
Just two commands to start Miyabi.

First, set your GitHub token as an environment variable.
Then, run "miyabi work-on" with an issue number.

The Coordinator automatically breaks down tasks
and assigns them to specialist agents.
```

**ターミナルコマンド（実際に入力）**:
```bash
# 1. トークン設定
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# 2. Miyabi実行
miyabi work-on 270

# 出力:
# 🚀 Let's work on it!
# 📋 Issue #270: Enable TypeScript strict mode
#
# 🔴 Coordinator - Task Decomposition
# [Task](Issue #270 Task Breakdown)
#   - [x] Issue analysis complete
#   - [ ] DAG construction
#   - [ ] Agent assignment
```

**字幕**:
- 0:35 "たった2コマンドで起動"
- 0:45 "Issue番号を指定するだけ"
- 0:55 "Coordinatorが自動分解"

**画面遷移**:
1. (0:30-0:40) ターミナル起動
2. (0:40-0:50) miyabi work-on 270 実行
3. (0:50-1:00) Coordinator出力表示

---

### 1:00-2:00 Agent実行デモ（60秒）

**画面**: ターミナル + GitHub画面（分割）

**ナレーション（日本語）**:
```
では、実際の動作を見てみましょう。
Issue #270は「TypeScript strict modeを有効化せよ」です。

まず、しきるん（Coordinator）がIssueを分析。
次に、つくるん（CodeGen）がコードを生成。
めだまん（Reviewer）が品質チェック。
最後に、まとめるん（PR Agent）がPull Requestを作成。

この間、あなたは何もする必要がありません。
全てのAgentが自動で連携して動きます。
```

**Narration (English)**:
```
Let's see it in action.
Issue #270 is "Enable TypeScript strict mode".

First, Coordinator analyzes the issue.
Next, CodeGen generates the code.
Reviewer checks the quality.
Finally, PR Agent creates a Pull Request.

You don't need to do anything.
All agents work together automatically.
```

**ターミナル出力（シミュレート）**:
```bash
🔴 Coordinator - Task Decomposition
✅ Created 4 tasks:
  1. task-270-analysis (IssueAgent)
  2. task-270-impl (CodeGenAgent)
  3. task-270-review (ReviewAgent)
  4. task-270-pr (PRAgent)

🟢 CodeGenAgent - Implementation
📝 Modified files:
  - tsconfig.json (strict: true)
  - src/types.ts (added type annotations)
  - src/utils.ts (fixed any types)

🔵 ReviewAgent - Quality Check
⭐ Quality Score: 92/100
✅ All tests passing (211 tests)
✅ Zero clippy warnings

🟡 PRAgent - Pull Request Creation
🎉 Created PR #271: feat: enable TypeScript strict mode
📊 Stats: 3 files, +45/-12 lines
```

**字幕**:
- 1:05 "しきるん: Issue分析"
- 1:20 "つくるん: コード生成"
- 1:35 "めだまん: 品質チェック"
- 1:50 "まとめるん: PR作成"

**画面遷移**:
1. (1:00-1:15) Coordinator実行
2. (1:15-1:30) CodeGen実行
3. (1:30-1:45) Reviewer実行
4. (1:45-2:00) PR画面（GitHub）

---

### 2:00-2:30 21キャラクター紹介（30秒）

**画面**: キャラクター一覧スライド

**ナレーション（日本語）**:
```
Miyabiには21個の専門Agentがいます。

開発系7個：
しきるん、つくるん、めだまん、まとめるん、
イシュまる、デプろう、フックマン。

ビジネス系14個：
起業ちゃん、マーケ太郎、セールス姫、
CRMくん、データ子、コンテンツ君、
SNS太郎、YouTube姉さん、など。

全員が協力して、あなたの開発を支援します。
```

**Narration (English)**:
```
Miyabi has 21 specialized agents.

7 Coding Agents:
Coordinator, CodeGen, Reviewer, PR Maker,
Issue Analyzer, Deployer, Hook Manager.

14 Business Agents:
Entrepreneur, Marketer, Sales, CRM, Analytics,
Content Creator, SNS Strategist, YouTuber, and more.

They all work together to support your development.
```

**スライド内容**:
```
🎮 Miyabi Agent Gallery (21キャラクター)

【Coding Agents】(7個)
🔴 しきるん (Coordinator) - タスク分解
🟢 つくるん (CodeGen) - コード生成
🔵 めだまん (Reviewer) - 品質チェック
🟡 まとめるん (PRAgent) - PR作成
🟣 イシュまる (IssueAgent) - Issue分析
🟠 デプろう (DeployAgent) - デプロイ
🔵 フックマン (HookIntegration) - ライフサイクル

【Business Agents】(14個)
💼 起業ちゃん (AIEntrepreneur) - ビジネスプラン
📊 データ子 (Analytics) - データ分析
📝 コンテンツ君 (ContentCreation) - コンテンツ制作
... (and 11 more)
```

**字幕**:
- 2:05 "開発系: 7個"
- 2:15 "ビジネス系: 14個"
- 2:25 "合計21個のAgent"

**画面遷移**:
1. (2:00-2:10) Coding Agents一覧
2. (2:10-2:20) Business Agents一覧
3. (2:20-2:30) 全Agents概観

---

### 2:30-3:00 まとめ + CTA（30秒）

**画面**: GitHub Stars画面 → README.md → ロゴ

**ナレーション（日本語）**:
```
Miyabiは完全オープンソースです。
今すぐGitHubでStarして、
あなたのプロジェクトでも試してみてください。

詳細なドキュメント、クイックスタートガイド、
そして21個のAgent仕様が全て公開されています。

さあ、AIと一緒に開発する新しい時代へ。
Miyabiで、開発をもっと楽しく、もっと速く。

ご視聴ありがとうございました！
```

**Narration (English)**:
```
Miyabi is fully open source.
Star it on GitHub now and
try it in your projects.

Detailed documentation, Quick Start guide,
and all 21 agent specifications are available.

Let's enter a new era of development with AI.
Make development more fun and faster with Miyabi.

Thank you for watching!
```

**字幕**:
- 2:35 "完全オープンソース"
- 2:45 "今すぐ試せる"
- 2:55 "Star & Fork待ってます！"

**CTA（Call to Action）**:
```
🌟 Star on GitHub
👉 https://github.com/ShunsukeHayashi/Miyabi

📚 Documentation
👉 https://github.com/ShunsukeHayashi/Miyabi/docs

🚀 Quick Start
👉 https://github.com/ShunsukeHayashi/Miyabi/QUICK_START.md
```

**画面遷移**:
1. (2:30-2:40) GitHub Repository画面
2. (2:40-2:50) README.md表示
3. (2:50-3:00) エンドカード（CTA）

---

## 🎨 ビジュアル要素

### サムネイル案（1280x720px）

**テキスト**:
```
【大きく】AI が勝手に
【大きく】コード書く時代

【小さく】3分でわかるMiyabi
```

**ビジュアル**:
- 背景: グラデーション（青→紫）
- 21キャラクターのアイコン配置
- ターミナル画面のスクリーンショット
- 矢印・動きのあるデザイン

### 字幕スタイル

**日本語字幕**:
- フォント: Noto Sans JP Bold
- サイズ: 36px
- 位置: 画面下部
- 背景: 半透明黒（80%）

**英語字幕**:
- フォント: Roboto Bold
- サイズ: 32px
- 位置: 画面下部（日本語の下）
- 背景: 半透明黒（80%）

### BGM選択

**候補**:
1. Upbeat Tech Music（YouTube Audio Library）
2. Modern Coding Vibes（無料BGM）
3. Silicon Valley Startup（フリー音源）

**要件**:
- テンポ: 120-140 BPM
- ジャンル: Electronic / Tech
- 著作権: ロイヤリティフリー

---

## 📋 必要な素材リスト

### 画面録画素材

1. **ターミナル録画** (0:30-1:00, 1:00-2:00)
   - `miyabi work-on 270` 実行
   - Agent出力表示
   - 解像度: 1920x1080
   - フォーマット: MP4

2. **GitHub画面録画** (1:45-2:00, 2:30-2:40)
   - Issue #270 表示
   - PR #271 作成画面
   - Repository画面
   - 解像度: 1920x1080
   - フォーマット: MP4

3. **スライド** (0:00-0:30, 2:00-2:30, 2:50-3:00)
   - タイトルカード
   - Agent一覧スライド
   - エンドカード（CTA）
   - 解像度: 1920x1080
   - フォーマット: PNG

### 音声素材

1. **ナレーション録音**
   - 日本語ナレーション: 3分（約600文字）
   - フォーマット: WAV (48kHz, 24bit)
   - マイク: Blue Yeti / AT2020 推奨

2. **BGM**
   - 長さ: 3分
   - フォーマット: MP3 (320kbps)
   - ソース: YouTube Audio Library

### テキスト素材

1. **字幕ファイル**
   - 日本語: SRT形式
   - 英語: SRT形式
   - タイミング: 0.5秒単位で調整

2. **YouTube説明文**
   - タイトル
   - 説明文（500文字）
   - タグ（20個）
   - リンク（3個）

---

## 🎥 撮影環境推奨設定

### ターミナル設定

**テーマ**: Tokyo Night Storm
```json
{
  "background": "#24283b",
  "foreground": "#a9b1d6",
  "cursor": "#c0caf5",
  "selection": "#33467C"
}
```

**フォント**: JetBrains Mono
```
font-family: 'JetBrains Mono'
font-size: 16px
line-height: 1.6
```

**サイズ**: 120x40 (cols x rows)

### 画面録画設定

**OBS Studio / QuickTime**:
- 解像度: 1920x1080 (Full HD)
- フレームレート: 30fps
- ビットレート: 5000 kbps
- フォーマット: MP4 (H.264)

**録画範囲**:
- ターミナルシーン: フルスクリーン
- ブラウザシーン: ウィンドウのみ

---

## ✅ チェックリスト（Phase 1完了）

### 台本・企画
- [x] タイムライン詳細作成（0:00-3:00）
- [x] ナレーション原稿（日本語 + 英語）
- [x] 字幕テキスト準備
- [x] 画面遷移設計
- [x] 必要素材リスト作成

### デモシナリオ
- [x] Issue #270 選定
- [x] Agent実行フロー設計
- [x] 期待される出力定義
- [x] エラーハンドリング計画

### ビジュアル設計
- [x] サムネイル案作成
- [x] スライドデザイン案
- [x] 字幕スタイル定義
- [x] 画面録画設定推奨

---

## 📊 期待される成果

**視聴者の理解度向上**:
- Before: 7.5/10
- After: 9.0/10 (予測)

**GitHub Star数**:
- Current: ~50 Stars
- Target: 150+ Stars (3倍増)

**初心者のハードル**:
- Before: 難しい（文章のみ）
- After: 簡単（動画でわかる）

**SEO効果**:
- YouTube検索: "AI開発フレームワーク"で上位表示
- Google検索: 動画リッチスニペット表示

---

## 🚀 次のステップ（Phase 2-4）

### Phase 2: 収録（人間実行）
1. ターミナル画面録画
2. GitHub画面録画
3. ナレーション録音
4. BGM選定

### Phase 3: 編集（人間実行）
1. 動画編集（iMovie / DaVinci Resolve）
2. 字幕追加（日本語 + 英語）
3. BGM追加・音量調整
4. サムネイル作成（Canva）

### Phase 4: 公開（人間実行）
1. YouTube公開
2. GIF変換（ezgif.com）
3. README.md更新
4. Asciinema録画 + 公開

---

**Created by**: Claude Code (AI Assistant)
**Date**: 2025-10-22
**Status**: Phase 1 Complete - Ready for Phase 2 (Human Execution)
