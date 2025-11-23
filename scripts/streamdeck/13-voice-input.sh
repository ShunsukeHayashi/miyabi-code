#!/bin/bash
# Stream Deck: Voice Input
# Trigger Pixel voice input remotely

# Send command to Pixel via adb
adb shell "am broadcast --user 0 -a com.termux.RUN_COMMAND --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/home/.shortcuts/voice-simple.sh'"

osascript -e 'display notification "Pixel音声入力起動" with title "🎤 Stream Deck"'
