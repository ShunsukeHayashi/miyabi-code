---
name: gemini-slide-generator
description: Generate visual slide decks and hand-drawn infographics using Gemini AI. Use when creating presentations, visual explanations, concept diagrams, or educational materials. Triggers include "create slides", "generate presentation", "visual explanation", "infographic", "slide deck", "hand-drawn diagram", or any visual content generation request.
---

# Gemini Slide Generator

Generate AI-powered visual slide decks with hand-drawn infographic style using Gemini API.

## Core Functions

### 1. generateDeckStructure
Transform user input into structured slide deck JSON.

```typescript
const deck = await generateDeckStructure("AIエージェントの仕組みを説明するプレゼン");
// Returns: { id, title, theme, slides: [...] }
```

### 2. generateSlideImage
Create hand-drawn style infographic images.

```typescript
const imageBase64 = await generateSlideImage(
  "Context Engineering",
  "How AI agents process and transform information",
  "AIエージェントの情報処理フロー"
);
```

### 3. generateAgentThought
Generate AI thought process explanations.

```typescript
const thought = await generateAgentThought("Explain how to optimize a database query");
```

## Visual Themes

### BLUEPRINT Theme
- **Style**: Technical, architectural, structured
- **Use for**: System architecture, technical docs, engineering presentations
- **Colors**: Blues, grays, precise lines

### SKETCH Theme
- **Style**: Creative, organic, storytelling
- **Use for**: Concept explanations, brainstorming, educational content
- **Colors**: Warm markers, hand-drawn feel

## Hand-Drawn Infographic Style

### Global Style Definition
```yaml
art_style: Graphic Recording / Hand-drawn Sketch / Whiteboard Art
texture: Marker pens, crayons, colored pencils on white paper
vibe: Friendly, approachable, "notebook" feel
imperfections: High (rough lines, slight smudges)

color_palette:
  background: White/Off-white paper
  outlines: Black/dark charcoal marker
  emphasis: Yellow/Orange (marker texture)
  structure: Blue/Green (marker texture)
  warning: Red (marker texture)
```

## Slide Structure

### Slide Types
| Type | Purpose |
|------|---------|
| `guidance` | Introduction, overview, navigation |
| `content` | Main information, details |

### Visual Elements
```typescript
interface VisualElement {
  id: string;
  type: "icon" | "text" | "shape";
  iconName?: string;  // Lucide icon name
  label: string;
  x: number;          // 0-100 percentage
  y: number;          // 0-100 percentage
  color?: string;     // Tailwind color class
  connectedTo?: string[];  // IDs of connected elements
  animation?: "flow" | "pulse" | "fade";
}
```

### Available Icons (Lucide-React)
```
User, Server, Database, Cloud, Brain, Zap, Globe, Box,
ArrowRight, ArrowDown, Settings, Lock, Shield, Code,
MessageSquare, FileText, Folder, GitBranch, Terminal
```

## API Configuration

### Model Selection
| Task | Model | Purpose |
|------|-------|---------|
| Text/Structure | `gemini-2.5-flash` | Fast JSON generation |
| Image Generation | `gemini-3-pro-image-preview` | Visual content |

### Image Config
```typescript
config: {
  imageConfig: {
    aspectRatio: "16:9",  // Slide format
    imageSize: "1K"       // Options: 1K, 2K, 4K
  }
}
```

## Workflow

### 1. Input Analysis
```
User Input → Topic extraction → Audience detection → Complexity assessment
```

### 2. Structure Generation
```
Analyze → Theme selection → Slide breakdown (4-8 slides) → Visual mapping
```

### 3. Image Generation
```
For each slide → Generate prompt → Call Gemini Image API → Return base64
```

### 4. Assembly
```
Combine structure + images → Final deck object
```

## Example Usage

### Create Technical Presentation
```typescript
// Generate structure
const deck = await generateDeckStructure(
  "Explain microservices architecture for backend developers"
);

// Generate images for each slide
for (const slide of deck.slides) {
  slide.generatedImage = await generateSlideImage(
    slide.title,
    slide.narrative,
    slide.annotation
  );
}
```

### Create Educational Content
```typescript
const deck = await generateDeckStructure(
  "小学生向けにプログラミングの基礎を説明"
);
// Theme: SKETCH (friendly, hand-drawn)
```

## Error Handling

```typescript
try {
  const result = await generateDeckStructure(input);
  if (!result) throw new Error("Generation failed");
} catch (error) {
  // Check API key
  // Retry with simplified prompt
  // Fallback to template
}
```

## Integration Points

### With MCP
```javascript
// Via miyabi-gemini MCP server
gemini_generate_deck({ topic: "...", theme: "SKETCH" })
gemini_generate_slide_image({ title: "...", narrative: "..." })
```

### With Miyabi Agents
```bash
# CodeGen agent generates presentation
tmux send-keys -t miyabi:%2 "Generate slides for Issue #123 documentation" Enter
```

## Best Practices

1. Keep narratives concise (1-2 sentences per slide)
2. Use Japanese annotations for bilingual audiences
3. Limit to 4-8 slides for optimal engagement
4. Choose theme based on audience (technical vs general)
5. Generate images asynchronously for performance
