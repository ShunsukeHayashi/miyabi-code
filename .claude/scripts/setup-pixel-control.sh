#!/bin/bash
# Pixel Termux Control Setup Script
# Setup SSH access from Pixel Termux (MAJIN) to Mac (Orchestrator)

set -e

echo "🎯 Pixel Termux Control Setup"
echo "=============================="
echo ""

# Step 1: Enable SSH on Mac
echo "1️⃣ Enabling SSH on Mac..."
sudo systemsetup -getremotelogin | grep -q "On" || sudo systemsetup -setremotelogin on
echo "✅ SSH enabled on Mac"
echo ""

# Step 2: Ensure SSH directory exists
echo "2️⃣ Setting up SSH directory..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "✅ SSH directory configured"
echo ""

# Step 3: Display Mac IP address
echo "3️⃣ Mac IP addresses:"
echo "---"
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "  " $2}'
echo "---"
echo ""

# Step 4: Display instructions for Pixel Termux
echo "4️⃣ Next steps on Pixel Termux:"
echo "================================"
echo ""
echo "On your Pixel Termux (MAJIN), run:"
echo ""
echo "# Install OpenSSH"
echo "pkg install openssh"
echo ""
echo "# Generate SSH key (if not exists)"
echo "ssh-keygen -t ed25519 -C 'majin-pixel-termux' -f ~/.ssh/id_ed25519_miyabi"
echo ""
echo "# Display public key"
echo "cat ~/.ssh/id_ed25519_miyabi.pub"
echo ""
echo "# Copy the public key output above, then on Mac, run:"
echo "echo 'YOUR_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys"
echo ""
echo "# Test connection from Pixel"
echo "ssh -i ~/.ssh/id_ed25519_miyabi shunsuke@MAC_IP_ADDRESS"
echo ""
echo "================================"
echo ""

# Step 5: Create Pixel control commands directory
echo "5️⃣ Creating Pixel control commands..."
mkdir -p ~/.miyabi/pixel-commands
cat > ~/.miyabi/pixel-commands/README.md << 'EOF'
# Pixel Termux Control Commands

## Quick Commands

### Status Check
```bash
ssh mac-orchestrator "cd ~/Dev/miyabi-private && git status"
```

### API Health Check
```bash
ssh mac-orchestrator "curl -s https://oxotvbi0x1.execute-api.us-west-2.amazonaws.com/prod/health | jq ."
```

### Lambda Logs
```bash
ssh mac-orchestrator "aws logs tail /aws/lambda/miyabi-webui-api --follow"
```

### CDK Diff
```bash
ssh mac-orchestrator "cd ~/Dev/miyabi-private/infrastructure/aws-cdk && npx cdk diff"
```

### Emergency Stop
```bash
ssh mac-orchestrator "tmux send-keys -t miyabi-orchestra:0 C-c"
```

## SSH Config

Add to `~/.ssh/config` on Pixel Termux:

```
Host mac-orchestrator
    HostName MAC_IP_ADDRESS
    User shunsuke
    Port 22
    IdentityFile ~/.ssh/id_ed25519_miyabi
    ServerAliveInterval 60
    ServerAliveCountMax 3
```
EOF

echo "✅ Control commands directory created: ~/.miyabi/pixel-commands/"
echo ""

# Step 6: Create quick test API script
cat > ~/.miyabi/pixel-commands/test-api.sh << 'EOF'
#!/bin/bash
# Quick API test from Pixel

API_URL="https://oxotvbi0x1.execute-api.us-west-2.amazonaws.com/prod"

echo "🔍 Testing Miyabi WebUI API..."
echo ""

echo "1️⃣ Health Check:"
curl -s "$API_URL/health" | jq .
echo ""

echo "2️⃣ Tasks:"
curl -s "$API_URL/api/tasks" | jq .
echo ""

echo "3️⃣ Projects:"
curl -s "$API_URL/api/projects" | jq .
echo ""

echo "✅ API test complete"
EOF

chmod +x ~/.miyabi/pixel-commands/test-api.sh
echo "✅ API test script created: ~/.miyabi/pixel-commands/test-api.sh"
echo ""

# Step 7: Display summary
echo "📊 Setup Summary:"
echo "================="
echo "✅ SSH enabled on Mac"
echo "✅ SSH directory configured"
echo "✅ Control commands directory created"
echo "✅ API test script created"
echo ""
echo "🎯 Next: Follow the instructions above to configure Pixel Termux"
echo ""
echo "🌸 Miyabi Society - Layer 2 Orchestrator"
