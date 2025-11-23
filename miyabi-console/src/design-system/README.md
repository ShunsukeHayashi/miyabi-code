# Miyabi Console - Design System Components

**Version**: 1.0.0
**Last Updated**: 2025-11-19

このディレクトリには、Miyabi Console のデザインシステムに基づいた再利用可能なコンポーネントとユーティリティが含まれています。

---

## 📁 Directory Structure

```
src/design-system/
├── README.md              # このファイル
├── colors.ts              # カラーパレット定義
├── typography.ts          # タイポグラフィ設定
├── spacing.ts             # スペーシングユーティリティ
└── animations.ts          # アニメーションプリセット
```

---

## 🎨 Usage Examples

### Colors

```tsx
import { colors } from '@/design-system/colors';

// Ive Palette
<div className="bg-white text-gray-900">
  <span className="text-blue-600">Miyabi</span>
</div>

// または直接インポート
const accentColor = colors.ive.accent;
```

### Typography

```tsx
// Hero Title
<h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-tight">
  Miyabi Console
</h1>

// Body Text
<p className="text-base font-normal text-gray-600">
  ボディテキスト
</p>
```

### Spacing

```tsx
// Section Padding
<section className="py-32 px-8">  {/* Desktop */}
<section className="py-20 px-6">  {/* Tablet */}
<section className="py-12 px-4">  {/* Mobile */}

// Card Padding
<Card className="p-12 sm:p-10 md:p-8 lg:p-6">
```

### Animations

```tsx
import { motion } from 'framer-motion';

// Page Enter
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>
  {/* Content */}
</motion.div>
```

---

## 📚 Documentation

詳細なデザインガイドラインは以下を参照:
- **Design System**: `/miyabi-console/DESIGN_SYSTEM.md`
- **Tailwind Config**: `/miyabi-console/tailwind.config.js`

---

## 🎯 Design Principles

1. **ミニマリズム** - 余計な装飾を排除
2. **一貫性** - 全ページで同じスタイル
3. **レスポンシブ** - モバイルファースト
4. **パフォーマンス** - 軽量・高速
5. **アクセシビリティ** - WCAG 2.1 AA準拠

---

## ✅ Checklist for New Components

新しいコンポーネントを作成する際のチェックリスト:

- [ ] グレースケール + 青アクセントのみ使用
- [ ] font-light または font-normal を使用
- [ ] 適切な余白 (8px grid)
- [ ] レスポンシブ対応 (sm/md/lg)
- [ ] 200ms トランジション
- [ ] WCAG 2.1 AA 準拠

---

**Maintained by**: Miyabi Design Team
