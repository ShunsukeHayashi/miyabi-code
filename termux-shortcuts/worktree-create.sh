#!/data/data/com.termux/files/usr/bin/bash
read -p "Issue Number: " NUM
ssh mugen "bash ~/miyabi-private/scripts/worktree-create-bg.sh ${NUM}"
echo "Press Enter..."
read
