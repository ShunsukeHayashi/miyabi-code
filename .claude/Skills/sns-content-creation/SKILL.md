---
name: sns-content-creation
description: Create optimized social media content for X (Twitter), Instagram, LinkedIn, and TikTok using Miyabi agents (つぶやくん, かくちゃん) and Gemini AI for visual content. Use when generating posts, threads, hashtags, content calendars, or visual infographics. Triggers include "create tweet", "write post", "SNS content", "social media strategy", "engagement optimization", "visual post", or any social media content creation request.
---

# SNS Content Creation

Generate high-engagement social media content with AI optimization and Gemini-powered visuals.

## Platform Specifications

| Platform | Max Length | Media | Best Times (JST) |
|----------|------------|-------|------------------|
| X (Twitter) | 280 chars | 4 images, 1 video | 7-9, 12-13, 20-22 |
| Instagram | 2,200 chars | Required | 11-13, 19-21 |
| LinkedIn | 3,000 chars | Optional | 7-8, 12, 17-18 |
| TikTok | 2,200 chars | Required | 19-23 |

## Content Templates

### X (Twitter) Post
```
[Hook - 問いかけ or 数字]

[本文 - 価値提供]

[CTA]

#hashtag1 #hashtag2
```

### Thread Format
```
🧵 [Main Topic] - スレッド

1/ [Introduction + Hook]

2/ [Point 1]

3/ [Point 2]

4/ [Point 3]

5/ [Conclusion + CTA]

いいね & RT で保存 🔖
```

### Instagram Caption
```
[Hook - 1行目が重要]

[Story/Value - 共感を呼ぶ内容]

[CTA - 保存・シェア促進]

.
.
.
#hashtag1 #hashtag2 ... (最大30個)
```

## Gemini Visual Integration

### Generate Visual Posts
```typescript
// Create infographic for social media
const visual = await generateSlideImage(
  "5 Tips for Productivity",
  "Key strategies to boost your daily output",
  "生産性を高める5つのコツ"
);

// Use in post
const post = {
  text: "🚀 生産性を3倍にする方法...",
  image: visual  // base64 image
};
```

### Visual Content Types
| Type | Use Case | Gemini Model |
|------|----------|--------------|
| Infographic | Educational posts | gemini-3-pro-image-preview |
| Quote Card | Motivational content | gemini-3-pro-image-preview |
| Diagram | Technical explanations | gemini-3-pro-image-preview |
| Thread Visual | Series content | gemini-3-pro-image-preview |

### Hand-Drawn Style for Social
```yaml
style:
  aesthetic: Friendly, approachable
  colors: Warm markers on white
  text: Japanese handwritten labels
  imperfections: High (authentic feel)
```

## Engagement Optimization

### Hook Patterns (High CTR)
- 数字: 「3つの理由」「5ステップ」
- 問いかけ: 「〜で悩んでませんか？」
- 逆説: 「実は〜は間違い」
- 緊急性: 「今すぐ」「知らないと損」

### Hashtag Strategy
```python
hashtags = {
    "primary": ["#メイン関連", "#ニッチ"],      # 2-3個
    "secondary": ["#業界", "#トレンド"],        # 3-5個
    "discovery": ["#一般的", "#フォロー返し"]   # 5-10個
}
```

### Posting Schedule
```
Monday:    Educational content + Infographic
Tuesday:   Tips & How-to + Visual
Wednesday: Case studies
Thursday:  Engagement posts
Friday:    Behind-the-scenes
Saturday:  User-generated content
Sunday:    Week recap / Planning
```

## MCP Tool Integration

### Generate X Post with Visual
```javascript
// Step 1: Generate post text
const post = await tsubuyakun_generate_x_post({
    topic: "AI開発の効率化",
    style: "engaging",
    language: "ja",
    include_hashtags: true
});

// Step 2: Generate accompanying visual
const visual = await gemini_generate_slide_image({
    title: "AI開発効率化",
    narrative: post.content,
    annotation: "効率化のポイント"
});

// Step 3: Combine for posting
const finalPost = { text: post.content, image: visual };
```

### Content Calendar with Visuals
```javascript
const calendar = await kakuchan_generate_content({
    type: "social",
    topic: "週間コンテンツプラン",
    target_audience: "エンジニア",
    tone: "professional",
    include_visuals: true  // Generate Gemini visuals
});
```

## Quality Checklist

Before posting:
- [ ] Hook is compelling (first 5 words)
- [ ] Value is clear
- [ ] CTA is present
- [ ] Hashtags are relevant (not spam)
- [ ] No typos or errors
- [ ] Visual matches message
- [ ] Visual is platform-optimized (aspect ratio)
- [ ] Scheduled for optimal time

## Visual Best Practices

1. **Consistent Style**: Use same Gemini style settings
2. **Brand Colors**: Customize color palette in prompts
3. **Japanese Labels**: Always include 日本語 annotations
4. **Size Optimization**: 
   - X: 1200x675 (16:9)
   - Instagram: 1080x1080 (1:1)
   - LinkedIn: 1200x627

## A/B Testing

Track and compare:
- Hook variations
- With visual vs without
- Hand-drawn vs polished style
- CTA types
- Posting times

## Best Practices

1. Platform-native content (not cross-post directly)
2. Use Gemini visuals for educational content
3. Engage with replies within 1 hour
4. Use analytics to refine strategy
5. Maintain consistent posting schedule
6. Balance promotional and value content (80/20 rule)
