# YouTube Demo Video - Complete Narration Script
# "3分でわかるMiyabi - 完全自律型AI開発フレームワーク"

**Total Duration**: 3:00 (180 seconds)
**Language**: Japanese (with English subtitles)
**Narrator**: Professional voice (recommended: calm, confident, tech-savvy tone)
**Words Per Minute**: ~150 WPM (conversational pace)

---

## Full Narration Script

### [0:00-0:05] Cold Open (5 seconds)
**[MUSIC STARTS - Upbeat tech music]**
**[BLACK SCREEN → LOGO REVEAL]**

**NARRATOR** (Japanese):
> AIが開発フローの全てを自動化したら、どうなると思いますか？

**NARRATOR** (English subtitle):
> "What if AI could handle your entire development workflow?"

**[ON-SCREEN TEXT]**:
- "Miyabi - Autonomous Development Framework"

---

### [0:05-0:15] Problem Statement (10 seconds)
**[MONTAGE: Developer working late, tired, frustrated]**

**NARRATOR** (Japanese):
> 従来の開発は遅すぎます。コードを書いて、レビューして、デプロイする。1つのタスクに何時間もかかります。

**NARRATOR** (English subtitle):
> "Traditional development is too slow. Writing code, reviewing, deploying... A single task takes hours."

**[ON-SCREEN TEXT - appearing sequentially]**:
- "手動コーディング: 6時間"
- "コードレビュー: 2時間"
- "デプロイ: 1時間"

---

### [0:15-0:30] Solution Introduction (15 seconds)
**[TERMINAL SCREEN APPEARS - clean, modern]**

**NARRATOR** (Japanese):
> Miyabiは、完全自律型のAI開発プラットフォームです。Issueを作成するだけで、21のAIエージェントが残りの全てを処理します。

**NARRATOR** (English subtitle):
> "Miyabi is a complete autonomous AI development platform. Just create an Issue, and 21 AI agents handle everything else."

**[VISUAL: Agent characters appearing in rapid succession]**
- しきるん (Coordinator) - "Task Orchestration"
- つくるん (CodeGen) - "AI Code Generation"
- めだまん (Review) - "Quality Assurance"
- まとめるん (PR) - "Pull Request Automation"

**[ON-SCREEN TEXT]**:
- "21 AI Agents"
- "Issue → Code → PR → Deploy"
- "100% Automated"

---

### [0:30-1:00] Live Demo Part 1 (30 seconds)
**[TERMINAL RECORDING - Real-time execution]**

**NARRATOR** (Japanese):
> 実際の動作を見てみましょう。Issue 270番を作成します。「TypeScript strict modeを有効化」。そしてコマンドを一つ実行します。

**NARRATOR** (English subtitle):
> "Let's see it in action. I create Issue #270: Enable TypeScript strict mode. Then I run a single command."

**[TERMINAL OUTPUT]**:
```bash
$ miyabi work-on 270

[しきるん] Analyzing Issue #270... ✓
[しきるん] Decomposing into 3 tasks...
  ✓ Task 1: Add strict mode to tsconfig.json
  ✓ Task 2: Fix type errors (12 files)
  ✓ Task 3: Add unit tests

[しきるん] Assigning to agents...
  Task 1 → つくるん (CodeGenAgent)
  Task 2 → つくるん (CodeGenAgent)
  Task 3 → めだまん (ReviewAgent)

[つくるん] Implementing Task 1... (32s)
[つくるん] Implementation complete ✓
```

**NARRATOR** (Japanese):
> コーディネーターエージェントが、Issueを3つのタスクに分解し、適切なエージェントに割り当てます。

**NARRATOR** (English subtitle):
> "The Coordinator Agent decomposes the Issue into 3 tasks and assigns them to the right agents."

**[SPLIT SCREEN - Right side shows agent workflow diagram]**

**[ON-SCREEN TEXT]**:
- "Step 1: Issue Analysis" (appearing at 0:35)
- "Step 2: Task Decomposition" (appearing at 0:42)
- "Step 3: Agent Assignment" (appearing at 0:50)

---

### [1:00-1:30] Live Demo Part 2 (30 seconds)
**[VS CODE EDITOR - Side-by-side diff view]**

**NARRATOR** (Japanese):
> コード生成エージェントが、コードベースを解析し、TypeScript準拠のコードを生成します。そして全てのテストを自動実行します。

**NARRATOR** (English subtitle):
> "The CodeGen Agent analyzes the codebase, generates TypeScript-compliant code, and runs all tests automatically."

**[VISUAL: Code changes appearing in real-time]**
- `tsconfig.json` before/after comparison
- Type errors being fixed across multiple files
- Test runner: "✓ 285 tests passed"

**[CODE EXAMPLE - Quick flash on screen]**:
```typescript
// Before
function getUserData(id) {
  return fetch(`/api/users/${id}`);
}

// After (AI-generated)
async function getUserData(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}
```

**NARRATOR** (Japanese):
> 12ファイルを修正し、285のテストが全て通りました。100%型安全なコードです。

**NARRATOR** (English subtitle):
> "12 files modified. All 285 tests passing. 100% type-safe code."

**[ON-SCREEN TEXT]**:
- "12 files modified"
- "285 tests passing ✓"
- "100% type-safe"

---

### [1:30-2:00] Live Demo Part 3 (30 seconds)
**[TERMINAL + GITHUB PR INTERFACE]**

**NARRATOR** (Japanese):
> 最後に、レビューエージェントがコード品質をチェックし、100点満点でスコアリング。そして自動的にPull Requestを作成します。

**NARRATOR** (English subtitle):
> "Finally, the Review Agent checks code quality, scores it, and automatically creates a Pull Request."

**[TERMINAL OUTPUT]**:
```bash
[めだまん] Reviewing code quality...
  ✓ ESLint: Passed
  ✓ TypeScript: Passed
  ✓ Security: Passed
  ✓ Coverage: 87%

Quality Score: 92/100

[まとめるん] Creating Pull Request...
✓ PR #108 created: "feat: Enable TypeScript strict mode"
```

**[GITHUB PR SCREEN appears]**
- PR title: "feat: Enable TypeScript strict mode"
- Description sections:
  - Summary
  - Changes (12 files)
  - Test Results (285 passing)
  - Quality Score: 92/100
- Labels: `type:feature`, `priority:P1-High`
- Status checks: All green checkmarks

**NARRATOR** (Japanese):
> 品質スコア92点。詳細なドキュメント付きで、マージ準備完了です。

**NARRATOR** (English subtitle):
> "Quality score: 92 out of 100. Complete documentation. Ready to merge."

**[ON-SCREEN TEXT]**:
- "Quality Score: 92/100"
- "Auto-generated documentation"
- "Ready to merge ✓"

---

### [2:00-2:15] Agent Showcase (15 seconds)
**[GRID VIEW - 21 agent characters displayed]**

**NARRATOR** (Japanese):
> Miyabiには、21の専門AIエージェントが含まれています。コーディング用に7体、ビジネス運営用に14体です。

**NARRATOR** (English subtitle):
> "Miyabi includes 21 specialized AI agents. 7 for coding, 14 for business operations."

**[VISUAL: Agent character grid with color coding]**
- Red agents (Leaders): しきるん, あきんどさん
- Green agents (Executors): つくるん, かくん, ひろめるん, etc.
- Blue agents (Analysts): めだまん, みつけるん, しらべるん, etc.
- Yellow agents (Support): まとめるん, はこぶん, つなぐん

**[ANIMATION: Each agent lights up briefly as a category is mentioned]**

**[ON-SCREEN TEXT]**:
- "21 AI Agents"
- "7 Coding Agents"
- "14 Business Agents"

---

### [2:15-2:30] Architecture & Features (15 seconds)
**[SYSTEM ARCHITECTURE DIAGRAM]**

**NARRATOR** (Japanese):
> Rustで構築され、高パフォーマンス。GitHub、Claude AI と統合し、並列エージェント実行に対応しています。

**NARRATOR** (English subtitle):
> "Built with Rust for performance. Integrates with GitHub, Claude AI, and supports parallel agent execution."

**[VISUAL: Architecture diagram showing components]**
- GitHub (Issues, PRs, Actions)
- Miyabi Core (Agent Orchestration)
- LLM Integration (Claude, GPT)
- Git Worktree (Parallel Execution)

**[FEATURE HIGHLIGHTS - Flying in from the sides]**:
- "Rust-powered (8MB binary)"
- "GitHub-native workflow"
- "5x parallel execution"
- "577 passing tests"

**[ON-SCREEN TEXT]**:
- "Built with Rust 1.75+"
- "577 passing tests ✓"
- "Apache 2.0 License"

---

### [2:30-2:45] Installation & Getting Started (15 seconds)
**[TERMINAL - Installation demo]**

**NARRATOR** (Japanese):
> インストールは簡単です。Crates.io からインストールするか、ビルド済みバイナリをダウンロードしてください。

**NARRATOR** (English subtitle):
> "Installation is simple. Install from crates.io or download the pre-built binary."

**[TERMINAL OUTPUT - Commands appearing line by line]**:
```bash
# Install from crates.io
$ cargo install miyabi-cli
   Installing miyabi-cli v0.1.1...
   Installed!

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

**NARRATOR** (Japanese):
> たった1つのコマンドで、30秒でセットアップ完了です。

**NARRATOR** (English subtitle):
> "Just one command. Ready in 30 seconds."

**[ON-SCREEN TEXT]**:
- "1 command to install"
- "Ready in 30 seconds"
- "Cross-platform support"

---

### [2:45-3:00] Call to Action (15 seconds)
**[GITHUB REPO PAGE + COMMUNITY LINKS]**

**NARRATOR** (Japanese):
> GitHubでスターをつけて、Discordコミュニティに参加してください。今日から開発を自動化しましょう。Miyabi - AIと美しいコードの融合です。

**NARRATOR** (English subtitle):
> "Star us on GitHub, join our Discord community, and start automating your development today. Miyabi - where AI meets beautiful code."

**[VISUAL: GitHub repo page]**
- Star button (animated click)
- Star count incrementing: 250 → 251 → 252 → 253...
- Social proof stats:
  - Discord members: 1,200+
  - npm downloads: 50K/month
  - Crates.io downloads: 5K

**[QR CODE appears - GitHub repo link]**

**[SOCIAL LINKS appearing]**:
- Discord invite: discord.gg/miyabi
- Documentation: docs.miyabi.dev
- GitHub: github.com/ShunsukeHayashi/Miyabi

**[END CARD - Final frame holds for 3 seconds]**:
- Miyabi logo (center)
- Tagline: "Autonomous Development, Beautifully Simple"
- Links:
  - github.com/ShunsukeHayashi/Miyabi
  - discord.gg/miyabi
  - miyabi-docs.com

**[MUSIC: Crescendo to finish]**

**[FADE TO BLACK]**

---

## Production Notes

### Narration Guidelines

**Tone**:
- Confident and professional
- Enthusiastic but not over-the-top
- Clear enunciation
- Pace: Moderate (not too fast, not too slow)

**Emphasis Points**:
- "21 AI agents" (0:23)
- "Just create an Issue" (0:25)
- "100% automated" (0:28)
- "Quality score: 92 out of 100" (1:53)
- "Ready in 30 seconds" (2:42)

**Pauses** (for visual emphasis):
- After "What if AI could..." (0:03) - 0.5s pause
- After "Miyabi" introduction (0:20) - 0.5s pause
- During terminal execution (0:45-0:55) - let visuals speak
- Before "Star us on GitHub" (2:47) - 0.5s pause

### Audio Production

**Recording Setup**:
- Microphone: Professional condenser mic (e.g., Blue Yeti, Rode NT1)
- Environment: Quiet room with minimal echo
- Format: WAV 48kHz 16-bit (for editing)
- Final format: AAC 192kbps (for YouTube)

**Audio Processing**:
1. Noise reduction
2. EQ (boost clarity in 2-5kHz range)
3. Compression (ratio 3:1, threshold -20dB)
4. De-esser (reduce harsh "s" sounds)
5. Normalization (-3dB peak)

**Background Music**:
- Track: Royalty-free tech/corporate music
- Sources: Epidemic Sound, Artlist, AudioJungle
- Volume: 40% during narration, 70% during silent sections
- Fade in/out: 1 second transitions

**Sound Effects**:
- Text overlay pop: Subtle (volume 20%)
- Button click: Soft (volume 30%)
- Success chime: When tests pass (volume 40%)
- No excessive sound effects (keep it professional)

### Subtitle/Caption Guidelines

**Languages**:
- Primary: Japanese (full narration)
- Secondary: English (full translation)

**Format**:
- SRT file for upload
- Font: Arial Bold or Helvetica Bold
- Size: 18pt (mobile-friendly)
- Position: Bottom center
- Background: Semi-transparent black box
- Text color: White

**Timing**:
- Max 2 lines per subtitle
- Max 42 characters per line
- Display time: Minimum 1 second, maximum 7 seconds
- Gap between subtitles: 0.3 seconds

**Example SRT format**:
```srt
1
00:00:00,000 --> 00:00:05,000
What if AI could handle your entire
development workflow?

2
00:00:05,000 --> 00:00:15,000
Traditional development is too slow.
Writing code, reviewing, deploying... takes hours.
```

---

## Voice Actor Briefing

### Character Persona
- **Name**: Tech Narrator
- **Age**: 30-40
- **Gender**: Male or Female (both work well)
- **Personality**: Knowledgeable developer, excited about innovation
- **Speaking style**: Clear, articulate, professional yet approachable

### Direction Notes
- Imagine you're explaining this to a colleague who's interested but skeptical
- Don't oversell - let the product speak for itself
- Emphasize the simplicity and automation aspects
- Sound genuinely impressed by the technology (not scripted)

### Alternative Voice Options
1. **Professional Voice Actor**: Fiverr, Voices.com ($100-$200)
2. **AI Voice Generation**: ElevenLabs, Play.ht ($20-$50)
   - Recommended voice: "Adam" (Professional) or "Antoni" (Friendly)
3. **Internal Team Member**: With good recording setup

---

## Script Variations for A/B Testing

### Version A: Technical Audience
Focus on technical details, performance metrics, code quality

### Version B: Business Audience
Focus on time savings, cost reduction, productivity gains

### Version C: Casual Audience
Focus on simplicity, ease of use, getting started quickly

**Recommendation**: Start with Version A (technical) for launch, then create Version C for broader reach after initial traction.

---

## Quality Checklist

### Pre-Recording
- [ ] Script reviewed and approved by team
- [ ] Voice actor selected and briefed
- [ ] Recording environment tested (no echo, no noise)
- [ ] Microphone tested and levels set correctly
- [ ] Backup recording device ready

### During Recording
- [ ] Record in takes (easier to edit)
- [ ] Record each section 2-3 times (choose best take)
- [ ] Monitor audio levels (peak at -6dB)
- [ ] Take breaks every 15 minutes (maintain voice quality)
- [ ] Note any issues or alternate takes

### Post-Recording
- [ ] Audio cleanup and processing
- [ ] Sync narration with visuals
- [ ] Add background music
- [ ] Add sound effects (minimal)
- [ ] Export final audio track
- [ ] Quality check on different devices (phone, laptop, headphones)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Author**: Miyabi Team
**Status**: Ready for Recording
