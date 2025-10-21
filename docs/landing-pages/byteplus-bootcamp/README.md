# BytePlus Video API Bootcamp - Landing Page

## 概要

BytePlus公式パートナーが開催する動画生成API実装セミナーのランディングページです。3時間で次世代動画生成APIの実装を完全マスターするブートキャンプの集客を目的としています。

### ビジネス目標

- **API消費促進**: 2025年11月30K、12月70K契約達成
- **セミナー集客**: オンライン50名、オフライン20名の参加者獲得
- **収益化支援**: 参加者のAPI実装スキル習得とビジネス展開サポート

## 制約条件（ByteDance会議より）

- ✅ **BytePlus公式パートナー**: 使用可能
- ❌ **ByteDance名**: 使用不可
- ❌ **TikTok関連**: 言及不可
- ❌ **他社比較**: 不可

## ディレクトリ構造

```
byteplus-bootcamp/
├── index.html          # メインHTML（セマンティックHTML、12セクション構成）
├── style.css           # スタイルシート（レスポンシブデザイン、アニメーション）
├── script.js           # JavaScript機能（カウントダウン、フォーム、トラッキング）
├── README.md           # このファイル
└── images/             # 画像ディレクトリ（後で追加）
    ├── byteplus-partner-logo.svg
    ├── hero-demo.png
    ├── instructor.jpg
    ├── testimonial-1.jpg
    ├── testimonial-2.jpg
    ├── testimonial-3.jpg
    ├── og-image.png
    └── favicon.png
```

## 機能一覧

### コア機能

1. **ファーストビュー**
   - キャッチコピー: "3時間で習得 次世代動画生成API実装完全マスター"
   - CTAボタン: "今すぐ無料席を確保"
   - 残席表示（リアルタイム更新）
   - ヒーローイメージ（動画生成デモ）

2. **カウントダウンタイマー**
   - 申込締切（2025年11月10日 23:59）までのリアルタイムカウントダウン
   - 日・時間・分・秒の表示
   - スティッキーポジション（スクロールに追従）

3. **ペインポイントセクション**
   - 6つの悩みを提示（動画制作コスト、納期、API選定等）
   - カード型レイアウト
   - ホバーアニメーション

4. **ベネフィットセクション**
   - セミナーで得られる6つの特典
   - 50万トークン無料クーポン（¥50,000相当）
   - 15パターン実装コード
   - 3ヶ月サポート

5. **アジェンダセクション**
   - 3時間構成の詳細タイムテーブル
   - タイムライン型デザイン
   - トピックリスト表示

6. **講師紹介**
   - 講師プロフィール
   - 実績数値（導入支援100社以上、総収益¥500M+）
   - 5.0評価

7. **参加者の声**
   - 3名のテストセミナー参加者レビュー
   - 星5評価
   - 顔写真・名前・会社名

8. **料金プラン**
   - オンライン: ¥29,800（定員50名）
   - オフライン: ¥39,800（定員20名、残り12席）
   - プラン比較表
   - 特典一覧

9. **FAQ**
   - 8つのよくある質問
   - アコーディオン型UI
   - スムーズなアニメーション

10. **申し込みフォーム**
    - プラン選択、名前、メール、会社名、職種、参加動機
    - リアルタイムバリデーション
    - Stripe決済統合準備

11. **信頼性セクション**
    - BytePlus公式パートナーロゴ
    - 導入支援実績100社以上
    - セキュリティ・プライバシー保護

12. **最終CTA**
    - 大きなCTAボタン
    - 緊急性訴求
    - 申込締切表示

### JavaScript機能

- **カウントダウンタイマー**: リアルタイム更新（1秒ごと）
- **FAQアコーディオン**: クリックで開閉
- **スムーズスクロール**: アンカーリンク対応
- **スクロールリビール**: セクション表示時のフェードインアニメーション
- **モバイルメニュー**: ハンバーガーメニュー
- **フォームバリデーション**: リアルタイム入力チェック
- **ヘッダースクロール効果**: スクロール時の背景変化
- **プラン選択トラッキング**: Google Analytics / Facebook Pixel連携
- **UTMパラメータトラッキング**: 広告流入経路追跡
- **CTAクリックトラッキング**: ボタンクリック計測
- **セクション閲覧トラッキング**: ページ内セクション表示計測
- **ページ滞在時間トラッキング**: エンゲージメント計測
- **スクロールプログレスバー**: ページ進捗表示

### トラッキング統合

1. **Google Analytics 4**
   - ページビュー
   - イベントトラッキング（フォーム送信、CTA クリック、プラン選択等）
   - セクション閲覧
   - UTMパラメータ

2. **Facebook Pixel**
   - PageView
   - Lead（フォーム送信）
   - AddToCart（プラン選択）
   - ViewContent（CTAクリック）

3. **LinkedIn Insight Tag**
   - ページビュー
   - コンバージョントラッキング

## デプロイ手順

### 方法1: GitHub Pages（推奨）

1. **リポジトリにプッシュ**

```bash
cd /Users/shunsuke/Dev/miyabi-private
git add docs/landing-pages/byteplus-bootcamp/
git commit -m "feat: add BytePlus Video API Bootcamp landing page"
git push origin main
```

2. **GitHub Pages設定**

- リポジトリ設定 > Pages
- Source: `Deploy from a branch`
- Branch: `main` / `docs/`
- Save

3. **アクセスURL**

```
https://shunsukehayashi.github.io/Miyabi/landing-pages/byteplus-bootcamp/
```

### 方法2: Vercel

1. **Vercelにデプロイ**

```bash
cd docs/landing-pages/byteplus-bootcamp
vercel --prod
```

2. **カスタムドメイン設定**（オプション）

```
byteplus-bootcamp.example.com
```

### 方法3: Firebase Hosting

1. **Firebase CLI インストール**

```bash
npm install -g firebase-tools
firebase login
```

2. **Firebase プロジェクト初期化**

```bash
cd docs/landing-pages/byteplus-bootcamp
firebase init hosting
```

3. **デプロイ**

```bash
firebase deploy --only hosting
```

## 環境設定

### トラッキングID設定

`index.html` の以下の箇所を実際のIDに置き換えてください：

```javascript
// Google Analytics
gtag('config', 'GA_MEASUREMENT_ID'); // 実際のGA4測定IDに変更

// Facebook Pixel
fbq('init', 'YOUR_PIXEL_ID'); // 実際のPixel IDに変更

// LinkedIn Insight Tag
_linkedin_partner_id = "YOUR_PARTNER_ID"; // 実際のPartner IDに変更
```

### Stripe決済統合

`script.js` の `initFormValidation()` 関数内で、Stripe決済ページへのリダイレクトを実装してください：

```javascript
// 決済ページへリダイレクト
window.location.href = '/payment?plan=' + formData.plan;
```

または、Stripe Checkoutを直接統合：

```javascript
const stripe = Stripe('YOUR_PUBLISHABLE_KEY');
stripe.redirectToCheckout({
    lineItems: [{
        price: formData.plan === 'online' ? 'price_online_id' : 'price_offline_id',
        quantity: 1
    }],
    mode: 'payment',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel'
});
```

## 画像素材の準備

以下の画像を `images/` ディレクトリに配置してください：

| ファイル名 | サイズ推奨 | 説明 |
|-----------|----------|------|
| `byteplus-partner-logo.svg` | - | BytePlus公式パートナーロゴ |
| `hero-demo.png` | 1200x800px | ヒーローセクションのデモ画像 |
| `instructor.jpg` | 400x400px | 講師写真 |
| `testimonial-1.jpg` | 200x200px | 参加者1の写真 |
| `testimonial-2.jpg` | 200x200px | 参加者2の写真 |
| `testimonial-3.jpg` | 200x200px | 参加者3の写真 |
| `og-image.png` | 1200x630px | OGP画像（SNSシェア用） |
| `favicon.png` | 32x32px | ファビコン |

### 画像最適化

デプロイ前に画像を最適化してください：

```bash
# ImageMagick を使用（インストール必要）
convert hero-demo.png -quality 85 -strip hero-demo.png

# または TinyPNG/TinyJPG オンラインサービスを使用
# https://tinypng.com/
```

## SEO最適化

### メタタグ（実装済み）

- `<title>`: "BytePlus動画生成API実装セミナー | 3時間完全マスター"
- `<meta name="description">`: 150文字の説明文
- `<meta name="keywords">`: 関連キーワード
- OGPタグ（Facebook, Twitter Card対応）

### 構造化データ（追加推奨）

`index.html` の `<head>` に以下を追加：

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "BytePlus Video API Bootcamp",
  "startDate": "2025-11-15T10:00",
  "endDate": "2025-11-15T13:30",
  "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": [
    {
      "@type": "Place",
      "name": "東京都渋谷区〇〇ビル 5F",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "〇〇",
        "addressLocality": "渋谷区",
        "postalCode": "150-0000",
        "addressCountry": "JP"
      }
    },
    {
      "@type": "VirtualLocation",
      "url": "https://zoom.us/j/xxxxx"
    }
  ],
  "offers": [
    {
      "@type": "Offer",
      "name": "オンライン参加",
      "price": "29800",
      "priceCurrency": "JPY",
      "availability": "https://schema.org/InStock",
      "validFrom": "2025-10-01"
    },
    {
      "@type": "Offer",
      "name": "オフライン参加",
      "price": "39800",
      "priceCurrency": "JPY",
      "availability": "https://schema.org/InStock",
      "validFrom": "2025-10-01"
    }
  ],
  "organizer": {
    "@type": "Organization",
    "name": "BytePlus 公式パートナー",
    "url": "https://example.com"
  }
}
</script>
```

## パフォーマンス最適化

### Core Web Vitals 目標

- **LCP (Largest Contentful Paint)**: < 2.5秒
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### 最適化チェックリスト

- [x] CSS/JSファイルの圧縮（minify）
- [x] 画像の遅延読み込み（lazy loading）
- [x] フォントの最適化（Google Fonts preconnect）
- [ ] Critical CSSのインライン化
- [ ] 画像のWebP形式対応
- [ ] Service Worker実装（PWA対応）
- [ ] CDN配信

### Lighthouse スコア目標

- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 100
- **SEO**: 100

## A/Bテスト計画

### テスト項目

1. **ヘッドラインコピー**
   - A: "3時間で習得 次世代動画生成API実装完全マスター"
   - B: "動画制作コストを70%削減 3時間で学ぶAPI実装"

2. **CTAボタンカラー**
   - A: オレンジ（#FF6B00）
   - B: ダークレッド（#E55E00）

3. **料金表示順序**
   - A: オンライン → オフライン
   - B: オフライン → オンライン

### A/Bテスト実装

`script.js` の `initABTesting()` 関数をカスタマイズして実装：

```javascript
function initABTesting() {
    const variant = Math.random() < 0.5 ? 'A' : 'B';
    sessionStorage.setItem('ab_variant', variant);

    if (variant === 'B') {
        // バリアントBの変更を適用
        document.querySelector('.hero-title-large').textContent = '動画制作コストを70%削減 3時間で学ぶAPI実装';
    }

    // Google Analytics へバリアント送信
    gtag('event', 'experiment_impression', {
        experiment_id: 'headline_test',
        variant_id: variant
    });
}
```

## メンテナンス

### 定期更新項目

- **残席数**: `index.html` の残席表示を手動更新
- **カウントダウン締切**: `script.js` の `deadline` 変数を変更
- **参加者の声**: 新しいレビューが集まったら追加
- **料金**: プラン変更時に更新

### バックアップ

デプロイ前に必ずバックアップを取得：

```bash
cp -r docs/landing-pages/byteplus-bootcamp docs/landing-pages/byteplus-bootcamp-backup-$(date +%Y%m%d)
```

## トラブルシューティング

### カウントダウンタイマーが動かない

- ブラウザのコンソールを確認
- `script.js` が正しく読み込まれているか確認
- 締切日時が未来の日時か確認

### フォームが送信できない

- バリデーションエラーメッセージを確認
- ブラウザのコンソールでJavaScriptエラーを確認
- Stripe APIキーが正しいか確認

### 画像が表示されない

- 画像ファイルのパスを確認
- 画像ファイル名の大文字小文字を確認
- 画像ファイルが存在するか確認

### モバイルで表示が崩れる

- レスポンシブデザインのブレークポイントを確認
- `viewport` メタタグが正しいか確認
- ブラウザの開発者ツールでデバッグ

## ライセンス

このランディングページは BytePlus公式パートナー向けに作成されたものです。商用利用可能ですが、BytePlus公式パートナー以外の使用は禁止されています。

## サポート

質問や問題がある場合は、以下にお問い合わせください：

- **Email**: info@example.com
- **Slack**: #byteplus-bootcamp チャンネル
- **GitHub Issues**: https://github.com/ShunsukeHayashi/Miyabi/issues

## 変更履歴

### v1.0.0 (2025-10-21)

- 初回リリース
- HTML/CSS/JavaScript実装完了
- トラッキング統合（GA4, Facebook Pixel, LinkedIn Insight Tag）
- レスポンシブデザイン対応
- SEO最適化

---

**作成者**: Claude Code (AI Assistant)
**作成日**: 2025-10-21
**最終更新**: 2025-10-21
