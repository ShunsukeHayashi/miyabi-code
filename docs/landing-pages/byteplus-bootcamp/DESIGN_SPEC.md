# BytePlus Video API Bootcamp - Design Specification

## デザインコンセプト

「信頼性」「高速性」「実装の容易さ」を表現したモダンでクリーンなデザイン

## カラーパレット

### Primary Colors

- **Primary Orange**: `#FF6B00` - BytePlusブランドカラー、CTA、アクセント
- **Primary Dark**: `#E55E00` - ホバー時、強調表示
- **Primary Light**: `#FF8533` - 背景、バッジ

### Secondary Colors

- **Secondary**: `#1A1A2E` - ヘッドライン、濃いテキスト
- **Accent**: `#16213E` - サブヘッドライン、セカンダリボタン

### Neutral Colors

- **Text**: `#333333` - 本文テキスト
- **Text Light**: `#666666` - サブテキスト
- **Text Lighter**: `#999999` - キャプション
- **Background**: `#FFFFFF` - 白背景
- **Background Light**: `#F8F9FA` - セクション背景
- **Background Dark**: `#1A1A2E` - フッター背景
- **Border**: `#E0E0E0` - ボーダー

### Status Colors

- **Success**: `#28A745` - 成功、チェックマーク
- **Warning**: `#FFC107` - 警告
- **Danger**: `#DC3545` - エラー、緊急性

## タイポグラフィ

### Font Families

- **Primary**: `'Noto Sans JP', sans-serif` - 本文、日本語
- **Secondary**: `'Inter', sans-serif` - 数字、英語

### Font Sizes

| 要素 | サイズ | 用途 |
|------|--------|------|
| Hero Title | 3.5rem (56px) | ファーストビューのメインタイトル |
| Section Title | 2.5rem (40px) | セクションタイトル |
| Card Title | 1.5rem (24px) | カードタイトル |
| Body | 1rem (16px) | 本文 |
| Small | 0.875rem (14px) | キャプション、注釈 |

### Font Weights

- **Regular**: 400 - 本文
- **Medium**: 500 - サブヘッドライン
- **Bold**: 700 - 見出し
- **Black**: 900 - メインタイトル

## レイアウト

### グリッドシステム

- **Container Max Width**: 1200px
- **Grid Columns**: 12カラム
- **Gutter**: 24px (1.5rem)

### セクション構成

#### 1. ヘッダー（Header）

```
+---------------------------------------+
| [Logo]              [Nav] [CTA Button] |
+---------------------------------------+
```

- **高さ**: 70px
- **背景**: 半透明白（rgba(255, 255, 255, 0.98)）
- **シャドウ**: あり
- **スティッキー**: 固定

#### 2. ファーストビュー（Hero）

```
+---------------------------------------+
| [Badge]                               |
| [Hero Title]                [Hero    |
| [Subtitle]                   Image]   |
| [Features x 3]                        |
| [CTA Button]                          |
| [Remaining Seats]                     |
+---------------------------------------+
```

- **レイアウト**: 2カラム（テキスト + 画像）
- **背景**: グラデーション（#F8F9FA → #FFFFFF）

#### 3. カウントダウンバー（Countdown Bar）

```
+---------------------------------------+
| 申込締切まで [00:00:00:00]             |
+---------------------------------------+
```

- **背景**: グラデーション（Primary Orange）
- **スティッキー**: 固定（top: 70px）

#### 4. ペインポイント（Pain Points）

```
+---------------------------------------+
| [Section Title]                       |
| [Card] [Card] [Card]                  |
| [Card] [Card] [Card]                  |
+---------------------------------------+
```

- **レイアウト**: 3カラムグリッド（レスポンシブ）
- **カード**: 白背景、シャドウ、ホバーアニメーション

#### 5. ベネフィット（Benefits）

```
+---------------------------------------+
| [Section Title]                       |
| [Card] [Card] [Card]                  |
| [Card] [Card] [Card]                  |
+---------------------------------------+
```

- **レイアウト**: 3カラムグリッド
- **背景**: #F8F9FA

#### 6. アジェンダ（Agenda）

```
+---------------------------------------+
| [Section Title]                       |
| [Time] ----O---- [Content]            |
| [Time] ----O---- [Content]            |
| [Time] ----O---- [Content]            |
| [Time] ----O---- [Content]            |
+---------------------------------------+
```

- **レイアウト**: タイムライン型
- **縦線**: Primary Orange、左側配置

#### 7. 講師紹介（Instructor）

```
+---------------------------------------+
| [Section Title]                       |
| [Photo] | [Name]                      |
|         | [Title]                     |
|         | [Bio]                       |
|         | [Achievements x 3]          |
+---------------------------------------+
```

- **レイアウト**: 2カラム（写真 + テキスト）
- **背景**: #F8F9FA

#### 8. 参加者の声（Testimonials）

```
+---------------------------------------+
| [Section Title]                       |
| [Card] [Card] [Card]                  |
+---------------------------------------+
```

- **レイアウト**: 3カラムグリッド
- **カード**: 星評価、引用文、著者情報

#### 9. 料金プラン（Pricing）

```
+---------------------------------------+
| [Section Title]                       |
| [Plan Card]     [Plan Card]           |
|                 (人気バッジ)           |
+---------------------------------------+
```

- **レイアウト**: 2カラムグリッド
- **背景**: #F8F9FA
- **人気プラン**: ボーダー、バッジ強調

#### 10. FAQ

```
+---------------------------------------+
| [Section Title]                       |
| [Question] [+]                        |
| [Question] [+]                        |
| [Question] [+]                        |
+---------------------------------------+
```

- **レイアウト**: 1カラム、アコーディオン
- **アニメーション**: スムーズな開閉

#### 11. 申し込みフォーム（Registration）

```
+---------------------------------------+
| [Section Title]                       |
| [Info] | [Form]                       |
|        | [プラン選択]                  |
|        | [名前]                        |
|        | [メール]                      |
|        | [会社名]                      |
|        | [職種]                        |
|        | [参加動機]                    |
|        | [規約同意]                    |
|        | [送信ボタン]                  |
+---------------------------------------+
```

- **レイアウト**: 2カラム（詳細 + フォーム）
- **背景**: #F8F9FA

#### 12. フッター（Footer）

```
+---------------------------------------+
| [Info] [Links] [Legal] [Contact]     |
| [Copyright]                           |
+---------------------------------------+
```

- **背景**: #1A1A2E（ダーク）
- **テキスト**: 白

## アニメーション

### トランジション速度

- **Fast**: 150ms - ホバー、クリック
- **Normal**: 300ms - カード、アコーディオン
- **Slow**: 500ms - ページ遷移

### アニメーション種類

#### フェードイン

```css
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

#### フロート

```css
@keyframes float {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-20px);
    }
}
```

#### スクロールリビール

- **IntersectionObserver** 使用
- **閾値**: 10%
- **rootMargin**: -50px

## レスポンシブデザイン

### ブレークポイント

| サイズ | 幅 | 備考 |
|--------|-----|------|
| Desktop | 1200px+ | デフォルト |
| Tablet | 768px - 1199px | 2カラム → 1カラム |
| Mobile | ~767px | 全て1カラム |

### モバイル対応

- **ヘッダー**: ハンバーガーメニュー
- **ヒーロー**: 画像を上に配置、テキストを下に配置
- **グリッド**: 3カラム → 1カラム
- **フォント**: clamp() 関数で可変サイズ
- **タッチ**: 44px以上のタップターゲット

## シャドウ

### レベル

- **sm**: `0 1px 2px rgba(0, 0, 0, 0.05)` - 軽いシャドウ
- **md**: `0 4px 6px rgba(0, 0, 0, 0.07)` - 標準シャドウ
- **lg**: `0 10px 15px rgba(0, 0, 0, 0.1)` - 強いシャドウ
- **xl**: `0 20px 25px rgba(0, 0, 0, 0.15)` - 最も強いシャドウ

## ボーダー半径

- **sm**: 4px - ボタン、入力フィールド
- **md**: 8px - カード、画像
- **lg**: 12px - 大きなカード
- **xl**: 16px - ヒーロー画像
- **full**: 9999px - バッジ、丸ボタン

## アイコン

### 絵文字アイコン（簡易版）

現在は絵文字を使用していますが、本番環境では以下のアイコンライブラリへの置き換えを推奨：

- **Font Awesome**: https://fontawesome.com/
- **Heroicons**: https://heroicons.com/
- **Material Icons**: https://fonts.google.com/icons

### アイコン置き換え例

```html
<!-- 現在（絵文字） -->
<span class="hero-feature-icon">🎁</span>

<!-- 推奨（Font Awesome） -->
<i class="fas fa-gift hero-feature-icon"></i>
```

## 画像ガイドライン

### ファイル形式

- **写真**: JPEG / WebP
- **ロゴ**: SVG / PNG
- **アイコン**: SVG

### 最適化

- **圧縮**: TinyPNG / ImageOptim
- **レスポンシブ**: `srcset` 属性使用
- **遅延読み込み**: `loading="lazy"` 属性使用

### 推奨サイズ

| 画像 | サイズ | 形式 |
|------|--------|------|
| Hero | 1200x800px | JPEG/WebP |
| 講師写真 | 400x400px | JPEG |
| 参加者写真 | 200x200px | JPEG |
| OGP画像 | 1200x630px | PNG |
| Favicon | 32x32px | PNG/ICO |

## アクセシビリティ

### WCAG 2.1 AA準拠

- **コントラスト比**: 4.5:1以上（テキスト）
- **フォーカス**: 明確なフォーカスインジケーター
- **キーボード**: 全機能キーボード操作可能
- **alt属性**: 全画像に適切なalt属性
- **ARIA**: 必要に応じてARIAラベル使用

### セマンティックHTML

- `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` 使用
- 見出しレベル（h1-h6）の適切な階層
- `<button>` vs `<a>` の適切な使い分け

## パフォーマンス

### 目標

- **初期ロード**: < 3秒（3G回線）
- **Lighthouse Performance**: 90+
- **ファーストビュー**: < 1.5秒

### 最適化手法

- CSS/JSの圧縮（minify）
- 画像の遅延読み込み
- Critical CSSのインライン化
- フォントのpreconnect
- CDN配信

## ブラウザサポート

### 対応ブラウザ

- **Chrome**: 最新2バージョン
- **Firefox**: 最新2バージョン
- **Safari**: 最新2バージョン
- **Edge**: 最新2バージョン
- **iOS Safari**: iOS 14+
- **Chrome Mobile**: Android 10+

### Polyfill不要

モダンブラウザのみ対応のため、Polyfillは不要。

## デザインシステムファイル

### Figma（推奨）

デザインカンプをFigmaで作成する場合の推奨構造：

```
BytePlus Bootcamp LP
├── 🎨 Styles
│   ├── Colors
│   ├── Typography
│   └── Effects (Shadows)
├── 📐 Components
│   ├── Buttons
│   ├── Cards
│   ├── Forms
│   └── Icons
└── 📄 Pages
    ├── Desktop (1920px)
    ├── Tablet (768px)
    └── Mobile (375px)
```

### Adobe XD / Sketch

上記と同様の構造で作成可能。

## 実装ノート

### CSS変数の活用

全ての色、サイズ、スペーシングはCSS変数で管理されているため、テーマ変更が容易：

```css
:root {
    --color-primary: #FF6B00;
    --spacing-md: 1.5rem;
    --radius-lg: 12px;
}
```

### BEM命名規則

クラス名はBEM（Block Element Modifier）に準拠：

```html
<div class="hero">
    <h1 class="hero-title hero-title--large">Title</h1>
    <button class="cta-button cta-button--primary">CTA</button>
</div>
```

### モバイルファースト

CSSはモバイルファーストで記述：

```css
/* モバイル（デフォルト） */
.hero-content {
    grid-template-columns: 1fr;
}

/* デスクトップ */
@media (min-width: 768px) {
    .hero-content {
        grid-template-columns: 1fr 1fr;
    }
}
```

---

**作成者**: Claude Code (AI Assistant)
**作成日**: 2025-10-21
**バージョン**: v1.0.0
