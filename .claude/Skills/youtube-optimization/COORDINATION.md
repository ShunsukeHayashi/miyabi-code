# YouTube Optimization - Coordination Integration

**Skill**: youtube-optimization
**Category**: Business
**Dependencies**: sns-content-creation, gemini-slide-generator
**Dependents**: marketing-campaign (video metrics)

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| sns-content-creation | Video brief | Create video plan |
| marketing-campaign | Campaign includes video | Generate video strategy |
| gemini-slide-generator | Visual ready | Create thumbnail |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| gemini-slide-generator | Thumbnail needed | `YOUTUBE_THUMB_REQ: {concept}` |
| sns-content-creation | Video published | `YOUTUBE_PUBLISHED: {url}` |
| marketing-campaign | Video metrics | `YOUTUBE_METRICS: {data}` |

---

## Resource Sharing

### Produces
```yaml
- type: video_plan
  data:
    title: "Video Title with SEO"
    description: "Optimized description..."
    tags: ["keyword1", "keyword2"]
    thumbnail_options: [base64_1, base64_2, base64_3]
- type: video_metrics
  data:
    views: 10000
    ctr: 5.2
    avg_view_duration: 8.5
    subscriber_conversion: 2.1
```

### Consumes
```yaml
- type: video_brief
  from: sns-content-creation
- type: generated_image
  from: gemini-slide-generator
```

---

## Communication Protocol

### Status Report Format
```
[YOUTUBE] {STATUS}: {video_title} - {details}
```

### Examples
```bash
# Report video published
tmux send-keys -t %1 '[YOUTUBE] PUBLISHED: AI Tutorial - https://youtu.be/xxx' && sleep 0.5 && tmux send-keys -t %1 Enter

# Request thumbnail
tmux send-keys -t %1 '[YOUTUBE->GEMINI] THUMB_REQ: Create thumbnail for productivity video' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## Chain Sequences

### Sequence: Video Production Pipeline
```
marketing-campaign [SIGNAL: VIDEO_BRIEF]
    |
    v
youtube-optimization [START]
    |
    +---> Analyze topic for SEO
    +---> Generate title variations
    +---> Create description template
    +---> Generate tags
    |
    v
gemini-slide-generator [REQUEST: thumbnail]
    |
    v
[SIGNAL: GEMINI_IMAGE x3 variations]
    |
    v
youtube-optimization [Select best thumbnail]
    |
    v
[VIDEO_PLAN ready]
    |
    v
sns-content-creation [SIGNAL: YOUTUBE_PUBLISHED]
    |
    v
marketing-campaign [SIGNAL: YOUTUBE_METRICS]
```

### Sequence: A/B Thumbnail Testing
```
gemini-slide-generator [Generate 3 variations]
    |
    v
youtube-optimization [START A/B test]
    |
    +---> Upload variation A (48h)
    +---> Measure CTR
    +---> Swap to variation B (48h)
    +---> Measure CTR
    +---> Select winner
    |
    v
[Apply best thumbnail]
```

---

## Momentum Multiplier

### Optimization 1: Content Multiplier
```
1 video concept
    -> 1 full video
    -> 1 short clip
    -> 3 thumbnail variations
    -> 1 thread for X
    -> 1 Instagram story
    -> 1 LinkedIn post
    -> 10+ content pieces
```

### Optimization 2: Parallel Optimization
```typescript
// Generate all optimizations concurrently
const [titles, description, tags, thumbnails] = await Promise.all([
    generateTitleVariations(topic),
    generateDescription(topic, keywords),
    generateTags(topic),
    generateThumbnails(3)  // via gemini-slide-generator
]);
```

### Optimization 3: SEO Chain
```
[Keyword research]
    |
    v
[Title with primary keyword]
    |
    v
[Description with long-tail keywords]
    |
    v
[Tags covering related terms]
    |
    v
[Thumbnail with keyword visual cues]
```

---

## SEO Components

### Title Optimization Pattern
```
[Number/Power Word] + [Main Keyword] + [Benefit/Hook]

Examples:
- "[2024] ChatGPT Tips | 3x Your Productivity"
- "99% Don't Know These Python Tricks | Half the Code"
- "Beginner's Guide | Git in 10 Minutes"
```

### Description Template
```
[First 2 lines - Hook + CTA (shows in preview)]

-- Timestamps --
0:00 Intro
1:23 Point 1
3:45 Point 2
...

-- Links --
- [Link 1]
- [Link 2]

-- Social --
Twitter: @handle
Instagram: @handle

#keyword1 #keyword2 #keyword3

[Keyword-rich paragraph 200-300 words]
```

### Tag Strategy
```python
tags = {
    "exact_match": ["main keyword"],           # 1-2
    "phrase_match": ["related phrase"],        # 3-5
    "broad_match": ["category", "genre"],      # 5-10
    "channel": ["channel name", "series"]      # 2-3
}
# Total: 10-15 tags
```

---

## Analytics Integration

### Key Metrics
| Metric | Target | Action if Low |
|--------|--------|---------------|
| CTR | >5% | Improve thumbnail & title |
| AVD | >50% | Better hooks, faster pacing |
| Watch Time | Growing | More/longer videos |
| Conversion | >2% | Better CTAs, end screens |

### Feedback to Skills
```
[Analytics data]
    |
    v
youtube-optimization [Analyze]
    |
    +---> gemini-slide-generator [Adjust thumbnail style]
    +---> sns-content-creation [Adjust promotion timing]
    +---> marketing-campaign [Update video strategy]
```

---

## Health Check Integration

```bash
# Monitor video performance
check_youtube_health() {
    # Check recent video CTR
    # Check AVD trends
    # Check upload schedule adherence
    echo "[YOUTUBE] HEALTH: Channel metrics nominal"
}
```

---

## Perpetual Activation

### Auto-triggers
- Video brief received: Start optimization
- Video published: Create promotion posts
- 24h post-publish: Check initial metrics
- Weekly: Review channel performance

### Feedback Loop
```
youtube-optimization --> gemini-slide-generator (thumbnail performance)
                            |
                            v
                        [Refine thumbnail style]
                            |
                            v
                        youtube-optimization (better CTR)
```

### Content Improvement Loop
```
[Video published]
    |
    v
[Track metrics at 24h, 48h, 7d, 30d]
    |
    v
[Analyze what works]
    |
    v
[Apply learnings to next video]
```
