#!/data/data/com.termux/files/usr/bin/bash
read -p "Environment (staging/production): " ENV
ssh mugen "bash ~/miyabi-private/scripts/deploy-execute-bg.sh ${ENV}"
read
