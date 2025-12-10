---
name: youtube-optimization
description: Optimize YouTube channel strategy, video SEO, thumbnails, and content planning using Miyabi agents (どうがくん). Use when creating video titles, descriptions, tags, or channel strategy. Triggers include "YouTube SEO", "video optimization", "thumbnail strategy", "channel growth", "video script", or any YouTube-related content optimization.
---

# YouTube Optimization

Maximize YouTube channel growth and video performance with AI-driven optimization.

## Video SEO Components

### Title Optimization
```
Pattern: [Number/Power Word] + [Main Keyword] + [Benefit/Hook]

Examples:
- "【2024年最新】ChatGPT活用術｜仕事効率が3倍になる方法"
- "99%が知らないPython裏技5選｜コード量が半分になる"
- "初心者でも10分でわかる｜Git入門完全ガイド"
```

### Description Template
```
[First 2 lines - Hook + CTA (shows in preview)]

📌 この動画の内容
0:00 イントロ
1:23 ポイント1
3:45 ポイント2
...

🔗 関連リンク
- [Link 1]
- [Link 2]

📱 SNS
Twitter: @handle
Instagram: @handle

#keyword1 #keyword2 #keyword3

[Keyword-rich paragraph for SEO - 200-300 words]
```

### Tag Strategy
```python
tags = {
    "exact_match": ["メインキーワード"],           # 1-2個
    "phrase_match": ["関連フレーズ キーワード"],   # 3-5個
    "broad_match": ["カテゴリ", "ジャンル"],       # 5-10個
    "channel": ["チャンネル名", "シリーズ名"]      # 2-3個
}
# Total: 10-15 tags recommended
```

## Thumbnail Best Practices

### Elements
- **Face**: Expressive emotion (shock, surprise, happiness)
- **Text**: 3-5 words max, readable at small size
- **Colors**: High contrast, brand consistent
- **Composition**: Rule of thirds, clear focal point

### Specifications
- Resolution: 1280x720 (minimum)
- Aspect ratio: 16:9
- File size: <2MB
- Format: JPG, PNG, GIF

### A/B Testing
Upload multiple thumbnails and rotate every 48 hours to find winner.

## Content Strategy

### Video Types by Goal
| Goal | Video Type | Length |
|------|------------|--------|
| Discovery | Shorts, Trending | <60s |
| Growth | Tutorials, How-to | 8-15min |
| Retention | Series, Deep-dive | 15-30min |
| Community | Q&A, Behind scenes | 5-10min |

### Upload Schedule
```
Consistency > Frequency

Recommended:
- New channels: 1-2/week
- Growing: 2-3/week
- Established: 3-5/week
```

## Analytics Focus

### Key Metrics
1. **CTR** (Click-Through Rate): Target >5%
2. **AVD** (Average View Duration): Target >50%
3. **Watch Time**: Total minutes watched
4. **Subscriber Conversion**: Views → Subscribers

### Improvement Actions
```
Low CTR → Improve thumbnail & title
Low AVD → Better hooks, faster pacing
Low Watch Time → More/longer videos
Low Conversion → Better CTAs, end screens
```

## MCP Tool Integration

```javascript
// Channel optimization
dougakun_optimize_youtube({
    channel_name: "TechChannel",
    niche: "プログラミング",
    current_subscribers: 5000,
    goals: ["subscriber_growth", "watch_time"],
    upload_frequency: "2/week"
})
```

## Script Structure

### Hook (0-30s)
```
1. Pattern interrupt (unexpected statement)
2. Problem/pain point
3. Promise/preview of solution
4. Credibility statement
```

### Body
```
1. Context/Background
2. Main content (numbered points work well)
3. Examples/Demonstrations
4. Common mistakes to avoid
```

### Outro (last 30s)
```
1. Recap key points
2. CTA (subscribe, like, comment)
3. Next video teaser
4. End screen elements
```

## Best Practices

1. First 30 seconds determine retention
2. Use pattern interrupts every 30-60 seconds
3. Include CTAs every 3-5 minutes
4. Respond to comments within 24 hours
5. Create playlists for series content
6. Use end screens and cards strategically
