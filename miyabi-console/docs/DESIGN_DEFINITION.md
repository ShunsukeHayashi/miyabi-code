# Miyabi Console - デザイン定義書 (Design Definition)

**プロジェクト**: Miyabi Console
**バージョン**: 1.0.0
**最終更新**: 2025-11-18
**コンセプト**: 雅 (Miyabi) - 洗練された日本の美意識 × 未来的ハイテクデザイン

---

## 📐 デザインフィロソフィー

### コアコンセプト
- **雅 (Miyabi)**: 洗練された、上品な、優美な
- **モダン**: 最新技術を反映したUI/UX
- **アクセシブル**: 全てのユーザーが使いやすい設計
- **一貫性**: 統一されたビジュアル言語

---

## 🎨 カラーパレット (Color Palette)

### 1. ブランドカラー (Brand Colors)

#### プライマリーカラー

| 名称 | Hex | RGB | 用途 |
|------|-----|-----|------|
| **Miyabi Purple** | `#764ba2` | (118, 75, 162) | メインブランドカラー |
| **Miyabi Blue** | `#667eea` | (102, 126, 234) | セカンダリーブランド |
| **Miyabi Pink** | `#f093fb` | (240, 147, 251) | アクセント |
| **Miyabi Cyan** | `#4facfe` | (79, 172, 254) | アクセント2 |

#### グラデーション定義

```css
/* プライマリーグラデーション */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* ヒーローグラデーション（ログイン画面等） */
background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);

/* 4カラーグラデーション（背景用） */
background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 100%);
```

### 2. セマンティックカラー (Semantic Colors)

| 用途 | カラー | Hex | 使用例 |
|------|--------|-----|--------|
| **Success** | Green | `#10B981` | 成功メッセージ、完了状態 |
| **Warning** | Amber | `#F59E0B` | 警告、注意が必要な状態 |
| **Error** | Red | `#EF4444` | エラー、失敗状態 |
| **Info** | Blue | `#3B82F6` | 情報、中立的な通知 |

### 3. ステータスカラー (Status Colors)

#### エージェント・タスクステータス

| ステータス | カラー | Hex | アイコン | グラデーション |
|-----------|--------|-----|---------|--------------|
| **Pending** | Gray | `#9CA3AF` | ⏸ | `linear-gradient(135deg, #6b7280 0%, #9ca3af 50%, #d1d5db 100%)` |
| **Running** | Purple | `#8B5CF6` | ▶️ | `linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)` |
| **Analyzing** | Blue | `#3B82F6` | 🔍 | `linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)` |
| **Completed** | Green | `#10B981` | ✅ | `linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)` |
| **Failed** | Red | `#EF4444` | ❌ | `linear-gradient(135deg, #ef4444 0%, #f87171 50%, #fca5a5 100%)` |
| **Paused** | Light Purple | `#D4C5F9` | ⏸ | `linear-gradient(135deg, #c4b5fd 0%, #d4c5f9 100%)` |

### 4. アクティビティタイプカラー (Activity Type Colors)

| タイプ | カラー | Hex | アイコン |
|--------|--------|-----|---------|
| **Agent** | Purple | `#8B5CF6` | 🤖 |
| **Deployment** | Red | `#EF4444` | 🚀 |
| **System** | Blue | `#3B82F6` | ⚙️ |
| **User** | Cyan | `#06B6D4` | 👤 |

---

## 🖌️ タイポグラフィ (Typography)

### フォントファミリー

```css
/* プライマリーフォント */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif;

/* モノスペースフォント（コード表示用） */
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
```

### フォントサイズスケール

| サイズ | Tailwind | rem | px | 用途 |
|--------|----------|-----|-----|------|
| **XS** | `text-xs` | 0.75rem | 12px | キャプション、タイムスタンプ |
| **SM** | `text-sm` | 0.875rem | 14px | ボディテキスト、説明文 |
| **Base** | `text-base` | 1rem | 16px | デフォルト |
| **LG** | `text-lg` | 1.125rem | 18px | 大きめのボディ |
| **XL** | `text-xl` | 1.25rem | 20px | サブヘッダー |
| **2XL** | `text-2xl` | 1.5rem | 24px | セクションタイトル |
| **3XL** | `text-3xl` | 1.875rem | 30px | ページタイトル |
| **4XL** | `text-4xl` | 2.25rem | 36px | ヒーローヘッダー |

### フォントウェイト

| ウェイト | Tailwind | 値 | 用途 |
|----------|----------|-----|------|
| **Light** | `font-light` | 300 | デリケートな表現 |
| **Normal** | `font-normal` | 400 | ボディテキスト |
| **Medium** | `font-medium` | 500 | やや強調 |
| **Semibold** | `font-semibold` | 600 | サブヘッダー |
| **Bold** | `font-bold` | 700 | 強調、重要な情報 |

---

## 🎭 グラスモーフィズム (Glassmorphism)

### 標準グラスエフェクト

```css
/* Light Glass */
.glass-light {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

/* Dark Glass */
.glass-dark {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
}

/* Glass Card */
.glass-card {
  background: linear-gradient(
    135deg,
    rgba(17, 24, 39, 0.95) 0%,
    rgba(31, 41, 55, 0.95) 100%
  );
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.2);
}
```

### 使用ガイドライン

- **カード**: `.glass-card` を使用
- **モーダル**: `.glass-dark` を使用
- **オーバーレイ**: `.glass-light` を使用

---

## 📦 コンポーネントスタイル

### 1. ボタン (Buttons)

#### プライマリーボタン

```tsx
<Button
  className="
    bg-gradient-to-br from-purple-500 to-pink-500
    hover:from-purple-600 hover:to-pink-600
    text-white font-semibold
    px-6 py-3 rounded-lg
    shadow-lg hover:shadow-xl
    transform hover:-translate-y-0.5
    transition-all duration-200
  "
>
  ボタンテキスト
</Button>
```

#### セカンダリーボタン

```tsx
<Button
  variant="flat"
  color="primary"
  className="font-medium"
>
  ボタンテキスト
</Button>
```

### 2. カード (Cards)

#### 標準カード

```tsx
<Card className="glass-card">
  <CardHeader className="pb-3">
    <h2 className="text-xl font-semibold">タイトル</h2>
  </CardHeader>
  <CardBody>
    コンテンツ
  </CardBody>
</Card>
```

#### グラデーションカード（ステータス表示用）

```tsx
<Card className="bg-gradient-to-br from-blue-500 to-blue-600">
  <CardBody className="p-6">
    <p className="text-sm text-white/80 mb-1">ラベル</p>
    <p className="text-3xl font-bold text-white">値</p>
  </CardBody>
</Card>
```

### 3. チップ (Chips)

```tsx
{/* ステータスチップ */}
<Chip color="success" variant="flat" size="sm">
  成功
</Chip>

<Chip color="warning" variant="flat" size="sm">
  警告
</Chip>

<Chip color="danger" variant="flat" size="sm">
  エラー
</Chip>

<Chip color="primary" variant="flat" size="sm">
  情報
</Chip>
```

---

## 🎬 アニメーション (Animations)

### トランジション基準

```css
/* 標準トランジション */
transition: all 0.2s ease-in-out;

/* ホバーエフェクト */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* ページトランジション */
transition: all 0.5s ease-out;
```

### アニメーション定義

#### グラデーションシフト

```css
@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
}
```

#### フェードイン

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
```

### アニメーション使用ガイドライン

- **ページ読み込み**: フェードイン (0.5s)
- **ホバー**: トランスフォーム + シャドウ (0.2s)
- **モーダル**: スケール + フェード (0.3s)
- **背景**: グラデーションシフト (15s)

---

## 📐 スペーシング (Spacing)

### スペーシングスケール

| サイズ | Tailwind | rem | px |
|--------|----------|-----|-----|
| **0** | `0` | 0 | 0 |
| **1** | `1` | 0.25rem | 4px |
| **2** | `2` | 0.5rem | 8px |
| **3** | `3` | 0.75rem | 12px |
| **4** | `4` | 1rem | 16px |
| **6** | `6` | 1.5rem | 24px |
| **8** | `8` | 2rem | 32px |
| **12** | `12` | 3rem | 48px |
| **16** | `16` | 4rem | 64px |

### 共通パターン

| 用途 | クラス | 値 |
|------|--------|-----|
| **カードパディング** | `p-6` | 24px |
| **セクション間隔** | `space-y-6` | 24px vertical |
| **ボタンパディング** | `px-6 py-3` | 24px horizontal, 12px vertical |
| **グリッドギャップ** | `gap-4` | 16px |

---

## 🌗 ダークモード対応

### カラー定義

```css
/* Light Mode */
:root {
  --background: #ffffff;
  --foreground: #000000;
  --card: #f9fafb;
  --card-foreground: #111827;
}

/* Dark Mode */
:root[class~="dark"] {
  --background: #0f172a;
  --foreground: #f8fafc;
  --card: #1e293b;
  --card-foreground: #f1f5f9;
}
```

### 使用例

```tsx
<div className="bg-background text-foreground">
  <Card className="bg-card text-card-foreground">
    コンテンツ
  </Card>
</div>
```

---

## ♿ アクセシビリティ (Accessibility)

### コントラスト比基準

| レベル | 比率 | 用途 |
|--------|------|------|
| **AA Large** | 3:1 | 大きなテキスト (18pt以上) |
| **AA Normal** | 4.5:1 | 通常のテキスト |
| **AAA Large** | 4.5:1 | 大きなテキスト (推奨) |
| **AAA Normal** | 7:1 | 通常のテキスト (推奨) |

### ステータス表示ガイドライン

ステータスを色だけで表現しない：

```tsx
{/* ❌ 悪い例 */}
<Chip color="success">Active</Chip>

{/* ✅ 良い例 */}
<Chip color="success" startContent={<CheckIcon />}>
  Active
</Chip>
```

### モーション設定

```css
/* ユーザーがモーション削減を希望している場合 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📱 レスポンシブデザイン

### ブレークポイント

| デバイス | Tailwind | 最小幅 |
|----------|----------|--------|
| **Mobile** | (default) | 0px |
| **SM** | `sm:` | 640px |
| **MD** | `md:` | 768px |
| **LG** | `lg:` | 1024px |
| **XL** | `xl:` | 1280px |
| **2XL** | `2xl:` | 1536px |

### レスポンシブパターン

```tsx
{/* モバイルファースト */}
<div className="
  text-sm        /* モバイル: 14px */
  sm:text-base   /* タブレット: 16px */
  lg:text-lg     /* デスクトップ: 18px */
">
  レスポンシブテキスト
</div>

{/* グリッドレイアウト */}
<div className="
  grid
  grid-cols-1       /* モバイル: 1列 */
  sm:grid-cols-2    /* タブレット: 2列 */
  lg:grid-cols-4    /* デスクトップ: 4列 */
  gap-4
">
  {/* カード */}
</div>
```

---

## 🎯 コンポーネント使用例

### ダッシュボードカード

```tsx
<Card className="bg-gradient-to-br from-blue-500 to-blue-600">
  <CardBody className="p-4 sm:p-6">
    <p className="text-xs sm:text-sm text-white/80 mb-1">
      Active Agents
    </p>
    <p className="text-2xl sm:text-3xl font-bold text-white">
      12/14
    </p>
  </CardBody>
</Card>
```

### アクティビティフィード

```tsx
<Card className="w-full">
  <CardHeader className="flex gap-3">
    <div className="flex flex-col">
      <p className="text-md font-semibold">Activity Feed</p>
      <p className="text-small text-default-500">Real-time updates</p>
    </div>
  </CardHeader>
  <Divider />
  <CardBody className="gap-3 max-h-[600px] overflow-y-auto">
    {/* Activity items */}
  </CardBody>
</Card>
```

### ユーザープロフィール

```tsx
<Dropdown placement="bottom-end">
  <DropdownTrigger>
    <User
      as="button"
      avatarProps={{
        src: user.avatar_url,
        size: 'sm',
      }}
      className="transition-transform hover:scale-105 cursor-pointer"
      description={`@${user.username}`}
      name={user.username}
    />
  </DropdownTrigger>
  <DropdownMenu aria-label="User Actions" variant="flat">
    <DropdownItem key="profile" className="h-14 gap-2">
      <p className="font-semibold">Logged in as</p>
      <p className="font-semibold">{user.email}</p>
    </DropdownItem>
    <DropdownItem key="logout" color="danger" onClick={logout}>
      Log Out
    </DropdownItem>
  </DropdownMenu>
</Dropdown>
```

---

## 📝 コーディング規約

### CSS クラス命名規則

```css
/* コンポーネント名-要素-修飾子 */
.activity-feed {}
.activity-feed__item {}
.activity-feed__item--active {}

/* ユーティリティクラス */
.glass-card {}
.gradient-text {}
.animate-fade-in {}
```

### Tailwind クラスの順序

```tsx
className="
  {/* Layout */}
  flex items-center justify-between

  {/* Spacing */}
  p-6 gap-4

  {/* Size */}
  w-full h-auto

  {/* Typography */}
  text-lg font-semibold

  {/* Visual */}
  bg-gradient-to-br from-purple-500 to-pink-500
  border border-white/20
  rounded-lg

  {/* Effects */}
  shadow-lg

  {/* Interactions */}
  hover:shadow-xl
  transition-all
"
```

---

## 🎨 カラー実装コード

### colors.ts

```typescript
export const colors = {
  brand: {
    purple: '#764ba2',
    blue: '#667eea',
    pink: '#f093fb',
    cyan: '#4facfe',
  },

  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  status: {
    pending: '#9CA3AF',
    running: '#8B5CF6',
    analyzing: '#3B82F6',
    completed: '#10B981',
    failed: '#EF4444',
    paused: '#D4C5F9',
  },

  activity: {
    agent: '#8B5CF6',
    deployment: '#EF4444',
    system: '#3B82F6',
    user: '#06B6D4',
  },
};

export const gradients = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  hero: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  full: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 100%)',

  status: {
    running: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    completed: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
    failed: 'linear-gradient(135deg, #ef4444 0%, #f87171 50%, #fca5a5 100%)',
  },
};
```

---

## 🔍 チェックリスト

### デザイン実装チェックリスト

- [ ] ブランドカラーを使用しているか？
- [ ] セマンティックカラーを適切に使用しているか？
- [ ] コントラスト比は基準を満たしているか？
- [ ] ステータスは色+アイコンで表現しているか？
- [ ] レスポンシブデザインになっているか？
- [ ] アニメーションは控えめか？（prefers-reduced-motion対応）
- [ ] グラスモーフィズムを適切に使用しているか？
- [ ] タイポグラフィスケールに従っているか？
- [ ] スペーシングは一貫しているか？

---

## 📚 参考リソース

### 外部リソース

- [HeroUI Documentation](https://heroui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### プロジェクト内リソース

- `tailwind.config.js` - カラー設定
- `src/index.css` - グローバルスタイル
- `src/design-system/colors.ts` - カラー定義

---

**このドキュメントは Miyabi Console プロジェクトの公式デザイン仕様書です。**
**全ての新規コンポーネントはこの仕様に従って実装してください。**

---

*Last updated: 2025-11-18*
*Version: 1.0.0*
*Maintained by: Miyabi Development Team*
