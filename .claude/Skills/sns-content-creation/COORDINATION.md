# SNS Content Creation - Coordination Integration

**Skill**: sns-content-creation
**Category**: Business
**Dependencies**: gemini-slide-generator, marketing-campaign
**Dependents**: youtube-optimization

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| marketing-campaign | Content brief ready | Create social posts |
| gemini-slide-generator | Visual ready | Create visual post |
| youtube-optimization | Video published | Create promotional posts |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| gemini-slide-generator | Visual needed | `SNS_VISUAL_REQ: {brief}` |
| youtube-optimization | Video content | `SNS_VIDEO_BRIEF: {concept}` |
| marketing-campaign | Engagement data | `SNS_METRICS: {data}` |

---

## Resource Sharing

### Produces
```yaml
- type: social_post
  data:
    platform: "twitter"
    content: "Post text..."
    hashtags: ["#ai", "#tech"]
    scheduled_time: "2025-12-07T09:00:00Z"
- type: engagement_metrics
  data:
    impressions: 1500
    engagement_rate: 4.5
    clicks: 75
```

### Consumes
```yaml
- type: generated_image
  from: gemini-slide-generator
- type: content_brief
  from: marketing-campaign
- type: video_info
  from: youtube-optimization
```

---

## Communication Protocol

### Status Report Format
```
[SNS] {STATUS}: {platform} - {details}
```

### Examples
```bash
# Report post created
tmux send-keys -t %1 '[SNS] POSTED: Twitter - Tech tutorial thread (5 tweets)' && sleep 0.5 && tmux send-keys -t %1 Enter

# Request visual
tmux send-keys -t %1 '[SNS->GEMINI] VISUAL_REQ: infographic for productivity tips' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## Platform Specifications

### Quick Reference
| Platform | Max Length | Best Times (JST) | Visual Required |
|----------|------------|------------------|-----------------|
| X (Twitter) | 280 chars | 7-9, 12-13, 20-22 | Optional |
| Instagram | 2,200 chars | 11-13, 19-21 | Required |
| LinkedIn | 3,000 chars | 7-8, 12, 17-18 | Optional |
| TikTok | 2,200 chars | 19-23 | Required |

---

## Chain Sequences

### Sequence: Content Creation Pipeline
```
marketing-campaign [SIGNAL: CONTENT_BRIEF]
    |
    v
sns-content-creation [START]
    |
    +---> Analyze target platform
    +---> Draft content
    |
    v
gemini-slide-generator [REQUEST: visual]
    |
    v
[SIGNAL: GEMINI_IMAGE]
    |
    v
sns-content-creation [Combine text + visual]
    |
    v
[Schedule/Post]
    |
    v
[Track engagement]
    |
    v
marketing-campaign [SIGNAL: SNS_METRICS]
```

### Sequence: Multi-Platform Cascade
```
[Single content concept]
    |
    v
sns-content-creation [START]
    |
    +---> X: Short-form post + visual
    +---> Instagram: Visual-first + caption
    +---> LinkedIn: Professional angle
    +---> TikTok: Video brief
    |
    v
youtube-optimization [SIGNAL: SNS_VIDEO_BRIEF]
    |
    v
[Full platform coverage]
```

---

## Momentum Multiplier

### Optimization 1: Content Multiplication
```
1 concept
    -> 1 thread (5 tweets)
    -> 1 Instagram post
    -> 1 LinkedIn article snippet
    -> 1 TikTok script
    -> 10+ content pieces from 1 idea
```

### Optimization 2: Visual Integration
```typescript
// Request batch visuals
const visuals = await Promise.all([
    generateSlideImage(title, narrative, "twitter_format"),
    generateSlideImage(title, narrative, "instagram_format"),
    generateSlideImage(title, narrative, "linkedin_format")
]);
// All platform visuals in parallel
```

### Optimization 3: Scheduling Cascade
```
Monday:    Educational post + Infographic
Tuesday:   Tips thread + Visual snippets
Wednesday: Case study + Diagram
Thursday:  Engagement post
Friday:    Behind-scenes
Saturday:  User content
Sunday:    Week recap

[Auto-generate for entire week]
```

---

## Content Templates

### X Thread
```
[1/N] [Hook - question or number]

[2/N] [Point 1 with detail]

[3/N] [Point 2 with detail]

...

[N/N] [Conclusion + CTA]

Like & RT to save this thread
#hashtag1 #hashtag2
```

### Instagram Caption
```
[Hook - first line is crucial]

[Story/Value - relatable content]

[CTA - save/share prompt]

.
.
.
#hashtag1 #hashtag2 ... (up to 30)
```

---

## Health Check Integration

```bash
# Monitor posting schedule
check_sns_health() {
    # Check scheduled posts
    # Check engagement rates
    # Check platform API status
    echo "[SNS] HEALTH: All platforms operational"
}
```

### Engagement Monitoring
```
[Post published]
    |
    v
[Track metrics at 1h, 24h, 48h]
    |
    v
[Report to marketing-campaign]
    |
    v
[Adjust strategy based on performance]
```

---

## Perpetual Activation

### Auto-triggers
- Content brief received: Create posts
- Visual received: Create visual post
- Video published: Create promotional posts
- Scheduled time: Auto-post
- Engagement milestone: Create follow-up

### Feedback Loop
```
sns-content-creation --> marketing-campaign (engagement data)
                            |
                            v
                        [Analyze what works]
                            |
                            v
                        [Refine content strategy]
                            |
                            v
                        sns-content-creation (better content)
```

### Continuous Engagement
```
[Post published]
    |
    v
[Monitor comments]
    |
    v
[Respond within 1 hour]
    |
    v
[Boost engagement]
    |
    v
[Learn for next post]
```
