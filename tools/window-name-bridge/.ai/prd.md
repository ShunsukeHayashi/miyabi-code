# Product Requirements Document: WindowName Bridge

## 概要

ヘッドレスブラウザ環境でのファイルアップロード自動化を実現するブリッジパターン。

## 背景・課題

### 問題

1. ヘッドレスブラウザでの `input[type="file"]` 操作は制限がある
2. クロスオリジンでのファイル転送は通常不可能
3. Playwright/Puppeteer の `setInputFiles()` はローカルファイルパスが必要

### ソリューション

`window.name` プロパティを利用したクロスオリジンデータ転送:
- ページ遷移後も `window.name` は維持される
- 同一タブ内でのナビゲーションで有効
- JavaScript から自由にアクセス可能

## ユースケース

### UC1: note.com への画像アップロード

**Actor**: Playwright 自動化スクリプト
**Goal**: ローカル画像を note.com の記事エディタにアップロード

**フロー**:
1. loader.html を開く
2. 画像ファイルを選択・Base64エンコード
3. window.name にデータ格納
4. note.com/edit へ遷移
5. inject.js で File オブジェクト復元
6. input 要素に注入

### UC2: 任意サイトへのファイルアップロード

**汎用フロー**:
1. loader.html でファイル準備
2. ターゲットURL設定
3. ブリッジ実行
4. inject.js で注入

## 機能要件

### FR1: ファイル読み込み

- [x] ローカルファイル選択 UI
- [x] Base64 エンコード
- [x] プレビュー表示
- [x] メタデータ保持 (name, type, size, lastModified)

### FR2: ブリッジ転送

- [x] window.name へのJSON格納
- [x] 検証フラグ (`__windowNameBridge__`)
- [x] タイムスタンプ記録
- [x] 同一タブ遷移

### FR3: ファイル注入

- [x] window.name からデータ抽出
- [x] Base64 → Blob 変換
- [x] File オブジェクト生成
- [x] DataTransfer API による注入
- [x] change イベント発火

### FR4: 自動化連携

- [ ] Playwright MCP 統合
- [ ] ヘッドレスモード対応
- [ ] エラーハンドリング強化

## 非機能要件

### NFR1: パフォーマンス

- ファイルサイズ上限: 5MB (Base64変換で約6.6MB)
- エンコード時間: < 1秒 (5MB以下)

### NFR2: 互換性

- Chrome 90+
- Firefox 90+
- Safari 14+

### NFR3: セキュリティ

- ローカルホストからのみ loader.html 提供
- window.name クリアオプション

## 変数定義

| 変数 | 説明 | 例 |
|------|------|-----|
| `{{TARGET_URL}}` | 注入先URL | https://note.com/edit |
| `{{LOADER_URL}}` | loader.html URL | http://localhost:8085 |
| `{{IMAGE_PATH}}` | 画像ファイルパス | /path/to/image.png |

## 成功指標

1. note.com への画像アップロード成功率 > 95%
2. 注入完了時間 < 3秒
3. エラー時の適切なログ出力
