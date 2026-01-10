# Architecture Document: WindowName Bridge

## システム構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                     Playwright / Automation                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Context                           │
│  ┌───────────────────┐      ┌───────────────────┐              │
│  │   loader.html     │ ───▶ │   target site     │              │
│  │   (localhost)     │      │   (note.com)      │              │
│  └───────────────────┘      └───────────────────┘              │
│           │                          │                          │
│           ▼                          ▼                          │
│  ┌───────────────────┐      ┌───────────────────┐              │
│  │  FileReader API   │      │   inject.js       │              │
│  │  Base64 Encode    │      │   DataTransfer    │              │
│  └───────────────────┘      └───────────────────┘              │
│           │                          │                          │
│           └──────────┬───────────────┘                          │
│                      ▼                                          │
│           ┌───────────────────┐                                 │
│           │   window.name     │                                 │
│           │   (Bridge Data)   │                                 │
│           └───────────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
```

## コンポーネント設計

### C1: loader.html

**責務**: ファイル読み込みとブリッジデータ準備

```javascript
// 主要フロー
FileInput.onchange
  → FileReader.readAsDataURL()
  → Encode to Base64
  → Store in window.name
  → Navigate to target
```

**状態遷移**:
```
[Waiting] → [Reading] → [Ready] → [Navigating]
```

### C2: inject.js

**責務**: ターゲットサイトでのファイル復元と注入

```javascript
// 主要フロー
window.name.parse()
  → Base64 decode
  → Create Blob
  → Create File
  → DataTransfer.items.add()
  → input.files = dataTransfer.files
  → dispatchEvent('change')
```

**API設計**:
```javascript
window.WindowNameBridge = {
    hasBridgeData(): boolean,
    extractBridgeData(): BridgeData,
    inject(options): boolean,
    injectWhenReady(options, maxWait): void
}
```

## データフロー

### Bridge Data Format

```typescript
interface BridgeData {
    __windowNameBridge__: true;
    timestamp: number;
    file: {
        name: string;
        type: string;
        size: number;
        lastModified: number;
        data: string; // Base64 Data URL
    };
}
```

### シーケンス図

```
Playwright          loader.html         window.name         target.html
    │                    │                   │                   │
    │──goto()──────────▶│                   │                   │
    │                    │                   │                   │
    │──setInputFiles()──▶│                   │                   │
    │                    │──readAsDataURL()─▶│                   │
    │                    │                   │                   │
    │──click(bridge)────▶│──JSON.stringify()▶│                   │
    │                    │                   │                   │
    │                    │──location.href────┼──────────────────▶│
    │                    │                   │                   │
    │──addScriptTag()───────────────────────────────────────────▶│
    │                    │                   │                   │
    │──evaluate()───────────────────────────▶│◀──JSON.parse()───│
    │                    │                   │                   │
    │                    │                   │      DataTransfer │
    │                    │                   │      File inject  │
    │                    │                   │      Event fire   │
    │◀───────────────────────────────────────────────success─────│
```

## エラーハンドリング

### E1: ファイル読み込みエラー

```javascript
// loader.html
reader.onerror = () => {
    log('Failed to read file', 'error');
    setStatus('Error reading file', true);
};
```

### E2: ブリッジデータ検証失敗

```javascript
// inject.js
if (!data.__windowNameBridge__) {
    throw new Error('No bridge data found');
}
```

### E3: input要素未検出

```javascript
// inject.js - リトライメカニズム
function injectWhenReady(options, maxWait = 10000) {
    // 500ms間隔でリトライ、最大10秒
}
```

## セキュリティ考慮

### S1: オリジン制限

- loader.html は localhost からのみ提供
- 外部ホスティング禁止

### S2: データクリア

```javascript
if (clearAfterInject && success) {
    window.name = '';
}
```

### S3: 検証フラグ

- `__windowNameBridge__` フラグで意図しないデータ解釈を防止

## 拡張ポイント

### 将来対応

1. **複数ファイル対応**: files 配列化
2. **圧縮**: 大容量ファイルの圧縮転送
3. **分割転送**: window.name サイズ制限回避
4. **暗号化**: センシティブファイルの保護

## 制限事項

| 項目 | 制限 | 備考 |
|------|------|------|
| ファイルサイズ | ~5MB | Base64変換で1.33倍 |
| window.name | ~10MB | ブラウザ依存 |
| ナビゲーション | 同一タブ | window.name維持条件 |
