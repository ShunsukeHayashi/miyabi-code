#!/data/data/com.termux/files/usr/bin/bash
# Termux Shortcut: Issue Create
# Widget用ショートカット - MUGENサーバー経由でIssue作成

# Input prompt
read -p "Issue Title: " TITLE
read -p "Type (feature/bug/refactor) [feature]: " TYPE
TYPE=${TYPE:-feature}
read -p "Priority (P0/P1/P2/P3) [P2]: " PRIORITY  
PRIORITY=${PRIORITY:-P2}

echo "Creating issue on MUGEN..."
ssh mugen "cd ~/miyabi-private && bash scripts/issue-create-bg.sh \"${TITLE}\" --type=${TYPE} --priority=${PRIORITY}"

echo ""
echo "Press Enter to close..."
read
