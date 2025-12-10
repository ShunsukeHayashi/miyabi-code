# Gemini Slide Generator - Coordination Integration

**Skill**: gemini-slide-generator
**Category**: Development (Content)
**Dependencies**: None
**Dependents**: marketing-campaign, sns-content-creation, youtube-optimization

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| marketing-campaign | Campaign plan ready | Generate pitch deck |
| sns-content-creation | Visual post needed | Generate infographic |
| youtube-optimization | Video thumbnail needed | Generate visual |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| marketing-campaign | Deck complete | `GEMINI_DECK: {deck_id}` |
| sns-content-creation | Image ready | `GEMINI_IMAGE: {base64}` |
| objective-observation-reporting | Generation complete | `GEMINI_COMPLETE: {stats}` |

---

## Resource Sharing

### Produces
```yaml
- type: slide_deck
  data:
    id: "deck-uuid"
    title: "Presentation Title"
    slides: 8
    theme: "BLUEPRINT"
- type: generated_image
  data:
    base64: "..."
    aspect_ratio: "16:9"
    style: "hand-drawn"
```

### Consumes
```yaml
- type: content_brief
  from: marketing-campaign
- type: post_concept
  from: sns-content-creation
```

---

## Communication Protocol

### Status Report Format
```
[GEMINI] {STATUS}: {asset_type} - {details}
```

### Examples
```bash
# Report to coordination layer
tmux send-keys -t %1 '[GEMINI] COMPLETE: deck - 8 slides generated' && sleep 0.5 && tmux send-keys -t %1 Enter

# Signal to marketing
tmux send-keys -t %1 '[GEMINI->MARKETING] DECK_READY: investor-pitch' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## Chain Sequences

### Sequence: Marketing Content Generation
```
marketing-campaign [REQUEST: pitch deck]
    |
    v
gemini-slide-generator [START]
    |
    +---> generateDeckStructure()
    +---> generateSlideImage() x N
    |
    v
[SIGNAL: GEMINI_DECK]
    |
    v
sns-content-creation [Snippet images]
    |
    v
youtube-optimization [Thumbnail variations]
```

### Sequence: Social Media Visual
```
sns-content-creation [REQUEST: infographic]
    |
    v
gemini-slide-generator [START]
    |
    +---> generateSlideImage()
    |
    v
[SIGNAL: GEMINI_IMAGE]
    |
    v
sns-content-creation [Create post with image]
```

---

## Momentum Multiplier

### Optimization 1: Batch Image Generation
```typescript
// Generate all slides concurrently
const images = await Promise.all(
    deck.slides.map(slide =>
        generateSlideImage(slide.title, slide.narrative, slide.annotation)
    )
);
// Multiplier: Nx faster deck generation
```

### Optimization 2: Template Reuse
```typescript
// Cache common styles
const style = getCachedStyle("SKETCH");
// Faster generation with cached prompts
```

### Optimization 3: Content Cascade
```
1 concept -> 1 deck (8 slides)
         -> 8 infographics
         -> 8 social posts
         -> 3 video thumbnails
// 1 input = 20+ outputs
```

---

## Theme Integration

### For Different Skills

| Consumer Skill | Recommended Theme | Use Case |
|---------------|-------------------|----------|
| marketing-campaign | BLUEPRINT | Investor decks, technical presentations |
| sns-content-creation | SKETCH | Social posts, educational content |
| youtube-optimization | SKETCH | Thumbnails, video covers |

---

## Health Check Integration

```typescript
// Monitor API health
async function checkGeminiHealth() {
    try {
        await generateAgentThought("test");
        return { status: "healthy" };
    } catch (error) {
        console.log("[GEMINI] HEALTH_FAIL:", error.message);
        return { status: "unhealthy", error };
    }
}
```

---

## Perpetual Activation

### Auto-triggers
- Marketing campaign created: Generate supporting deck
- Social post drafted: Generate visual
- YouTube video planned: Generate thumbnail options

### Feedback Loop
```
gemini-slide-generator --> sns-content-creation (engagement metrics)
                              |
                              v
                          [Refine visual style]
                              |
                              v
                          gemini-slide-generator (improved generation)
```

### Content Multiplication Pattern
```
[Single topic input]
    |
    v
gemini-slide-generator
    |
    +---> Full presentation deck
    +---> Individual slide images
    +---> Social media snippets
    +---> Video thumbnails
    +---> Blog illustrations
    |
    v
[Multi-platform content ecosystem]
```
