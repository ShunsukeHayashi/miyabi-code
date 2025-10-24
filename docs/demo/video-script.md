# YouTube Video Script: "3分でわかるMiyabi"

**Title**: 3分でわかるMiyabi - 完全自律型AI開発フレームワーク

**Duration**: 3:00

**Target Audience**: Software developers, DevOps engineers, Engineering managers

**Language**: Japanese (with English subtitles)

---

## 📽️ Scene Breakdown

### Scene 1: Introduction (0:00 - 0:30)

**Visual**:
- Miyabi logo animation
- GitHub repository screenshot
- Code editor with automated commits

**Narration (Japanese)**:
```
こんにちは。開発者の皆さん、毎日の Issue 対応に疲れていませんか？

Miyabi は、GitHub Issue を投げるだけで、AIが自動的にコードを書き、
テストを実行し、Pull Request を作成する、完全自律型の開発フレームワークです。

今日は、わずか3分で Miyabi の魅力をお見せします。
```

**Narration (English)**:
```
Hello developers! Are you tired of daily issue management?

Miyabi is a fully autonomous development framework that automatically writes code,
runs tests, and creates Pull Requests - just by creating a GitHub Issue.

Today, I'll show you the power of Miyabi in just 3 minutes.
```

**On-Screen Text**:
- "Miyabi - 完全自律型AI開発フレームワーク"
- "GitHub as OS アーキテクチャ"
- "21個の専門Agent搭載"

---

### Scene 2: Installation Demo (0:30 - 1:00)

**Visual**:
- Terminal screen recording
- Installation commands
- Real-time output

**Narration (Japanese)**:
```
インストールは驚くほど簡単です。

まず、Rust をインストールします。
次に、Miyabi をクローンして、cargo build を実行するだけ。

たったこれだけで、21個の専門Agentがあなたの開発チームに加わります。
```

**Narration (English)**:
```
Installation is incredibly simple.

First, install Rust.
Then, clone Miyabi and run cargo build.

That's it! 21 specialized agents join your development team.
```

**Terminal Commands**:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Clone Miyabi
git clone https://github.com/ShunsukeHayashi/Miyabi.git
cd Miyabi

# Build
cargo build --release

# Verify installation
./target/release/miyabi --version
# Output: miyabi 2.0.0
```

**On-Screen Text**:
- "インストール時間: 5分"
- "必要な知識: Rust基本操作のみ"

---

### Scene 3: Agent Execution Demo - Issue #270 (1:00 - 2:00)

**Visual**:
- Split screen: GitHub Issue + Terminal
- Real-time Agent execution
- Code diff preview
- Test results

**Narration (Japanese)**:
```
では、実際の動作を見てみましょう。

Issue #270: "TypeScript strict mode 有効化" という Issue を作成します。

次に、たった一つのコマンドを実行します。
miyabi work-on 270

すると、4つの専門Agentが順番に動き出します。

まず、「しきるん」がタスクを分解します。
次に、「つくるん」がコードを実装します。
そして、「めだまん」が品質をチェックします。
最後に、「まとめるん」がPull Requestを作成します。

わずか10分で、レビュー可能な状態のPRが完成しました。
```

**Narration (English)**:
```
Let's see it in action.

We create Issue #270: "Enable TypeScript strict mode"

Then, we run just one command:
miyabi work-on 270

Four specialized agents start working in sequence.

First, "Coordinator" decomposes the task.
Then, "CodeGen" implements the code.
Next, "Review" checks the quality.
Finally, "PR" creates the Pull Request.

In just 10 minutes, a review-ready PR is complete.
```

**Terminal Output**:
```bash
$ miyabi work-on 270

[12:00:00] 🎯 [CoordinatorAgent] Analyzing Issue #270...
[12:00:05] ✅ [CoordinatorAgent] Task decomposition complete
           - 3 tasks identified
           - DAG: 3 nodes, 2 edges, 2 levels

[12:00:10] ⚙️ [CodeGenAgent] Implementing changes...
[12:03:45] ✅ [CodeGenAgent] Code generation complete
           - 5 files modified
           - 234 lines added
           - 12 lines removed

[12:03:50] 🔍 [ReviewAgent] Running quality checks...
[12:05:20] ✅ [ReviewAgent] Quality score: 98/100
           - Code quality: Excellent
           - Test coverage: 95%
           - Performance: No issues

[12:05:25] 📝 [PRAgent] Creating Pull Request...
[12:05:40] ✅ [PRAgent] PR #280 created
           - URL: https://github.com/...
           - Tests: All passing ✅
           - Ready for review

✨ Execution complete in 5m 40s
```

**On-Screen Text**:
- "実行時間: 10分"
- "成功率: 95%+"
- "人間の介入: 不要"

---

### Scene 4: 21 Character Introduction (2:00 - 2:30)

**Visual**:
- Character grid animation
- Each character icon with name
- Agent specialization tags

**Narration (Japanese)**:
```
Miyabiには、21個のユニークな専門Agentがいます。

コーディングチームには：
- しきるん：タスク統括
- つくるん：コード生成
- めだまん：品質レビュー
- みつけるん：Issue分析
- まとめるん：PR作成
- はこぶん：デプロイ
- つなぐん：状態監視

さらに、ビジネスチームには14個のAgentが、
戦略立案からマーケティング、営業まで、
あらゆる業務を自動化します。
```

**Narration (English)**:
```
Miyabi includes 21 unique specialized agents.

The coding team consists of:
- Coordinator: Task orchestration
- CodeGen: Code generation
- Review: Quality review
- Issue: Issue analysis
- PR: Pull request creation
- Deployment: Deployment automation
- Refresher: State monitoring

Additionally, the business team has 14 agents
automating everything from strategic planning
to marketing and sales.
```

**Visual Grid Layout**:
```
Coding Agents (7)
┌─────────────┬─────────────┬─────────────┐
│ しきるん     │ つくるん     │ めだまん     │
│ Coordinator │ CodeGen     │ Review      │
├─────────────┼─────────────┼─────────────┤
│ みつけるん   │ まとめるん   │ はこぶん     │
│ Issue       │ PR          │ Deployment  │
├─────────────┴─────────────┴─────────────┤
│ つなぐん                                  │
│ Refresher                                │
└──────────────────────────────────────────┘

Business Agents (14)
[Grid of business agent icons with tags]
```

---

### Scene 5: Summary + CTA (2:30 - 3:00)

**Visual**:
- Key metrics animation
- GitHub repository stats
- Landing page preview
- QR code for repository

**Narration (Japanese)**:
```
Miyabiを使えば、あなたのチームの生産性は劇的に向上します。

Issue作成からデプロイまで、完全自動化。
開発者は、本当に重要な意思決定に集中できます。

Miyabiは、完全オープンソース。
今すぐ GitHub でスターをつけて、無料で始めましょう。

あなたの開発ワークフローを、今日から革新しませんか？

ご視聴ありがとうございました。
```

**Narration (English)**:
```
With Miyabi, your team's productivity improves dramatically.

From issue creation to deployment, fully automated.
Developers can focus on truly important decisions.

Miyabi is completely open source.
Star us on GitHub and start for free today.

Ready to revolutionize your development workflow?

Thank you for watching!
```

**On-Screen Text**:
- "GitHub: ShunsukeHayashi/Miyabi"
- "無料・オープンソース"
- "今すぐスター⭐をつけよう"
- "詳細: https://shunsukehayashi.github.io/Miyabi/"

**Final Statistics**:
```
✨ Miyabi Stats
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ 生産性向上:     200%+
🤖 Agent数:       21個
📊 成功率:        95%+
⏱️ 平均実行時間:  10分
🌟 GitHub Stars:  500+ (target)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎬 Production Notes

### Recording Equipment
- **Screen Capture**: OBS Studio / QuickTime Player
- **Microphone**: Built-in or external USB mic
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30fps

### Editing Software
- **Primary**: iMovie (macOS) / DaVinci Resolve (Free)
- **Alternative**: Adobe Premiere Pro

### Background Music (BGM)
- **Intro/Outro**: Upbeat tech music (royalty-free)
- **Demo Section**: Minimal ambient music
- **Volume**: -20dB to -25dB (background level)

**Recommended BGM Sources**:
- YouTube Audio Library (Free)
- Artlist.io (Subscription)
- Epidemic Sound (Subscription)

### Font Choices
- **Japanese**: Noto Sans JP (Bold)
- **English**: Roboto / Inter (Medium)
- **Code**: JetBrains Mono / Fira Code

### Color Palette
- **Primary**: #1D76DB (Miyabi Blue)
- **Success**: #10B981 (Green)
- **Warning**: #F59E0B (Orange)
- **Background**: #0F172A (Dark)
- **Text**: #FFFFFF (White)

---

## 📋 Checklist

Pre-Production:
- [ ] Script approved
- [ ] Demo environment ready (Issue #270)
- [ ] Character assets prepared
- [ ] Recording software tested

Recording:
- [ ] Screen capture completed
- [ ] Narration recorded
- [ ] No audio issues
- [ ] All scenes captured

Post-Production:
- [ ] Video edited (3:00 length)
- [ ] Subtitles added (JP + EN)
- [ ] BGM added
- [ ] Thumbnail created (1280x720)
- [ ] Final quality check

Publishing:
- [ ] YouTube upload
- [ ] Description with links
- [ ] Tags added (AI, DevOps, Automation, Rust)
- [ ] Shared on social media

---

**Version**: 1.0.0
**Created**: 2025-10-24
**Last Updated**: 2025-10-24
