# BytePlus Bootcamp - Google Slides Script Enhancement Plan

**作成日**: 2025-10-22
**担当**: Claude Code
**目的**: Marp 150ページスライドをGoogle Slides自動生成に対応

---

## 📊 現状分析

### 既存スクリプトの状態
- **バージョン**: 17.0（汎用版）
- **現在のスライド枚数**: 12枚（イントロダクション部分のみ）
- **対応タイプ**: title, content, headerCards, table, closing
- **実行時間**: 約3-6分（最大50枚想定）

### 目標
- **150ページ完全対応**: Marpスライドの全内容をGoogle Slidesに変換
- **実行時間最適化**: 15-20分以内（150枚）
- **新規スライドタイプ追加**: コードブロック、2カラム、プロセス図など

---

## 🎯 Phase 1: スライドデータ拡張（優先度: 最高）

### 1.1 slideData配列の完全版作成

**作業内容**:
- Marp 150ページの内容を全て`slideData`配列に変換
- 各スライドに`notes`フィールド追加（スピーカーノート）
- セクション区切りの明確化

**追加が必要なスライドタイプ**:

#### A. コードブロックスライド
```javascript
{
  type: "codeBlock",
  title: "APIリクエスト例（Python）",
  subhead: "requests ライブラリを使用",
  language: "python",
  code: `import requests

url = "https://api.byteplus.com/v1/generate"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
data = {"prompt": "テキスト→動画", "duration": 10}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,
  notes: "コードの各行を解説します..."
}
```

#### B. 比較表スライド
```javascript
{
  type: "comparisonTable",
  title: "BytePlus vs 競合API比較",
  subhead: "4項目で徹底比較",
  headers: ["項目", "BytePlus", "Runway", "Pika"],
  rows: [
    ["価格", "¥100/分", "¥150/分", "¥120/分"],
    ["速度", "⭐⭐⭐⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐"],
    ["品質", "4K対応", "1080p", "4K対応"],
    ["API制限", "1000req/日", "500req/日", "750req/日"]
  ]
}
```

#### C. プロセスフロー図
```javascript
{
  type: "processFlow",
  title: "動画生成フロー（5ステップ）",
  steps: [
    {label: "1. テキスト入力", icon: "📝"},
    {label: "2. API呼び出し", icon: "⚙️"},
    {label: "3. 生成開始", icon: "🎬"},
    {label: "4. ポーリング", icon: "⏳"},
    {label: "5. 動画取得", icon: "✅"}
  ]
}
```

#### D. 2カラムコードスライド
```javascript
{
  type: "twoColumnCode",
  title: "Python vs Node.js 実装比較",
  leftColumn: {
    language: "python",
    code: `# Python実装\nimport requests\n...`
  },
  rightColumn: {
    language: "javascript",
    code: `// Node.js実装\nconst axios = require('axios');\n...`
  }
}
```

#### E. スクリーンショット画像スライド
```javascript
{
  type: "screenshot",
  title: "BytePlus Dashboard画面",
  subhead: "使用状況の確認方法",
  imageUrl: "https://example.com/screenshot.png",
  caption: "ダッシュボード右上の「Usage」タブから確認できます",
  annotations: [
    {x: 100, y: 50, text: "ここをクリック"}
  ]
}
```

#### F. ROI計算シートスライド
```javascript
{
  type: "calculation",
  title: "ROI試算例",
  subhead: "月間1,000本の動画生成の場合",
  items: [
    {label: "初期費用", value: "¥0"},
    {label: "月額API費用", value: "¥100,000"},
    {label: "人件費削減", value: "¥500,000"},
    {label: "差引メリット", value: "¥400,000", highlight: true}
  ]
}
```

---

## 🛠️ Phase 2: 新規スライドタイプの実装

### 2.1 createCodeBlockSlide()

**実装内容**:
```javascript
function createCodeBlockSlide(slide, data, layout, pageNum) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);
  drawStandardTitleHeader(slide, layout, 'contentSlide', data.title);
  const dy = drawSubheadIfAny(slide, layout, 'contentSlide', data.subhead);

  const codeArea = offsetRect(layout.getRect('contentSlide.body'), 0, dy);

  // コードブロック背景（グレー）
  const codeBg = slide.insertShape(
    SlidesApp.ShapeType.RECTANGLE,
    codeArea.left,
    codeArea.top,
    codeArea.width,
    codeArea.height
  );
  codeBg.getFill().setSolidFill('#2D2D2D'); // VS Code Dark背景
  codeBg.getBorder().setTransparent();

  // コードテキスト（等幅フォント）
  const codeText = slide.insertShape(
    SlidesApp.ShapeType.TEXT_BOX,
    codeArea.left + layout.pxToPt(15),
    codeArea.top + layout.pxToPt(15),
    codeArea.width - layout.pxToPt(30),
    codeArea.height - layout.pxToPt(30)
  );

  const text = codeText.getText();
  text.setText(data.code || '');

  const style = text.getTextStyle();
  style.setFontFamily('Courier New'); // 等幅フォント
  style.setFontSize(11);
  style.setForegroundColor('#D4D4D4'); // 薄いグレー文字

  // 言語ラベル（右上）
  if (data.language) {
    const langLabel = slide.insertShape(
      SlidesApp.ShapeType.TEXT_BOX,
      codeArea.left + codeArea.width - layout.pxToPt(80),
      codeArea.top + layout.pxToPt(5),
      layout.pxToPt(75),
      layout.pxToPt(20)
    );
    langLabel.getFill().setSolidFill(CONFIG.COLORS.primary_color);
    setStyledText(langLabel, data.language.toUpperCase(), {
      size: 10,
      color: '#FFFFFF',
      align: SlidesApp.ParagraphAlignment.CENTER
    });
  }

  drawBottomBarAndFooter(slide, layout, pageNum);
}
```

### 2.2 createProcessFlowSlide()

**実装内容**:
```javascript
function createProcessFlowSlide(slide, data, layout, pageNum) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);
  drawStandardTitleHeader(slide, layout, 'contentSlide', data.title);
  const dy = drawSubheadIfAny(slide, layout, 'contentSlide', data.subhead);

  const area = offsetRect(layout.getRect('contentSlide.body'), 0, dy);
  const steps = data.steps || [];
  const n = steps.length;
  const gap = layout.pxToPt(20);
  const boxW = (area.width - gap * (n - 1)) / n;
  const boxH = layout.pxToPt(80);
  const startY = area.top + (area.height - boxH) / 2;

  for (let i = 0; i < n; i++) {
    const x = area.left + i * (boxW + gap);

    // ステップボックス
    const box = slide.insertShape(
      SlidesApp.ShapeType.RECTANGLE,
      x,
      startY,
      boxW,
      boxH
    );
    box.getFill().setSolidFill(CONFIG.COLORS.primary_color);
    box.getBorder().setTransparent();

    // アイコン
    if (steps[i].icon) {
      const icon = slide.insertShape(
        SlidesApp.ShapeType.TEXT_BOX,
        x,
        startY + layout.pxToPt(10),
        boxW,
        layout.pxToPt(30)
      );
      setStyledText(icon, steps[i].icon, {
        size: 32,
        align: SlidesApp.ParagraphAlignment.CENTER
      });
    }

    // ラベル
    const label = slide.insertShape(
      SlidesApp.ShapeType.TEXT_BOX,
      x + layout.pxToPt(5),
      startY + layout.pxToPt(45),
      boxW - layout.pxToPt(10),
      layout.pxToPt(30)
    );
    setStyledText(label, steps[i].label, {
      size: 11,
      color: '#FFFFFF',
      align: SlidesApp.ParagraphAlignment.CENTER
    });

    // 矢印（最後のステップ以外）
    if (i < n - 1) {
      const arrowX = x + boxW;
      const arrowY = startY + boxH / 2 - layout.pxToPt(5);
      const arrow = slide.insertShape(
        SlidesApp.ShapeType.RIGHT_ARROW,
        arrowX,
        arrowY,
        gap,
        layout.pxToPt(10)
      );
      arrow.getFill().setSolidFill(CONFIG.COLORS.neutral_gray);
      arrow.getBorder().setTransparent();
    }
  }

  drawBottomBarAndFooter(slide, layout, pageNum);
}
```

### 2.3 createScreenshotSlide()

**実装内容**:
```javascript
function createScreenshotSlide(slide, data, layout, pageNum) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);
  drawStandardTitleHeader(slide, layout, 'contentSlide', data.title);
  const dy = drawSubheadIfAny(slide, layout, 'contentSlide', data.subhead);

  const area = offsetRect(layout.getRect('contentSlide.body'), 0, dy);

  try {
    // スクリーンショット画像挿入
    const img = slide.insertImage(data.imageUrl);

    // 画像サイズ調整（エリアに収まるように）
    const scale = Math.min(
      area.width / img.getWidth(),
      (area.height * 0.85) / img.getHeight()
    );
    const w = img.getWidth() * scale;
    const h = img.getHeight() * scale;

    img.setWidth(w).setHeight(h);
    img.setLeft(area.left + (area.width - w) / 2);
    img.setTop(area.top);

    // キャプション（画像の下）
    if (data.caption) {
      const captionY = area.top + h + layout.pxToPt(10);
      const caption = slide.insertShape(
        SlidesApp.ShapeType.TEXT_BOX,
        area.left,
        captionY,
        area.width,
        layout.pxToPt(30)
      );
      setStyledText(caption, data.caption, {
        size: 12,
        color: CONFIG.COLORS.neutral_gray,
        align: SlidesApp.ParagraphAlignment.CENTER
      });
    }

    // アノテーション（吹き出し）
    if (Array.isArray(data.annotations)) {
      data.annotations.forEach(anno => {
        const annoX = area.left + (w * anno.x / 100);
        const annoY = area.top + (h * anno.y / 100);

        const annoBox = slide.insertShape(
          SlidesApp.ShapeType.CLOUD_CALLOUT,
          annoX,
          annoY,
          layout.pxToPt(100),
          layout.pxToPt(40)
        );
        annoBox.getFill().setSolidFill('#FFEB3B');
        setStyledText(annoBox, anno.text, {size: 10});
      });
    }

  } catch (e) {
    Logger.log(`Screenshot image failed: ${e}`);
    // フォールバック: エラーメッセージ表示
    const errorText = slide.insertShape(
      SlidesApp.ShapeType.TEXT_BOX,
      area.left,
      area.top,
      area.width,
      area.height
    );
    setStyledText(errorText, '画像の読み込みに失敗しました', {
      size: 16,
      color: CONFIG.COLORS.neutral_gray,
      align: SlidesApp.ParagraphAlignment.CENTER
    });
  }

  drawBottomBarAndFooter(slide, layout, pageNum);
}
```

---

## ⚡ Phase 3: パフォーマンス最適化

### 3.1 実行時間の短縮

**課題**: 150枚のスライド生成は20分以上かかる可能性

**解決策**:

#### A. バッチ処理の最適化
```javascript
// 画像の事前読み込み（並列処理）
const imageCache = {};

function preloadImages(slideData) {
  const imageUrls = [];
  slideData.forEach(data => {
    if (data.imageUrl) imageUrls.push(data.imageUrl);
    if (Array.isArray(data.images)) {
      data.images.forEach(img => {
        if (typeof img === 'string') imageUrls.push(img);
        else if (img.url) imageUrls.push(img.url);
      });
    }
  });

  // 重複除去
  const uniqueUrls = [...new Set(imageUrls)];

  // 事前読み込み（Google Apps Scriptの制限内で）
  uniqueUrls.forEach(url => {
    try {
      const blob = UrlFetchApp.fetch(url).getBlob();
      imageCache[url] = blob;
    } catch (e) {
      Logger.log(`Failed to preload image: ${url}`);
    }
  });
}
```

#### B. 処理進捗表示
```javascript
function generatePresentationWithProgress() {
  const ui = SlidesApp.getUi();
  const totalSlides = slideData.length;

  ui.alert(`スライド生成を開始します（全${totalSlides}枚）\n\n推定時間: ${Math.ceil(totalSlides / 10)}分`);

  let processed = 0;

  for (const data of slideData) {
    // スライド生成処理...
    processed++;

    // 10枚ごとに進捗ログ
    if (processed % 10 === 0) {
      Logger.log(`進捗: ${processed}/${totalSlides}枚 (${Math.round(processed/totalSlides*100)}%)`);
    }
  }

  ui.alert(`✅ スライド生成完了！\n\n生成枚数: ${processed}枚`);
}
```

### 3.2 Google Apps Script制限への対応

**制限事項**:
- **実行時間**: 最大6分（無料版）/ 30分（Google Workspace）
- **URL Fetch**: 1日20,000回
- **画像サイズ**: 最大25MB

**対策**:

#### A. バッチ分割実行
```javascript
// スライドを25枚ずつに分割して生成
const BATCH_SIZE = 25;

function generatePresentationInBatches() {
  const props = PropertiesService.getScriptProperties();
  let startIndex = parseInt(props.getProperty('batchStartIndex') || '0');

  const endIndex = Math.min(startIndex + BATCH_SIZE, slideData.length);

  // バッチ処理
  for (let i = startIndex; i < endIndex; i++) {
    const data = slideData[i];
    // スライド生成...
  }

  startIndex = endIndex;
  props.setProperty('batchStartIndex', String(startIndex));

  // 続きがある場合は次のバッチをトリガー
  if (startIndex < slideData.length) {
    const ui = SlidesApp.getUi();
    ui.alert(`バッチ ${Math.floor(startIndex/BATCH_SIZE)} 完了\n\n次のバッチを実行しますか？`);
  } else {
    // 完了
    props.deleteProperty('batchStartIndex');
    SlidesApp.getUi().alert('✅ 全スライド生成完了！');
  }
}
```

#### B. 画像URL最適化
```javascript
// 外部画像URLを事前にGoogle Driveに保存
function cacheImagesToDrive(imageUrls) {
  const folder = DriveApp.getFoldersByName('BytePlusBootcampImages').next();
  const cached = {};

  imageUrls.forEach(url => {
    try {
      const blob = UrlFetchApp.fetch(url).getBlob();
      const file = folder.createFile(blob);
      cached[url] = file.getDownloadUrl();
    } catch (e) {
      Logger.log(`Failed to cache image: ${url}`);
    }
  });

  return cached;
}
```

---

## 📊 Phase 4: 完全版slideData作成

### 4.1 Part 1: イントロダクション（既存）

**スライド数**: 12枚 ✅

### 4.2 Part 2: 市場動向とAPI概要（新規）

**スライド数**: 35枚

```javascript
// Part 2 のslideData例
{type: "content", title: "動画生成AI市場の現状（2025年）", subhead: "市場規模は前年比350%成長", points: [
  "**グローバル市場規模**: $2.5B（約3,500億円）",
  "**年間成長率**: 45.8% CAGR",
  "**主要プレイヤー**: Runway, Pika, BytePlus, Stability AI",
  "**日本市場**: $150M（約210億円）、成長率60%+"
]},

{type: "codeBlock", title: "APIリクエスト例（Python）", language: "python", code: `import requests

url = "https://api.byteplus.com/v1/text-to-video"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
data = {
  "prompt": "夕日が沈む海辺の風景",
  "duration": 10,
  "resolution": "1080p"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
`},

{type: "comparisonTable", title: "BytePlus vs 競合比較", headers: ["項目", "BytePlus", "Runway", "Pika"], rows: [
  ["価格", "¥100/分", "¥150/分", "¥120/分"],
  ["速度", "30秒/分", "45秒/分", "40秒/分"],
  ["品質", "4K対応", "1080p", "4K対応"],
  ["API制限", "1000req/日", "500req/日", "750req/日"]
]}
```

### 4.3 Part 3: 実装ハンズオン（新規）

**スライド数**: 90枚（15パターン × 6枚/パターン）

```javascript
// 15パターンの実装例
const implementationPatterns = [
  {id: 1, title: "テキスト→動画（基本）", slides: 6},
  {id: 2, title: "テキスト→動画（スタイル指定）", slides: 6},
  {id: 3, title: "画像→動画（I2V）", slides: 6},
  {id: 4, title: "動画編集（トリミング）", slides: 6},
  {id: 5, title: "動画編集（エフェクト）", slides: 6},
  {id: 6, title: "字幕追加", slides: 6},
  {id: 7, title: "音声追加", slides: 6},
  {id: 8, title: "バッチ処理", slides: 6},
  {id: 9, title: "エラーハンドリング", slides: 6},
  {id: 10, title: "Webhook統合", slides: 6},
  {id: 11, title: "進捗ポーリング", slides: 6},
  {id: 12, title: "カスタムパラメータ", slides: 6},
  {id: 13, title: "コスト最適化", slides: 6},
  {id: 14, title: "品質調整", slides: 6},
  {id: 15, title: "本番環境デプロイ", slides: 6}
];

// パターン1の詳細スライド例
{type: "content", title: "パターン1: テキスト→動画（基本）", subhead: "最もシンプルな実装", points: [
  "**目的**: テキストから10秒の動画を生成",
  "**難易度**: ⭐（初級）",
  "**所要時間**: 5分",
  "**必要なもの**: APIキー、Python 3.8+",
  "**成果物**: MP4動画ファイル"
]},

{type: "codeBlock", title: "実装コード（Python）", language: "python", code: `import requests
import time

# ステップ1: 動画生成リクエスト
def generate_video(prompt):
    url = "https://api.byteplus.com/v1/text-to-video"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    data = {"prompt": prompt, "duration": 10}

    response = requests.post(url, headers=headers, json=data)
    return response.json()["task_id"]

# ステップ2: 進捗確認
def check_status(task_id):
    url = f"https://api.byteplus.com/v1/tasks/{task_id}"
    response = requests.get(url, headers=headers)
    return response.json()

# ステップ3: 動画ダウンロード
def download_video(video_url, filename):
    response = requests.get(video_url)
    with open(filename, 'wb') as f:
        f.write(response.content)

# 実行
task_id = generate_video("夕日が沈む海辺")
while True:
    status = check_status(task_id)
    if status["state"] == "completed":
        download_video(status["video_url"], "output.mp4")
        break
    time.sleep(5)
`},

{type: "processFlow", title: "実行フロー", steps: [
  {label: "テキスト入力", icon: "📝"},
  {label: "APIリクエスト", icon: "⚙️"},
  {label: "生成開始", icon: "🎬"},
  {label: "ポーリング", icon: "⏳"},
  {label: "動画取得", icon: "✅"}
]},

{type: "screenshot", title: "実行結果", subhead: "生成された動画", imageUrl: "https://example.com/result.png", caption: "夕日が沈む海辺の動画（10秒、1080p）"},

{type: "content", title: "よくあるエラーと対処法", points: [
  "**401 Unauthorized**: APIキーが無効 → 再確認",
  "**429 Too Many Requests**: レート制限 → 待機してリトライ",
  "**500 Internal Server Error**: サーバー側エラー → サポートに連絡",
  "**タイムアウト**: 生成時間超過 → `duration`を短くする"
]},

{type: "content", title: "パターン1 まとめ", subhead: "✅ 学んだこと", points: [
  "✅ 基本的なAPIリクエストの送信方法",
  "✅ 非同期処理（ポーリング）の実装",
  "✅ エラーハンドリングの基礎",
  "**次のステップ**: パターン2でスタイル指定を学びます"
]}
```

### 4.4 Part 4: 収益化戦略とQ&A（新規）

**スライド数**: 13枚

```javascript
{type: "calculation", title: "ROI試算例", subhead: "月間1,000本の動画生成", items: [
  {label: "初期費用", value: "¥0"},
  {label: "月額API費用", value: "¥100,000"},
  {label: "人件費削減", value: "¥500,000"},
  {label: "差引メリット", value: "¥400,000", highlight: true}
]},

{type: "headerCards", title: "収益化の3つの戦略", columns: 3, items: [
  {title: "1. 社内効率化", desc: "動画制作時間を80%削減 → 人件費削減"},
  {title: "2. 新サービス立ち上げ", desc: "動画生成SaaSを提供 → 月額課金"},
  {title: "3. 既存サービス強化", desc: "動画生成機能を追加 → ARPU向上"}
]},

{type: "content", title: "Q&Aタイム", subhead: "🙋 どんな質問でもどうぞ！", points: [
  "**所要時間**: 30分",
  "**方法**: チャットまたは挙手して音声で",
  "**よくある質問**:",
  "  - 商用利用は可能ですか？ → **可能です**",
  "  - 生成した動画の著作権は？ → **お客様に帰属します**",
  "  - サポート期間は？ → **3ヶ月間無料**",
  "  - 追加クーポンは？ → **紹介制度あり**"
]}
```

---

## 🎨 Phase 5: デザインの洗練

### 5.1 カラースキームの拡張

**既存**: Primary Color（#4285F4）のみカスタマイズ可能

**追加**: 5色のカラーパレット

```javascript
CONFIG.COLORS = {
  primary_color: '#FF6B00',      // BytePlus Orange
  secondary_color: '#4285F4',    // Google Blue
  accent_color: '#34A853',       // Success Green
  warning_color: '#FBBC04',      // Warning Yellow
  error_color: '#EA4335',        // Error Red
  // ... existing colors
};
```

### 5.2 フォントサイズの最適化

**課題**: コードブロックが読みにくい

**解決**:
```javascript
CONFIG.FONTS.sizes = {
  // ... existing sizes
  codeBlock: 10,          // コードブロック専用（小さめ）
  codeComment: 9,         // コメント（さらに小さく）
  annotation: 8,          // アノテーション
  largeNumber: 64         // 大きな数字（統計表示用）
};
```

---

## 📦 Phase 6: 配布パッケージ化

### 6.1 スクリプトの分割

**現状**: 1ファイル（1,000行超）

**改善**: モジュール化

```
Code.gs (メインファイル)
├── Config.gs (設定)
├── SlideData.gs (スライドデータ)
├── Generators.gs (スライド生成関数)
├── Utils.gs (ユーティリティ)
└── Menu.gs (カスタムメニュー)
```

### 6.2 テンプレート配布

**提供物**:
1. **Google Slidesテンプレート**: 空のプレゼンテーション + スクリプト
2. **ドキュメント**: `README.md`（使い方）
3. **サンプルデータ**: `slideData_sample.js`（50枚分）

---

## ✅ 実装チェックリスト

### Phase 1: スライドデータ拡張 ⏳
- [ ] Part 2（35枚）のslideData作成
- [ ] Part 3（90枚）のslideData作成
- [ ] Part 4（13枚）のslideData作成
- [ ] 全150枚のスピーカーノート追加

### Phase 2: 新規スライドタイプ実装 ⏳
- [ ] `createCodeBlockSlide()`
- [ ] `createProcessFlowSlide()`
- [ ] `createScreenshotSlide()`
- [ ] `createComparisonTableSlide()`
- [ ] `createTwoColumnCodeSlide()`
- [ ] `createCalculationSlide()`

### Phase 3: パフォーマンス最適化 ⏳
- [ ] 画像事前読み込み機能
- [ ] バッチ分割実行機能
- [ ] 進捗表示機能
- [ ] エラーリカバリー機能

### Phase 4: デザイン洗練 ⏳
- [ ] カラーパレット拡張
- [ ] フォントサイズ最適化
- [ ] コードブロックシンタックスハイライト

### Phase 5: テスト ⏳
- [ ] 50枚テスト実行
- [ ] 100枚テスト実行
- [ ] 150枚フル実行
- [ ] エラーハンドリングテスト

### Phase 6: ドキュメント作成 ⏳
- [ ] README.md（使い方ガイド）
- [ ] CUSTOMIZATION.md（カスタマイズ方法）
- [ ] TROUBLESHOOTING.md（トラブルシューティング）

---

## 🚀 次のステップ（優先順位順）

### Priority 1: 即座に実施
1. **Part 2のslideData作成**（35枚）
2. **createCodeBlockSlide()実装**
3. **50枚テスト実行**

### Priority 2: 1週間以内
4. **Part 3のslideData作成**（90枚）
5. **createProcessFlowSlide()実装**
6. **バッチ分割実行機能**

### Priority 3: 2週間以内
7. **Part 4のslideData作成**（13枚）
8. **残りのスライドタイプ実装**
9. **150枚フル実行テスト**
10. **ドキュメント作成**

---

## 📝 推定作業時間

| Phase | 作業内容 | 所要時間 |
|-------|---------|---------|
| **Phase 1** | slideData作成（150枚） | 8時間 |
| **Phase 2** | 新規スライドタイプ実装（6種） | 6時間 |
| **Phase 3** | パフォーマンス最適化 | 4時間 |
| **Phase 4** | デザイン洗練 | 2時間 |
| **Phase 5** | テスト | 3時間 |
| **Phase 6** | ドキュメント | 2時間 |
| **合計** | | **25時間** |

---

## 💡 Tips（実装時の注意点）

### 1. Google Apps Scriptの制限
- **実行時間**: 最大6分（無料版）→ バッチ分割必須
- **URL Fetch**: 1日20,000回 → 画像キャッシング推奨
- **メモリ**: 100MB → 大量の画像処理は注意

### 2. エラーハンドリング
```javascript
try {
  // スライド生成処理
} catch (e) {
  Logger.log(`Slide ${i} failed: ${e.message}`);
  // 次のスライドへ進む（処理を止めない）
  continue;
}
```

### 3. デバッグ方法
```javascript
// 特定のスライドだけテスト
const DEBUG_MODE = true;
const DEBUG_START = 10; // 10枚目から
const DEBUG_END = 15;   // 15枚目まで

if (DEBUG_MODE) {
  for (let i = DEBUG_START; i < DEBUG_END; i++) {
    const data = slideData[i];
    // 生成処理...
  }
}
```

---

**ドキュメント作成完了**
Claude Code
