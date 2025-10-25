# VOICEVOX Real-time Narration Hooks

**Status**: ✅ Configured
**Speaker**: ずんだもん (ID: 3)
**Mode**: Detailed operation narration

---

## 📋 Overview

This directory contains Claude Code hooks that provide **real-time VOICEVOX narration** for all operations.

---

## 🎯 Configured Hooks

### 1. PostToolUse Hook

**Script**: `tool-use.sh`
**Trigger**: After every tool execution
**Narration**: Detailed operation descriptions in Japanese

### 2. SessionStart Hook

**Configured in**: `.claude/settings.local.json`
**Message**: "セッション開始なのだ！Miyabiプロジェクトで作業を始めるのだ！"

---

## 🔧 Configuration

See `.claude/settings.local.json` for full configuration.

Environment variables:
- `VOICEVOX_NARRATION_ENABLED=true`
- `VOICEVOX_SPEAKER=3` (ずんだもん)
- `VOICEVOX_SPEED=1.2`

---

**Created**: 2025-10-25
**Version**: v1.0.0
