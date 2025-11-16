#!/usr/bin/env bash
tail -50 ~/miyabi-private/.miyabi/logs/latest.log 2>/dev/null || echo "No logs found"
