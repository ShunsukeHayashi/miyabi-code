#!/bin/bash
# Miyabi Ops Consolidated tmux Setup
# 100ウィンドウ → 10ウィンドウへ集約

set -e

SESSION="miyabi-ops-new"
REPO_ROOT="$HOME/miyabi-private"

# セッションが存在する場合は削除
tmux has-session -t $SESSION 2>/dev/null && tmux kill-session -t $SESSION

# 新セッション作成
tmux new-session -d -s $SESSION -c $REPO_ROOT

# セッション名変更
tmux rename-window -t $SESSION:1 "Infrastructure"

# ============================================================
# Window 1: Infrastructure (4 panes - 簡略化)
# ============================================================
tmux send-keys -t $SESSION:1 "echo '📊 Monitor'" C-m

# 2x2レイアウト
tmux split-window -t $SESSION:1 -h
tmux split-window -t $SESSION:1.1 -v
tmux split-window -t $SESSION:1.2 -v

# 各paneにラベル
tmux send-keys -t $SESSION:1.2 "echo '📝 Summary'" C-m
tmux send-keys -t $SESSION:1.3 "echo '🚀 Deploy'" C-m
tmux send-keys -t $SESSION:1.4 "echo '📈 Metrics'" C-m

# ============================================================
# Window 2: Coding-Leaders (1 pane)
# ============================================================
tmux new-window -t $SESSION -n "Coding-Leaders" -c $REPO_ROOT
tmux send-keys -t $SESSION:2 "# 🔴 しきるん (CoordinatorAgent)" C-m
tmux send-keys -t $SESSION:2 "# リーダー・タスク分解・オーケストレーション" C-m

# ============================================================
# Window 3: Coding-Builders (2 panes - 並列実行)
# ============================================================
tmux new-window -t $SESSION -n "Coding-Builders" -c $REPO_ROOT
tmux send-keys -t $SESSION:3 "# 🟢 つくるん-1 (CodeGenAgent)" C-m
tmux split-window -t $SESSION:3 -h -c $REPO_ROOT
tmux send-keys -t $SESSION:3.2 "# 🟢 つくるん-2 (CodeGenAgent)" C-m

# ============================================================
# Window 4: Coding-QA (3 panes)
# ============================================================
tmux new-window -t $SESSION -n "Coding-QA" -c $REPO_ROOT
tmux send-keys -t $SESSION:4 "# 🔵 めだまん (ReviewAgent)" C-m
tmux split-window -t $SESSION:4 -h -c $REPO_ROOT
tmux send-keys -t $SESSION:4.2 "# 🔵 みつけるん (IssueAgent)" C-m
tmux split-window -t $SESSION:4.2 -v -c $REPO_ROOT
tmux send-keys -t $SESSION:4.3 "# 🟡 つなぐん (RefresherAgent)" C-m

# ============================================================
# Window 5: Coding-Deploy (2 panes)
# ============================================================
tmux new-window -t $SESSION -n "Coding-Deploy" -c $REPO_ROOT
tmux send-keys -t $SESSION:5 "# 🟡 まとめるん (PRAgent)" C-m
tmux split-window -t $SESSION:5 -h -c $REPO_ROOT
tmux send-keys -t $SESSION:5.2 "# 🟡 はこぶん (DeploymentAgent)" C-m

# ============================================================
# Window 6: Business-Strategy (4 panes)
# ============================================================
tmux new-window -t $SESSION -n "Business-Strategy" -c $REPO_ROOT
tmux send-keys -t $SESSION:6 "# 🔴 あきんどさん (AIEntrepreneurAgent)" C-m
tmux split-window -t $SESSION:6 -h -c $REPO_ROOT
tmux send-keys -t $SESSION:6.2 "# 🔵 じぶんさん (SelfAnalysisAgent)" C-m
tmux split-window -t $SESSION:6.1 -v -c $REPO_ROOT
tmux send-keys -t $SESSION:6.3 "# 🔵 しらべるん (MarketResearchAgent)" C-m
tmux split-window -t $SESSION:6.2 -v -c $REPO_ROOT
tmux send-keys -t $SESSION:6.4 "# 🔵 なりきりん (PersonaAgent)" C-m

# ============================================================
# Window 7: Business-Product (3 panes)
# ============================================================
tmux new-window -t $SESSION -n "Business-Product" -c $REPO_ROOT
tmux send-keys -t $SESSION:7 "# 🟢 つくろん (ProductConceptAgent)" C-m
tmux split-window -t $SESSION:7 -h -c $REPO_ROOT
tmux send-keys -t $SESSION:7.2 "# 🟢 かくん (ContentCreationAgent)" C-m
tmux split-window -t $SESSION:7.2 -v -c $REPO_ROOT
tmux send-keys -t $SESSION:7.3 "# 🟢 みちびきん (FunnelDesignAgent)" C-m

# ============================================================
# Window 8: Business-Marketing (4 panes)
# ============================================================
tmux new-window -t $SESSION -n "Business-Marketing" -c $REPO_ROOT
tmux send-keys -t $SESSION:8 "# 🟢 ひろめるん (MarketingAgent)" C-m
tmux split-window -t $SESSION:8 -h -c $REPO_ROOT
tmux send-keys -t $SESSION:8.2 "# 🟢 つぶやきん (SNSStrategyAgent)" C-m
tmux split-window -t $SESSION:8.1 -v -c $REPO_ROOT
tmux send-keys -t $SESSION:8.3 "# 🟢 どうがん (YouTubeAgent)" C-m
tmux split-window -t $SESSION:8.2 -v -c $REPO_ROOT
tmux send-keys -t $SESSION:8.4 "# 🟢 かくちゃん (?)" C-m

# ============================================================
# Window 9: Business-Sales (3 panes)
# ============================================================
tmux new-window -t $SESSION -n "Business-Sales" -c $REPO_ROOT
tmux send-keys -t $SESSION:9 "# 🟢 うるん (SalesAgent)" C-m
tmux split-window -t $SESSION:9 -h -c $REPO_ROOT
tmux send-keys -t $SESSION:9.2 "# 🟢 おきゃくさま (CRMAgent)" C-m
tmux split-window -t $SESSION:9.2 -v -c $REPO_ROOT
tmux send-keys -t $SESSION:9.3 "# 🔵 かぞえるん (AnalyticsAgent)" C-m

# ============================================================
# Window 10: Monitoring (全体監視)
# ============================================================
tmux new-window -t $SESSION -n "Monitoring" -c $REPO_ROOT
tmux send-keys -t $SESSION:10 "# 全体監視ダッシュボード" C-m
tmux send-keys -t $SESSION:10 "watch -n 5 'tmux list-sessions; echo; tmux list-windows -t $SESSION'" C-m

# 最初のウィンドウに戻る
tmux select-window -t $SESSION:1

echo "✅ Miyabi Ops Consolidated Setup Complete!"
echo "📊 100 windows → 10 windows (集約完了)"
echo ""
echo "接続方法: tmux attach -t $SESSION"
echo ""
echo "ウィンドウ構成:"
echo "  1: Infrastructure (4 panes)"
echo "  2: Coding-Leaders (1 pane - しきるん)"
echo "  3: Coding-Builders (2 panes - つくるん×2)"
echo "  4: Coding-QA (3 panes - めだまん/みつけるん/つなぐん)"
echo "  5: Coding-Deploy (2 panes - まとめるん/はこぶん)"
echo "  6: Business-Strategy (4 panes - あきんどさん/じぶんさん/しらべるん/なりきりん)"
echo "  7: Business-Product (3 panes - つくろん/かくん/みちびきん)"
echo "  8: Business-Marketing (4 panes - ひろめるん/つぶやきん/どうがん/かくちゃん)"
echo "  9: Business-Sales (3 panes - うるん/おきゃくさま/かぞえるん)"
echo " 10: Monitoring (全体監視)"
