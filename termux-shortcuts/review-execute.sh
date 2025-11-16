#!/data/data/com.termux/files/usr/bin/bash
read -p "Issue: " N
ssh mugen "bash ~/miyabi-private/scripts/review-execute-bg.sh ${N}"
read
