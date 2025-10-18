# Miyabi - 世界初のAGI OS ピッチデック

**世界を手に入れよう、1タップで。**

このディレクトリには、Miyabiの投資家向けピッチデックが含まれています。Marp（Markdown Presentation Ecosystem）を使用して、プロフェッショナルなプレゼンテーションを作成します。

## 📋 目次

- [概要](#概要)
- [必要環境](#必要環境)
- [セットアップ](#セットアップ)
- [使用方法](#使用方法)
- [ファイル構造](#ファイル構造)
- [カスタマイズ](#カスタマイズ)
- [トラブルシューティング](#トラブルシューティング)

---

## 📖 概要

このピッチデックは、以下の構成で作成されています：

- **Act 1: The Problem** - 問題の定義（4スライド）
- **Act 2: The Solution** - 解決策の提示（4スライド）
- **Act 3: The Products** - プロダクトデモ（4スライド）
- **Act 4: The Market** - 市場とタイミング（4スライド）
- **Act 5: The Team & Partnership** - チームと組織体制（3スライド）
- **Act 6: The Numbers** - 財務と成長（2スライド）
- **Act 7: The Vision** - 未来への招待（2スライド）
- **The Close** - クロージング（2スライド）
- **付録** - ワンスライド・サマリー（5スライド）

**合計：30スライド以上**

---

## 🛠️ 必要環境

### 前提条件

- **Node.js** v16.x 以上
- **npm** v7.x 以上
- **make** コマンド（オプション、Makefileを使用する場合）

### インストール確認

```bash
node --version  # v16.x 以上
npm --version   # v7.x 以上
make --version  # GNU Make または互換版
```

---

## 🚀 セットアップ

### 1. ディレクトリに移動

```bash
cd /Users/a003/dev/miyabi-private/docs/pitch-deck
```

### 2. 依存関係をインストール

**オプション A: Makefileを使用（推奨）**

```bash
make install
```

**オプション B: npmを直接使用**

```bash
npm install
```

インストールが完了すると、`@marp-team/marp-cli` がインストールされます。

---

## 📊 使用方法

### クイックスタート

すべての形式（HTML, PDF, PPTX）を一度にビルド：

```bash
make build
```

出力ファイルは `output/` ディレクトリに生成されます。

---

### 個別ビルドコマンド

#### HTML形式をビルド

ブラウザで表示可能なHTML形式を生成：

```bash
make html
# または
npm run build:html
```

**出力:** `output/miyabi-pitch-deck.html`

#### PDF形式をビルド

投資家へのメール送付や印刷用PDF：

```bash
make pdf
# または
npm run build:pdf
```

**出力:** `output/miyabi-pitch-deck.pdf`

#### PowerPoint形式をビルド

Microsoft PowerPointで編集可能なPPTX形式：

```bash
make pptx
# または
npm run build:pptx
```

**出力:** `output/miyabi-pitch-deck.pptx`

---

### 開発モード

#### ファイル監視モード

Markdownファイルを編集すると自動的にHTMLをリビルド：

```bash
make watch
# または
npm run watch
```

ターミナルで実行し続けます。変更を保存するたびに自動リビルドされます。

#### ブラウザでプレビュー

ローカルサーバーを起動してブラウザでプレビュー：

```bash
make preview
# または
npm run preview
```

ブラウザが自動的に開き、スライドショーモードでプレゼンテーションを確認できます。

---

### クリーンアップ

生成されたファイルを削除：

```bash
make clean
# または
npm run clean
```

---

## 📁 ファイル構造

```
docs/pitch-deck/
├── README.md                      # このファイル
├── miyabi-pitch-deck.md           # メインのピッチデック（Markdown）
├── package.json                   # Node.js依存関係
├── Makefile                       # ビルドコマンド
├── .gitignore                     # Git無視リスト
├── themes/
│   └── miyabi.css                 # カスタムMarpテーマ
├── assets/                        # 画像やアセット（オプション）
│   └── (SVG, PNG, etc.)
└── output/                        # 生成された出力ファイル
    ├── miyabi-pitch-deck.html
    ├── miyabi-pitch-deck.pdf
    └── miyabi-pitch-deck.pptx
```

---

## 🎨 カスタマイズ

### スライド内容の編集

`miyabi-pitch-deck.md` ファイルを編集してください。

**Markdown形式**で記述されており、以下の構文を使用：

```markdown
---
<!-- _class: slide-1 -->

# スライドタイトル

内容をここに記述...

---
```

### テーマのカスタマイズ

`themes/miyabi.css` ファイルでデザインをカスタマイズ：

```css
:root {
  --color-primary: #3498db;      /* プライマリカラー */
  --color-secondary: #2c3e50;    /* セカンダリカラー */
  --color-accent: #e74c3c;       /* アクセントカラー */
  /* ... */
}
```

### スライドクラスの使用

特定のスタイルを適用するには、`<!-- _class: クラス名 -->` を使用：

- `opening` - オープニングスライド（グラデーション背景）
- `act-title` - Act タイトルスライド
- `closing` - クロージングスライド
- `quote-slide` - 引用スライド
- `appendix` - 付録スライド
- `final` - 最終スライド

**例:**

```markdown
---
<!-- _class: opening -->

# Miyabi - 世界初のAGI OS

## 世界を手に入れよう、1タップで。
---
```

---

## 🔧 トラブルシューティング

### 問題1: `marp: command not found`

**原因:** @marp-team/marp-cli がインストールされていない

**解決策:**

```bash
npm install
```

### 問題2: PDF/PPTX生成が失敗する

**原因:** Chromeまたは Chromiumがインストールされていない可能性

**解決策:**

```bash
# macOSの場合
brew install --cask chromium

# またはGoogle Chromeをインストール
```

### 問題3: テーマが適用されない

**原因:** テーマファイルのパスが間違っている

**解決策:**

`miyabi-pitch-deck.md` の先頭で以下を確認：

```markdown
---
marp: true
theme: miyabi
---
```

そして、`themes/miyabi.css` が存在することを確認。

### 問題4: 日本語フォントが表示されない

**原因:** システムに日本語フォントがインストールされていない

**解決策:**

`themes/miyabi.css` の `font-family` を調整：

```css
--font-body: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
```

必要に応じて、Webフォントをインポート：

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&display=swap');
```

---

## 📚 参考リンク

- **Marp公式ドキュメント:** https://marp.app/
- **Marp CLI:** https://github.com/marp-team/marp-cli
- **Markdown記法:** https://www.markdownguide.org/

---

## 📧 サポート

質問や問題がある場合は、以下にお問い合わせください：

- **Email:** investor@customercloud.ai
- **GitHub Issues:** [Miyabi Repository](https://github.com/ShunsukeHayashi/Miyabi/issues)

---

## 📄 ライセンス

このピッチデックは、CUSTOMER CLOUDの所有物です。無断複製・配布を禁じます。

---

## 🚀 クイックコマンド一覧

| コマンド | 説明 |
|---------|------|
| `make install` | 依存関係をインストール |
| `make build` | すべての形式をビルド |
| `make html` | HTML形式をビルド |
| `make pdf` | PDF形式をビルド |
| `make pptx` | PPTX形式をビルド |
| `make watch` | ファイル監視モード |
| `make preview` | ブラウザでプレビュー |
| `make clean` | 生成ファイルを削除 |
| `make all` | install + build を実行 |
| `make help` | ヘルプを表示 |

---

**世界を手に入れよう、1タップで。**

**Miyabi - 世界初のAGI OS**
