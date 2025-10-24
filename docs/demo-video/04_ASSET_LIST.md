# Video Production Asset List
# All Required Assets for "3分でわかるMiyabi" Demo Video

**Last Updated**: 2025-10-24
**Status**: Asset Inventory & Production Checklist

---

## Asset Categories

1. **Terminal Recordings** (4 scenes, ~150 seconds total)
2. **Code Screenshots** (8 images)
3. **Architecture Diagrams** (3 diagrams)
4. **Agent Character Assets** (21 characters × 4 states)
5. **Audio Assets** (narration, music, SFX)
6. **Text Overlays** (15+ text elements)
7. **Thumbnail Assets** (3 variations)

---

## 1. Terminal Recordings

### Recording 1: Installation Demo
**File**: `terminal-01-installation.mp4`
**Duration**: 30 seconds
**Resolution**: 1920x1080, 60fps
**Terminal Config**:
- Font: JetBrains Mono 16pt
- Theme: One Dark Pro
- Window Size: 80x24

**Commands to Record**:
```bash
$ cargo install miyabi-cli
   Updating crates.io index
   Installing miyabi-cli v0.1.1
   Compiling miyabi-cli v0.1.1
   Finished release [optimized] target(s) in 1m 32s
   Installing /Users/demo/.cargo/bin/miyabi

$ miyabi --version
miyabi-cli 0.1.1

$ miyabi --help
[... help output ...]
```

**Production Notes**:
- Use `pv` or `sleep` to slow down output
- Ensure all ANSI colors are preserved
- Record 2-3 takes (select best)
- Export as MP4 (H.264, 10 Mbps)

**Status**: ⏳ To Be Recorded

---

### Recording 2: Issue Processing
**File**: `terminal-02-issue-processing.mp4`
**Duration**: 60 seconds
**Resolution**: 1920x1080, 60fps

**Commands to Record**:
```bash
$ miyabi work-on 270

[2025-10-24 12:00:00] [しきるん] 🎯 Analyzing Issue #270...
[2025-10-24 12:00:01] [しきるん]    Title: Enable TypeScript strict mode
[2025-10-24 12:00:01] [しきるん]    Labels: type:feature, priority:P1-High
[2025-10-24 12:00:02] [しきるん] 🔍 Decomposing Issue into tasks...
[2025-10-24 12:00:03] [しきるん]    ✓ Task 1: Add strict mode to tsconfig.json
[2025-10-24 12:00:03] [しきるん]    ✓ Task 2: Fix type errors (12 files)
[2025-10-24 12:00:03] [しきるん]    ✓ Task 3: Add unit tests
[... continues ...]
```

**Production Notes**:
- Pre-create mock Issue #270 in test repo
- Use simulated output (not live execution for consistency)
- Add subtle typing animation for realism
- Color-code agent names (red, green, blue, yellow)

**Status**: ⏳ To Be Recorded

---

### Recording 3: Code Generation & Testing
**File**: `terminal-03-code-generation.mp4`
**Duration**: 30 seconds
**Resolution**: 1920x1080, 60fps

**Commands to Record**:
```bash
[2025-10-24 12:00:08] [つくるん] ✍️ Implementing Task 1: tsconfig.json
[2025-10-24 12:00:15] [つくるん]    ✓ Added "strict": true
[2025-10-24 12:00:16] [つくるん]    ✓ Added "strictNullChecks": true
[2025-10-24 12:00:17] [つくるん]    ✓ Saved tsconfig.json

[2025-10-24 12:00:42] [つくるん] 🧪 Running tests...
   PASS  src/auth.test.ts (3.2s)
   PASS  src/api.test.ts (2.8s)
   PASS  src/utils.test.ts (1.5s)

   Test Suites: 15 passed, 15 total
   Tests:       285 passed, 285 total
```

**Production Notes**:
- Show Jest/Vitest test output
- Include progress bars for visual interest
- Use green checkmarks for passed tests

**Status**: ⏳ To Be Recorded

---

### Recording 4: Code Review & PR Creation
**File**: `terminal-04-review-pr.mp4`
**Duration**: 30 seconds
**Resolution**: 1920x1080, 60fps

**Commands to Record**:
```bash
[2025-10-24 12:00:51] [めだまん] 🔍 Reviewing code quality...
[2025-10-24 12:00:52] [めだまん] 📋 Running ESLint...
   ✓ 0 errors, 0 warnings
[2025-10-24 12:01:10] [めだまん] 📈 Quality Score: 92/100

[2025-10-24 12:01:12] [まとめるん] 📋 Creating Pull Request...
[2025-10-24 12:01:30] [まとめるん] 🎉 Pull Request created!
   URL: https://github.com/ShunsukeHayashi/Miyabi/pull/108
```

**Production Notes**:
- Show quality checks with progress indicators
- Highlight quality score (92/100) prominently
- Use confetti/celebration emoji for PR creation

**Status**: ⏳ To Be Recorded

---

## 2. Code Screenshots

### Screenshot 1: TypeScript Before/After
**File**: `code-01-typescript-before-after.png`
**Resolution**: 1920x1080
**Tool**: VS Code + Carbon.now.sh

**Content**:
```typescript
// Before (Left Side)
function getUserData(id) {
  return fetch(`/api/users/${id}`);
}

// After (Right Side)
async function getUserData(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}
```

**Design Specs**:
- Split screen (50/50)
- VS Code Dark+ theme
- Highlight type annotations (yellow)
- Add "Before" and "After" labels

**Status**: ⏳ To Be Created

---

### Screenshot 2: tsconfig.json Changes
**File**: `code-02-tsconfig-diff.png`
**Resolution**: 1920x1080
**Tool**: VS Code (Git diff view)

**Content**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
+   "strict": true,
+   "strictNullChecks": true,
+   "strictFunctionTypes": true,
+   "noImplicitAny": true,
    "esModuleInterop": true
  }
}
```

**Design Specs**:
- Use Git diff view (green for additions)
- Show line numbers
- Add commit message at top

**Status**: ⏳ To Be Created

---

### Screenshot 3: Test Results (Passing)
**File**: `code-03-test-results.png`
**Resolution**: 1920x1080
**Tool**: Terminal screenshot

**Content**:
```
Test Suites: 15 passed, 15 total
Tests:       285 passed, 285 total
Snapshots:   0 total
Time:        8.234s
Ran all test suites.

✓ Coverage threshold met
```

**Design Specs**:
- Green checkmarks for all passing tests
- Show coverage percentage (87%)
- Jest/Vitest output format

**Status**: ⏳ To Be Created

---

### Screenshot 4: GitHub PR Interface
**File**: `code-04-github-pr.png`
**Resolution**: 1920x1080
**Tool**: Browser screenshot (GitHub)

**Content**:
- PR title: "feat: Enable TypeScript strict mode"
- Labels: `type:feature`, `priority:P1-High`, `agent:codegen`
- Description sections:
  - Summary
  - Changes (12 files)
  - Test Results
  - Quality Score: 92/100
- Status checks: All passing (green)

**Design Specs**:
- Use light mode (better for video)
- Crop to relevant area only
- Highlight quality score badge

**Status**: ⏳ To Be Created (or use existing PR)

---

### Screenshot 5-8: Additional Code Examples
**Files**: `code-05-*.png` through `code-08-*.png`

**Content Ideas**:
- Type error before/after fix
- ESLint output (clean)
- Git commit message (Conventional Commits)
- VS Code IntelliSense (showing type hints)

**Status**: ⏳ To Be Created (as needed)

---

## 3. Architecture Diagrams

### Diagram 1: System Architecture (Existing)
**File**: `architecture-01-system-overview.png`
**Source**: `/docs/architecture/Miyabi Crates Architecture.png`
**Resolution**: 1920x1080 (resize if needed)

**Modifications Needed**:
- Add "21 AI Agents" label
- Highlight key components (GitHub, Agents, LLM)
- Simplify for video (remove excess detail)

**Status**: ✅ Exists (needs minor modifications)

---

### Diagram 2: Agent Workflow (New)
**File**: `architecture-02-agent-workflow.png`
**Resolution**: 1920x1080
**Tool**: Excalidraw, Mermaid.js, or Figma

**Content**:
```
Issue #270
   ↓
[しきるん] Coordinator
   ↓
[つくるん] CodeGen → [めだまん] Review
   ↓
[まとめるん] PR Agent
   ↓
PR #108 Created
```

**Design Specs**:
- Flowchart style
- Color-coded boxes (red, green, blue, yellow)
- Add agent character icons
- Show execution time for each step

**Status**: ⏳ To Be Created

---

### Diagram 3: 21 Agent Grid
**File**: `architecture-03-agent-grid.png`
**Resolution**: 1920x1080
**Tool**: Figma or Canva

**Content**:
- 7x3 grid layout (21 agents)
- Color-coded by role:
  - Red: Leaders (2)
  - Green: Executors (13)
  - Blue: Analysts (6)
  - Yellow: Support (3)
- Agent names in Japanese + English

**Design Specs**:
- Cute character icons for each agent
- Agent name below icon
- Role label (e.g., "Coordinator", "CodeGen")

**Status**: ⏳ To Be Created

---

## 4. Agent Character Assets

### Character Design Specifications
**Total Characters**: 21
**Variations per Character**: 4 states
- Idle (default)
- Working (active animation)
- Success (celebration)
- Error (concerned)

**Total Assets**: 21 × 4 = 84 images

**File Naming Convention**:
```
agent-[name]-[state].png

Examples:
- agent-shikiroon-idle.png
- agent-tsukuroon-working.png
- agent-medaman-success.png
- agent-matomeroon-error.png
```

**Image Specifications**:
- Format: PNG with transparency
- Size: 256x256px (high-res for scaling)
- Style: Kawaii/cute (Pokemon-like)
- Background: Transparent

---

### Character List & Colors

#### Red Agents (Leaders)
1. **しきるん** (Shikiroon) - CoordinatorAgent
2. **あきんどさん** (Akindosan) - AIEntrepreneurAgent

#### Green Agents (Executors)
3. **つくるん** (Tsukuroon) - CodeGenAgent
4. **つくろん** (Tsukuron) - ProductConceptAgent
5. **かくん** (Kakun) - ProductDesignAgent
6. **みちびきん** (Michibikin) - FunnelDesignAgent
7. **ひろめるん** (Hiromeroon) - MarketingAgent
8. **かくちゃん** (Kakuchan) - ContentCreationAgent
9. **つぶやきん** (Tsubuyakin) - SNSStrategyAgent
10. **どうがん** (Dougan) - YouTubeAgent
11. **うるん** (Uroon) - SalesAgent
12. **おきゃくさま** (Okyakusama) - CRMAgent
13. **かきこちゃん** (Kakikochan) - NoteAgent
14. **えがくん** (Egakun) - ImageGenAgent
15. **ほのかちゃん** (Honokachan) - HonokaAgent

#### Blue Agents (Analysts)
16. **めだまん** (Medaman) - ReviewAgent
17. **みつけるん** (Mitsukeroon) - IssueAgent
18. **なりきりん** (Narikirin) - PersonaAgent
19. **じぶんさん** (Jibunsan) - SelfAnalysisAgent
20. **しらべるん** (Shiraberoon) - MarketResearchAgent
21. **かぞえるん** (Kazoeroon) - AnalyticsAgent

#### Yellow Agents (Support)
22. **まとめるん** (Matomeroon) - PRAgent
23. **はこぶん** (Hakoboon) - DeploymentAgent
24. **つなぐん** (Tsunagun) - HooksIntegration

---

### Character Asset Creation Options

**Option A: Commission Artist** ($500-$1000)
- Pros: High quality, custom designs
- Cons: Expensive, time-consuming
- Platforms: Fiverr, Upwork, ArtStation

**Option B: AI Image Generation** ($50-$100)
- Pros: Fast, affordable
- Cons: May lack consistency
- Tools: Midjourney, DALL-E 3, Stable Diffusion

**Option C: Use Existing Assets** (Free)
- Pros: Free, immediate
- Cons: Generic, not custom
- Sources: OpenMoji, Twemoji, Free icon packs

**Recommendation**: Option B (AI) for MVP, Option A (artist) for v2

---

### AI Image Generation Prompts

**Example Prompt (DALL-E 3)**:
```
Create a cute kawaii-style character named "Shikiroon" (しきるん) for a software development tool. The character should be:
- Gender-neutral
- Color scheme: Red and pink (represents leadership)
- Holding a clipboard or checklist
- Simple, clean design (like Pokemon)
- Friendly and approachable expression
- Transparent background
- 256x256px resolution

Style: Flat design, minimalist, professional yet cute
Mood: Confident, organized, helpful
```

**Status**: ⏳ To Be Created (or use placeholders for MVP)

---

## 5. Audio Assets

### Audio 1: Voice Narration
**File**: `audio-narration-japanese.wav`
**Duration**: ~2:30 (script is 2:30, music extends to 3:00)
**Format**: WAV, 48kHz, 24-bit
**Language**: Japanese

**Recording Specs**:
- Microphone: Professional condenser mic
- Environment: Quiet, treated room
- Format: Uncompressed WAV (for editing)
- Export: AAC 192kbps (for final video)

**Script**: See `02_NARRATION_SCRIPT.md`

**Status**: ⏳ To Be Recorded

---

### Audio 2: Background Music
**File**: `audio-music-background.mp3`
**Duration**: 3:00 (looped if needed)
**Genre**: Tech/Corporate, Upbeat
**Tempo**: 120-140 BPM
**License**: Royalty-free

**Track Suggestions**:
1. "Tech Innovation" by Ahjay (Epidemic Sound)
2. "Digital Dreams" by Francis Wells (Epidemic Sound)
3. "Modern Technology" by Loxbeats (Artlist)

**Volume Levels**:
- Intro (0:00-0:05): 70%
- Narration sections: 40%
- Silent sections: 60%
- Outro (2:45-3:00): 70%

**Status**: ⏳ To Be Licensed/Downloaded

---

### Audio 3: Sound Effects (Optional)
**Files**: `audio-sfx-*.wav`
**Total**: 5-10 short effects

**Sound Effects Needed**:
1. `audio-sfx-text-pop.wav` - Text overlay appearance (0.2s)
2. `audio-sfx-success-chime.wav` - Test passing, PR created (0.5s)
3. `audio-sfx-typing.wav` - Subtle keyboard typing (loop, 10s)
4. `audio-sfx-transition-whoosh.wav` - Scene transitions (0.3s)
5. `audio-sfx-celebration.wav` - Final CTA (1s)

**Sources**:
- Freesound.org (CC0 licensed)
- Zapsplat.com (free for YouTube)
- Adobe Audition sound effects library

**Volume**: 20-40% (very subtle, not distracting)

**Status**: ⏳ To Be Downloaded

---

## 6. Text Overlays

### Overlay 1: Title Card (Intro)
**Time**: 0:00-0:05
**Text**:
```
Miyabi
Autonomous Development Framework
```
**Design**:
- Font: Montserrat Bold, 72pt
- Color: White (#FFFFFF)
- Background: Semi-transparent gradient
- Animation: Fade in + scale

**Status**: ⏳ To Be Created in Editor

---

### Overlay 2-15: On-Screen Text
**Total**: 15+ text overlays throughout video

**Examples**:
- "21 AI Agents" (0:23)
- "Issue → Code → PR → Deploy" (0:28)
- "100% Automated" (0:29)
- "Step 1: Issue Analysis" (0:35)
- "12 files modified" (1:15)
- "Quality Score: 92/100" (1:53)
- "Star on GitHub" (2:47)

**Design Specs**:
- Font: Inter Regular, 36pt
- Color: White with 2px black outline
- Position: Bottom third or top third (avoid center)
- Animation: Fade in (0.3s), hold (2-3s), fade out (0.3s)

**Status**: ⏳ To Be Created in Editor

---

### Overlay 16: End Card
**Time**: 2:45-3:00
**Content**:
```
🌸 Miyabi
Autonomous Development, Beautifully Simple

⭐ Star us on GitHub
💬 Join Discord Community
📚 Read the Docs

github.com/ShunsukeHayashi/Miyabi
```

**Design**:
- Background: Dark gradient (Miyabi brand colors)
- Logo: Center top
- Links: Large, clickable-looking buttons
- QR code: Bottom right (optional)

**Status**: ⏳ To Be Created in Editor

---

## 7. Thumbnail Assets

### Thumbnail 1: Agent Characters Prominent
**File**: `thumbnail-01-agents.png`
**Resolution**: 1280x720px
**Format**: JPG (under 2MB)

**Layout**:
```
┌─────────────────────────────────┐
│ [21 Agent Icons Grid]           │
│                                  │
│   AIが勝手にコード書く           │
│                                  │
│   3分でわかるMiyabi              │
│                                  │
│ [Miyabi Logo]                    │
└─────────────────────────────────┘
```

**Design Elements**:
- Large, bold Japanese text (Impact font)
- High contrast colors
- Agent characters visible but not cluttered
- Miyabi logo (bottom right)

**Status**: ⏳ To Be Created

---

### Thumbnail 2: Code Screenshot Prominent
**File**: `thumbnail-02-code.png`
**Resolution**: 1280x720px

**Layout**:
```
┌─────────────────────────────────┐
│ [VS Code Screenshot]             │
│ [Code with type annotations]     │
│                                  │
│   100% Automated                 │
│   Issue → PR                     │
│                                  │
│ [Miyabi Logo]                    │
└─────────────────────────────────┘
```

**Design Elements**:
- Blurred code in background
- "100% Automated" in large text
- Arrow showing Issue → PR flow

**Status**: ⏳ To Be Created

---

### Thumbnail 3: Human Face Prominent
**File**: `thumbnail-03-face.png`
**Resolution**: 1280x720px

**Layout**:
```
┌─────────────────────────────────┐
│ [Developer Face - Excited]       │
│                                  │
│   "もう手動で                    │
│    コード書かない"               │
│                                  │
│   Miyabi                         │
└─────────────────────────────────┘
```

**Design Elements**:
- Human face with expressive emotion (shocked/excited)
- Speech bubble with text
- Miyabi logo (bottom right)

**Status**: ⏳ To Be Created (if using human face)

---

## Asset Production Priority

### Phase 1: Critical Assets (Day 1)
**Must-Have for MVP**:
- [x] Script outline
- [x] Narration script
- [ ] Terminal recording 2 (Issue processing)
- [ ] Diagram 2 (Agent workflow)
- [ ] Background music
- [ ] Thumbnail 1 (Agent characters)

### Phase 2: Important Assets (Day 2)
**Enhance Quality**:
- [ ] Terminal recording 1 (Installation)
- [ ] Terminal recording 3 (Code generation)
- [ ] Terminal recording 4 (Review & PR)
- [ ] Code screenshots 1-4
- [ ] Voice narration (Japanese)

### Phase 3: Nice-to-Have Assets (Day 3)
**Polish & Refinement**:
- [ ] Agent character animations (simplified)
- [ ] Sound effects
- [ ] Additional code screenshots
- [ ] Thumbnail variations 2-3

---

## Asset Storage & Organization

### Directory Structure
```
/docs/demo-video/
├── assets/
│   ├── terminal/
│   │   ├── terminal-01-installation.mp4
│   │   ├── terminal-02-issue-processing.mp4
│   │   ├── terminal-03-code-generation.mp4
│   │   └── terminal-04-review-pr.mp4
│   ├── code/
│   │   ├── code-01-typescript-before-after.png
│   │   ├── code-02-tsconfig-diff.png
│   │   ├── code-03-test-results.png
│   │   └── code-04-github-pr.png
│   ├── architecture/
│   │   ├── architecture-01-system-overview.png
│   │   ├── architecture-02-agent-workflow.png
│   │   └── architecture-03-agent-grid.png
│   ├── agents/
│   │   ├── agent-shikiroon-idle.png
│   │   ├── agent-shikiroon-working.png
│   │   └── [... 84 total files ...]
│   ├── audio/
│   │   ├── audio-narration-japanese.wav
│   │   ├── audio-music-background.mp3
│   │   └── audio-sfx-*.wav
│   └── thumbnails/
│       ├── thumbnail-01-agents.png
│       ├── thumbnail-02-code.png
│       └── thumbnail-03-face.png
├── 01_SCRIPT_OUTLINE.md
├── 02_NARRATION_SCRIPT.md
├── 03_PRODUCTION_PLAN.md
├── 04_ASSET_LIST.md (this file)
└── final/
    ├── miyabi-demo-video-v1.mp4
    ├── miyabi-demo-video-v1-subtitles-ja.srt
    └── miyabi-demo-video-v1-subtitles-en.srt
```

---

## Asset Creation Tracking

### Terminal Recordings (4 total)
- [ ] Recording 1: Installation (30s)
- [ ] Recording 2: Issue Processing (60s)
- [ ] Recording 3: Code Generation (30s)
- [ ] Recording 4: Review & PR (30s)

### Code Screenshots (8 total)
- [ ] Screenshot 1: TypeScript Before/After
- [ ] Screenshot 2: tsconfig.json Changes
- [ ] Screenshot 3: Test Results
- [ ] Screenshot 4: GitHub PR Interface
- [ ] Screenshot 5-8: Additional examples (as needed)

### Architecture Diagrams (3 total)
- [x] Diagram 1: System Architecture (existing, needs modification)
- [ ] Diagram 2: Agent Workflow (new)
- [ ] Diagram 3: 21 Agent Grid (new)

### Agent Characters (84 total)
- [ ] 21 characters × 4 states each
- [ ] Option: Use placeholders for MVP, create custom later

### Audio Assets (3 types)
- [ ] Voice narration (Japanese)
- [ ] Background music (licensed)
- [ ] Sound effects (5-10 files)

### Text Overlays (15+ total)
- [ ] Create in video editor during editing phase

### Thumbnails (3 variations)
- [ ] Thumbnail 1: Agent characters prominent
- [ ] Thumbnail 2: Code screenshot prominent
- [ ] Thumbnail 3: Human face prominent (optional)

---

## Asset Quality Checklist

### Technical Quality
- [ ] All video assets: 1920x1080, 60fps
- [ ] All images: High-res PNG (no compression artifacts)
- [ ] All audio: 48kHz, 24-bit (WAV for editing), AAC for final
- [ ] All text: Readable on mobile devices (minimum 18pt)
- [ ] All colors: High contrast (passes WCAG AA)

### Branding Consistency
- [ ] Miyabi logo appears consistently
- [ ] Brand colors used throughout (pink, blue, green)
- [ ] Font consistency (Montserrat, Inter, JetBrains Mono)
- [ ] Agent character designs match style guide

### Content Accuracy
- [ ] All code examples compile and run
- [ ] All terminal outputs match actual behavior
- [ ] All statistics are up-to-date (star count, downloads, etc.)
- [ ] All links are valid and working

---

## Asset Sources & References

### Existing Assets (Use as-is or modify)
- `/docs/architecture/*.png` - Architecture diagrams
- `/docs/diagrams/*.png` - Various diagrams
- `/.claude/agents/AGENT_CHARACTERS.md` - Agent descriptions
- `/README.md` - Project description, installation instructions

### External Resources
- **Stock Music**: Epidemic Sound, Artlist, AudioJungle
- **Sound Effects**: Freesound.org, Zapsplat.com
- **Fonts**: Google Fonts (Montserrat, Inter), JetBrains Mono
- **Icons**: OpenMoji, Twemoji, Feather Icons

### Tools
- **Screen Recording**: OBS Studio, QuickTime, Asciinema
- **Image Editing**: Figma, Canva, Photoshop, GIMP
- **Video Editing**: DaVinci Resolve, Final Cut Pro, Premiere Pro
- **Audio Editing**: Audacity, Adobe Audition, GarageBand

---

## Next Steps

1. **Priority 1**: Record terminal sessions (Day 1)
2. **Priority 2**: Create agent workflow diagram (Day 1)
3. **Priority 3**: License background music (Day 1)
4. **Priority 4**: Design thumbnail (Day 2)
5. **Priority 5**: Record voice narration (Day 2)
6. **Priority 6**: Create code screenshots (Day 2)
7. **Priority 7**: Agent character assets (Day 3 or use placeholders)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Author**: Miyabi Team
**Status**: Asset Inventory Complete, Production Ready
