---
name: Mobile Development Workflow
description: Comprehensive mobile development workflow using Capacitor, React Native, and Tauri for iOS and Android. Use when building cross-platform mobile apps, managing app stores, or debugging mobile-specific issues.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# 📱 Mobile Development Workflow

**Version**: 1.0.0
**Last Updated**: 2025-01-10
**Priority**: ⭐⭐⭐⭐ (P1 Level)
**Purpose**: クロスプラットフォームモバイル開発統合

---

## 📋 概要

Miyabiエコシステムのモバイルアプリ開発ワークフロー。
Capacitor、React Native、Tauri Mobile統合による効率的なクロスプラットフォーム開発を管理します。

---

## 🎯 P0: 呼び出しトリガー

| トリガー | 例 |
|---------|-----|
| モバイル開発 | "build mobile app", "ios build", "android build" |
| Capacitor関連 | "capacitor", "ionic", "cordova" |
| App Store | "deploy to app store", "mobile deployment" |
| モバイルデバッグ | "mobile debug", "device testing" |
| ネイティブ機能 | "native features", "device api", "camera", "geolocation" |

---

## 🔧 P1: モバイル開発構成

### Miyabi Mobile Projects

| Project | Framework | Platforms | Build Target | Store Status |
|---------|-----------|-----------|--------------|-------------|
| **AI Course Generator** | Vite + Capacitor | iOS, Android | CCG Mobile v2 | Development |
| **Miyabi Dashboard** | Next.js + Capacitor | iOS, Android | Admin Mobile | Planning |
| **Gen-Studio Mobile** | Tauri Mobile | iOS, Android | MUSE Mobile | Future |

### 技術スタック

```typescript
// Capacitor Configuration
{
  "appId": "com.miyabi.ccg",
  "appName": "AI Course Generator",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "Camera": {
      "permissions": ["camera", "photos"]
    },
    "Geolocation": {
      "permissions": ["location"]
    },
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}
```

### 共通コマンド体系

```bash
# 開発
npm run cap:serve           # ライブリロード開発
npm run cap:run:ios        # iOSシミュレーター
npm run cap:run:android    # Androidエミュレーター

# ビルド
npm run cap:build:ios      # iOS向けビルド
npm run cap:build:android  # Android向けビルド
npm run cap:sync           # プラットフォーム同期

# デプロイ
npm run cap:deploy:ios     # App Store Connect
npm run cap:deploy:android # Google Play Console
```

---

## 🚀 P2: プラットフォーム別最適化

### Pattern 1: Capacitor + Vite (AI Course Generator)

```bash
# Capacitor開発フロー（3-8分）
cd content-generator && \
npm run build && \
npx cap sync && \
npx cap run ios --livereload --external
```

**プロジェクト構造**:

```
content-generator/
├── src/                    # Webアプリケーション
├── public/                 # 静的ファイル
├── dist/                   # ビルド出力
├── ios/                    # iOSネイティブプロジェクト
├── android/                # Androidネイティブプロジェクト
├── capacitor.config.ts     # Capacitor設定
└── vite.config.ts         # Vite設定
```

**ネイティブ機能統合**:

```typescript
// src/services/native/CameraService.ts
import { Camera, CameraResultType } from '@capacitor/camera'

export class CameraService {
  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri
      })

      return {
        webPath: image.webPath,
        format: image.format,
        saved: image.saved
      }
    } catch (error) {
      throw new Error(`Camera error: ${error.message}`)
    }
  }

  async requestPermissions() {
    const permission = await Camera.requestPermissions({
      permissions: ['camera', 'photos']
    })

    return permission.camera === 'granted'
  }
}
```

### Pattern 2: React Native統合 (Future)

```bash
# React Native開発フロー
npx react-native init MiyabiApp --template @react-native-community/template-typescript
cd MiyabiApp

# iOS
npm run ios

# Android
npm run android
```

**設定例**:

```typescript
// metro.config.js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    alias: {
      '@': './src',
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

### Pattern 3: Tauri Mobile (Gen-Studio Future)

```bash
# Tauri Mobile開発フロー
cd Gen-Studio && \
cargo install tauri-cli --version "^2.0.0-beta" && \
npm run tauri android init && \
npm run tauri android dev
```

**Tauri設定**:

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri = { version = "2.0.0-beta", features = ["mobile"] }
tauri-plugin-shell = "2.0.0-beta"

[target.aarch64-linux-android]
linker = "aarch64-linux-android21-clang"

[target.armv7-linux-androideabi]
linker = "armv7a-linux-androideabi21-clang"
```

---

## ⚡ P3: モバイル最適化戦略

### パフォーマンス最適化

```typescript
// src/config/mobile-optimization.ts
export const MOBILE_CONFIG = {
  // バンドルサイズ最適化
  chunking: {
    strategy: 'splitVendor',
    maxSize: 200 * 1024, // 200KB
  },

  // 画像最適化
  images: {
    formats: ['webp', 'avif'],
    sizes: [320, 640, 1024, 1280],
    quality: 80,
    lazy: true
  },

  // ネットワーク最適化
  network: {
    timeout: 10000,
    retries: 3,
    caching: true
  },

  // UI最適化
  ui: {
    virtualScrolling: true,
    touchOptimizations: true,
    hapticFeedback: true
  }
}
```

### ネイティブプラグイン開発

```typescript
// src/plugins/MiyabiNativePlugin.ts
import { registerPlugin } from '@capacitor/core'

export interface MiyabiNativePlugin {
  processAudio(options: { filePath: string }): Promise<{ result: string }>
  generateContent(options: { prompt: string }): Promise<{ content: string }>
  syncData(options: { endpoint: string, data: any }): Promise<{ success: boolean }>
}

const MiyabiNative = registerPlugin<MiyabiNativePlugin>('MiyabiNative', {
  web: () => import('./web/MiyabiNativeWeb').then(m => new m.MiyabiNativeWeb()),
})

export default MiyabiNative
```

### レスポンシブUI設計

```typescript
// src/hooks/useDeviceInfo.ts
import { Device } from '@capacitor/device'
import { useState, useEffect } from 'react'

export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  useEffect(() => {
    const getDeviceInfo = async () => {
      const info = await Device.getInfo()
      const screen = await Device.getLanguageCode()

      setDeviceInfo({
        platform: info.platform,
        model: info.model,
        osVersion: info.osVersion,
        isTablet: info.platform === 'ios'
          ? info.model.includes('iPad')
          : screen.screenWidth > 768
      })
    }

    getDeviceInfo()
  }, [])

  return deviceInfo
}
```

### オフライン対応

```typescript
// src/services/OfflineService.ts
import { CapacitorSQLite } from '@capacitor-community/sqlite'

export class OfflineService {
  private db: any

  async initialize() {
    this.db = await CapacitorSQLite.createConnection({
      database: 'miyabi_offline',
      version: 1,
      encrypted: false,
      mode: 'no-encryption'
    })

    await this.db.open()
    await this.createTables()
  }

  async syncWhenOnline() {
    const isOnline = (await Network.getStatus()).connected

    if (isOnline) {
      const pendingData = await this.getPendingSync()

      for (const item of pendingData) {
        try {
          await this.uploadToServer(item)
          await this.markAsSynced(item.id)
        } catch (error) {
          console.error('Sync failed for item:', item.id, error)
        }
      }
    }
  }

  async saveOffline(data: any) {
    const query = `
      INSERT INTO offline_data (id, data, synced, created_at)
      VALUES (?, ?, ?, ?)
    `

    await this.db.run(query, [
      data.id,
      JSON.stringify(data),
      false,
      new Date().toISOString()
    ])
  }
}
```

---

## 📊 App Store管理

### iOS App Store Connect

```bash
# iOS配布フロー（30-60分）
# 1. 証明書・プロファイル確認
npm run ios:certificates

# 2. アプリビルド
npm run cap:build:ios --prod

# 3. アーカイブ作成
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release archive -archivePath build/App.xcarchive

# 4. App Store Upload
xcrun altool --upload-app --file build/App.ipa --username $APPLE_ID --password $APP_PASSWORD

# 5. TestFlight配布
npm run ios:testflight
```

### Google Play Console

```bash
# Android配布フロー（20-40分）
# 1. Release APK/AAB作成
npm run cap:build:android --prod

# 2. 署名
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore miyabi.keystore android/app/build/outputs/bundle/release/app-release.aab miyabi

# 3. Play Console Upload
npm run android:upload

# 4. 段階的ロールアウト
npm run android:rollout --percentage 10
```

### 自動化スクリプト

```bash
# scripts/mobile-deploy.sh
#!/bin/bash

function deploy_mobile() {
    local platform=$1
    local environment=${2:-production}

    echo "🚀 Deploying mobile app: $platform ($environment)"

    # 1. ビルド準備
    npm run build:$environment
    npx cap sync

    # 2. プラットフォーム別デプロイ
    case $platform in
        "ios")
            npm run cap:build:ios
            if [[ $environment == "production" ]]; then
                npm run ios:appstore
            else
                npm run ios:testflight
            fi
            ;;
        "android")
            npm run cap:build:android
            if [[ $environment == "production" ]]; then
                npm run android:playstore
            else
                npm run android:internal
            fi
            ;;
        "both")
            deploy_mobile "ios" $environment &
            deploy_mobile "android" $environment &
            wait
            ;;
    esac

    echo "✅ Deployment complete"
}
```

---

## 🛡️ トラブルシューティング

### 共通問題パターン

| 問題 | プラットフォーム | 原因 | 対処 |
|------|-----------------|------|------|
| Build Failed | iOS | 証明書・プロファイル | Developer Account確認 |
| APK Error | Android | Keystore問題 | 署名設定見直し |
| Plugin Error | Both | ネイティブ依存関係 | `npx cap sync` 実行 |
| Performance | Both | バンドルサイズ | Code splitting適用 |
| Device API | Both | 権限エラー | Permissions確認 |

### モバイルデバッグ

```bash
# モバイルデバッグワークフロー
function debug_mobile() {
    local platform=$1

    echo "🔍 Mobile Debug: $platform"

    # 1. デバイス接続確認
    case $platform in
        "ios")
            xcrun devicectl list devices
            npm run cap:run:ios --list
            ;;
        "android")
            adb devices
            npm run cap:run:android --list
            ;;
    esac

    # 2. ログ監視
    npx cap run $platform --livereload --external &
    LOG_PID=$!

    # 3. デバイスログ
    case $platform in
        "ios")
            xcrun devicectl logs stream --device-id $DEVICE_ID
            ;;
        "android")
            adb logcat | grep -i miyabi
            ;;
    esac

    # クリーンアップ
    kill $LOG_PID 2>/dev/null
}
```

### パフォーマンス分析

```bash
# モバイルパフォーマンス分析
function analyze_mobile_performance() {
    echo "📊 Mobile Performance Analysis"

    # 1. バンドルサイズ分析
    npm run analyze

    # 2. メモリ使用量
    case $PLATFORM in
        "ios")
            xcrun instruments -t "Allocations" -D performance.trace MyApp.app
            ;;
        "android")
            adb shell dumpsys meminfo com.miyabi.ccg
            ;;
    esac

    # 3. 起動時間測定
    npm run test:performance:mobile

    # 4. ネットワーク分析
    npm run test:network:mobile

    echo "✅ Performance analysis complete"
}
```

---

## ✅ 成功基準

| チェック項目 | 基準 |
|-------------|------|
| **アプリ起動時間** | < 3秒 (初回), < 1秒 (再起動) |
| **バンドルサイズ** | < 10MB (initial), < 50MB (total) |
| **メモリ使用量** | < 100MB (平均) |
| **クラッシュ率** | < 1% |
| **ストア評価** | > 4.0 stars |

### 出力フォーマット

```
📱 Mobile Development Results

✅ Platform: iOS ✓, Android ✓
✅ Build: Successful (iOS: X.Xmin, Android: X.Xmin)
✅ Bundle Size: XXMb (target: <10MB)
✅ Performance: Launch XXXms (target: <3s)
✅ Store Ready: iOS TestFlight ✓, Android Internal ✓

Mobile apps ready ✓
```

---

## 🔗 関連ドキュメント

| ドキュメント | 用途 |
|-------------|------|
| `mobile/README.md` | モバイル開発ガイド |
| `capacitor.config.ts` | Capacitor設定 |
| `mobile/deployment.md` | デプロイ手順 |

---

## 📝 関連Skills

- **Frontend Framework**: Web→Mobile統合
- **Testing Framework**: モバイルテスト自動化
- **AI/LLM Integration**: モバイルAI機能
- **Environment Management**: モバイル環境設定
- **CI/CD Pipeline**: モバイル自動デプロイ