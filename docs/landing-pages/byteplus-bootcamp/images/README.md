# BytePlus Landing Page - Image Assets

## 📦 画像一覧

| ファイル名 | サイズ | 用途 | ステータス |
|-----------|--------|------|-----------|
| `byteplus-partner-logo.svg` | - | BytePlus公式パートナーロゴ | ✅ 完成 |
| `hero-demo.png` | 1200x800px | ヒーローセクション | 🔄 プレースホルダー |
| `instructor.jpg` | 400x400px | 講師写真 | 🔄 プレースホルダー |
| `testimonial-1.jpg` | 200x200px | 参加者1の写真 | 🔄 プレースホルダー |
| `testimonial-2.jpg` | 200x200px | 参加者2の写真 | 🔄 プレースホルダー |
| `testimonial-3.jpg` | 200x200px | 参加者3の写真 | 🔄 プレースホルダー |
| `og-image.png` | 1200x630px | OGP画像（SNSシェア用） | 🔄 プレースホルダー |
| `favicon.png` | 32x32px | ファビコン | 🔄 プレースホルダー |

## 🎨 デザインガイドライン

### カラーパレット

**BytePlus Brand Colors**:
- Primary: `#FF6B00` (オレンジ)
- Secondary: `#1E40AF` (ブルー)
- Accent: `#F59E0B` (アンバー)
- Background: `#FFFFFF`
- Text: `#1F2937`

### 画像最適化

**必須要件**:
- Format: WebP推奨（PNG fallback）
- Compression: Quality 85
- File Size: 各画像 < 200KB

**最適化コマンド**:
```bash
# PNG → WebP
cwebp -q 85 input.png -o output.webp

# または ImageMagick
convert input.png -quality 85 -strip output.webp
```

## 📝 プレースホルダー仕様

### 1. Hero Demo Image (hero-demo.png)

**サイズ**: 1200x800px
**内容**: BytePlus Video API ダッシュボード or デモ動画サムネイル

### 2. Instructor Photo (instructor.jpg)

**サイズ**: 400x400px
**内容**: 講師のプロフェッショナルな写真

### 3. Testimonial Photos (testimonial-1/2/3.jpg)

**サイズ**: 200x200px x 3
**内容**: 参加者の写真（円形にトリミング）

### 4. OG Image (og-image.png)

**サイズ**: 1200x630px
**内容**: SNSシェア用のOGP画像
- イベント名: "BytePlus Video API Bootcamp"
- 日時: "2025年11月15日(土) 10:00-13:30"
- BytePlusロゴ

### 5. Favicon (favicon.png)

**サイズ**: 32x32px
**内容**: BytePlus "B" マーク or シンプルなアイコン

## 🚀 実装ステータス

### Phase 2完了基準

- [x] プレースホルダーファイル作成
- [x] 仕様書作成（このREADME.md）
- [ ] 実画像作成（デザイナー作業）
- [ ] WebP最適化
- [ ] index.html更新（src属性）

### 画像置換手順

1. デザイナーが実画像を作成
2. 最適化コマンドで圧縮
3. `docs/landing-pages/byteplus-bootcamp/images/` に配置
4. `index.html` の `<img src="images/xxx.placeholder">` を更新
5. Git commit & push

## 📊 パフォーマンス目標

- **Total Image Size**: < 1.5MB
- **LCP (Largest Contentful Paint)**: < 2.5秒
- **WebP Support**: 90%以上のブラウザ対応

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
