#!/data/data/com.termux/files/usr/bin/bash
read -p "Issue Number: " NUM
ssh mugen "cd ~/miyabi-private && bash scripts/task-decompose-bg.sh ${NUM}"
echo "Press Enter to close..."
read
