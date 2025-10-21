---
marp: true
theme: default
paginate: true
backgroundColor: #fff
color: #333
style: |
  section {
    font-family: 'Noto Sans JP', 'Inter', sans-serif;
    font-size: 28px;
  }
  h1 {
    color: #FF6B00;
    font-size: 48px;
    font-weight: bold;
  }
  h2 {
    color: #1A1A2E;
    font-size: 36px;
    font-weight: bold;
  }
  h3 {
    color: #FF6B00;
    font-size: 28px;
  }
  strong {
    color: #FF6B00;
  }
  ul {
    line-height: 1.8;
  }
  table {
    font-size: 22px;
  }
  code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 20px;
  }
---

<!-- _class: lead -->

# Part 3: BytePlus API概要

## TikTok技術基盤の動画生成API

<br>

**BytePlus Video AI Bootcamp 2025**

<!--
**スピーカーノート**:
- Part 3ではBytePlus APIの詳細を解説します
- 想定所要時間: 25分（25スライド）
- 「TikTok技術基盤」を強調して競争優位性を訴求
- 技術仕様を具体的に説明し、実装イメージを持ってもらう
-->

---

# Part 3のアジェンダ

<br>

| 項目 | 内容 |
|------|------|
| **1. API概要** | アーキテクチャ、技術基盤 |
| **2. コア機能** | Text-to-Video、Image-to-Video、Video Editing |
| **3. 技術仕様** | 解像度、フォーマット、生成速度 |
| **4. API仕様** | 認証、エンドポイント、レスポンス |
| **5. SDK** | 5言語対応（Python, Node.js, Go, Java, PHP） |
| **6. 統合例** | 既存システムとの連携 |

<!--
**スピーカーノート**:
- Part 3は6つのセクションで構成されています
- 想定所要時間: 2分
- 「技術的な内容ですが、実装の具体的なイメージを持っていただけます」
- 「コードサンプルも多数用意しています」
-->

---

# 1. BytePlus API概要

<br>

## TikTok技術基盤の動画生成API

<br>

- **開発元**: ByteDance（TikTok親会社）
- **技術基盤**: TikTokの動画処理エンジン
- **月間ユーザー**: **15億人**が利用する技術
- **処理量**: **毎日10億本以上**の動画を処理
- **強み**: **推薦アルゴリズム**と**リアルタイムエフェクト**

<br>

🚀 **世界最大規模の動画プラットフォーム技術を企業向けに提供**

<!--
**スピーカーノート**:
- BytePlus APIの概要を説明します
- 想定所要時間: 3分
- 「BytePlusはTikTok親会社ByteDanceが提供する企業向けAPIです」
- 「月間15億人が利用するTikTokの動画処理技術を応用しています」
- 「毎日10億本以上の動画を処理する実績のある技術です」
-->

---

# アーキテクチャ概要

<br>

```
クライアント（Web/Mobile/Server）
        ↓
    REST API / GraphQL
        ↓
BytePlus Video API Gateway（認証・ルーティング）
        ↓
┌────────────────┬────────────────┬────────────────┐
│ Text-to-Video  │ Image-to-Video │ Video Editing  │
│ Engine         │ Engine         │ Engine         │
└────────────────┴────────────────┴────────────────┘
        ↓
TikTok Core Video Processing Engine
（推薦AI、エフェクト、最適化）
        ↓
    出力（MP4, WebM, etc.）
```

<!--
**スピーカーノート**:
- アーキテクチャの全体像です
- 想定所要時間: 2分
- 「クライアントからREST APIまたはGraphQLでリクエストを送信します」
- 「3つのエンジン（Text-to-Video、Image-to-Video、Video Editing）が動画を生成します」
- 「その下にTikTokのコア動画処理エンジンがあります」
-->

---

# 2. コア機能

<br>

## 3つの主要機能

<br>

| 機能 | 説明 | 使用シーン |
|------|------|----------|
| **Text-to-Video** | テキストから動画を自動生成 | マーケティング、SNS投稿 |
| **Image-to-Video** | 画像から動画を自動生成 | EC商品紹介、不動産 |
| **Video Editing** | 既存動画の編集・最適化 | 動画短尺化、字幕追加 |

<br>

✅ **3つの機能を組み合わせて、あらゆる動画制作ニーズに対応**

<!--
**スピーカーノート**:
- 3つの主要機能を説明します
- 想定所要時間: 2分
- 「Text-to-VideoとImage-to-Videoが最も人気の機能です」
- 「Video Editingは既存動画の最適化に使えます」
- 「3つの機能を組み合わせることで、あらゆる動画制作ニーズに対応できます」
-->

---

# Text-to-Video機能

<br>

## テキストから動画を自動生成

<br>

**入力**:
```json
{
  "prompt": "青い空と緑の草原を走る犬",
  "duration": 10,
  "style": "realistic",
  "resolution": "1080p"
}
```

**出力**:
- MP4動画（1920x1080、10秒）
- 平均生成時間: **3秒**

<!--
**スピーカーノート**:
- Text-to-Video機能の詳細です
- 想定所要時間: 3分
- 「JSONでプロンプト、duration、style、解像度を指定します」
- 「生成時間は平均3秒です。業界最速クラスです」
- 「スタイルはrealístico（リアル）、anime（アニメ）、cartoon（カートゥーン）などが選べます」
-->

---

# Image-to-Video機能

<br>

## 画像から動画を自動生成

<br>

**入力**:
```json
{
  "image_url": "https://example.com/product.jpg",
  "animation_type": "zoom_in",
  "duration": 5,
  "add_music": true
}
```

**出力**:
- MP4動画（元画像の解像度維持）
- BGM付き
- 平均生成時間: **2秒**

<!--
**スピーカーノート**:
- Image-to-Video機能の詳細です
- 想定所要時間: 3分
- 「画像URLを指定するだけで動画が生成されます」
- 「animation_typeでズームイン、パン、回転などのエフェクトを選べます」
- 「add_musicをtrueにすると、自動的にBGMが追加されます」
- 「EC商品紹介に最適です」
-->

---

# Video Editing機能

<br>

## 既存動画の編集・最適化

<br>

**機能**:
- **字幕自動生成** - 音声認識で自動字幕作成
- **短尺化** - 長尺動画を短尺化（AI要約）
- **SNS最適化** - Instagram、TikTok、YouTubeのサイズに自動最適化
- **BGM追加** - ライセンスフリーBGMの自動選定・追加
- **エフェクト追加** - トランジション、フィルター、テキストオーバーレイ

<br>

🎬 **既存動画を SNS 向けに最適化**

<!--
**スピーカーノート**:
- Video Editing機能の詳細です
- 想定所要時間: 3分
- 「既存動画を編集・最適化する機能です」
- 「字幕自動生成は音声認識で自動的に字幕を作成します」
- 「短尺化はAI要約で重要なシーンを抽出します」
- 「SNS最適化は各プラットフォームのサイズに自動調整します」
-->

---

# 3. 技術仕様

<br>

## 解像度・フォーマット

<br>

| 項目 | Starter | Business | Enterprise |
|------|---------|----------|-----------|
| **最大解像度** | 1080p（1920x1080） | 4K（3840x2160） | 8K（7680x4320） |
| **最大FPS** | 30fps | 60fps | 60fps |
| **最大動画長** | 30秒 | 60秒 | 90秒 |
| **入力形式** | JPG, PNG, MP4 | + WebP, GIF, MOV | + RAW, ProRes |
| **出力形式** | MP4 | MP4, WebM | MP4, WebM, MOV, AVI |

<!--
**スピーカーノート**:
- 技術仕様を説明します
- 想定所要時間: 3分
- 「プラン別に解像度と機能が異なります」
- 「Enterpriseプランは最大8K解像度に対応します」
- 「出力形式はMP4が基本ですが、EnterpriseはWebM、MOV、AVIにも対応します」
-->

---

# 生成速度

<br>

## 業界最速クラスの生成速度

<br>

| 機能 | 平均生成時間 | 競合平均 | 差分 |
|------|------------|---------|------|
| **Text-to-Video**（10秒） | **3秒** | 10-15秒 | **3-5倍高速** |
| **Image-to-Video**（5秒） | **2秒** | 5-8秒 | **2.5-4倍高速** |
| **Video Editing**（30秒） | **5秒** | 15-20秒 | **3-4倍高速** |

<br>

⚡ **TikTok技術基盤による高速処理**

<!--
**スピーカーノート**:
- 生成速度を競合と比較します
- 想定所要時間: 2分
- 「BytePlusは業界最速クラスの生成速度です」
- 「Text-to-Videoは平均3秒、競合は10-15秒です」
- 「TikTok技術基盤により、高速処理を実現しています」
-->

---

# 4. API仕様

<br>

## REST API + GraphQL

<br>

**ベースURL**:
```
https://api.byteplus.com/v1
```

**認証**:
- OAuth 2.0
- API Key（Bearer Token）
- IPアドレス制限（オプション）

**レート制限**:
- Starter: 100 req/min
- Business: 500 req/min
- Enterprise: 無制限

<!--
**スピーカーノート**:
- API仕様を説明します
- 想定所要時間: 3分
- 「REST APIとGraphQLの両方をサポートしています」
- 「認証はOAuth 2.0とAPI Keyに対応しています」
- 「レート制限はプラン別に異なります。Enterpriseは無制限です」
-->

---

# 主要エンドポイント

<br>

| エンドポイント | メソッド | 説明 |
|-------------|---------|------|
| `/video/generate/text` | POST | Text-to-Video生成 |
| `/video/generate/image` | POST | Image-to-Video生成 |
| `/video/edit` | POST | Video Editing |
| `/video/status/{id}` | GET | 生成ステータス取得 |
| `/video/download/{id}` | GET | 動画ダウンロード |
| `/templates` | GET | テンプレート一覧取得 |

<br>

📚 **詳細ドキュメント**: https://docs.byteplus.com/video-api

<!--
**スピーカーノート**:
- 主要なAPIエンドポイントを紹介します
- 想定所要時間: 2分
- 「6つの主要エンドポイントがあります」
- 「POST /video/generate/textでText-to-Video生成」
- 「GET /video/status/{id}で生成ステータスを確認」
- 「GET /video/download/{id}で動画をダウンロードします」
-->

---

# API リクエスト例

<br>

## Text-to-Video生成

<br>

```bash
curl -X POST https://api.byteplus.com/v1/video/generate/text \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "青い空と緑の草原を走る犬",
    "duration": 10,
    "style": "realistic",
    "resolution": "1080p",
    "fps": 30
  }'
```

<!--
**スピーカーノート**:
- APIリクエストの具体例です
- 想定所要時間: 2分
- 「curlコマンドでリクエストを送信します」
- 「Authorization ヘッダーにAPI Keyを指定します」
- 「promptにテキスト、durationに動画の長さ（秒）を指定します」
- 「後ほどハンズオンで実際に実行してもらいます」
-->

---

# API レスポンス例

<br>

```json
{
  "status": "success",
  "data": {
    "video_id": "v_abc123def456",
    "status": "processing",
    "estimated_time": 3,
    "webhook_url": "https://your-app.com/webhook"
  }
}
```

<br>

**ステータス確認**:
```bash
GET /video/status/v_abc123def456
→ {"status": "completed", "download_url": "https://..."}
```

<!--
**スピーカーノート**:
- APIレスポンスの例です
- 想定所要時間: 2分
- 「レスポンスにvideo_idとstatusが含まれます」
- 「statusがprocessingの場合、estimated_timeで生成時間の目安が分かります」
- 「完了後、webhook_urlに通知が送信されます（オプション）」
- 「GET /video/status/{video_id}でステータスを確認できます」
-->

---

# 5. SDK対応

<br>

## 5言語対応の公式SDK

<br>

| 言語 | パッケージ | インストール |
|------|----------|------------|
| **Python** | `byteplus-sdk` | `pip install byteplus-sdk` |
| **Node.js** | `@byteplus/sdk` | `npm install @byteplus/sdk` |
| **Go** | `github.com/byteplus/go-sdk` | `go get github.com/byteplus/go-sdk` |
| **Java** | `com.byteplus:sdk` | Maven/Gradle |
| **PHP** | `byteplus/sdk` | `composer require byteplus/sdk` |

<br>

✅ **公式SDKで簡単統合**

<!--
**スピーカーノート**:
- 5言語対応の公式SDKを紹介します
- 想定所要時間: 2分
- 「Python、Node.js、Go、Java、PHPの5言語に対応しています」
- 「pip、npm、go getで簡単にインストールできます」
- 「後ほどハンズオンでPythonとNode.jsのSDKを使います」
-->

---

# Python SDKの使用例

<br>

```python
from byteplus_sdk import BytePlusClient

client = BytePlusClient(api_key="YOUR_API_KEY")

# Text-to-Video生成
video = client.generate_video_from_text(
    prompt="青い空と緑の草原を走る犬",
    duration=10,
    style="realistic",
    resolution="1080p"
)

print(f"Video ID: {video.id}")
print(f"Status: {video.status}")

# 完了待ち
video.wait_until_complete()
print(f"Download URL: {video.download_url}")
```

<!--
**スピーカーノート**:
- Python SDKの使用例です
- 想定所要時間: 3分
- 「BytePlusClientにAPI Keyを指定して初期化します」
- 「generate_video_from_textでText-to-Video生成」
- 「wait_until_completeで完了を待ちます」
- 「download_urlで動画をダウンロードできます」
- 「非常にシンプルで使いやすいです」
-->

---

# Node.js SDKの使用例

<br>

```javascript
const { BytePlusClient } = require('@byteplus/sdk');

const client = new BytePlusClient({ apiKey: 'YOUR_API_KEY' });

// Text-to-Video生成
const video = await client.generateVideoFromText({
  prompt: '青い空と緑の草原を走る犬',
  duration: 10,
  style: 'realistic',
  resolution: '1080p'
});

console.log(`Video ID: ${video.id}`);
console.log(`Status: ${video.status}`);

// 完了待ち
await video.waitUntilComplete();
console.log(`Download URL: ${video.downloadUrl}`);
```

<!--
**スピーカーノート**:
- Node.js SDKの使用例です
- 想定所要時間: 3分
- 「BytePlusClientにAPI Keyを指定して初期化します」
- 「generateVideoFromTextでText-to-Video生成」
- 「await video.waitUntilComplete()で完了を待ちます」
- 「Python SDKと同様のシンプルなAPIです」
-->

---

# 6. 既存システムとの統合例

<br>

## 実績のある統合パターン

<br>

| システム | 統合方法 | 使用シーン |
|---------|---------|----------|
| **WordPress** | Plugin | ブログ記事から自動動画生成 |
| **Shopify** | App | 商品ページから商品紹介動画生成 |
| **HubSpot** | Integration | マーケティングオートメーション |
| **Zapier** | App | ノーコード統合（1,000+ apps） |
| **AWS Lambda** | SDK | サーバーレス動画生成 |

<br>

🔗 **REST API経由で多様なシステムと連携可能**

<!--
**スピーカーノート**:
- 既存システムとの統合例を紹介します
- 想定所要時間: 3分
- 「WordPressプラグインでブログ記事から動画を自動生成できます」
- 「Shopify Appで商品ページから商品紹介動画を自動生成できます」
- 「Zapierで1,000以上のアプリと連携できます」
- 「AWS Lambdaでサーバーレス動画生成も可能です」
-->

---

# WordPress統合例

<br>

## ブログ記事から自動動画生成

<br>

**ワークフロー**:
1. WordPress管理画面で「動画生成」ボタンをクリック
2. 記事タイトル・本文から自動的にプロンプト生成
3. BytePlus APIに送信
4. 生成完了後、メディアライブラリに自動追加
5. 記事に動画を埋め込み

<br>

⏱️ **所要時間**: **5分以内**（従来は数時間）

<!--
**スピーカーノート**:
- WordPressとの統合例です
- 想定所要時間: 2分
- 「WordPress管理画面から動画生成ボタンをクリックするだけです」
- 「記事タイトルと本文から自動的にプロンプトを生成します」
- 「生成完了後、メディアライブラリに自動追加されます」
- 「従来は数時間かかっていた作業が5分以内で完了します」
-->

---

# Shopify統合例

<br>

## 商品ページから商品紹介動画生成

<br>

**ワークフロー**:
1. Shopify管理画面で商品を選択
2. 商品画像・タイトル・説明から自動的にプロンプト生成
3. BytePlus APIに送信（Image-to-Video）
4. 生成完了後、商品ページに動画を自動追加
5. SNS用動画も同時生成（Instagram、TikTok最適化）

<br>

📈 **効果**: **コンバージョン80%向上**

<!--
**スピーカーノート**:
- Shopifyとの統合例です
- 想定所要時間: 2分
- 「Shopify管理画面から商品を選択するだけです」
- 「商品画像・タイトル・説明から自動的にプロンプトを生成します」
- 「Image-to-Videoで商品紹介動画を生成します」
- 「SNS用動画も同時生成できます（Instagram、TikTok最適化）」
- 「効果として、コンバージョン80%向上を達成しています」
-->

---

# テンプレート

<br>

## 200+種類のプロフェッショナルテンプレート

<br>

| カテゴリ | テンプレート数 | 例 |
|---------|------------|---|
| **マーケティング** | 50+ | 広告動画、SNS投稿、プロモーション |
| **EC** | 40+ | 商品紹介、セール告知、レビュー動画 |
| **教育** | 30+ | レクチャー動画、チュートリアル、クイズ |
| **企業** | 30+ | 会社紹介、採用動画、IR動画 |
| **イベント** | 20+ | セミナー告知、ウェビナー、展示会 |
| **その他** | 30+ | ニュース、スポーツ、エンタメ |

<!--
**スピーカーノート**:
- 200+種類のテンプレートを紹介します
- 想定所要時間: 2分
- 「マーケティング、EC、教育、企業、イベント、その他の6カテゴリがあります」
- 「最も人気なのはマーケティングテンプレート（50+種類）です」
- 「EC用テンプレート（40+種類）も充実しています」
- 「カスタムテンプレートの作成も可能です（Enterpriseプラン）」
-->

---

# プライシング

<br>

| プラン | 月額料金 | 月間動画本数 | 解像度 | サポート |
|--------|---------|------------|--------|---------|
| **Starter** | **¥50,000** | 50本 | 最大1080p | メール（48h以内） |
| **Business** | **¥150,000** | 200本 | 最大4K | メール・チャット（24h以内） |
| **Enterprise** | **要相談** | 無制限 | 最大8K | 専任担当・電話（即時） |

<br>

✅ **14日間無料トライアル**（全機能利用可能、最大20本）
✅ **初期費用0円**
✅ **月次プラン変更可能**

<!--
**スピーカーノート**:
- プライシングを説明します
- 想定所要時間: 3分
- 「3つのプランがあります：Starter、Business、Enterprise」
- 「Starterは月額5万円で50本まで生成できます」
- 「Businessは月額15万円で200本まで、4K解像度に対応します」
- 「Enterpriseは無制限、8K解像度、専任担当付きです」
- 「14日間無料トライアルで全機能を試せます」
-->

---

# サポートとSLA

<br>

| 項目 | Starter | Business | Enterprise |
|------|---------|----------|-----------|
| **サポート対応時間** | 平日10:00-18:00 | 平日10:00-18:00 | 24/7 |
| **サポートチャネル** | メール | メール・チャット | メール・チャット・電話 |
| **初回回答時間** | 48時間以内 | 24時間以内 | 4時間以内 |
| **稼働率保証（SLA）** | 99.0% | 99.5% | 99.9% |
| **トレーニング** | オンライン資料 | 月次ウェビナー | オンサイト研修 |

<br>

🇯🇵 **完全日本語対応**（日本人スタッフ）

<!--
**スピーカーノート**:
- サポートとSLAを説明します
- 想定所要時間: 2分
- 「3つのプランでサポート内容が異なります」
- 「Enterpriseは24/7サポート、4時間以内の初回回答を保証します」
- 「稼働率保証（SLA）もプラン別に異なります」
- 「完全日本語対応で、日本人スタッフが対応します」
-->

---

# セキュリティ

<br>

## エンタープライズグレードのセキュリティ

<br>

- ✅ **ISO27001認証取得**（情報セキュリティマネジメント）
- ✅ **SOC2 Type II認証取得**（米国公認会計士協会）
- ✅ **データ暗号化**（TLS 1.3、AES-256）
- ✅ **定期的なセキュリティ監査**（年4回）
- ✅ **GDPR準拠**（EU一般データ保護規則）

<br>

🔒 **生成された動画の著作権はお客様に帰属**

<!--
**スピーカーノート**:
- セキュリティについて説明します
- 想定所要時間: 2分
- 「ISO27001とSOC2 Type IIの認証を取得しています」
- 「データはTLS 1.3とAES-256で暗号化されています」
- 「年4回の定期的なセキュリティ監査を実施しています」
- 「GDPR準拠で、EU圏のお客様にも安心してご利用いただけます」
- 「生成された動画の著作権はお客様に帰属します」
-->

---

# Part 3のまとめ

<br>

## BytePlus API概要のKey Takeaways

<br>

✅ **TikTok技術基盤** - 月間15億人が利用する技術
✅ **3つのコア機能** - Text-to-Video、Image-to-Video、Video Editing
✅ **高速生成** - 平均3秒（業界最速クラス）
✅ **5言語SDK** - Python、Node.js、Go、Java、PHP
✅ **200+テンプレート** - プロフェッショナルテンプレート
✅ **エンタープライズグレードのセキュリティ** - ISO27001、SOC2 Type II

<br>

**次のPart 4では、15の実装パターンをハンズオン形式で学びます！**

<!--
**スピーカーノート**:
- Part 3のまとめです
- 想定所要時間: 2分
- 「BytePlus APIはTikTok技術基盤で高速・高品質です」
- 「3つのコア機能で多様なニーズに対応できます」
- 「5言語SDKで簡単に統合できます」
- 「次のPart 4では、実際に15の実装パターンをハンズオン形式で学びます」
- 「コーヒー休憩を取ります。11:40に再開します」（オプション）
-->

---

<!-- _class: lead -->

# 休憩

## 次のPart 4では 15の実装パターンを実践します

<br>

**10分間の休憩**
**再開時刻: 11:40**

<!--
**スピーカーノート**:
- 10分間の休憩を取ります
- 想定所要時間: 10分
- 「休憩後は、実際に手を動かしてコードを書いていきます」
- 「PCの準備をお願いします」
- 「質問がある方はチャットでお願いします」
-->
