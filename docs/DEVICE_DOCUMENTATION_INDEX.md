# 📚 Miyabi開発環境 - 端末別ドキュメント統合インデックス

**最終更新**: 2025-11-14
**作成者**: Claude Code

このドキュメントは、Miyabiプロジェクトの全端末における設定手順、環境構築、開発ガイドを一元管理するマスターインデックスです。

---

## 🎯 クイックナビゲーション

| 端末 | 主要な役割 | セットアップガイド | 接続方法 |
|------|-----------|------------------|---------|
| 📱 **Pixel 9 Pro XL** | モバイル開発・リモート制御 | [#pixel-setup](#-pixel-9-pro-xl-termux環境) | SSH, Tailscale |
| 💻 **MacBook** | ローカル開発・ビルド | [#macbook-setup](#-macbook-開発環境) | Tailscale, WiFi |
| 🖥️ **MUGEN Server** | 本番環境・AIインフラ | [#mugen-setup](#️-mugen-server-aws-ec2) | SSH, API |

---

## 📱 Pixel 9 Pro XL (Termux環境)

**役割**: モバイル開発ハブ、リモートサーバー制御、Claude Code実行環境

### 基本環境設定

#### 必須ドキュメント
- **メイン設定ガイド**: `~/.claude/CLAUDE.md`
  - グローバル環境マップ
  - SSH接続設定 (Pixel ⇄ MacBook ⇄ MUGEN)
  - tmuxリモート制御ルール
  - Claude Code Stop Hook通知

- **SSH設定**: `~/SSH_BIDIRECTIONAL_SETUP.md`
  - Pixel SSHDサーバー設定 (Port 8022)
  - MacBookからPixelへの接続方法
  - 公開鍵認証設定

- **Pixel Fold移行ガイド**: `~/PIXEL_FOLD_SETUP_GUIDE.md`
  - Termux環境セットアップ
  - パッケージインストール
  - アプリケーション設定

### モバイルアプリ開発

#### Miyabi Mobile App
- **APKインストール済み**: `~/miyabi-mobile-app.apk` (2025-11-14 15:05ビルド)
- **パッケージ名**: `com.miyabimobileapp`
- **API接続先**: `http://44.250.27.197:3002/miyabi`
- **改善版UIソース**: `~/Projects/MiyabiMobileApp-Improved/src/`
  - DashboardScreen.tsx
  - WorkersScreen.tsx
  - LogsScreen.tsx
  - SettingsScreen.tsx

#### AWS設定
- **Security Groupガイド**: `~/AWS_SecurityGroup_Setup.md`
  - Port 3002開放手順 (完了済み)
  - Security Group: aimovie-dev-sg
  - Instance: i-0403a2243764ac279

- **AWS関連プロジェクト**: `~/Projects/aws_setting/`
  - AWS-SETUP-SUMMARY.md
  - AWS-WELL-ARCHITECTED-GUIDE-MIYABI.md
  - MIYABI-TARGET-COMPANIES-JP.md

### Termux拡張機能

#### Termux:Widget
- **設定ガイド**: `~/.shortcuts/WIDGET_SETUP.md`
- **インストール手順**: `~/.shortcuts/INSTALL_GUIDE.md`
- **Widget詳細**: `~/.shortcuts/WIDGET_GUIDE.md`
- **アプリガイド**: `~/.shortcuts/TERMUX_APPS_GUIDE.md`
- **README**: `~/.shortcuts/README.md`

#### ショートカット一覧
```bash
~/.shortcuts/
├── monitor.sh              # MUGEN monitor接続
├── monitor-via-mac.sh      # MacBook経由でMUGEN monitor接続
├── (その他のshortcuts)
```

### Lark統合

#### Lark MCP設定
- **セットアップガイド**: `~/.claude/LARK_SETUP_GUIDE.md`
- **MCP設定**: `~/.claude/LARK_MCP_SETUP.md`
- **ユーザートークン**: `~/.claude/LARK_USER_TOKEN_GUIDE.md`

### X (Twitter) API

#### Codexプロジェクト
- **README**: `~/.codex/README.md`
- **X APIセットアップ (英語)**: `~/.codex/X_API_SETUP_GUIDE.md`
- **X APIセットアップ (日本語)**: `~/.codex/X_API_SETUP_GUIDE_JA.md`

### その他プロジェクト

#### Miyabiプラグイン
- **マーケットプレイス**: `~/Projects/Miyabi/.claude-plugin/MARKETPLACE_README.md`
- **プラグインREADME**: `~/Projects/Miyabi/.claude-plugin/README.md`
- **Agents**:
  - codegen.md
  - coordinator.md

---

## 💻 MacBook (開発環境)

**役割**: React Native開発、Android Studio、Metro Bundler、ビルド環境

### 環境構築

#### 接続情報
- **Tailscale IP**: `100.112.127.63`
- **SSH設定**: `~/.ssh/config` (Host: macbook)
- **Pixel→MacBook接続**:
  ```bash
  ssh -p 8022 u0_a336@192.168.3.9  # MacBookからPixelへ
  ssh macbook                       # PixelからMacBookへ
  ```

#### tmux環境
- **セッション**: `miyabi-orchestra` (2 windows)
  - Window 0: 作業用
  - Window 1: Claude Code実行
- **tmuxバイナリ**: `/opt/homebrew/bin/tmux`
- **リモート制御ルール**:
  - **重要**: コマンド送信時は必ず0.5秒のsleepを入れてからEnterキー送信
  - 詳細: `~/.claude/CLAUDE.md` (Pixel) の「MacBook tmux リモート制御」セクション

### Miyabi Mobile App開発

#### アプリソース
- **メインプロジェクト**: `~/Dev/01-miyabi/_archive/MiyabiMobileApp/`
- **Symlink**: `~/Dev/MiyabiMobileApp` → archive location
- **最新ビルド**: `~/Dev/01-miyabi/_archive/MiyabiMobileApp/android/app/build/outputs/apk/debug/app-debug.apk`
  - ビルド日時: 2025-11-14 15:05
  - サイズ: 117MB

#### ソースコード構造
```
~/Dev/01-miyabi/_archive/MiyabiMobileApp/
├── src/
│   ├── screens/          # 画面コンポーネント (2025-11-14更新)
│   │   ├── DashboardScreen.tsx
│   │   ├── WorkersScreen.tsx
│   │   ├── LogsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/         # APIサービス
│   │   └── MiyabiAPIService.ts  # MUGEN API接続
│   ├── navigation/       # React Navigation設定
│   ├── components/       # 共通コンポーネント
│   ├── hooks/            # カスタムフック
│   ├── store/            # 状態管理
│   ├── constants/        # 定数定義
│   ├── utils/            # ユーティリティ
│   ├── types/            # TypeScript型定義
│   └── assets/           # 画像・アイコン
├── android/              # Android固有設定
├── ios/                  # iOS固有設定
├── App.tsx               # エントリーポイント
├── package.json          # 依存関係
└── app.json              # React Native設定
```

#### ビルド・実行コマンド
```bash
# Metro Bundler起動
npm start

# Androidビルド
npm run android

# 依存関係インストール
npm install

# キャッシュクリア
npm start -- --reset-cache
```

### Miyabiコアプロジェクト

#### miyabi_business
- **場所**: `~/Dev/01-miyabi/_core/miyabi_business/`
- **ドキュメント**:
  - AGENT_WORKFLOW_README.md
  - README_SUBPANEL_SYSTEM.md
  - NEW_PROJECT_ARCHITECTURE.md
  - COORDINATOR.md
  - AGENTS.md
  - QUICK_REFERENCE.md
  - CLAUDE.md
  - FINAL_DELIVERABLES.md

#### miyabi-lark-os
- **場所**: `~/Dev/01-miyabi/_core/miyabi-lark-os/`
- **ドキュメント**:
  - PROJECT_SUMMARY.md
  - PRODUCTION_DEPLOYMENT_COMPLETE.md
  - DEPLOYMENT_READINESS_STATUS.md
  - COORDINATOR_IMPLEMENTATION_SUMMARY.md
  - TEST_FIX_STRATEGY.md
  - Plans.md

---

## 🖥️ MUGEN Server (AWS EC2)

**役割**: 本番環境、Miyabi Management API、AI/MLワーカー (128GB RAM)

### 基本情報

#### サーバー詳細
- **ホスト名**: `mugen` / `majin` / `majin-cpu`
- **IP**: `44.250.27.197`
- **リージョン**: `us-west-2` (AWS Oregon)
- **インスタンス**: `r5.4xlarge` (16 vCPU, 128GB RAM)
- **OS**: Ubuntu 22.04 + Deep Learning AMI
- **ユーザー**: `ubuntu`
- **SSH Key**: `~/.ssh/aimovie-dev-key-usw2.pem` (Pixel/MacBook上)

#### 接続方法
```bash
# Pixelから
m        # SSH基本接続
c        # SSH + Claude Code
cc       # SSH + tmux + Claude Code (推奨)
cm       # Mosh + Claude Code (モバイル)
mt       # tmux接続

# MacBookから
ssh -i ~/.ssh/aimovie-dev-key-usw2.pem ubuntu@44.250.27.197
ssh mugen  # SSH config設定済みの場合
```

### Miyabi Management API

#### API設定
- **ベースURL**: `http://44.250.27.197:3002/miyabi`
- **認証**: X-API-Key ヘッダー
- **API Key**: `93304e039eea24d50c7d91f6a7cb5d581e931357e04c2c19dce1ae6d3b309d89`
- **ポート**: `3002` (AWS Security Group開放済み)

#### エンドポイント
- `GET /miyabi/status` - システムステータス
- `GET /miyabi/workers` - ワーカー一覧
- `POST /miyabi/workers/{id}/start` - ワーカー起動
- `POST /miyabi/workers/{id}/stop` - ワーカー停止
- `POST /miyabi/workers/{id}/restart` - ワーカー再起動
- `GET /miyabi/logs` - ログ取得

### プロジェクト構造

#### メインプロジェクト
```
/home/ubuntu/miyabi-private/
├── deployment/
│   └── SETUP_GUIDE.md          # デプロイメントガイド
├── miyabi-dashboard/
│   ├── README.md
│   ├── TESTING_SETUP_SUMMARY.md
│   ├── MOCK_DATA.md
│   ├── MISSION_CONTROL_README.md
│   ├── INTEGRATION_GUIDE.md
│   ├── TESTING_STRATEGY.md
│   └── STORYBOOK_GUIDE.md
├── examples/
│   ├── README.md
│   └── demo-issue.md
├── database/
│   └── README.md
├── .miyabi-orchestra-ready.md
├── SECURITY.md
├── README.md
└── DESIGN_DELIVERABLES_SUMMARY.md
```

#### PRワーカー環境
```
/home/ubuntu/
├── miyabi-pr-worker-1/
├── miyabi-pr-worker-2/
├── miyabi-pr-worker-3/
└── miyabi-pr-worker-4/
```

### 運用コマンド (Pixelから実行)

#### システム監視
```bash
jcpu      # CPU/RAM統計
jgpu      # GPU統計 (利用可能な場合)
```

#### ファイル転送
```bash
jup <file>      # アップロード
jdown <file>    # ダウンロード
```

#### Git操作
```bash
mg       # git status
mgl      # git log (最新10件)
mgd      # git diff
mgp      # git pull
```

#### ビルド・テスト
```bash
mb       # cargo build
mbt      # cargo test
mbc      # cargo clippy
mbr      # cargo build --release
```

---

## 🔄 デバイス間連携フロー

### 開発フロー例

#### 1. モバイルアプリ開発
```
MacBook                    Pixel                      MUGEN
   ├─ コード編集          ├─ Claude Code          ├─ API稼働
   ├─ npm run android     ├─ APK受信              ├─ Worker管理
   └─ Metro Bundler       └─ デバイステスト       └─ ログ提供
```

#### 2. リモート開発
```
Pixel (Termux)
   ├─ SSH → MacBook (tmuxリモート制御)
   ├─ SSH → MUGEN (Claude Code実行)
   └─ Termux:Widget (ショートカット実行)
```

#### 3. デプロイフロー
```
MacBook                    Pixel                      MUGEN
   └─ ビルド実行          ├─ 転送制御              ├─ デプロイ受信
                          └─ 確認・テスト          └─ サービス再起動
```

---

## 🛠️ トラブルシューティング

### よくある問題と解決策

#### Pixel Termux

**問題**: SSHDが起動しない
```bash
# 再起動
pkill sshd && sshd

# 起動確認
pgrep sshd
```

**問題**: Claude Code通知が来ない
```bash
# Hookスクリプト確認
cat ~/.claude/hooks/stop.sh

# テスト実行
~/Scripts/test-notification.sh
```

#### MacBook

**問題**: tmuxリモート制御が失敗
```bash
# Enterキー送信前に必ずsleep
sleep 0.5 && ssh macbook "/opt/homebrew/bin/tmux send-keys -t 'miyabi-orchestra:1' 'command' Enter"
```

**問題**: Metro Bundlerポート競合
```bash
# MacBookから
lsof -ti:8081 | xargs kill -9
```

#### MUGEN Server

**問題**: API接続できない
```bash
# Pixelから疎通確認
curl -H "X-API-Key: 93304e039eea24d50c7d91f6a7cb5d581e931357e04c2c19dce1ae6d3b309d89" http://44.250.27.197:3002/miyabi/status

# MUGENでサービス確認
ssh mugen 'ps aux | grep lark-oauth'
ssh mugen 'netstat -tuln | grep 3002'
```

**問題**: Worker起動失敗
```bash
# MUGENでログ確認
ssh mugen 'cd ~/miyabi-private && cargo run --release'
```

---

## 📖 参考リンク

### 公式ドキュメント
- **Claude Code**: https://docs.claude.com/en/docs/claude-code
- **React Native**: https://reactnative.dev/docs/getting-started
- **Termux**: https://termux.dev/en/
- **Termux:Widget**: https://wiki.termux.com/wiki/Termux:Widget

### AWS関連
- **EC2インスタンス**: AWS Console → EC2 → i-0403a2243764ac279
- **Security Group**: AWS Console → EC2 → Security Groups → aimovie-dev-sg
- **リージョン**: us-west-2 (Oregon)

### プロジェクト管理
- **GitHub Issues**: (プロジェクトリポジトリURL)
- **Lark通知**: Miyabi公式LINE
- **Codex**: X (Twitter) 連携

---

## 🔐 セキュリティ情報

### SSH鍵管理

#### Pixel認証済み鍵
- `termux-pixel-tablet` (SSH RSA)
- `shunsuke` (SSH ED25519)

#### MUGEN接続鍵
- `~/.ssh/aimovie-dev-key-usw2.pem` (Pixel/MacBook両方に配置)

### API認証

#### Miyabi Management API
- **X-API-Key**: `93304e039eea24d50c7d91f6a7cb5d581e931357e04c2c19dce1ae6d3b309d89`
- **Rate Limit**: 100リクエスト/時間

#### Lark API
- 詳細: `~/.claude/LARK_USER_TOKEN_GUIDE.md`

#### X (Twitter) API
- 詳細: `~/.codex/X_API_SETUP_GUIDE_JA.md`

---

## 📊 システム監視

### MUGEN Monitor Session

**アクセス方法 (Pixelから)**:
```bash
# 直接接続
mon                        # Alias
~/.shortcuts/monitor.sh    # Widget

# MacBook経由
mon-mac                    # Alias
~/.shortcuts/monitor-via-mac.sh  # Widget
```

**レイアウト**:
- Left (Main): miyabi-private workspace
- Top-Right: htop (CPU/RAM)
- Bottom-Right: system stats

---

## 📝 ドキュメントメンテナンス

### 更新履歴

**2025-11-14**:
- ✅ 初版作成
- ✅ 全端末のドキュメントインデックス化
- ✅ Miyabi Mobile App APK転送完了
- ✅ AWS Security Group Port 3002開放完了
- ✅ デバイス間連携フロー整備

### 今後の更新予定

- [ ] Pixel Fold環境の統合
- [ ] CI/CDパイプライン documentation
- [ ] 本番デプロイ手順書
- [ ] バックアップ・復旧手順

---

**このドキュメントは全環境で最新状態を保つよう、定期的に更新してください。**

**作成日**: 2025-11-14
**管理者**: Miyabi Development Team
**連絡先**: Lark公式チャンネル
