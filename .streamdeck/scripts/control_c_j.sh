#!/bin/bash

# Stream Deck Shortcut: Control+C+J
# Description: Send Control+C+J keyboard shortcut

# Using osascript to send key combination
osascript -e 'tell application "System Events" to key code 38 using {control down, command down}' # J key with Control+Command

# Alternative using different key combination approach
# osascript -e '
# tell application "System Events"
#     key code 8 using {control down}  -- C key
#     delay 0.1
#     key code 38 using {control down} -- J key
# end tell
# '

echo "Sent Control+C+J shortcut"