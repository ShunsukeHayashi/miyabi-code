# Miyabi Pitch Deck - Asset Specification

**Project**: Miyabi AGI OS Pitch Deck
**Design System**: Jonathan Ive Minimalist Design (継承)
**Target**: Marp Presentation (HTML/PDF/PPTX)
**Date**: 2025-10-18

---

## 📋 Design Philosophy

**Jonathan Ive Design Principles** (from miyabi-jony.css):
1. **Simplicity**: One accent color (#007AFF), flat design, no gradients
2. **Whitespace**: Generous padding and margins (95%+ white space)
3. **Typography**: Lightweight fonts (300-500 weight), optical refinement
4. **Honesty**: No unnecessary decoration or effects
5. **Clarity**: Clear hierarchy through size and weight, not color
6. **Refinement**: Letter-spacing, line-height carefully tuned

**Additional Pitch Deck Requirements**:
- **Professional**: 投資家・役員向けの高品質ビジュアル
- **Emotional Impact**: 数字とビジョンを視覚的に表現
- **Scalable**: PDF/PPTX出力で品質を維持
- **Fast Loading**: HTML版でLighthouse Performance 95+

---

## 🎨 Color Palette

### Primary Colors (from miyabi-jony.css)
```css
--color-primary: #000000        /* Pure black for clarity */
--color-accent: #007AFF         /* Apple blue - only accent color */
--color-background: #ffffff     /* Pure white for maximum contrast */
--color-text: #1d1d1f          /* Near-black (Apple's text color) */
--color-text-light: #86868b    /* Gray for secondary text */
--color-subtle: #f5f5f7        /* Subtle background (Apple's light gray) */
```

### Asset-Specific Colors
```
SVG Icons: #1d1d1f (Near-black)
SVG Stroke: 1.5px
Background Images: Monochromatic (white to light gray #f5f5f7)
Accent Elements: #007AFF (sparingly)
```

---

## 📐 Asset Requirements

### 1. Background Images (AI-Generated)

**Purpose**: スライド背景として使用、Jonathan Ive極限ミニマリズム

#### Opening Slide Background
- **Filename**: `opening-background-minimal.webp`
- **Resolution**: 1920x1080px (16:9)
- **Prompt**:
  ```
  ULTRA-MINIMAL abstract composition, 98% pure white (#ffffff) background,
  whisper-quiet geometric shapes, barely visible light gray (#f5f5f7) elements,
  monochromatic palette ONLY, no colors, no gradients,
  Jony Ive extreme minimalism, Apple-style simplicity,
  AGI OS concept, future technology, clean and refined,
  professional presentation background, 2K resolution
  ```
- **Opacity**: 5-10% (極度に控えめ)
- **Usage**: Opening slide (<!-- _class: opening -->)

#### Act Title Background
- **Filename**: `act-title-background-minimal.webp`
- **Resolution**: 1920x1080px (16:9)
- **Prompt**:
  ```
  ULTRA-MINIMAL abstract composition, 95% white space,
  subtle light gray (#f5f5f7) geometric patterns,
  monochromatic palette ONLY, no colors,
  Jony Ive extreme minimalism, refined and professional,
  section divider concept, barely perceptible depth,
  whisper-quiet visual, 2K resolution
  ```
- **Opacity**: 8-12%
- **Usage**: Act 1 & Act 2 title slides (<!-- _class: act-title -->)

#### Closing Slide Background
- **Filename**: `closing-background-minimal.webp`
- **Resolution**: 1920x1080px (16:9)
- **Prompt**:
  ```
  ULTRA-MINIMAL abstract composition, 97% white space,
  barely visible light gray (#f5f5f7) elements,
  monochromatic palette ONLY, no colors,
  Jony Ive extreme minimalism, elegant conclusion,
  future technology, refined and confident,
  2K resolution, whisper-quiet visual
  ```
- **Opacity**: 5-8%
- **Usage**: Final/Closing slides (<!-- _class: closing -->)

#### Data Visualization Background
- **Filename**: `data-viz-background-minimal.webp`
- **Resolution**: 1920x1080px (16:9)
- **Prompt**:
  ```
  ULTRA-MINIMAL abstract composition, 96% white space,
  geometric grid patterns, barely visible light gray (#f5f5f7),
  monochromatic palette ONLY, no colors,
  Jony Ive extreme minimalism, data-driven concept,
  subtle depth, refined and professional,
  2K resolution, whisper-quiet visual
  ```
- **Opacity**: 10-15%
- **Usage**: Data-heavy slides (17.9兆円, 9%, 10億人)

**Total Background Images**: 4 files

---

### 2. SVG Icons

**Design Guidelines**:
- **Stroke weight**: 1.5px (consistent)
- **Color**: #1d1d1f (Near-black)
- **Size**: 48x48px (standard), 64x64px (large)
- **Style**: Monochromatic, geometric, minimal
- **No gradients, no shadows**

#### Concept Icons (5 files)

1. **brain.svg** (脳 - AGI Layer)
   - **Size**: 64x64px
   - **Description**: 極限までシンプルな脳のアウトライン、3本のニューロン線
   - **Usage**: Slide 7 (脳が考え、神経がつなぎ、筋肉が動かす)

2. **network.svg** (神経 - DX Layer)
   - **Size**: 64x64px
   - **Description**: 3つのノードを結ぶネットワーク線、極度にシンプル
   - **Usage**: Slide 7 (DX Layer - 神経)

3. **power.svg** (筋肉 - AI Cloud Layer)
   - **Size**: 64x64px
   - **Description**: エネルギー/パワーを表す3本の線、ミニマル
   - **Usage**: Slide 7 (AI Cloud Layer - 筋肉)

4. **store.svg** (ショッピングモール - AGI OS)
   - **Size**: 64x64px
   - **Description**: 1つのビルディングアウトライン、極度にシンプル
   - **Usage**: Slide 8 (箱の中の革命)

5. **stall.svg** (屋台 - 従来SaaS)
   - **Size**: 48x48px
   - **Description**: 小さな屋台のアウトライン、3本の線で表現
   - **Usage**: Slide 8 (路上の屋台)

#### Data Icons (3 files)

6. **currency.svg** (通貨 - 17.9兆円)
   - **Size**: 48x48px
   - **Description**: 円記号（¥）のミニマルアウトライン
   - **Usage**: Slide 3 (17.9兆円の流出)

7. **percentage.svg** (パーセンテージ - 9%)
   - **Size**: 48x48px
   - **Description**: パーセント記号（%）のミニマルアウトライン
   - **Usage**: Slide 4 (AI利用率：わずか9%)

8. **people.svg** (人口 - 10億人)
   - **Size**: 48x48px
   - **Description**: 3人のシルエット、極度にシンプル
   - **Usage**: Slide 1 & Slide 4 (10億人)

#### Brand Icon (1 file)

9. **miyabi-logo.svg** (Miyabi ロゴ)
   - **Size**: 128x32px (横長)
   - **Description**: "Miyabi"テキストロゴ、極度にシンプルなサンセリフ
   - **Usage**: Opening slide, Closing slide

**Total SVG Icons**: 9 files

---

### 3. Export Formats

#### WebP Images (Background Images)
- **Format**: WebP
- **Quality**: 90
- **Resolution**: 1920x1080px
- **Compression**: Target 50KB-150KB per file
- **Color Space**: sRGB

#### SVG Icons
- **Format**: SVG (optimized with SVGO)
- **Compression**: Target <2KB per icon
- **Viewbox**: 0 0 48 48 (or 64 64, 128 32)

---

## 📦 Asset Inventory

### Summary

| Category | Count | Total Size (Target) |
|----------|-------|---------------------|
| Background Images (WebP) | 4 | ~400KB |
| SVG Icons | 9 | ~18KB |
| **Total** | **13** | **~418KB** |

### File Structure

```
docs/pitch-deck/
└── assets/
    ├── backgrounds/
    │   ├── opening-background-minimal.webp
    │   ├── act-title-background-minimal.webp
    │   ├── closing-background-minimal.webp
    │   └── data-viz-background-minimal.webp
    ├── icons/
    │   ├── concept/
    │   │   ├── brain.svg
    │   │   ├── network.svg
    │   │   ├── power.svg
    │   │   ├── store.svg
    │   │   └── stall.svg
    │   ├── data/
    │   │   ├── currency.svg
    │   │   ├── percentage.svg
    │   │   └── people.svg
    │   └── brand/
    │       └── miyabi-logo.svg
    └── bg-gradient.svg (existing)
```

---

## 🎯 Success Criteria

### Design Compliance
- ✅ 100% Jonathan Ive design principles adherence
- ✅ Monochromatic palette (black + white + one accent)
- ✅ 95%+ white space in all images
- ✅ No gradients, no shadows
- ✅ Consistent 1.5px stroke weight for SVG

### Technical Quality
- ✅ WebP compression: 80%+ reduction from original
- ✅ SVG optimization: <2KB per icon
- ✅ Scalability: Works in PDF/PPTX export
- ✅ Performance: HTML version Lighthouse Performance 95+

### Usability
- ✅ Clear visual hierarchy
- ✅ Professional presentation quality
- ✅ Emotional impact (投資家向け)
- ✅ Scalable to different screen sizes

---

## 📚 Related Documents

- **Workflow**: `/Users/a003/dev/miyabi-portal/docs/workflows/UI_UX_DESIGN_IMPROVEMENT_WORKFLOW.md`
- **Landing Page Assets**: `/Users/a003/dev/miyabi-portal/ASSET_SPECIFICATION.md`
- **Theme**: `/Users/a003/dev/miyabi-private/docs/pitch-deck/themes/miyabi-jony.css`
- **Pitch Deck**: `/Users/a003/dev/miyabi-private/docs/pitch-deck/miyabi-pitch-deck.md`

---

**Specification Version**: 1.0.0
**Created**: 2025-10-18
**Author**: Claude Code (AI Assistant)
**Design Philosophy**: Jonathan Ive Extreme Minimalism
