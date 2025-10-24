# YouTube Demo Video Script Outline
# "3分でわかるMiyabi - 完全自律型AI開発フレームワーク"

**Target Duration**: 3:00 (180 seconds)
**Target Audience**: Developers, CTOs, Tech Enthusiasts
**Goal**: Convert viewers to GitHub stars and early adopters
**Tone**: Professional yet approachable, exciting, demo-heavy

---

## Video Structure Overview

### Act 1: Hook & Problem (0:00-0:30) - 30 seconds
**Purpose**: Grab attention, establish pain point
**Key Message**: Development is slow and tedious
**Visuals**: Split screen showing traditional vs. Miyabi workflow

### Act 2: Solution Demo (0:30-2:00) - 90 seconds
**Purpose**: Show Miyabi in action
**Key Message**: AI Agents automate everything from Issue to PR
**Visuals**: Live terminal recording + agent character animations

### Act 3: Features & CTA (2:00-2:30) - 30 seconds
**Purpose**: Highlight 21 agents, GitHub integration
**Key Message**: Complete autonomous development platform
**Visuals**: Agent character showcase, architecture diagram

### Act 4: Closing (2:30-3:00) - 30 seconds
**Purpose**: Strong call-to-action
**Key Message**: Get started now, join the community
**Visuals**: Installation command, GitHub stars button, Discord invite

---

## Detailed Breakdown

### 0:00-0:05 | Cold Open (5s)
**Scene**: Black screen → Logo reveal
**Narration**: "What if AI could handle your entire development workflow?"
**Visual**:
- Miyabi logo fade-in with cherry blossom animation
- Subtitle: "Miyabi - Autonomous Development Framework"
**Music**: Upbeat, modern tech music (40% volume)

---

### 0:05-0:15 | Problem Statement (10s)
**Scene**: Developer frustration montage
**Narration**: "Traditional development is slow. Writing code, reviewing PRs, deploying... it takes hours."
**Visual**:
- Time-lapse of developer typing code (fast-forward)
- Clock showing time passing (3 hours → 6 hours)
- Tired developer rubbing eyes
**Text Overlay**:
- "Manual coding: 6 hours"
- "Code review: 2 hours"
- "Deployment: 1 hour"

---

### 0:15-0:30 | Solution Introduction (15s)
**Scene**: Miyabi interface reveal
**Narration**: "Meet Miyabi. A complete autonomous AI development platform. Just create an Issue, and watch 21 AI agents do the rest."
**Visual**:
- Terminal screen showing `miyabi work-on 270`
- 21 agent characters appearing one by one (quick montage)
- Highlight: しきるん (Coordinator), つくるん (CodeGen), めだまん (Review)
**Text Overlay**:
- "21 AI Agents"
- "Issue → Code → PR → Deploy"
- "100% Automated"

---

### 0:30-1:00 | Live Demo Part 1: Issue Processing (30s)
**Scene**: Real terminal recording
**Narration**: "Here's how it works. I create Issue #270: Enable TypeScript strict mode. Then I run a single command."
**Visual**:
```bash
# Terminal Recording
$ miyabi work-on 270

[しきるん] Analyzing Issue #270...
[しきるん] Decomposing into 3 tasks...
  Task 1: Add strict mode to tsconfig.json
  Task 2: Fix type errors (12 files)
  Task 3: Add unit tests

[しきるん] Assigning to agents...
  Task 1 → つくるん (CodeGenAgent)
  Task 2 → つくるん (CodeGenAgent)
  Task 3 → めだまん (ReviewAgent)

[つくるん] Implementing Task 1...
[つくるん] Implementation complete (32s)
```
**Text Overlay**:
- "Step 1: Issue Analysis"
- "Step 2: Task Decomposition"
- "Step 3: Agent Assignment"

**Split Screen (right side)**:
- Visual representation of agent workflow (flowchart)
- Agent character animations (しきるん thinking, つくるん coding)

---

### 1:00-1:30 | Live Demo Part 2: Code Generation (30s)
**Scene**: Code editor showing AI-generated changes
**Narration**: "The AI agents analyze the codebase, generate TypeScript-compliant code, and run all tests automatically."
**Visual**:
- VS Code editor showing file changes (side-by-side diff)
- `tsconfig.json` before/after
- Type errors being fixed in real-time
- Test runner output: "✓ 285 tests passed"
**Text Overlay**:
- "12 files modified"
- "285 tests passing"
- "100% type-safe"

**Code Examples** (quick flash):
```typescript
// Before
function getUserData(id) {
  return fetch(`/api/users/${id}`);
}

// After (AI-generated)
async function getUserData(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

---

### 1:30-2:00 | Live Demo Part 3: PR Creation (30s)
**Scene**: GitHub PR interface
**Narration**: "Finally, the Review Agent checks code quality, scores it, and automatically creates a Pull Request with detailed documentation."
**Visual**:
```bash
[めだまん] Reviewing code quality...
  ESLint: ✓ Passed
  TypeScript: ✓ Passed
  Security: ✓ Passed
  Coverage: 87%

Quality Score: 92/100

[まとめるん] Creating Pull Request...
PR #108 created: "feat: Enable TypeScript strict mode"
```

**GitHub PR Screen**:
- PR title: "feat: Enable TypeScript strict mode"
- Description with sections:
  - Summary
  - Changes
  - Test Results
  - Quality Score: 92/100
- Labels: `type:feature`, `priority:P1-High`, `agent:codegen`
- Status checks: All passing (green checkmarks)

**Text Overlay**:
- "Quality Score: 92/100"
- "Auto-generated documentation"
- "Ready to merge"

---

### 2:00-2:15 | Agent Showcase (15s)
**Scene**: 21 Agent character grid
**Narration**: "Miyabi includes 21 specialized AI agents. 7 for coding, 14 for business operations."
**Visual**:
- Grid layout showing all 21 agent characters with names
- Color-coded by role:
  - Red: Leaders (しきるん, あきんどさん)
  - Green: Executors (つくるん, かくん, etc.)
  - Blue: Analysts (めだまん, みつけるん, etc.)
  - Yellow: Support (まとめるん, はこぶん, etc.)
- Quick highlight animation on each character

**Text Overlay**:
- "21 AI Agents"
- "7 Coding Agents"
- "14 Business Agents"

---

### 2:15-2:30 | Architecture & Features (15s)
**Scene**: System architecture diagram
**Narration**: "Built on Rust for performance. Integrates with GitHub, Claude AI, and supports parallel agent execution."
**Visual**:
- Architecture diagram showing:
  - GitHub (Issues, PRs, Actions)
  - Miyabi Core (Agent Orchestration)
  - LLM Integration (Claude, GPT)
  - Git Worktree (Parallel Execution)
- Feature highlights fly in:
  - "Rust-powered (8MB binary)"
  - "GitHub-native workflow"
  - "5x parallel execution"
  - "100% test coverage"

**Text Overlay**:
- "Built with Rust 1.75+"
- "577 passing tests"
- "Apache 2.0 License"

---

### 2:30-2:45 | Installation & Getting Started (15s)
**Scene**: Terminal with installation commands
**Narration**: "Getting started is simple. Install from crates.io or download the pre-built binary."
**Visual**:
- Terminal showing installation:
```bash
# Install from crates.io
$ cargo install miyabi-cli

# Or download binary (macOS ARM64)
$ curl -L https://github.com/.../miyabi-macos-arm64 -o miyabi
$ chmod +x miyabi
$ sudo mv miyabi /usr/local/bin/

# Verify installation
$ miyabi --version
miyabi-cli 0.1.1

# Your first command
$ miyabi work-on 1
```

**Text Overlay**:
- "1 command to install"
- "Ready in 30 seconds"
- "Cross-platform support"

---

### 2:45-3:00 | Call to Action (15s)
**Scene**: GitHub repo + Community links
**Narration**: "Star us on GitHub, join our Discord community, and start automating your development today. Miyabi - where AI meets beautiful code."
**Visual**:
- GitHub repo page with star button (animated click)
- Star count incrementing: 250 → 251 → 252...
- Social proof:
  - Discord members: 1,200+
  - npm downloads: 50K/month
  - Crates.io downloads: 5K
- QR code for GitHub repo
- Discord invite link

**Text Overlay**:
- "Star on GitHub"
- "Join Discord Community"
- "Read the Docs"
- "Start Building"

**End Card**:
- Miyabi logo
- Links:
  - github.com/ShunsukeHayashi/Miyabi
  - discord.gg/miyabi
  - miyabi-docs.com
- Subtitle: "Autonomous Development, Beautifully Simple"

**Music**: Crescendo to finish

---

## Production Notes

### Video Format
- Resolution: 1920x1080 (Full HD)
- Frame Rate: 60fps (for smooth terminal recordings)
- Aspect Ratio: 16:9
- Format: MP4 (H.264 codec)

### Audio
- Narration: Clear, professional voice (male or female)
- Background Music:
  - Genre: Tech/Corporate (upbeat but not distracting)
  - Volume: 40% during narration, 70% during silent visuals
  - Fade in/out at scene transitions
- Sound Effects: Minimal (subtle "pop" for text overlays)

### Visual Style
- Color Scheme: Miyabi brand colors
  - Primary: #FF6B9D (Pink - cherry blossom)
  - Secondary: #4A90E2 (Blue - tech)
  - Accent: #50C878 (Green - success)
  - Dark: #1E1E1E (VS Code dark theme)
- Font:
  - Titles: Montserrat Bold
  - Body: Inter Regular
  - Code: JetBrains Mono
- Animations: Smooth transitions (0.3s ease-in-out)

### Captions/Subtitles
- Languages: Japanese (primary), English (secondary)
- Format: SRT file
- Position: Bottom center
- Font Size: 18pt (readable on mobile)
- Background: Semi-transparent black box

### Thumbnail Design
- Size: 1280x720px
- Elements:
  - Large text: "AIが勝手にコード書く"
  - Subtitle: "3分でわかるMiyabi"
  - 21 agent characters (small grid)
  - Miyabi logo
  - High contrast colors (YouTube algorithm friendly)
- Face: Include a human face or agent character with expressive emotion

---

## Script Variations

### A/B Test Titles
1. "3分でわかるMiyabi - 完全自律型AI開発フレームワーク" (Original)
2. "【革命】Issue投げたら10分でPR完成！Miyabiがヤバい" (Clickbait)
3. "AIが勝手にコード書いてPR作る時代が来た" (Casual)
4. "開発者が寝てる間にAIが仕事を終わらせる方法" (Benefit-focused)

### Target Keywords (SEO)
- Miyabi
- AI autonomous development
- GitHub automation
- AI coding assistant
- 自律型開発
- AIエージェント
- コード自動生成

### Hashtags
#Miyabi #AIAgents #GitHubAutomation #AutonomousDevelopment #Rust #DevTools #AIAssistant #自律型開発 #AI開発

---

## Success Metrics

### Primary KPIs
- Views: 10,000+ in first month
- GitHub Stars: +500 new stars
- Click-through Rate: 10%+ (YouTube → GitHub)
- Watch Time: 70%+ average view duration

### Secondary KPIs
- Likes: 200+
- Comments: 50+
- Shares: 100+
- Discord joins: 200+

---

## Next Steps

1. Review and approve script outline
2. Record narration audio (professional voice actor or AI voice)
3. Record terminal sessions (OBS Studio)
4. Create animations (After Effects or Remotion.js)
5. Edit video (DaVinci Resolve or Final Cut Pro)
6. Add captions (Japanese + English)
7. Design thumbnail (Canva or Figma)
8. Upload to YouTube with optimized metadata
9. Promote on social media (Twitter, Reddit, Discord)
10. Monitor analytics and iterate

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Author**: Miyabi Team
**Status**: Ready for Review
