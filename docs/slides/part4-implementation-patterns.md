---
marp: true
theme: default
paginate: true
backgroundColor: #fff
color: #333
style: |
  section {
    font-family: 'Noto Sans JP', 'Inter', sans-serif;
    font-size: 24px;
  }
  h1 {
    color: #FF6B00;
    font-size: 44px;
    font-weight: bold;
  }
  h2 {
    color: #1A1A2E;
    font-size: 32px;
    font-weight: bold;
  }
  h3 {
    color: #FF6B00;
    font-size: 26px;
  }
  strong {
    color: #FF6B00;
  }
  ul {
    line-height: 1.6;
  }
  table {
    font-size: 20px;
  }
  code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 18px;
  }
  pre {
    font-size: 16px;
  }
---

<!-- _class: lead -->

# Part 4: 実装15パターン

## ハンズオン形式で学ぶBytePlus API

<br>

**BytePlus Video AI Bootcamp 2025**

<!--
**スピーカーノート**:
- Part 4では15の実装パターンを学びます
- 想定所要時間: 90分（60スライド）
- 実際にコードを書いてもらいます
- 「最も重要なパートです。手を動かして覚えましょう」
-->

---

# Part 4のアジェンダ

<br>

| # | パターン | 難易度 | 所要時間 |
|---|---------|--------|---------|
| 1-5 | 基本パターン | ⭐ | 30分 |
| 6-10 | 応用パターン | ⭐⭐ | 30分 |
| 11-15 | 実践パターン | ⭐⭐⭐ | 30分 |

<br>

💻 **すべてのコードはGitHubで公開**
🔗 https://github.com/byteplus/video-api-examples

<!--
**スピーカーノート**:
- 15パターンを3つの難易度に分けて学びます
- 想定所要時間: 90分
- 「基本→応用→実践と段階的に学びます」
- 「すべてのコードはGitHubで公開しています」
-->

---

# 環境セットアップ

<br>

## 事前準備

<br>

```bash
# 1. API Keyを環境変数に設定
export BYTEPLUS_API_KEY="your_api_key_here"

# 2. Python SDKインストール
pip install byteplus-sdk

# 3. Node.js SDKインストール
npm install @byteplus/sdk

# 4. サンプルコードダウンロード
git clone https://github.com/byteplus/video-api-examples
cd video-api-examples
```

<!--
**スピーカーノート**:
- 環境セットアップを行います
- 想定所要時間: 5分
- 「API Keyは管理画面から取得してください」
- 「PythonとNode.jsのSDKをインストールします」
- 「サンプルコードをダウンロードします」
-->

---

<!-- _class: lead -->

# 基本パターン（1-5）

## 難易度: ⭐

<!--
**スピーカーノート**:
- 基本パターンに入ります
- 想定所要時間: 30分
- 「最初の5パターンは基本的な使い方です」
-->

---

# パターン1: Basic Text-to-Video

<br>

## テキストから動画を生成

<br>

**使用シーン**: マーケティング動画、SNS投稿

**Python実装**:
```python
from byteplus_sdk import BytePlusClient

client = BytePlusClient(api_key="YOUR_API_KEY")

video = client.generate_video_from_text(
    prompt="青い空と緑の草原を走る犬",
    duration=10,
    style="realistic",
    resolution="1080p"
)

print(f"Video ID: {video.id}")
video.wait_until_complete()
print(f"Download URL: {video.download_url}")
```

<!--
**スピーカーノート**:
- パターン1はBasic Text-to-Videoです
- 想定所要時間: 5分
- 「最もシンプルなパターンです」
- 「prompt、duration、style、resolutionを指定します」
- 「wait_until_completeで完了を待ちます」
-->

---

# パターン1: 実行結果

<br>

**出力**:
```
Video ID: v_abc123def456
Status: processing
Estimated time: 3 seconds
...
Status: completed
Download URL: https://cdn.byteplus.com/v_abc123def456.mp4
```

<br>

**動画仕様**:
- 解像度: 1920x1080 (1080p)
- 長さ: 10秒
- フォーマット: MP4
- ファイルサイズ: 約5MB

<!--
**スピーカーノート**:
- 実行結果の例です
- 想定所要時間: 2分
- 「3秒で生成完了します」
- 「Download URLから動画をダウンロードできます」
- 「実際に動画を再生してみましょう」
-->

---

# パターン2: Image-to-Video

<br>

## 画像から動画を生成

<br>

**使用シーン**: EC商品紹介、不動産

**Python実装**:
```python
video = client.generate_video_from_image(
    image_url="https://example.com/product.jpg",
    animation_type="zoom_in",  # zoom_in, pan, rotate
    duration=5,
    add_music=True,
    music_genre="upbeat"  # upbeat, calm, dramatic
)

print(f"Video ID: {video.id}")
video.wait_until_complete()
print(f"Download URL: {video.download_url}")
```

<!--
**スピーカーノート**:
- パターン2はImage-to-Videoです
- 想定所要時間: 5分
- 「画像URLを指定するだけで動画が生成されます」
- 「animation_typeでズームイン、パン、回転を選べます」
- 「add_musicをTrueにすると自動的にBGMが追加されます」
-->

---

# パターン2: アニメーション種類

<br>

| animation_type | 説明 | 適した用途 |
|---------------|------|----------|
| **zoom_in** | ズームイン | 商品詳細、強調 |
| **zoom_out** | ズームアウト | 全体像、広がり |
| **pan_left** | 左にパン | 横長画像、スライド |
| **pan_right** | 右にパン | 横長画像、スライド |
| **rotate** | 回転 | 360度商品撮影 |
| **ken_burns** | Ken Burns エフェクト | ドキュメンタリー、ストーリー |

<!--
**スピーカーノート**:
- アニメーション種類の説明です
- 想定所要時間: 2分
- 「6種類のアニメーションがあります」
- 「zoom_inは商品詳細や強調に適しています」
- 「ken_burnsはドキュメンタリーやストーリーに適しています」
-->

---

# パターン3: Video Editing - 字幕生成

<br>

## 既存動画に字幕を自動追加

<br>

**使用シーン**: YouTube動画、セミナー動画

**Python実装**:
```python
video = client.edit_video(
    video_url="https://example.com/original.mp4",
    operations=[
        {
            "type": "add_subtitles",
            "language": "ja",  # ja, en, zh, ko, etc.
            "style": "default"  # default, bold, minimal
        }
    ]
)

print(f"Video ID: {video.id}")
video.wait_until_complete()
print(f"Download URL: {video.download_url}")
```

<!--
**スピーカーノート**:
- パターン3は字幕生成です
- 想定所要時間: 5分
- 「既存動画に字幕を自動追加します」
- 「音声認識で自動的に字幕を生成します」
- 「日本語、英語、中国語、韓国語などに対応しています」
-->

---

# パターン3: 字幕スタイル

<br>

| style | 説明 | プレビュー |
|-------|------|----------|
| **default** | 標準スタイル | 白文字、黒縁 |
| **bold** | 太字スタイル | 白文字、太字、黒縁 |
| **minimal** | ミニマルスタイル | 白文字、縁なし |
| **karaoke** | カラオケスタイル | ハイライト表示 |
| **shadow** | 影付きスタイル | 白文字、影付き |

<br>

💡 **カスタムスタイルも作成可能**（Enterpriseプラン）

<!--
**スピーカーノート**:
- 字幕スタイルの説明です
- 想定所要時間: 2分
- 「5種類の字幕スタイルがあります」
- 「defaultは標準的な白文字、黒縁です」
- 「karaokeはハイライト表示で歌詞に適しています」
- 「Enterpriseプランではカスタムスタイルも作成できます」
-->

---

# パターン4: Video Editing - 短尺化

<br>

## 長尺動画を短尺化（AI要約）

<br>

**使用シーン**: YouTube Shorts、TikTok、Instagram Reels

**Python実装**:
```python
video = client.edit_video(
    video_url="https://example.com/long_video.mp4",
    operations=[
        {
            "type": "create_short",
            "target_duration": 30,  # 30秒
            "highlight_mode": "ai_auto",  # ai_auto, manual
            "aspect_ratio": "9:16"  # 9:16 (vertical), 16:9 (horizontal)
        }
    ]
)

print(f"Video ID: {video.id}")
video.wait_until_complete()
print(f"Download URL: {video.download_url}")
```

<!--
**スピーカーノート**:
- パターン4は短尺化です
- 想定所要時間: 5分
- 「長尺動画をAI要約で短尺化します」
- 「target_durationで目標の長さを指定します」
- 「highlight_modeをai_autoにすると、AIが自動的に重要なシーンを抽出します」
- 「aspect_ratioで縦長（9:16）または横長（16:9）を選べます」
-->

---

# パターン4: ハイライトモード

<br>

| highlight_mode | 説明 | 精度 | 速度 |
|---------------|------|------|------|
| **ai_auto** | AI自動抽出 | ⭐⭐⭐ | ⭐⭐ |
| **audio_analysis** | 音声分析ベース | ⭐⭐ | ⭐⭐⭐ |
| **scene_detection** | シーン検出ベース | ⭐⭐ | ⭐⭐⭐ |
| **manual** | 手動指定 | ⭐⭐⭐ | ⭐ |

<br>

**推奨**: **ai_auto**（最も高精度）

<!--
**スピーカーノート**:
- ハイライトモードの説明です
- 想定所要時間: 2分
- 「4種類のハイライトモードがあります」
- 「ai_autoが最も高精度で推奨です」
- 「audio_analysisは音声の盛り上がりを検出します」
- 「scene_detectionはシーンの切り替わりを検出します」
-->

---

# パターン5: Multi-Language Video

<br>

## 多言語動画を一括生成

<br>

**使用シーン**: グローバルマーケティング、多言語SNS

**Python実装**:
```python
languages = ["ja", "en", "zh", "ko", "es", "fr"]

for lang in languages:
    video = client.generate_video_from_text(
        prompt="新製品発表。画期的な技術を搭載。",
        duration=10,
        style="modern",
        resolution="1080p",
        language=lang,  # 言語指定
        voice_gender="female"  # male, female, neutral
    )
    print(f"{lang}: {video.id}")
```

<!--
**スピーカーノート**:
- パターン5は多言語動画生成です
- 想定所要時間: 5分
- 「1つのプロンプトから多言語動画を一括生成します」
- 「6言語（日本語、英語、中国語、韓国語、スペイン語、フランス語）に対応」
- 「voice_genderで音声の性別を選べます」
- 「グローバルマーケティングに最適です」
-->

---

# パターン5: 対応言語

<br>

| 言語 | コード | 音声対応 | 字幕対応 |
|------|--------|---------|---------|
| 日本語 | ja | ✅ | ✅ |
| 英語 | en | ✅ | ✅ |
| 中国語（簡体字） | zh | ✅ | ✅ |
| 韓国語 | ko | ✅ | ✅ |
| スペイン語 | es | ✅ | ✅ |
| フランス語 | fr | ✅ | ✅ |
| ドイツ語 | de | ✅ | ✅ |
| イタリア語 | it | ✅ | ✅ |

<br>

**合計**: **80言語以上**対応

<!--
**スピーカーノート**:
- 対応言語の一覧です
- 想定所要時間: 1分
- 「主要8言語に加え、合計80言語以上に対応しています」
- 「すべて音声と字幕に対応しています」
-->

---

<!-- _class: lead -->

# 応用パターン（6-10）

## 難易度: ⭐⭐

<!--
**スピーカーノート**:
- 応用パターンに入ります
- 想定所要時間: 30分
- 「次の5パターンは応用的な使い方です」
-->

---

# パターン6: A/Bテスト動画生成

<br>

## 複数バージョンを同時生成

<br>

**使用シーン**: 広告最適化、マーケティングテスト

**Python実装**:
```python
variations = [
    {"prompt": "青い空と緑の草原を走る犬", "style": "realistic"},
    {"prompt": "青い空と緑の草原を走る犬", "style": "anime"},
    {"prompt": "青い空と緑の草原を走る犬", "style": "cartoon"},
]

videos = []
for i, var in enumerate(variations):
    video = client.generate_video_from_text(**var, duration=10)
    videos.append({"id": video.id, "variation": i+1})
    print(f"Variation {i+1}: {video.id}")

# 完了待ち
for v in videos:
    client.wait_until_complete(v["id"])
```

<!--
**スピーカーノート**:
- パターン6はA/Bテスト動画生成です
- 想定所要時間: 6分
- 「複数バージョンを同時生成してA/Bテストを行います」
- 「スタイル（realistic、anime、cartoon）を変えて生成します」
- 「広告最適化に最適です」
-->

---

# パターン6: A/Bテスト戦略

<br>

| テスト項目 | バリエーション例 | 期待効果 |
|-----------|-----------------|---------|
| **スタイル** | realistic, anime, cartoon | クリック率向上 |
| **長さ** | 5秒、10秒、15秒 | 完視聴率向上 |
| **音楽** | upbeat, calm, dramatic | 感情的エンゲージメント向上 |
| **CTA** | "今すぐ購入", "詳細を見る", "無料トライアル" | コンバージョン向上 |

<br>

📊 **推奨**: 3バージョン同時テスト

<!--
**スピーカーノート**:
- A/Bテスト戦略の説明です
- 想定所要時間: 2分
- 「4つのテスト項目があります」
- 「スタイル、長さ、音楽、CTAをテストします」
- 「3バージョン同時テストが推奨です」
-->

---

# パターン7: Batch Video Generation

<br>

## 大量の動画を一括生成

<br>

**使用シーン**: EC商品動画、大量コンテンツ作成

**Python実装**:
```python
import pandas as pd

# CSVから商品情報を読み込み
products = pd.read_csv("products.csv")

for _, product in products.iterrows():
    video = client.generate_video_from_image(
        image_url=product["image_url"],
        animation_type="zoom_in",
        duration=5,
        text_overlay=product["name"],  # テキストオーバーレイ
        add_music=True
    )
    print(f"Product {product['id']}: {video.id}")

    # 非同期で生成（完了を待たない）
```

<!--
**スピーカーノート**:
- パターン7はバッチ動画生成です
- 想定所要時間: 6分
- 「CSVから商品情報を読み込み、大量の動画を一括生成します」
- 「EC商品動画の作成に最適です」
- 「非同期で生成するので、完了を待ちません」
-->

---

# パターン7: CSVフォーマット

<br>

**products.csv**:
```csv
id,name,image_url,animation_type
1,青いTシャツ,https://example.com/img1.jpg,zoom_in
2,赤いパーカー,https://example.com/img2.jpg,pan_left
3,黒いジャケット,https://example.com/img3.jpg,rotate
```

<br>

**生成結果**:
- 商品1: v_abc123 (青いTシャツ、ズームイン、5秒)
- 商品2: v_def456 (赤いパーカー、パン左、5秒)
- 商品3: v_ghi789 (黒いジャケット、回転、5秒)

<!--
**スピーカーノート**:
- CSVフォーマットの例です
- 想定所要時間: 2分
- 「id、name、image_url、animation_typeを指定します」
- 「一括で複数の商品動画を生成できます」
-->

---

# パターン8: Real-Time Video Generation

<br>

## リアルタイムで動画を生成

<br>

**使用シーン**: ライブコマース、リアルタイムマーケティング

**Python実装**:
```python
from flask import Flask, request, jsonify

app = Flask(__name__)
client = BytePlusClient(api_key="YOUR_API_KEY")

@app.route("/generate", methods=["POST"])
def generate_video():
    data = request.json
    video = client.generate_video_from_text(
        prompt=data["prompt"],
        duration=10,
        style="realistic"
    )
    return jsonify({"video_id": video.id, "status": video.status})

if __name__ == "__main__":
    app.run(port=5000)
```

<!--
**スピーカーノート**:
- パターン8はリアルタイム動画生成です
- 想定所要時間: 6分
- 「FlaskでWeb APIを作成し、リアルタイムで動画を生成します」
- 「ライブコマースやリアルタイムマーケティングに最適です」
- 「POST /generateでリクエストを送信します」
-->

---

# パターン8: クライアント側実装

<br>

**JavaScript（クライアント側）**:
```javascript
async function generateVideo(prompt) {
  const response = await fetch("http://localhost:5000/generate", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({prompt: prompt})
  });

  const data = await response.json();
  console.log(`Video ID: ${data.video_id}`);
  console.log(`Status: ${data.status}`);

  // ポーリングで完了を待つ
  await pollVideoStatus(data.video_id);
}

generateVideo("青い空と緑の草原を走る犬");
```

<!--
**スピーカーノート**:
- クライアント側の実装例です
- 想定所要時間: 2分
- 「JavaScriptでFetch APIを使ってリクエストを送信します」
- 「ポーリングで完了を待ちます」
-->

---

# パターン9: Webhook Integration

<br>

## Webhookで完了通知を受信

<br>

**使用シーン**: バックグラウンド処理、大量生成

**Python実装**:
```python
from flask import Flask, request

app = Flask(__name__)

@app.route("/webhook", methods=["POST"])
def webhook():
    data = request.json
    video_id = data["video_id"]
    status = data["status"]
    download_url = data.get("download_url")

    if status == "completed":
        print(f"Video {video_id} completed!")
        print(f"Download URL: {download_url}")
        # 後続処理（DB保存、メール通知等）

    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=8000)
```

<!--
**スピーカーノート**:
- パターン9はWebhook統合です
- 想定所要時間: 6分
- 「Webhookで動画生成完了を通知します」
- 「バックグラウンド処理や大量生成に最適です」
- 「完了後にDB保存やメール通知などの後続処理を実行できます」
-->

---

# パターン9: Webhook設定

<br>

**動画生成時にWebhook URLを指定**:
```python
video = client.generate_video_from_text(
    prompt="青い空と緑の草原を走る犬",
    duration=10,
    style="realistic",
    webhook_url="https://your-app.com/webhook",  # Webhook URL
    webhook_events=["completed", "failed"]  # 通知イベント
)

print(f"Video ID: {video.id}")
# 完了を待たない（Webhookで通知される）
```

<br>

💡 **ngrokを使ってローカルで開発可能**

<!--
**スピーカーノート**:
- Webhook設定の方法です
- 想定所要時間: 2分
- 「webhook_urlに通知先URLを指定します」
- 「webhook_eventsに通知イベントを指定します」
- 「ngrokを使えばローカル環境でもWebhookを受信できます」
-->

---

# パターン10: Error Handling & Retry

<br>

## エラーハンドリングとリトライ

<br>

**Python実装**:
```python
import time
from byteplus_sdk.exceptions import BytePlusException

def generate_video_with_retry(prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            video = client.generate_video_from_text(
                prompt=prompt, duration=10, style="realistic"
            )
            video.wait_until_complete()
            return video
        except BytePlusException as e:
            print(f"Attempt {attempt+1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise

video = generate_video_with_retry("青い空と緑の草原を走る犬")
```

<!--
**スピーカーノート**:
- パターン10はエラーハンドリングとリトライです
- 想定所要時間: 6分
- 「エラーが発生した場合、自動的にリトライします」
- 「Exponential backoffでリトライ間隔を延ばします」
- 「max_retriesでリトライ回数を制限します」
-->

---

# パターン10: エラー種類

<br>

| エラー種類 | 原因 | 対処法 |
|-----------|------|--------|
| **AuthenticationError** | API Key無効 | API Keyを確認 |
| **QuotaExceededError** | 月間動画本数上限 | プラン変更またはアップグレード |
| **VideoGenerationError** | 生成失敗 | プロンプトを変更してリトライ |
| **TimeoutError** | タイムアウト | リトライまたはサポート連絡 |
| **NetworkError** | ネットワークエラー | ネットワーク接続を確認してリトライ |

<br>

💡 **すべてのエラーは`BytePlusException`を継承**

<!--
**スピーカーノート**:
- エラー種類の説明です
- 想定所要時間: 2分
- 「5種類の主要なエラーがあります」
- 「AuthenticationErrorはAPI Key無効です」
- 「QuotaExceededErrorは月間動画本数上限です」
- 「すべてBytePlusExceptionを継承しています」
-->

---

<!-- _class: lead -->

# 実践パターン（11-15）

## 難易度: ⭐⭐⭐

<!--
**スピーカーノート**:
- 実践パターンに入ります
- 想定所要時間: 30分
- 「最後の5パターンは実践的な統合例です」
-->

---

# パターン11: WordPress Integration

<br>

## WordPressプラグイン統合

<br>

**PHP実装**:
```php
<?php
require_once 'vendor/autoload.php';
use BytePlus\SDK\BytePlusClient;

function generate_video_from_post($post_id) {
    $client = new BytePlusClient(['api_key' => get_option('byteplus_api_key')]);

    $post = get_post($post_id);
    $prompt = $post->post_title . '. ' . wp_trim_words($post->post_content, 50);

    $video = $client->generateVideoFromText([
        'prompt' => $prompt,
        'duration' => 10,
        'style' => 'modern'
    ]);

    update_post_meta($post_id, 'video_id', $video->id);
    return $video->id;
}
```

<!--
**スピーカーノート**:
- パターン11はWordPress統合です
- 想定所要時間: 6分
- 「WordPressプラグインでブログ記事から動画を自動生成します」
- 「記事タイトルと本文からプロンプトを生成します」
- 「video_idをpost_metaに保存します」
-->

---

# パターン11: WordPress管理画面

<br>

**管理画面に「動画生成」ボタンを追加**:
```php
add_action('post_submitbox_misc_actions', function() {
    global $post;
    ?>
    <div class="misc-pub-section">
        <button type="button" id="generate-video-btn" class="button">
            動画生成
        </button>
    </div>
    <script>
    jQuery('#generate-video-btn').on('click', function() {
        jQuery.post(ajaxurl, {
            action: 'generate_video',
            post_id: <?php echo $post->ID; ?>
        }, function(response) {
            alert('動画生成完了！Video ID: ' + response.video_id);
        });
    });
    </script>
    <?php
});
```

<!--
**スピーカーノート**:
- WordPress管理画面のカスタマイズです
- 想定所要時間: 2分
- 「記事編集画面に「動画生成」ボタンを追加します」
- 「ボタンをクリックすると動画が生成されます」
-->

---

# パターン12: Shopify Integration

<br>

## Shopify App統合

<br>

**Node.js実装**:
```javascript
const Shopify = require('shopify-api-node');
const { BytePlusClient } = require('@byteplus/sdk');

const shopify = new Shopify({shopName: 'your-shop', accessToken: 'token'});
const client = new BytePlusClient({apiKey: 'YOUR_API_KEY'});

async function generateProductVideo(productId) {
  const product = await shopify.product.get(productId);

  const video = await client.generateVideoFromImage({
    imageUrl: product.images[0].src,
    animationType: 'zoom_in',
    duration: 5,
    textOverlay: product.title,
    addMusic: true
  });

  console.log(`Video ID: ${video.id}`);
  return video.id;
}
```

<!--
**スピーカーノート**:
- パターン12はShopify統合です
- 想定所要時間: 6分
- 「Shopify APIで商品情報を取得します」
- 「商品画像から動画を生成します」
- 「text_overlayで商品タイトルを追加します」
-->

---

# パターン12: Shopify Appフロー

<br>

```
Shopify Admin
    ↓
「動画生成」ボタンクリック
    ↓
Node.js Backend（商品情報取得）
    ↓
BytePlus API（動画生成）
    ↓
Shopify Files API（動画アップロード）
    ↓
商品ページに動画を自動追加
```

<br>

**効果**: **コンバージョン80%向上**

<!--
**スピーカーノート**:
- Shopify Appのフローです
- 想定所要時間: 2分
- 「Shopify管理画面から動画生成ボタンをクリックします」
- 「Node.jsバックエンドで商品情報を取得します」
- 「BytePlus APIで動画を生成します」
- 「Shopify Files APIで動画をアップロードし、商品ページに追加します」
-->

---

# パターン13: AWS Lambda Integration

<br>

## サーバーレス動画生成

<br>

**Python（Lambda）実装**:
```python
import json
from byteplus_sdk import BytePlusClient

def lambda_handler(event, context):
    client = BytePlusClient(api_key="YOUR_API_KEY")

    prompt = event.get("prompt", "デフォルトプロンプト")
    duration = event.get("duration", 10)

    video = client.generate_video_from_text(
        prompt=prompt,
        duration=duration,
        style="realistic",
        webhook_url=event.get("webhook_url")  # Lambda完了後にWebhook
    )

    return {
        'statusCode': 200,
        'body': json.dumps({'video_id': video.id})
    }
```

<!--
**スピーカーノート**:
- パターン13はAWS Lambda統合です
- 想定所要時間: 6分
- 「サーバーレスで動画を生成します」
- 「Lambda関数でBytePlus APIを呼び出します」
- 「webhook_urlで完了通知を受信します」
-->

---

# パターン13: Lambda + S3フロー

<br>

```
S3バケット（画像アップロード）
    ↓
S3イベント通知
    ↓
Lambda関数起動
    ↓
BytePlus API（Image-to-Video）
    ↓
Webhook通知
    ↓
Lambda関数（動画ダウンロード→S3保存）
```

<br>

💡 **完全サーバーレス、スケーラブル**

<!--
**スピーカーノート**:
- Lambda + S3のフローです
- 想定所要時間: 2分
- 「S3に画像をアップロードすると自動的にLambdaが起動します」
- 「Lambdaで動画を生成し、Webhookで通知します」
- 「完了後、動画をS3に保存します」
- 「完全サーバーレスでスケーラブルです」
-->

---

# パターン14: Custom Template Creation

<br>

## カスタムテンプレートの作成

<br>

**Python実装**:
```python
template = client.create_template(
    name="EC商品紹介テンプレート",
    description="EC商品紹介用のテンプレート",
    duration=10,
    layout={
        "sections": [
            {"type": "image", "duration": 3, "animation": "zoom_in"},
            {"type": "text", "duration": 2, "text": "{product_name}"},
            {"type": "text", "duration": 2, "text": "価格: {price}円"},
            {"type": "image", "duration": 3, "animation": "pan_left"}
        ]
    },
    music="upbeat",
    style="modern"
)

print(f"Template ID: {template.id}")
```

<!--
**スピーカーノート**:
- パターン14はカスタムテンプレート作成です
- 想定所要時間: 6分
- 「独自のテンプレートを作成します」
- 「layout.sectionsでセクション構成を定義します」
- 「{product_name}や{price}などの変数を使えます」
- 「Enterpriseプランで利用可能です」
-->

---

# パターン14: テンプレート使用

<br>

**作成したテンプレートを使用**:
```python
video = client.generate_video_from_template(
    template_id=template.id,
    variables={
        "product_name": "青いTシャツ",
        "price": 2980,
        "image_urls": [
            "https://example.com/img1.jpg",
            "https://example.com/img2.jpg"
        ]
    }
)

print(f"Video ID: {video.id}")
video.wait_until_complete()
print(f"Download URL: {video.download_url}")
```

<!--
**スピーカーノート**:
- テンプレートの使用方法です
- 想定所要時間: 2分
- 「template_idを指定してテンプレートを使用します」
- 「variablesで変数に値を代入します」
- 「同じテンプレートで複数の動画を効率的に生成できます」
-->

---

# パターン15: Video Analytics Integration

<br>

## 動画分析データの取得

<br>

**Python実装**:
```python
# 動画の分析データを取得
analytics = client.get_video_analytics(video_id="v_abc123def456")

print(f"再生回数: {analytics['views']}")
print(f"完視聴率: {analytics['completion_rate']}%")
print(f"平均視聴時間: {analytics['avg_watch_time']}秒")
print(f"エンゲージメント率: {analytics['engagement_rate']}%")

# レポートをCSVで保存
analytics.to_csv("video_analytics.csv")
```

<!--
**スピーカーノート**:
- パターン15は動画分析データの取得です
- 想定所要時間: 6分
- 「動画の分析データを取得します」
- 「再生回数、完視聴率、平均視聴時間、エンゲージメント率などが取得できます」
- 「CSVで保存してレポートを作成できます」
-->

---

# パターン15: A/Bテスト分析

<br>

**複数バージョンの比較**:
```python
import pandas as pd

variations = ["v_abc123", "v_def456", "v_ghi789"]
results = []

for video_id in variations:
    analytics = client.get_video_analytics(video_id)
    results.append({
        "video_id": video_id,
        "views": analytics['views'],
        "completion_rate": analytics['completion_rate'],
        "engagement_rate": analytics['engagement_rate']
    })

df = pd.DataFrame(results)
print(df.sort_values("engagement_rate", ascending=False))
```

<!--
**スピーカーノート**:
- A/Bテスト分析の例です
- 想定所要時間: 2分
- 「複数バージョンの分析データを比較します」
- 「エンゲージメント率でソートして最適なバージョンを特定します」
-->

---

# Part 4のまとめ

<br>

## 15パターンのKey Takeaways

<br>

**基本パターン（1-5）**:
✅ Text-to-Video、Image-to-Video、Video Editing、Multi-Language

**応用パターン（6-10）**:
✅ A/Bテスト、バッチ生成、リアルタイム生成、Webhook、エラーハンドリング

**実践パターン（11-15）**:
✅ WordPress、Shopify、AWS Lambda、カスタムテンプレート、動画分析

<br>

**次のPart 5では、実際のハンズオンワークショップを行います！**

<!--
**スピーカーノート**:
- Part 4のまとめです
- 想定所要時間: 2分
- 「15パターンを3つの難易度で学びました」
- 「基本→応用→実践と段階的に学びました」
- 「次のPart 5では、実際にハンズオンワークショップを行います」
- 「15分間の休憩を取ります。13:00に再開します」（オプション）
-->

---

<!-- _class: lead -->

# 休憩

## 次のPart 5では ハンズオンワークショップを行います

<br>

**15分間の休憩**
**再開時刻: 13:00**

<!--
**スピーカーノート**:
- 15分間の休憩を取ります
- 想定所要時間: 15分
- 「休憩後は、実際に手を動かしてハンズオンワークショップを行います」
- 「PCの準備とサンプルコードのダウンロードをお願いします」
- 「質問がある方はチャットでお願いします」
-->
