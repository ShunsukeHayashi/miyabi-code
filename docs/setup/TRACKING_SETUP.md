# BytePlus Bootcamp Landing Page - トラッキング設定ガイド

**バージョン**: v1.0.0
**最終更新**: 2025-10-22
**対象ファイル**: `docs/byteplus-bootcamp-landing.html`

---

## 📊 概要

BytePlus Bootcamp Landing Pageには、以下の3つのトラッキングシステムが統合されています：

1. **Google Analytics 4 (GA4)** - ページビュー、イベント、ユーザー行動分析
2. **Facebook Pixel** - コンバージョン追跡、リターゲティング広告
3. **LinkedIn Insight Tag** - B2B追跡、LinkedIn広告最適化

---

## 🔧 セットアップ手順

### 1️⃣ Google Analytics 4 (GA4)

#### トラッキングIDの取得

1. [Google Analytics](https://analytics.google.com/)にアクセス
2. 「管理」→「データストリーム」→「ウェブ」
3. 測定IDをコピー（例: `G-ABC123DEFG`）

#### HTMLファイルの更新

**ファイル**: `docs/byteplus-bootcamp-landing.html`

**置換箇所**（2箇所）:
```html
<!-- 置換前 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
...
gtag('config', 'G-XXXXXXXXXX', {

<!-- 置換後 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123DEFG"></script>
...
gtag('config', 'G-ABC123DEFG', {
```

#### 追跡されるイベント

| イベント名 | トリガー | パラメータ |
|----------|---------|----------|
| `page_view` | ページ読み込み | `page_title`, `page_location` |
| `cta_click` | CTAボタンクリック | `event_label`, `button_location`, `value` |
| `section_view` | セクション表示（スクロール深度） | `event_label` (セクション名) |
| `feature_hover` | 機能カードホバー | `event_label` (カードタイトル) |

---

### 2️⃣ Facebook Pixel

#### Pixel IDの取得

1. [Facebook Business Manager](https://business.facebook.com/)にアクセス
2. 「イベントマネージャ」→「データソース」→「Pixel」
3. Pixel IDをコピー（例: `1234567890123456`）

#### HTMLファイルの更新

**置換箇所**（2箇所）:
```html
<!-- 置換前 -->
fbq('init', 'XXXXXXXXXXXXXXX');
...
src="https://www.facebook.com/tr?id=XXXXXXXXXXXXXXX&ev=PageView&noscript=1"/>

<!-- 置換後 -->
fbq('init', '1234567890123456');
...
src="https://www.facebook.com/tr?id=1234567890123456&ev=PageView&noscript=1"/>
```

#### 追跡されるイベント

| イベント名 | トリガー | パラメータ |
|----------|---------|----------|
| `PageView` | ページ読み込み | なし |
| `Lead` | CTAボタンクリック | `content_name`, `content_category`, `value`, `currency` |

---

### 3️⃣ LinkedIn Insight Tag

#### Partner IDの取得

1. [LinkedIn Campaign Manager](https://www.linkedin.com/campaignmanager/)にアクセス
2. 「アカウントアセット」→「Insight Tag」
3. Partner IDをコピー（例: `1234567`）

#### HTMLファイルの更新

**置換箇所**（2箇所）:
```html
<!-- 置換前 -->
_linkedin_partner_id = "XXXXXXX";
...
src="https://px.ads.linkedin.com/collect/?pid=XXXXXXX&fmt=gif" />

<!-- 置換後 -->
_linkedin_partner_id = "1234567";
...
src="https://px.ads.linkedin.com/collect/?pid=1234567&fmt=gif" />
```

#### Conversion IDの設定（オプション）

**コンバージョントラッキングを有効にする場合**:

1. LinkedIn Campaign Managerで「コンバージョン」を作成
2. Conversion IDをコピー（例: `12345678`）
3. 以下の行を更新:

```javascript
// 置換前
window.lintrk('track', { conversion_id: 12345678 });

// 置換後
window.lintrk('track', { conversion_id: 87654321 }); // あなたのConversion ID
```

---

## 🧪 動作確認

### GA4の確認

1. [Google Analytics](https://analytics.google.com/)にアクセス
2. 「リアルタイム」→「イベント」を開く
3. Landing Pageを開いてイベントが記録されるか確認

**確認項目**:
- ✅ `page_view` イベントが記録される
- ✅ CTAボタンをクリックして `cta_click` イベントが記録される
- ✅ スクロールして `section_view` イベントが記録される

### Facebook Pixelの確認

**方法1: Facebook Pixel Helper拡張機能**
1. [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)をインストール
2. Landing Pageを開く
3. 拡張機能アイコンをクリックしてイベントを確認

**方法2: イベントマネージャ**
1. [Facebook Business Manager](https://business.facebook.com/)にアクセス
2. 「イベントマネージャ」→「データソース」→「テストイベント」
3. Landing PageのURLを入力してテスト

**確認項目**:
- ✅ `PageView` イベントが記録される
- ✅ CTAボタンをクリックして `Lead` イベントが記録される

### LinkedIn Insight Tagの確認

**方法1: LinkedIn Insight Tag Helper拡張機能**
1. [LinkedIn Insight Tag Helper](https://chrome.google.com/webstore/detail/linkedin-insight-tag-help/pgkijndngddhmnkjfhiblmejabedgffp)をインストール
2. Landing Pageを開く
3. 拡張機能アイコンをクリックしてタグを確認

**方法2: ブラウザ開発者ツール**
1. 開発者ツール（F12）を開く
2. 「ネットワーク」タブを開く
3. `snap.licdn.com` へのリクエストを確認

**確認項目**:
- ✅ `insight.min.js` が読み込まれる
- ✅ `collect` リクエストが送信される

---

## 🎯 トラッキングイベント一覧

### 1. CTAボタンクリック

**トリガー**: `.cta-button` クラスのボタンクリック

**送信先**:
- GA4: `cta_click` イベント
- Facebook: `Lead` イベント
- LinkedIn: Conversion イベント

**パラメータ**:
```javascript
{
  event_category: 'engagement',
  event_label: 'ボタンのテキスト',
  button_location: 'hero' or 'cta-section',
  value: 1
}
```

### 2. セクション表示（スクロール深度）

**トリガー**: セクションが50%以上表示された時

**送信先**:
- GA4: `section_view` イベント

**パラメータ**:
```javascript
{
  event_category: 'engagement',
  event_label: 'セクション名（class名）',
  value: 1
}
```

### 3. 機能カードホバー

**トリガー**: `.feature-card` クラスの要素にマウスホバー

**送信先**:
- GA4: `feature_hover` イベント

**パラメータ**:
```javascript
{
  event_category: 'engagement',
  event_label: 'カードタイトル'
}
```

---

## 📝 カスタマイズ

### イベントの追加

新しいイベントを追加する場合は、`docs/byteplus-bootcamp-landing.html` の末尾にあるスクリプトを編集してください。

**例: フォーム送信イベント**

```javascript
// フォーム送信時のトラッキング
const form = document.querySelector('form');
form.addEventListener('submit', function(e) {
    // GA4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submit', {
            'event_category': 'conversion',
            'event_label': 'registration_form',
            'value': 1
        });
    }

    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', 'CompleteRegistration', {
            content_name: 'BytePlus Bootcamp',
            status: 'completed'
        });
    }

    // LinkedIn
    if (typeof window.lintrk !== 'undefined') {
        window.lintrk('track', { conversion_id: 12345678 });
    }
});
```

---

## 🔒 プライバシーとGDPR対応

### Cookie同意バナー（将来実装）

GDPRやCCPAに準拠するため、将来的にCookie同意バナーの実装を推奨します。

**推奨ライブラリ**:
- [CookieConsent](https://github.com/orestbida/cookieconsent)
- [Osano Cookie Consent](https://www.osano.com/cookieconsent)

**実装例**:
```html
<script src="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.js"></script>
<script>
window.cookieconsent.initialise({
  "palette": {
    "popup": { "background": "#1A1A2E" },
    "button": { "background": "#FF6B00" }
  },
  "content": {
    "message": "このサイトはCookieを使用してユーザー体験を向上させています。",
    "dismiss": "同意する",
    "link": "詳細を見る"
  }
});
</script>
```

---

## 📊 トラッキングIDの管理

**本番環境とテスト環境で異なるIDを使用することを推奨します。**

### 環境変数を使用した管理（GitHub Actions例）

**`.github/workflows/deploy-pages.yml`** に以下を追加:

```yaml
- name: Replace Tracking IDs
  run: |
    sed -i 's/G-XXXXXXXXXX/${{ secrets.GA4_TRACKING_ID }}/g' docs/byteplus-bootcamp-landing.html
    sed -i 's/XXXXXXXXXXXXXXX/${{ secrets.FACEBOOK_PIXEL_ID }}/g' docs/byteplus-bootcamp-landing.html
    sed -i 's/XXXXXXX/${{ secrets.LINKEDIN_PARTNER_ID }}/g' docs/byteplus-bootcamp-landing.html
```

**GitHub Secretsに登録**:
1. GitHub リポジトリ → Settings → Secrets → Actions
2. `GA4_TRACKING_ID`, `FACEBOOK_PIXEL_ID`, `LINKEDIN_PARTNER_ID` を登録

---

## 🐛 トラブルシューティング

### イベントが記録されない

**問題**: GA4でイベントが表示されない

**解決方法**:
1. ブラウザの開発者ツール（F12）を開く
2. コンソールに「✅ Event tracking initialized」が表示されるか確認
3. イベント発火時に「📊 Tracking: ...」がコンソールに出力されるか確認
4. ネットワークタブで `https://www.google-analytics.com/g/collect` へのリクエストを確認

### Facebook Pixelが動作しない

**問題**: Facebook Pixel Helperで「No Pixel Found」と表示される

**解決方法**:
1. Pixel IDが正しく置き換えられているか確認
2. ブラウザの広告ブロッカーを無効にする
3. キャッシュをクリアしてページを再読み込み

### LinkedInタグが動作しない

**問題**: LinkedIn Insight Tag Helperでタグが検出されない

**解決方法**:
1. Partner IDが正しく置き換えられているか確認
2. ネットワークタブで `snap.licdn.com` へのリクエストを確認
3. JavaScriptエラーがコンソールに表示されていないか確認

---

## 📈 推奨ダッシュボード設定

### GA4カスタムレポート

以下の指標を含むカスタムレポートを作成することを推奨します：

**基本指標**:
- ページビュー数
- セッション数
- 直帰率
- 平均滞在時間

**イベント指標**:
- `cta_click` 回数
- `section_view` 回数（スクロール深度）
- `feature_hover` 回数

**コンバージョンファネル**:
1. ページビュー
2. セクション表示（50%以上スクロール）
3. 機能カードホバー
4. CTAボタンクリック
5. フォーム送信（実装後）

---

## 🔗 参考リンク

### 公式ドキュメント
- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/9304153)
- [Facebook Pixel Documentation](https://developers.facebook.com/docs/facebook-pixel/)
- [LinkedIn Insight Tag Documentation](https://www.linkedin.com/help/lms/answer/a423304)

### ツール
- [Google Tag Assistant](https://tagassistant.google.com/)
- [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
- [LinkedIn Insight Tag Helper](https://chrome.google.com/webstore/detail/linkedin-insight-tag-help/pgkijndngddhmnkjfhiblmejabedgffp)

---

## 📝 変更履歴

### v1.0.0 (2025-10-22)
- ✅ GA4トラッキングコード実装
- ✅ Facebook Pixel実装
- ✅ LinkedIn Insight Tag実装
- ✅ イベントトラッキング実装（CTAクリック、スクロール深度、ホバー）
- ✅ 設定ドキュメント作成

---

**最終更新**: 2025-10-22
**作成者**: Claude Code (AI Assistant)
**Issue**: #364 (P1) - トラッキング設定
