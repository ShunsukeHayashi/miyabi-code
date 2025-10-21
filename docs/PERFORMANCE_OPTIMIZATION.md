# BytePlus Bootcamp Landing Page - パフォーマンス最適化ガイド

**バージョン**: v1.0.0
**最終更新**: 2025-10-22
**対象ファイル**: `docs/byteplus-bootcamp-landing.html`
**目標**: Lighthouse スコア 90+達成

---

## 📊 最適化概要

BytePlus Bootcamp Landing Pageに実装されたパフォーマンス最適化のすべて。

### 目標指標

| カテゴリ | 目標スコア | 現状 |
|---------|----------|------|
| **Performance** | 90+ | 測定中 |
| **Accessibility** | 90+ | 測定中 |
| **Best Practices** | 90+ | 測定中 |
| **SEO** | 90+ | 測定中 |

---

## ✅ 実装済み最適化

### 1️⃣ リソースヒント（Resource Hints）

**目的**: 外部リソースの読み込みを高速化

#### preconnect

DNS解決、TCPハンドシェイク、TLSネゴシエーションを事前に実行します。

```html
<link rel="preconnect" href="https://www.googletagmanager.com">
<link rel="preconnect" href="https://www.google-analytics.com">
<link rel="preconnect" href="https://connect.facebook.net">
<link rel="preconnect" href="https://snap.licdn.com">
```

**効果**: 外部スクリプト（GA4, Facebook Pixel, LinkedIn）の読み込み時間を短縮

#### dns-prefetch

DNS解決のみを事前に実行します（preconnectのフォールバック）。

```html
<link rel="dns-prefetch" href="https://www.googletagmanager.com">
<link rel="dns-prefetch" href="https://www.google-analytics.com">
<link rel="dns-prefetch" href="https://connect.facebook.net">
<link rel="dns-prefetch" href="https://snap.licdn.com">
```

**効果**: 古いブラウザでもDNS解決を高速化

---

### 2️⃣ メタタグ最適化

#### theme-color

モバイルブラウザのテーマカラーを設定。

```html
<meta name="theme-color" content="#FF6B00">
```

**効果**: ブランドカラー統一、ネイティブアプリ風UI

#### モバイルアプリメタタグ

```html
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

**効果**: ホーム画面追加時のUX向上

#### Open Graph（OG）タグ

SNSシェア時の表示最適化。

```html
<meta property="og:title" content="BytePlus Video AI Bootcamp 2025">
<meta property="og:description" content="3時間で習得する次世代動画生成API実装">
<meta property="og:type" content="website">
<meta property="og:url" content="https://shunsukehayashi.github.io/miyabi-private/byteplus-bootcamp-landing.html">
<meta property="og:image" content="https://shunsukehayashi.github.io/miyabi-private/assets/byteplus-bootcamp-og.png">
```

**効果**: Facebook/LinkedIn等でのシェア時の見栄え向上

#### Twitter Card

Twitter シェア時の表示最適化。

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="BytePlus Video AI Bootcamp 2025">
<meta name="twitter:description" content="3時間で習得する次世代動画生成API実装">
<meta name="twitter:image" content="https://shunsukehayashi.github.io/miyabi-private/assets/byteplus-bootcamp-og.png">
```

**効果**: Twitter シェア時の大きな画像表示

---

### 3️⃣ フォント最適化

#### システムフォントスタック使用

外部フォントの読み込みを回避し、システムフォントを使用。

```css
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", sans-serif;
}
```

**システムフォント一覧**:
- `-apple-system`: macOS/iOS
- `BlinkMacSystemFont`: Chrome/Edge on macOS
- `"Segoe UI"`: Windows
- `"Noto Sans JP"`: Android（日本語）
- `sans-serif`: フォールバック

**効果**:
- ✅ 外部フォント読み込み時間ゼロ
- ✅ FOUT（Flash of Unstyled Text）なし
- ✅ CLS（Cumulative Layout Shift）最小化

---

### 4️⃣ スクリプト最適化

#### 非同期読み込み（async）

Google Analytics、トラッキングスクリプトを非同期読み込み。

```html
<!-- GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>

<!-- Facebook Pixel -->
<script>
    !function(f,b,e,v,n,t,s) {
        ...
        t.async=!0;  // async設定
        ...
    }(window, document,'script', 'https://connect.facebook.net/en_US/fbevents.js');
</script>

<!-- LinkedIn -->
<script type="text/javascript">
    (function(l) {
        ...
        b.async = true;  // async設定
        ...
    })(window.lintrk);
</script>
```

**効果**: メインスレッドをブロックせずにスクリプト実行

---

### 5️⃣ CSS最適化

#### インライン化

CSSを`<style>`タグ内に埋め込み、外部CSSファイルの読み込みを回避。

```html
<style>
    /* 全スタイルをインライン化 */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ...; }
    .hero { background: ...; }
    ...
</style>
```

**効果**:
- ✅ HTTP リクエスト数削減
- ✅ レンダリングブロッキング削減
- ✅ 初回表示時間（FCP）短縮

#### アニメーション最適化

GPUアクセラレーションを活用。

```css
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);  /* transform使用 */
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.feature-card:hover {
    transform: translateY(-10px);  /* transform使用 */
}
```

**効果**: スムーズなアニメーション、Jankなし

---

## 📐 Lighthouse測定方法

### オンライン測定

**PageSpeed Insights**（推奨）:
1. https://pagespeed.web.dev/ にアクセス
2. URLを入力: `https://shunsukehayashi.github.io/miyabi-private/byteplus-bootcamp-landing.html`
3. 「分析」をクリック
4. スコアを確認

### ローカル測定

**Chrome DevTools**:
1. Chrome で Landing Page を開く
2. 開発者ツール（F12）を開く
3. 「Lighthouse」タブを選択
4. 「レポートを生成」をクリック

**Lighthouse CLI**:
```bash
npm install -g lighthouse

# デスクトップ測定
lighthouse https://shunsukehayashi.github.io/miyabi-private/byteplus-bootcamp-landing.html \
  --view \
  --output=html \
  --output-path=./lighthouse-report.html

# モバイル測定
lighthouse https://shunsukehayashi.github.io/miyabi-private/byteplus-bootcamp-landing.html \
  --emulated-form-factor=mobile \
  --view
```

---

## 🎯 最適化推奨事項（未実装）

### 1️⃣ 画像最適化（優先度: 高）

#### WebP形式への変換

**現状**: PNG/JPEG使用（OG画像のみ）

**推奨**:
```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="..." loading="lazy">
</picture>
```

**効果**: ファイルサイズ25-35%削減

#### 遅延ロード（Lazy Loading）

**推奨**:
```html
<img src="hero-bg.jpg" alt="..." loading="lazy">
```

**効果**: 初回ロード時間短縮

#### レスポンシブ画像

**推奨**:
```html
<img srcset="image-320w.jpg 320w,
             image-640w.jpg 640w,
             image-1280w.jpg 1280w"
     sizes="(max-width: 768px) 100vw, 50vw"
     src="image-640w.jpg"
     alt="...">
```

**効果**: デバイスに最適なサイズを配信

---

### 2️⃣ CDN導入（優先度: 中）

#### GitHub Pages + Cloudflare

**手順**:
1. Cloudflare アカウント作成
2. DNS設定変更
3. キャッシュルール設定

**推奨キャッシュ設定**:
```
# HTML: 1時間
Cache-Control: public, max-age=3600

# CSS/JS: 1年
Cache-Control: public, max-age=31536000, immutable

# 画像: 1ヶ月
Cache-Control: public, max-age=2592000
```

**効果**: グローバルでの読み込み高速化

---

### 3️⃣ Critical CSS抽出（優先度: 中）

#### Above-the-fold CSS

初回表示に必要な最小限のCSSをインライン化。

**ツール**:
- [Critical](https://github.com/addyosmani/critical)
- [PurgeCSS](https://purgecss.com/)

**実装例**:
```html
<head>
    <style>
        /* Critical CSS（Above-the-fold） */
        .hero { ... }
        .cta-button { ... }
    </style>
</head>
<body>
    ...
    <!-- 残りのCSSは遅延ロード -->
    <link rel="preload" href="styles-deferred.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
</body>
```

**効果**: FCP（First Contentful Paint）改善

---

### 4️⃣ Service Worker導入（優先度: 低）

#### オフライン対応

**実装**:
```javascript
// sw.js
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('v1').then(function(cache) {
            return cache.addAll([
                '/byteplus-bootcamp-landing.html',
                // 他のアセット
            ]);
        })
    );
});
```

**効果**: オフライン表示、リピート訪問時の高速化

---

## 📊 パフォーマンス指標

### Core Web Vitals

**LCP（Largest Contentful Paint）**:
- **目標**: 2.5秒以下
- **測定要素**: Hero画像またはHeadline
- **最適化**: 画像最適化、preconnect

**FID（First Input Delay）**:
- **目標**: 100ms以下
- **測定要素**: ボタンクリック応答
- **最適化**: JavaScript最適化、遅延ロード

**CLS（Cumulative Layout Shift）**:
- **目標**: 0.1以下
- **測定要素**: レイアウトシフト
- **最適化**: 画像サイズ指定、システムフォント使用

---

## 🐛 トラブルシューティング

### スコアが90未満の場合

#### Performance < 90

**原因**:
- JavaScript実行時間が長い
- 画像サイズが大きい
- レンダリングブロックリソース

**解決方法**:
1. 画像をWebPに変換
2. 遅延ロード実装
3. 未使用のJavaScriptを削除

#### Accessibility < 90

**原因**:
- altテキストがない
- コントラスト比不足
- フォームラベルがない

**解決方法**:
1. 全画像にaltテキスト追加
2. 色のコントラスト比を4.5:1以上に
3. フォーム要素にlabel追加

#### Best Practices < 90

**原因**:
- HTTPSでない
- コンソールエラーがある
- 古いJavaScript APIを使用

**解決方法**:
1. HTTPS確認（GitHub Pagesは自動）
2. コンソールエラーを修正
3. 最新APIに更新

#### SEO < 90

**原因**:
- メタタグ不足
- モバイル非対応
- robots.txtがない

**解決方法**:
1. titleとdescriptionを追加（実装済み）
2. viewportメタタグ追加（実装済み）
3. robots.txt作成（オプション）

---

## 📈 継続的モニタリング

### 自動測定

#### GitHub Actions統合

**`.github/workflows/lighthouse-ci.yml`**（将来実装）:
```yaml
name: Lighthouse CI

on:
  push:
    branches:
      - main
    paths:
      - 'docs/byteplus-bootcamp-landing.html'

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://shunsukehayashi.github.io/miyabi-private/byteplus-bootcamp-landing.html
          uploadArtifacts: true
          temporaryPublicStorage: true
```

**効果**: プッシュ時に自動スコア測定

---

## 🔗 参考リソース

### 公式ドキュメント
- [Web.dev - Lighthouse](https://web.dev/lighthouse-performance/)
- [Web.dev - Core Web Vitals](https://web.dev/vitals/)
- [MDN - Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)

### ツール
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Chrome DevTools Lighthouse](https://developer.chrome.com/docs/lighthouse/)

### ベストプラクティス
- [Google - Web Fundamentals](https://developers.google.com/web/fundamentals/)
- [Smashing Magazine - Performance](https://www.smashingmagazine.com/category/performance/)

---

## 📝 変更履歴

### v1.0.0 (2025-10-22)
- ✅ リソースヒント実装（preconnect + dns-prefetch）
- ✅ メタタグ最適化（theme-color, OG, Twitter Card）
- ✅ システムフォント使用確認
- ✅ スクリプト非同期読み込み確認
- ✅ CSS インライン化確認
- ✅ パフォーマンス最適化ドキュメント作成

---

## 🎯 次のステップ

1. **PageSpeed Insights測定** ⭐⭐⭐
   - 現在のスコアを確認
   - ボトルネックを特定

2. **画像最適化** ⭐⭐⭐
   - OG画像の作成
   - WebP形式への変換
   - 遅延ロード実装

3. **Lighthouse CI導入** ⭐⭐
   - GitHub Actions統合
   - 自動スコア測定

4. **CDN導入** ⭐
   - Cloudflare設定
   - キャッシュルール最適化

---

**最終更新**: 2025-10-22
**作成者**: Claude Code (AI Assistant)
**Issue**: #366 (P1) - パフォーマンス最適化
