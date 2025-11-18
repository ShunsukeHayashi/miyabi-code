#!/bin/bash
# Setup Pixel 9 Pro Fold as Maestro Device
# Automated installation via ADB

set -e

DEVICE="${1:-46271FDKD001PY}"
DEVICE_NAME="pixel9-fold"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🌸 Miyabi Maestro Setup - Pixel 9 Pro Fold${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verify connection
if ! adb devices | grep -q "$DEVICE"; then
    echo -e "${RED}❌ Device $DEVICE not connected${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Device connected: $DEVICE${NC}"
echo ""

# Step 1: Update Termux packages
echo -e "${BLUE}📦 Step 1: Updating Termux packages...${NC}"
adb -s $DEVICE shell "am start -n com.termux/.HomeActivity" > /dev/null 2>&1
sleep 2

# Execute via Termux RUN_COMMAND broadcast
adb -s $DEVICE shell "am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/bash' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '-c,pkg update -y && pkg upgrade -y' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false" > /dev/null 2>&1 &

echo -e "${YELLOW}⏳ Updating packages (this may take a few minutes)...${NC}"
sleep 30

# Step 2: Install essential packages
echo -e "${BLUE}📦 Step 2: Installing essential packages...${NC}"
PACKAGES="git gh openssh rust cargo jq curl wget tmux neovim"

for pkg in $PACKAGES; do
    echo -e "   Installing ${pkg}..."
    adb -s $DEVICE shell "am broadcast \
        --user 0 \
        -a com.termux.RUN_COMMAND \
        --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/pkg' \
        --esa com.termux.RUN_COMMAND_ARGUMENTS 'install,-y,$pkg' \
        --ez com.termux.RUN_COMMAND_BACKGROUND false" > /dev/null 2>&1
    sleep 2
done

echo -e "${GREEN}✅ Essential packages installed${NC}"
echo ""

# Step 3: Install Termux:API
echo -e "${BLUE}📱 Step 3: Setting up Termux:API...${NC}"
adb -s $DEVICE shell "am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/pkg' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS 'install,-y,termux-api' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false" > /dev/null 2>&1

echo -e "${YELLOW}⚠️  Please install Termux:API app from F-Droid or Play Store${NC}"
echo ""

# Step 4: Setup SSH
echo -e "${BLUE}🔐 Step 4: Setting up SSH...${NC}"
adb -s $DEVICE shell "am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/bash' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '-c,mkdir -p ~/.ssh && chmod 700 ~/.ssh' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false" > /dev/null 2>&1

# Copy SSH public key if exists
if [ -f ~/.ssh/id_ed25519.pub ]; then
    echo "   Copying SSH public key..."
    SSH_KEY=$(cat ~/.ssh/id_ed25519.pub)
    adb -s $DEVICE shell "am broadcast \
        --user 0 \
        -a com.termux.RUN_COMMAND \
        --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/bash' \
        --esa com.termux.RUN_COMMAND_ARGUMENTS '-c,echo \"$SSH_KEY\" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys' \
        --ez com.termux.RUN_COMMAND_BACKGROUND false" > /dev/null 2>&1
fi

echo -e "${GREEN}✅ SSH configured${NC}"
echo ""

# Step 5: Clone Miyabi repository
echo -e "${BLUE}📂 Step 5: Cloning Miyabi repository...${NC}"
adb -s $DEVICE shell "am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/bash' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '-c,cd ~ && git clone https://github.com/customer-cloud/miyabi-private.git' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false" > /dev/null 2>&1 &

echo -e "${YELLOW}⏳ Cloning repository (this may take a few minutes)...${NC}"
sleep 60

echo -e "${GREEN}✅ Repository cloned${NC}"
echo ""

# Step 6: Configure Git
echo -e "${BLUE}⚙️  Step 6: Configuring Git...${NC}"
adb -s $DEVICE shell "am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/git' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS 'config,--global,user.name,Pixel 9 Fold Maestro' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false" > /dev/null 2>&1

adb -s $DEVICE shell "am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/git' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS 'config,--global,user.email,maestro@pixel9fold.miyabi' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false" > /dev/null 2>&1

echo -e "${GREEN}✅ Git configured${NC}"
echo ""

# Step 7: Setup device-specific config
echo -e "${BLUE}📝 Step 7: Creating device configuration...${NC}"

cat > /tmp/pixel9fold-config.yaml <<EOF
device:
  name: pixel9-fold
  model: Pixel 9 Pro Fold
  serial: $DEVICE
  type: maestro
  layer: 1

capabilities:
  - mobile-notifications
  - termux-execution
  - adb-control
  - real-time-monitoring

network:
  usb: true
  wireless: true

apps:
  termux: installed
  lark: not_installed
  github: optional
EOF

# Push config to device
adb -s $DEVICE push /tmp/pixel9fold-config.yaml /sdcard/miyabi-config.yaml > /dev/null 2>&1
adb -s $DEVICE shell "am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/mv' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '/sdcard/miyabi-config.yaml,/data/data/com.termux/files/home/.miyabi-config.yaml' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false" > /dev/null 2>&1

echo -e "${GREEN}✅ Device configuration created${NC}"
echo ""

# Step 8: Test installation
echo -e "${BLUE}🧪 Step 8: Testing installation...${NC}"

# Test git
if adb -s $DEVICE shell "test -d /data/data/com.termux/files/home/miyabi-private && echo 'exists'" | grep -q "exists"; then
    echo -e "${GREEN}   ✅ Miyabi repository: Found${NC}"
else
    echo -e "${RED}   ❌ Miyabi repository: Not found${NC}"
fi

# Test packages
for cmd in git gh cargo jq; do
    if adb -s $DEVICE shell "which $cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ $cmd: Installed${NC}"
    else
        echo -e "${RED}   ❌ $cmd: Not found${NC}"
    fi
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Pixel 9 Pro Fold setup complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Install Termux:API app from Play Store/F-Droid"
echo "2. (Optional) Install Lark app for notifications"
echo "3. Configure GitHub CLI: adb shell -c 'gh auth login'"
echo "4. Test remote execution:"
echo "   ./scripts/pixel-maestro-control.sh -d $DEVICE status"
echo ""
echo -e "${BLUE}🌸 Miyabi Society - Dual Maestro Setup Complete${NC}"
