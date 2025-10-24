# Setup Dependencies - Miyabi Narration System

**Last Updated**: 2025-10-24
**Platform**: macOS 12.0+ (tested on macOS 15.0)

---

## Overview

This guide covers all dependencies required for the Miyabi Narration System, including Social Stream Ninja live streaming integration (Phase 13).

---

## System Requirements

**Hardware**:
- Mac with Apple Silicon (M1/M2/M3) or Intel CPU
- 8GB RAM minimum (16GB recommended)
- 10GB free disk space
- Internet connection

**Operating System**:
- macOS 12.0 Monterey or later
- Tested on macOS 15.0 Sequoia

---

## Core Dependencies

### 1. Homebrew (Package Manager)

**Installation**:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Verification**:
```bash
brew --version
# Expected: Homebrew 4.0.0 or later
```

---

### 2. Python 3.8+

**Installation**:
```bash
brew install python@3.11
```

**Verification**:
```bash
python3 --version
# Expected: Python 3.11.x or later
```

---

### 3. Git

**Installation**:
```bash
brew install git
```

**Verification**:
```bash
git --version
# Expected: git version 2.40.0 or later
```

---

## Python Dependencies

### Required Packages

Create a virtual environment (recommended):
```bash
cd /Users/shunsuke/Dev/miyabi-private/tools
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
# Social Stream Ninja WebSocket client
pip3 install websocket-client

# VOICEVOX API client (if using remote engine)
pip3 install requests

# Video generation (FFmpeg Python wrapper)
pip3 install pillow numpy

# BytePlus ARK API (thumbnail generation)
pip3 install volcengine-python-sdk
```

**Verification**:
```bash
python3 -c "import websocket; print('websocket-client:', websocket.__version__)"
python3 -c "import requests; print('requests:', requests.__version__)"
python3 -c "import PIL; print('pillow:', PIL.__version__)"
```

**Create requirements.txt**:
```bash
cat > requirements.txt << 'EOF'
websocket-client==1.7.0
requests==2.31.0
pillow==10.2.0
numpy==1.26.3
volcengine-python-sdk==1.0.80
EOF
```

**Install from requirements.txt**:
```bash
pip3 install -r requirements.txt
```

---

## Audio Tools

### 1. VOICEVOX Engine (Mock Mode)

**Installation**:
```bash
# Clone VOICEVOX Engine repository
cd ~/dev
git clone https://github.com/VOICEVOX/voicevox_engine.git
cd voicevox_engine

# Install uv (fast Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync

# Start engine in mock mode (for testing)
uv run run.py --enable_mock --host 127.0.0.1 --port 50021
```

**Verification**:
```bash
curl http://127.0.0.1:50021/version
# Expected: {"version":"0.14.x"}
```

**Auto-start with miyabi-narrate.sh**:
```bash
./miyabi-narrate.sh -s  # -s flag starts VOICEVOX Engine automatically
```

---

### 2. BlackHole 2ch (Audio Routing)

**Purpose**: Routes VOICEVOX audio output to OBS Studio input

**Installation**:
```bash
brew install blackhole-2ch
```

**Post-Installation**:
```bash
# IMPORTANT: Reboot required after installation
sudo reboot
```

**Verification (after reboot)**:
```bash
system_profiler SPAudioDataType | grep -A 10 "BlackHole"
# Expected: BlackHole 2ch device listed
```

**Configuration**:
1. Open **Audio MIDI Setup** (Applications → Utilities)
2. Click **+** (bottom left) → Create Multi-Output Device
3. Check **BlackHole 2ch** and **Speakers** (or headphones)
4. Rename to **"VOICEVOX Output"**
5. System Settings → Sound → Output → Select **"VOICEVOX Output"**

For detailed instructions, see: `BLACKHOLE_MANUAL_INSTALL.md`

---

## Video Tools

### 1. FFmpeg (Video Processing)

**Installation**:
```bash
brew install ffmpeg
```

**Verification**:
```bash
ffmpeg -version
# Expected: ffmpeg version 6.0 or later

# Check codec support
ffmpeg -codecs | grep h264
# Expected: DEV.LS h264 (H.264 / AVC / MPEG-4 AVC)
```

**Required Codecs**:
- H.264 encoder (video)
- AAC encoder (audio)
- MP4 muxer (container)

---

### 2. ImageMagick (Image Processing)

**Installation**:
```bash
brew install imagemagick
```

**Verification**:
```bash
magick --version
# Expected: ImageMagick 7.x.x
```

---

## Streaming Tools

### 1. OBS Studio (Live Streaming)

**Installation**:
```bash
brew install --cask obs
```

**Verification**:
```bash
# Launch OBS Studio
open -a "OBS"

# Check version (Help → About)
# Expected: OBS Studio 29.0 or later
```

**Initial Setup**:
1. Run Auto-Configuration Wizard (first launch)
2. Select "Optimize for streaming"
3. Choose resolution: 1920x1080
4. Choose FPS: 30

For detailed configuration, see: `OBS_SETUP_GUIDE.md`

---

### 2. Social Stream Ninja (WebSocket API)

**No Installation Required**

Social Stream Ninja is a web-based service (https://socialstream.ninja) that requires no local installation.

**Components Provided**:
- `social-stream-client.py` - Python WebSocket client
- `test-social-stream.html` - Browser-based test client

**Verification**:
```bash
cd /Users/shunsuke/Dev/miyabi-private/tools
python3 social-stream-client.py --start --session test-session
# Expected: ✅ Connected successfully!
```

---

## Optional Dependencies

### 1. BytePlus ARK API (Thumbnail Generation)

**Purpose**: AI-powered thumbnail generation for YouTube videos

**Setup**:
1. Create BytePlus account: https://console.byteplus.com
2. Get API credentials (Access Key + Secret Key)
3. Export environment variables:

```bash
export BYTEPLUS_ACCESS_KEY="your-access-key"
export BYTEPLUS_SECRET_KEY="your-secret-key"
```

**Verification**:
```bash
python3 thumbnail-generator.py --test
# Expected: Connection successful
```

---

### 2. YouTube Data API v3 (Automated Upload)

**Purpose**: Automated video upload to YouTube (Phase 13.8)

**Setup**:
1. Enable YouTube Data API v3 in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Download `client_secrets.json`
4. Place in `tools/` directory

**Verification**:
```bash
python3 youtube-upload.py --test
# Expected: Authentication successful
```

---

## Environment Variables

Create `.env` file in `tools/` directory:
```bash
cd /Users/shunsuke/Dev/miyabi-private/tools
cat > .env << 'EOF'
# VOICEVOX Engine
VOICEVOX_ENGINE_DIR="/Users/a003/dev/voicevox_engine"
VOICEVOX_PORT=50021

# BytePlus ARK API (optional)
BYTEPLUS_ACCESS_KEY="your-access-key"
BYTEPLUS_SECRET_KEY="your-secret-key"

# YouTube Data API (optional)
YOUTUBE_CLIENT_SECRETS="./client_secrets.json"
YOUTUBE_CHANNEL_ID="your-channel-id"

# Social Stream Ninja (optional, auto-generated if not set)
SOCIAL_STREAM_SESSION_ID="miyabi-narrate"
EOF
```

**Load environment variables**:
```bash
source .env
```

---

## Quick Setup Script

**Automated Installation** (run at your own risk):
```bash
#!/bin/bash
# setup-dependencies.sh

set -e

echo "🚀 Miyabi Narration System - Dependency Setup"
echo ""

# Homebrew
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Core tools
echo "Installing core tools..."
brew install python@3.11 git ffmpeg imagemagick

# Python dependencies
echo "Installing Python dependencies..."
pip3 install --upgrade pip
pip3 install websocket-client requests pillow numpy volcengine-python-sdk

# Audio tools
echo "Installing BlackHole 2ch..."
brew install blackhole-2ch
echo "⚠️  WARNING: Reboot required after BlackHole installation"

# OBS Studio
echo "Installing OBS Studio..."
brew install --cask obs

# Verification
echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Reboot Mac: sudo reboot"
echo "  2. Configure BlackHole Multi-Output Device (see BLACKHOLE_MANUAL_INSTALL.md)"
echo "  3. Configure OBS Studio (see OBS_SETUP_GUIDE.md)"
echo "  4. Test workflow: cd tools && ./miyabi-narrate.sh -d 1 -s -l"
```

**Usage**:
```bash
chmod +x setup-dependencies.sh
./setup-dependencies.sh
```

---

## Verification Checklist

After installation, verify all dependencies:

```bash
cd /Users/shunsuke/Dev/miyabi-private/tools

# Python
python3 --version                         # ✅ Python 3.11+
python3 -c "import websocket"             # ✅ websocket-client
python3 -c "import requests"              # ✅ requests
python3 -c "import PIL"                   # ✅ pillow

# System tools
git --version                             # ✅ git 2.40+
ffmpeg -version                           # ✅ ffmpeg 6.0+
magick --version                          # ✅ ImageMagick 7.x

# Audio
system_profiler SPAudioDataType | grep BlackHole  # ✅ BlackHole 2ch
curl http://127.0.0.1:50021/version      # ✅ VOICEVOX Engine (if running)

# Streaming
python3 social-stream-client.py --start --session test  # ✅ Social Stream Ninja
open -a "OBS"                             # ✅ OBS Studio

# Full workflow
./miyabi-narrate.sh --help                # ✅ Script executable
./miyabi-narrate.sh -d 1 -s -l            # ✅ Full workflow test
```

Expected output: All checks pass with ✅

---

## Troubleshooting

### Issue: `pip3: command not found`

**Solution**:
```bash
brew install python@3.11
export PATH="/opt/homebrew/bin:$PATH"
```

---

### Issue: `ModuleNotFoundError: No module named 'websocket'`

**Solution**:
```bash
pip3 install websocket-client
# OR use virtual environment:
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
```

---

### Issue: VOICEVOX Engine fails to start

**Solution**:
```bash
# Check if port is in use
lsof -i :50021

# Kill existing process
kill $(lsof -t -i :50021)

# Start engine
cd ~/dev/voicevox_engine
uv run run.py --enable_mock --host 127.0.0.1 --port 50021
```

---

### Issue: BlackHole 2ch not detected after installation

**Solution**:
```bash
# MUST reboot after installation
sudo reboot

# After reboot, verify
system_profiler SPAudioDataType | grep -A 10 "BlackHole"
```

---

### Issue: OBS Browser Source shows blank screen

**Solution**:
1. Check session ID matches in URL
2. Verify WebSocket connection: `python3 social-stream-client.py --info`
3. Test in standalone browser first: Open `test-social-stream.html`
4. Clear OBS cache: OBS → Help → Clear Cache

---

## Platform-Specific Notes

### macOS Apple Silicon (M1/M2/M3)

**FFmpeg Hardware Encoding**:
```bash
# Use VideoToolbox hardware encoder for faster video generation
export FFMPEG_ENCODER="h264_videotoolbox"
```

**Python Architecture**:
```bash
# Ensure using arm64 Python, not x86_64 (Rosetta)
python3 -c "import platform; print(platform.machine())"
# Expected: arm64
```

---

### macOS Intel

**FFmpeg Software Encoding**:
```bash
# Use x264 software encoder (slower but more compatible)
export FFMPEG_ENCODER="libx264"
```

---

## Uninstall (if needed)

**Remove all dependencies**:
```bash
# Python packages
pip3 uninstall -y websocket-client requests pillow numpy volcengine-python-sdk

# Homebrew packages
brew uninstall blackhole-2ch ffmpeg imagemagick obs

# VOICEVOX Engine
rm -rf ~/dev/voicevox_engine

# Environment file
rm /Users/shunsuke/Dev/miyabi-private/tools/.env
```

---

## Support & References

**Documentation**:
- `OBS_SETUP_GUIDE.md` - OBS Studio configuration
- `BLACKHOLE_MANUAL_INSTALL.md` - Audio routing setup
- `PHASE_13_5_TEST_REPORT.md` - Test results and troubleshooting
- `SOCIAL_STREAM_INTEGRATION.md` - WebSocket API reference

**External Links**:
- VOICEVOX Engine: https://github.com/VOICEVOX/voicevox_engine
- BlackHole: https://github.com/ExistentialAudio/BlackHole
- Social Stream Ninja: https://socialstream.ninja
- OBS Studio: https://obsproject.com

**Community**:
- Issue Tracker: https://github.com/ShunsukeHayashi/Miyabi/issues
- Discussions: https://github.com/ShunsukeHayashi/Miyabi/discussions

---

**Last Updated**: 2025-10-24
**Maintainer**: Miyabi Development Team
**Version**: 1.0.0 (Phase 13)
