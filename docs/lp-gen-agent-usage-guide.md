# LPGenAgent 使用ガイド

このドキュメントは、**LPGenAgent**の使用方法を詳しく解説します。

---

## 目次

1. [概要](#概要)
2. [インストール](#インストール)
3. [基本的な使い方](#基本的な使い方)
4. [詳細な実行例](#詳細な実行例)
5. [カスタマイズ方法](#カスタマイズ方法)
6. [トラブルシューティング](#トラブルシューティング)
7. [よくある質問（FAQ）](#よくある質問faq)

---

## 概要

**LPGenAgent**は、参考URLのデザインを元に、カスタマイズされたランディングページを自動生成するAgentです。

### 主な特徴

- **高速生成**: URLを入力してから5分以内にLP完成
- **デザイン品質**: プロフェッショナルなTailwindCSSベースのデザイン
- **レスポンシブ**: モバイル・タブレット・デスクトップ全対応
- **SEO最適化**: メタタグ、OGP、構造化データ自動挿入
- **再利用性**: `content.json`で簡単に編集・再生成可能

### 対応デザインパターン

- VSL型LP（ビデオセールスレター）
- リストビルディング型（メールアドレス収集）
- ウェビナー型（イベント申込）
- SaaS型（無料トライアル）
- Eコマース型（商品販売）

---

## インストール

### 1. Miyabi CLIのインストール

```bash
# Rust版（推奨）
cargo install miyabi-cli

# または、NPM版（レガシー）
npm install -g miyabi
```

### 2. 環境変数の設定

```bash
# .envファイルに追加
echo "GITHUB_TOKEN=ghp_xxx" >> .env
echo "ANTHROPIC_API_KEY=sk-xxx" >> .env
```

### 3. プロジェクト初期化

```bash
# 新規プロジェクト
miyabi init my-lp-project
cd my-lp-project

# 既存プロジェクトに追加
cd existing-project
miyabi install
```

---

## 基本的な使い方

### ステップ1: 参考URLを用意

まず、デザインの参考にしたいランディングページのURLを用意します。

**例**:
- https://happytry-lp.site?vos=meta
- https://your-favorite-lp.com
- https://competitor-lp.example.com

### ステップ2: LPGenAgentを実行

```bash
# 基本コマンド
miyabi agent run lp-gen --reference https://happytry-lp.site?vos=meta
```

### ステップ3: 対話形式で質問に回答

Agentが以下の質問をします：

```
【質問1】サービス名を教えてください。
> 寿司マーケティング講座

【質問2】メインキャッチコピーを教えてください（30文字以内）。
> 寿司職人が教える、心を掴むストーリーテリング術

【質問3】ターゲット顧客を教えてください（3つまで）。
> 飲食店経営者, コンテンツクリエイター, 個人起業家

【質問4】アクセントカラーを選んでください。
A. 青系 B. 緑系 C. オレンジ系 D. 紫系 E. 赤系
> C
```

### ステップ4: LP自動生成

Agentが自動的に以下を生成します：

```
lp-gen-output/
├── index.html          # メインHTMLファイル
├── styles.css          # カスタムCSS
├── content.json        # コンテンツJSON
└── README.md           # 使用方法
```

### ステップ5: プレビュー確認

```bash
cd lp-gen-output
python3 -m http.server 8080

# ブラウザで開く
open http://localhost:8080
```

---

## 詳細な実行例

### 例1: 寿司マーケティング講座のLP生成

```bash
# Step 1: Agent実行
miyabi agent run lp-gen --reference https://happytry-lp.site?vos=meta

# Step 2: 質問に回答（自動プロンプト）
# サービス名: 寿司マーケティング講座
# キャッチコピー: 寿司職人が教える、心を掴むストーリーテリング術
# ターゲット: 飲食店経営者, コンテンツクリエイター, 個人起業家
# アクセントカラー: オレンジ系

# Step 3: 生成完了（5分以内）
# 出力先: ./lp-gen-output/

# Step 4: プレビュー
cd lp-gen-output
python3 -m http.server 8080
open http://localhost:8080
```

**生成結果**:
- **ファイル数**: 4ファイル（HTML, CSS, JSON, README）
- **HTML行数**: 約850行
- **CSS行数**: 約120行
- **セクション数**: 10セクション
- **Lighthouseスコア**: Performance 94, Accessibility 98, SEO 100

### 例2: SaaS無料トライアルLPの生成

```bash
miyabi agent run lp-gen --reference https://stripe.com/jp

# 質問回答
# サービス名: CloudSync Pro
# キャッチコピー: チームのファイル共有を10倍速く
# ターゲット: スタートアップ, リモートチーム, フリーランサー
# アクセントカラー: 青系
```

### 例3: Eコマース商品LPの生成

```bash
miyabi agent run lp-gen --reference https://www.shopify.com/jp/examples/beauty

# 質問回答
# サービス名: オーガニック化粧水 Pure Glow
# キャッチコピー: 100%天然成分で、輝く素肌へ
# ターゲット: 20-40代女性, 敏感肌の方, オーガニック志向
# アクセントカラー: 緑系
```

---

## カスタマイズ方法

### 方法1: `content.json`を編集して再生成

```bash
# Step 1: JSONファイルを編集
cd lp-gen-output
vim content.json

# Step 2: 再生成（10秒）
miyabi agent run lp-gen --regenerate

# Step 3: プレビュー確認
python3 -m http.server 8080
```

**編集例**:
```json
{
  "serviceName": "寿司マーケティング講座",
  "mainCatchcopy": "【新】寿司職人が教える、心を掴むストーリーテリング術",
  "subCatchcopy": "【変更】35年の経験から生まれた...",
  "features": [
    "【追加】AI活用フレームワーク",
    "動画講座60本以上",
    "個別フィードバック付き"
  ]
}
```

### 方法2: HTMLを直接編集

```bash
cd lp-gen-output
vim index.html

# 変更後、すぐにプレビュー反映（ブラウザリロード）
```

### 方法3: 複数バージョン作成（A/Bテスト）

```bash
# バージョンA（オレンジ系）
miyabi agent run lp-gen --reference https://example.com --config version-a.json

# バージョンB（青系）
miyabi agent run lp-gen --reference https://example.com --config version-b.json

# 比較
ls -la lp-gen-output-a/ lp-gen-output-b/
```

---

## トラブルシューティング

### 問題1: 参考URLが取得できない

**症状**: `Error: Failed to fetch reference URL`

**原因**:
- URLが間違っている
- サイトがアクセス制限をかけている
- ネットワーク接続が切れている

**解決策**:
```bash
# URLを再確認
curl -I https://happytry-lp.site?vos=meta

# プロキシ設定が必要な場合
export HTTP_PROXY=http://proxy.example.com:8080
miyabi agent run lp-gen --reference https://...
```

### 問題2: プレビューサーバーが起動しない

**症状**: `Error: Address already in use`

**原因**: ポート8080が既に使用中

**解決策**:
```bash
# 別のポートを使用
python3 -m http.server 8081
open http://localhost:8081

# または、既存プロセスを終了
lsof -ti:8080 | xargs kill -9
```

### 問題3: レスポンシブデザインが崩れる

**症状**: スマホ表示で要素がはみ出る

**原因**: TailwindCSS CDNが読み込まれていない

**解決策**:
```html
<!-- index.htmlの<head>内を確認 -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- もしくは、ローカルTailwindCSSを使用 -->
npm install -D tailwindcss
npx tailwindcss -o styles.css --watch
```

### 問題4: 画像が表示されない

**症状**: プレースホルダー画像が表示される

**原因**: デフォルトでは `https://via.placeholder.com` を使用

**解決策**:
```bash
# content.jsonの画像URLを実画像に差し替え
vim lp-gen-output/content.json

# 例
"heroImage": "https://your-cdn.com/hero.jpg",
"profileImage": "https://your-cdn.com/profile.jpg"
```

---

## よくある質問（FAQ）

### Q1: コーディングスキルは必要ですか？

**A1**: いいえ、一切不要です。対話形式で質問に答えるだけでLPが完成します。

### Q2: 商用利用は可能ですか？

**A2**: はい、生成されたHTMLは完全にオープンで、商用利用が可能です。クレジット表記も不要です。

### Q3: 既存のLPをリニューアルできますか？

**A3**: はい、既存LPのURLを参考URLとして指定することで、デザインを踏襲しつつコンテンツを刷新できます。

### Q4: 生成されたコードは編集できますか？

**A4**: はい、生成されたHTMLは通常のHTMLファイルなので、自由に編集可能です。

### Q5: WordPress等のCMSとの統合は？

**A5**: 現在、WordPress、Wix、Shopifyへのエクスポート機能を開発中です（2025年12月リリース予定）。

### Q6: 複数ページのサイトは作れますか？

**A6**: LPGenAgentは1ページのランディングページ専用です。複数ページのサイトは、CodeGenAgentをご利用ください。

### Q7: 独自ドメインで公開するには？

**A7**: 生成されたHTMLをFirebase Hosting、Vercel、Netlify等にデプロイしてください。

```bash
# Firebase Hostingの例
firebase init hosting
firebase deploy
```

### Q8: アニメーション追加は可能ですか？

**A8**: はい、`styles.css`にCSS animationを追加するか、AOS.js等のライブラリを統合してください。

```html
<!-- index.htmlの</body>前に追加 -->
<link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css" />
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
<script>AOS.init();</script>
```

### Q9: 多言語対応は可能ですか？

**A9**: 現在、日本語のみ対応しています。多言語対応は次期バージョン（Phase 3）で実装予定です。

### Q10: スライド形式のLPは作れますか？

**A10**: LPGenAgentは縦スクロール型LPに特化しています。スライド形式のLP（Reveal.js等）は、SlideGenAgentをご利用ください。

---

## 関連ドキュメント

- **Agent仕様書**: [lp-gen-agent.md](.claude/agents/specs/business/lp-gen-agent.md)
- **実行プロンプト**: [lp-gen-agent-prompt.md](.claude/agents/prompts/business/lp-gen-agent-prompt.md)
- **note.com記事**: [寿司次郎さんデモストーリー](../docs/note_article_sushijiro_lp_demo.md)
- **Miyabi公式ドキュメント**: [CLAUDE.md](../CLAUDE.md)

---

## コミュニティ・サポート

### Discord
Miyabiコミュニティ: https://discord.gg/miyabi

### GitHub
Issue報告・機能リクエスト: https://github.com/ShunsukeHayashi/Miyabi/issues

### メール
サポート: support@miyabi.dev

---

**最終更新日**: 2025年10月22日
**バージョン**: v1.0.0
**著者**: Miyabi Framework Team
