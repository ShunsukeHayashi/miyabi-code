-- SuperWhisper Auto Activate for Claude Code
-- Claude Codeが入力待ちのときSuperWhisperを自動起動

on run
    set checkInterval to 2 -- seconds
    set wasWaiting to false

    repeat
        try
            -- Check if iTerm2 is frontmost
            tell application "System Events"
                set frontApp to name of first application process whose frontmost is true
            end tell

            if frontApp is "iTerm2" then
                -- Get the last line of the terminal
                tell application "iTerm2"
                    tell current session of current window
                        set terminalText to text
                        set lineList to paragraphs of terminalText
                        if (count of lineList) > 0 then
                            set lastLine to last item of lineList
                        else
                            set lastLine to ""
                        end if
                    end tell
                end tell

                -- Check if Claude Code is waiting for input
                -- Pattern: line starts with ">" and is mostly empty (input prompt)
                set isWaiting to false

                if lastLine starts with ">" then
                    -- Remove leading ">" and whitespace
                    set cleanLine to text 2 thru -1 of lastLine
                    if length of cleanLine < 3 then
                        set isWaiting to true
                    end if
                end if

                -- Also check for explicit waiting patterns
                if lastLine contains ">" and length of lastLine < 10 then
                    set isWaiting to true
                end if

                if isWaiting and not wasWaiting then
                    -- Claude Code just started waiting for input
                    delay 0.5 -- Brief delay to avoid false triggers

                    -- Trigger SuperWhisper recording (Ctrl+Space)
                    tell application "System Events"
                        key code 49 using control down
                    end tell

                    set wasWaiting to true
                    log "Voice input triggered"

                else if not isWaiting and wasWaiting then
                    -- Claude Code is no longer waiting
                    set wasWaiting to false
                end if

            else
                -- Not in iTerm2, reset state
                set wasWaiting to false
            end if

        on error errMsg
            log "Error: " & errMsg
        end try

        delay checkInterval
    end repeat
end run
