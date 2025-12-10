# Miyabi Stream Deck Configuration

## 概要
このディレクトリには、Miyabi開発用のStream Deck設定が含まれています。

## ディレクトリ構造

```
.streamdeck/
├── actions/           # Stream Deckアクション定義
│   └── shortcut_control_c_j.json
├── scripts/           # 実行スクリプト
│   └── control_c_j.sh
├── configs/           # プロファイル設定
│   └── miyabi_profile.json
└── README.md          # このファイル
```

## セットアップ手順

### 1. Stream Deckアプリでの設定
1. Stream Deckアプリを開く
2. 新しいプロファイルを作成: "Miyabi Development"
3. ボタンを追加してスクリプトを設定

### 2. ボタン設定
- **アクション**: システム > 開く
- **パス**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.streamdeck/scripts/control_c_j.sh`
- **タイトル**: "Ctrl+C+J"
- **アイコン**: ⌨️

## 利用可能なショートカット

### Control+C+J ショートカット
- **機能**: Control+C+J キーコンビネーションを送信
- **用途**: カスタムアプリケーション操作
- **スクリプト**: `scripts/control_c_j.sh`

## 新しいショートカットの追加方法

1. `scripts/` に新しいスクリプトを作成
2. スクリプトを実行可能にする: `chmod +x scripts/your_script.sh`
3. `actions/` にアクション定義JSONを作成
4. `configs/miyabi_profile.json` にボタンを追加
5. Stream Deckアプリで新しいボタンを設定

## トラブルシューティング

### スクリプトが実行されない場合
1. 実行権限を確認: `ls -la scripts/`
2. スクリプトパスが正しいか確認
3. macOSのアクセシビリティ権限を確認

### キーボードショートカットが送信されない場合
1. システム環境設定 > セキュリティとプライバイシー > アクセシビリティでStream Deckアプリを許可
2. 対象アプリケーションがアクティブか確認

## 注意事項
- macOS Monterey以降ではアクセシビリティ権限が必要
- 一部のアプリケーションではキーコードが異なる場合があります