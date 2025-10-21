# BytePlus Bootcamp - Tracking Setup Guide

トラッキング設定の完全ガイド。GA4, Facebook Pixel, LinkedIn Insight Tagの設定手順を記載。

---

## 📊 Overview

ランディングページには3つのトラッキングシステムが統合されています：

1. **Google Analytics 4 (GA4)** - サイト全体のトラフィック分析
2. **Facebook Pixel** - Facebook広告のコンバージョン計測
3. **LinkedIn Insight Tag** - LinkedIn広告のコンバージョン計測

---

## 🔧 Phase 3.1: Google Analytics 4 (GA4) Setup

### Step 1: GA4プロパティ作成

1. [Google Analytics](https://analytics.google.com/)にアクセス
2. 管理 > プロパティを作成
3. プロパティ名: `BytePlus Video API Bootcamp`
4. レポートのタイムゾーン: `日本`
5. 通貨: `日本円 (JPY)`

### Step 2: データストリーム作成

1. 管理 > データストリーム > ストリームを追加
2. プラットフォーム: `ウェブ`
3. ウェブサイトのURL: `https://shunsukehayashi.github.io`
4. ストリーム名: `BytePlus Bootcamp Landing`
5. 測定IDを取得 (例: `G-XXXXXXXXXX`)

### Step 3: index.htmlに測定IDを設定

`index.html` の以下の箇所を実際の測定IDに変更：

```html
<!-- Before -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID'); // ← ここを変更
</script>

<!-- After -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX'); // ← 実際の測定ID
</script>
```

### Step 4: イベント設定

GA4で以下のカスタムイベントが自動計測されます：

| イベント名 | トリガー | 説明 |
|-----------|---------|------|
| `page_view` | ページ読み込み | 自動計測（デフォルト） |
| `form_start` | フォーム入力開始 | script.jsで実装済み |
| `form_submit` | フォーム送信 | script.jsで実装済み |
| `scroll` | 90%スクロール | script.jsで実装済み |
| `click` | CTAClickEvent」 | script.jsで実装済み |

### Step 5: コンバージョンイベント設定

GA4管理画面で以下をコンバージョンに設定：

1. 管理 > イベント
2. `form_submit` イベントを探す
3. 「コンバージョンとしてマークを付ける」をON

### Step 6: 動作確認

1. ランディングページにアクセス
2. GA4管理画面 > リアルタイム
3. 自分のアクセスが表示されるか確認（30秒以内）

---

## 📘 Phase 3.2: Facebook Pixel Setup

### Step 1: Facebook Pixelを作成

1. [Facebook Events Manager](https://business.facebook.com/events_manager/)にアクセス
2. データソースを接続 > ウェブ > Facebook Pixelを選択
3. Pixel名: `BytePlus Bootcamp Landing`
4. ウェブサイトURL: `https://shunsukehayashi.github.io`

### Step 2: Pixel IDを取得

1. Pixelを選択
2. 設定 > Pixel ID をコピー (例: `123456789012345`)

### Step 3: index.htmlにPixel IDを設定

`index.html` の以下の箇所を実際のPixel IDに変更：

```html
<!-- Before -->
<script>
  fbq('init', 'YOUR_PIXEL_ID'); // ← ここを変更
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1" // ← ここも変更
/></noscript>

<!-- After -->
<script>
  fbq('init', '123456789012345'); // ← 実際のPixel ID
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=123456789012345&ev=PageView&noscript=1"
/></noscript>
```

### Step 4: イベント設定

Facebook Pixelで以下のイベントが計測されます：

| イベント名 | トリガー | 説明 |
|-----------|---------|------|
| `PageView` | ページ読み込み | 自動計測（デフォルト） |
| `ViewContent` | セクション表示 | script.jsで実装済み |
| `InitiateCheckout` | フォーム入力開始 | script.jsで実装済み |
| `Purchase` | フォーム送信完了 | script.jsで実装済み |

### Step 5: コンバージョンAPI設定（オプション）

より正確な計測のため、Conversions APIの設定を推奨：

1. Events Manager > Conversions API
2. サーバー側統合を設定
3. Node.jsサーバーでイベント送信実装

### Step 6: 動作確認

1. [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/)をインストール
2. ランディングページにアクセス
3. Pixel Helperアイコンをクリック
4. `PageView` イベントが計測されているか確認

---

## 💼 Phase 3.3: LinkedIn Insight Tag Setup

### Step 1: LinkedIn Insight Tagを作成

1. [LinkedIn Campaign Manager](https://www.linkedin.com/campaignmanager/)にアクセス
2. アカウント資産 > Insight Tag
3. 「Insight Tagをインストール」をクリック

### Step 2: Partner IDを取得

1. Insight Tag設定画面
2. Partner IDをコピー (例: `1234567`)

### Step 3: index.htmlにPartner IDを設定

`index.html` の以下の箇所を実際のPartner IDに変更：

```html
<!-- Before -->
<script type="text/javascript">
_linkedin_partner_id = "YOUR_PARTNER_ID"; // ← ここを変更
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script>

<!-- After -->
<script type="text/javascript">
_linkedin_partner_id = "1234567"; // ← 実際のPartner ID
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script>
```

### Step 4: コンバージョンイベント設定

LinkedIn Campaign Managerで以下をコンバージョンに設定：

1. アカウント資産 > コンバージョン
2. 「新しいコンバージョンを作成」
3. コンバージョン名: `Form Submission`
4. コンバージョンルール: URL contains `/success`
5. 保存

### Step 5: 動作確認

1. ランディングページにアクセス
2. LinkedIn Campaign Manager > Insight Tag > アクティビティ
3. 最近のアクティビティが表示されるか確認（5分以内）

---

## 🔒 Phase 3.4: Privacy & GDPR Compliance

### Cookie同意バナー実装（推奨）

EU/EEA地域からのアクセスに対応するため、Cookie同意バナーの実装を推奨：

#### オプション1: Cookiebot（推奨）

```html
<script id="Cookiebot" src="https://consent.cookiebot.com/uc.js" data-cbid="YOUR-CBID" type="text/javascript" async></script>
```

#### オプション2: OneTrust

```html
<script src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js" type="text/javascript" charset="UTF-8" data-domain-script="YOUR-DOMAIN-SCRIPT-ID"></script>
```

### プライバシーポリシー更新

`footer` セクションの「プライバシーポリシー」リンク先に以下を記載：

- 収集する情報の種類
- Cookieの使用目的
- データの保管期間
- オプトアウト方法
- GDPR/CCPA準拠の権利説明

---

## 📊 Phase 3.5: Tracking Verification Checklist

全てのトラッキングが正常に動作しているか確認：

### Google Analytics 4
- [ ] リアルタイムで自分のアクセスが表示される
- [ ] `page_view` イベントが計測される
- [ ] `form_submit` イベントが計測される
- [ ] コンバージョンが設定されている

### Facebook Pixel
- [ ] Pixel Helperで `PageView` が表示される
- [ ] `Purchase` イベントがテスト計測される
- [ ] Events Managerでアクティビティが表示される

### LinkedIn Insight Tag
- [ ] Campaign Managerでアクティビティが表示される
- [ ] コンバージョンルールが設定されている

### Privacy Compliance
- [ ] Cookie同意バナーが表示される（オプション）
- [ ] プライバシーポリシーが更新されている
- [ ] データ削除リクエスト対応フローが確立されている

---

## 🚨 Troubleshooting

### GA4が計測されない

**原因1**: 測定IDが正しくない
- 修正: `G-XXXXXXXXXX` 形式の測定IDを確認

**原因2**: Ad Blockerが動作している
- 修正: ブラウザの拡張機能を一時的に無効化

**原因3**: HTTPS必須
- 修正: GitHub Pagesは自動的にHTTPSなので問題なし

### Facebook Pixelが計測されない

**原因1**: Pixel IDが正しくない
- 修正: 15桁の数字のPixel IDを確認

**原因2**: noscriptタグのIDも変更が必要
- 修正: HTMLとnoscriptタグ両方のIDを変更

**原因3**: Cookieがブロックされている
- 修正: ブラウザのCookie設定を確認

### LinkedIn Insight Tagが計測されない

**原因1**: Partner IDが正しくない
- 修正: Campaign Managerから正しいIDをコピー

**原因2**: スクリプトの読み込み順序
- 修正: `</head>` タグ直前に配置されているか確認

---

## 📈 Expected Results

トラッキング設定完了後、以下の指標が計測可能になります：

### 集客指標
- **PV**: ページビュー数
- **UU**: ユニークユーザー数
- **セッション**: セッション数
- **直帰率**: Bounce Rate
- **平均滞在時間**: Avg. Session Duration

### コンバージョン指標
- **CVR**: コンバージョン率（フォーム送信 / PV）
- **申込数**: オンライン/オフライン別
- **平均申込額**: ￥29,800 or ￥39,800
- **収益**: 総売上金額

### チャネル分析
- **organic search**: 検索エンジン経由
- **social**: SNS経由（Facebook/Twitter/LinkedIn）
- **referral**: 外部サイト経由
- **direct**: 直接アクセス

---

## 🎯 Next Steps

トラッキング設定完了後の次のステップ：

1. **Phase 4**: Stripe決済統合
2. **Phase 5**: パフォーマンス最適化
3. **Phase 6**: A/Bテスト実装
4. **Phase 7**: 定期レポート自動化

---

**最終更新**: 2025-10-21
**担当者**: Claude Code
**レビュー**: Pending
