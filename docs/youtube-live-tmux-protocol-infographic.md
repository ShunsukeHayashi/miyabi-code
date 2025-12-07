# YouTube Live: Miyabi tmux P0.2通信プロトコル インフォグラフィック

## 📋 スライド1: システム全体図 (手書き風)

### プロンプト生成用
```
Create a technical whiteboard sketch showing a tmux session layout.
Draw 6 rectangular panes arranged in a grid pattern:
- Top left (large): "Shikirun (Conductor)" with a crown icon
- Top right (3 small panes horizontally): "Kaede-01", "Kaede-02", "Kaede-03"
- Bottom left: "Sakura (Review)"
- Bottom middle: "Tsubaki (PR)"
- Bottom right: "Botan (Deploy)"

Add blue arrows showing bidirectional communication between Shikirun and all other panes.
Label the arrows with "P0.2 Protocol".
Hand-drawn marker style on white background, engineering sketch aesthetic, 16:9 aspect ratio.
```

---

## 📋 スライド2: P0.2通信フロー (手書き風)

### プロンプト生成用
```
Draw a whiteboard flowchart showing the P0.2 communication protocol:

1. Top: Box labeled "GitHub Issue #123 created"
2. Arrow down to: Diamond shape "Shikirun detects"
3. Arrow down to: Rectangle "Parse & Route Decision"
4. Three arrows branching to: "Kaede-01 (Code)", "Kaede-02 (Test)", "Kaede-03 (Doc)"
5. Dotted lines back up labeled "Status Reports"
6. Arrow to final box: "Sakura Review"

Include timing annotations like "t+0s", "t+5s", "t+30s".
Add small "PUSH" and "PULL" labels on arrows.
Hand-drawn technical diagram style with black marker on white background.
```

---

## 📋 スライド3: 永続ペインIDマッピング (手書き風)

### プロンプト生成用
```
Sketch a technical diagram showing tmux pane ID mapping:

Left side: "Session Index Method (❌)"
- Show "%0", "%1", "%2" with X marks
- Label "Fragile - IDs change"

Right side: "Permanent ID Method (✅)"
- Show "%14", "%27", "%39" with checkmarks
- Label "Stable - Survives restarts"

Center: Large arrow pointing right labeled "Migration"
Bottom: Code snippet box showing "tmux send-keys -t %27 'command'"

Hand-drawn engineering diagram style, marker on whiteboard, technical education aesthetic.
```

---

## 📋 スライド4: メッセージ送信コマンド例 (手書き風)

### プロンプト生成用
```
Draw a terminal window sketch showing command execution:

Top: Terminal header bar
Inside terminal:
$ miyabi_send %27 "[Shikirun→Kaede] Issue #1: Implement feature"
[✓] Message sent to pane %27
[✓] Sleep 0.5s applied
[✓] Enter key pressed

Bottom: Small flowchart showing:
1. "Prepare message"
2. "Send to pane"
3. "Wait buffer"
4. "Press Enter"

Hand-drawn terminal interface with rounded corners, command line aesthetic, marker sketch style.
```

---

## 📋 スライド5: 35個のMCPサーバー概要 (手書き風)

### プロンプト生成用
```
Create a mind map style diagram showing MCP server categories:

Center: "Miyabi MCP Ecosystem (35 servers)"

Branches radiating out:
1. "Core Tools" (miyabi-mcp, miyabi-github, miyabi-tmux)
2. "Development" (miyabi-file-watcher, miyabi-log-aggregator)
3. "AI Integration" (gemini3-general, gemini3-image-gen)
4. "Business Tools" (lark-openapi, miyabi-commercial-agents)
5. "Monitoring" (miyabi-resource-monitor, miyabi-network-inspector)

Each branch shows 3-4 representative servers.
Hand-drawn mind map style with curved branches, bubble nodes, whiteboard marker aesthetic.
```

---

## 📋 スライド6: OSS公開戦略 (手書き風)

### プロンプト生成用
```
Draw a strategy roadmap diagram:

Timeline from left to right showing 3 phases:

Phase 1 (Month 1): "Core Release"
- Box showing "tmux orchestration"
- Box showing "P0.2 protocol docs"
- Box showing "Basic MCP servers"

Phase 2 (Month 2-3): "Community Building"
- Box showing "Tutorial videos"
- Box showing "Best practices guide"
- Box showing "Community feedback"

Phase 3 (Month 4+): "Ecosystem Growth"
- Box showing "Plugin marketplace"
- Box showing "Enterprise features"
- Box showing "Multi-language support"

Connect with arrows and add GitHub star predictions: "100 stars", "500 stars", "1000+ stars".
Hand-drawn project timeline style, marker on whiteboard.
```

---

## 📝 配信用トークスクリプト

### スライド1使用時:
> 「これがMiyabiのtmuxオーケストレーション全体図です。
> 指揮者のしきるんが中央にいて、
> 3つのカエデが並列処理、
> サクラ、ツバキ、ボタンがそれぞれの役割を担当しています。」

### スライド2使用時:
> 「P0.2プロトコルの通信フローです。
> GitHubでIssueが作成されると、
> しきるんが検知してタスクを分散、
> 各エージェントが並列で作業して結果を返します。」

### スライド3使用時:
> 「重要なのは永続ペインIDの使用です。
> インデックスベース（%0, %1）ではなく、
> 永続ID（%27など）を使うことで、
> tmuxセッション再起動にも対応できます。」

### スライド4使用時:
> 「実際のメッセージ送信は、このようなコマンドで行います。
> miyabi_sendコマンドで指定ペインにメッセージを送り、
> 0.5秒待ってからEnterキーを押す仕組みです。」

### スライド5使用時:
> 「Miyabiエコシステムには35個のMCPサーバーがあります。
> コア機能から開発ツール、AI統合、ビジネスツール、
> 監視ツールまで幅広くカバーしています。」

### スライド6使用時:
> 「OSS公開は3段階で進めます。
> まずコア機能を公開、
> 次にコミュニティ構築、
> 最終的にエコシステム全体の成長を目指します。」

---

*Generated for YouTube Live - Miyabi tmux P0.2 Protocol Presentation*