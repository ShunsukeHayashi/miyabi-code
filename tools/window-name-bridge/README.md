# WindowName Bridge

ヘッドレスブラウザ環境において、`window.name` を媒介とした File オブジェクトの注入を実現するブリッジパターン実装。

## 概要

クロスオリジン制限を回避しつつ、ローカルファイルをターゲットサイトの `<input type="file">` に注入するためのソリューション。

### アーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  loader.html    │     │   window.name   │     │  target site    │
│  (localhost)    │────▶│  (File as B64)  │────▶│  (note.com)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   Read file &            Store in              Inject via
   encode B64            window.name           DataTransfer API
```

## セットアップ

### 1. ローカルサーバー起動

```bash
cd server
python3 -m http.server 8085
```

### 2. ブラウザでアクセス

```
http://localhost:8085/loader.html
```

## 使用方法

### 手動使用

1. `loader.html` を開く
2. ファイルを選択
3. ターゲットURLを入力
4. "Load & Navigate" をクリック

### Playwright自動化

```javascript
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Step 1: loader.html でファイルをwindow.nameに格納
    await page.goto('http://localhost:8085/loader.html');
    await page.setInputFiles('#fileInput', '/path/to/image.png');
    await page.fill('#targetUrl', 'https://note.com/edit');
    await page.click('#bridgeBtn');

    // Step 2: ターゲットサイトで注入スクリプト実行
    await page.waitForURL('**/note.com/**');
    await page.addScriptTag({ path: './inject.js' });
    await page.evaluate(() => {
        window.WindowNameBridge.inject();
    });

    await browser.close();
})();
```

### MCP Playwright連携

```javascript
// playwright_navigate: loader.html へアクセス
// playwright_fill: ファイル選択
// playwright_click: ブリッジ実行
// playwright_evaluate: inject.js 実行
```

## ファイル構成

```
window-name-bridge/
├── AGENTS.md          # エージェント仕様書
├── README.md          # このファイル
├── server/
│   ├── loader.html    # ファイル読み込み・ブリッジUI
│   └── inject.js      # ターゲットサイト注入スクリプト
└── .ai/
    ├── prd.md         # 製品要件定義
    └── arch.md        # アーキテクチャ設計
```

## API リファレンス

### inject.js

ターゲットページで利用可能な `window.WindowNameBridge` オブジェクト:

```javascript
// ブリッジデータの存在確認
WindowNameBridge.hasBridgeData() // boolean

// ブリッジデータの抽出
WindowNameBridge.extractBridgeData() // { file, timestamp, ... }

// ファイル注入実行
WindowNameBridge.inject({
    selector: 'input[type="file"]',  // オプション: CSSセレクタ
    clearAfterInject: true,          // 注入後にwindow.nameをクリア
    onSuccess: (result) => {},       // 成功コールバック
    onError: (error) => {}           // エラーコールバック
})

// DOM準備後に自動注入
WindowNameBridge.injectWhenReady(options, maxWait)
```

### window.name データ形式

```json
{
    "__windowNameBridge__": true,
    "timestamp": 1234567890123,
    "file": {
        "name": "image.png",
        "type": "image/png",
        "size": 12345,
        "lastModified": 1234567890123,
        "data": "data:image/png;base64,..."
    }
}
```

## トラブルシューティング

| 問題 | 対処法 |
|------|--------|
| window.name が消失 | 同一タブでのナビゲーションか確認 |
| input要素が見つからない | セレクタを明示的に指定 |
| CORSエラー | localhost から実行しているか確認 |
| ファイルサイズ制限 | window.name は通常 2MB 程度まで |

## 制限事項

- window.name のサイズ制限（ブラウザ依存、通常 2-10MB）
- 同一タブでのナビゲーションが必須
- JavaScript 無効環境では動作不可

## ライセンス

MIT License - Miyabi Project
