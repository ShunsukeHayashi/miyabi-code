# Infrastructure Context - MUGEN (無限)

**Last Updated**: 2025-11-08
**Version**: 1.0.0

---

## 🔥 MUGEN (無限) - Main Development Environment

**Concept**: 無限の可能性を持つEC2開発環境

### Connection

```bash
# Quick connect
ssh mugen

# Short alias
m

# VS Code Remote-SSH
# Cmd+Shift+P → "Remote-SSH: Connect to Host" → "mugen"

# Android Termux
ssh mugen  # or: m
```

---

## 📊 Server Specifications

### Hardware
```
Instance Type: AWS EC2 r5.4xlarge
Region: us-west-2 (Oregon)
CPU: 16 vCPU (Intel Xeon Platinum 8259CL @ 2.50GHz)
RAM: 128GB
Storage: 200GB SSD
Network: Enhanced Networking (up to 10 Gbps)
```

### Operating System
```
OS: Ubuntu 22.04 LTS
AMI: Deep Learning AMI
Kernel: Linux 5.15+
Architecture: x86_64
```

### Network
```
IP: 44.250.27.197
SSH Port: 22
User: ubuntu
Auth: Key-based only (password auth disabled)
Key: ~/.ssh/mugen-key.pem (or aimovie-dev-key-usw2.pem)
```

---

## 🛠️ Installed Software

### Development Tools
```
Python: 3.10.12
Node.js: v20.19.5
npm: 10.8.2
Git: 2.34.1
Docker: 28.5.1
Rust: (to be installed as needed)
```

### System Tools
```
tmux: Available
vim/nano: Available
curl/wget: Available
```

### Notes
- ⚠️ **GPU**: Not available (CPU-only instance)
- ✅ **Cargo/Rust**: Install via `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

---

## 🎯 Usage Patterns

### Pattern 1: Miyabi Development

```bash
# Connect to MUGEN
ssh mugen

# Clone/Update Miyabi
cd ~
git clone https://github.com/ShunsukeHayashi/Miyabi.git miyabi-private
cd miyabi-private

# Setup Rust (first time only)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Build & Test
cargo build --release
cargo test --all

# Run Agents
./target/release/miyabi agent run <agent_name>
```

### Pattern 2: tmux Multi-Agent Development

```bash
# Start tmux orchestra on MUGEN
ssh mugen
cd ~/miyabi-private
tmux new -s orchestra

# Launch multiple agents in parallel
# See: .claude/MIYABI_ORCHESTRA_INTEGRATION.md
```

### Pattern 3: File Transfer

```bash
# Local → MUGEN
scp myfile.txt mugen:~/miyabi-private/

# MUGEN → Local
scp mugen:~/miyabi-private/results.txt ~/Downloads/

# Directory transfer
scp -r local-dir/ mugen:~/miyabi-private/
```

### Pattern 4: Port Forwarding

```bash
# Forward local port to MUGEN
ssh -L 8888:localhost:8888 mugen

# Then access http://localhost:8888 from local browser
# Useful for Jupyter, web servers, monitoring dashboards
```

---

## 📱 Multi-Platform Access

### macOS / Linux
```bash
# SSH config already set up
ssh mugen
```

### Windows (WSL)
```bash
# Copy SSH key to WSL
cp /mnt/c/Users/<username>/.ssh/mugen-key.pem ~/.ssh/
chmod 600 ~/.ssh/mugen-key.pem

# Add to ~/.ssh/config
cat >> ~/.ssh/config << 'EOF'
Host mugen
    HostName 44.250.27.197
    User ubuntu
    IdentityFile ~/.ssh/mugen-key.pem
    ServerAliveInterval 60
EOF

ssh mugen
```

### Android (Termux)
```bash
# See: EC2-Setup-Package/TERMUX_ANDROID_QUICK_START.md

# Quick setup
pkg install openssh
cd ~/storage/downloads/EC2-Setup-Package/
bash termux-mugen-setup.sh

# Connect
ssh mugen  # or: m
```

---

## 🔧 Maintenance

### Check System Status

```bash
# Resource usage
ssh mugen "free -h"
ssh mugen "df -h"
ssh mugen "uptime"

# Running processes
ssh mugen "ps aux | head -20"

# Network status
ping -c 4 44.250.27.197
```

### Cleanup

```bash
# Docker cleanup
ssh mugen "docker system prune -af"

# Cargo cleanup
ssh mugen "cd ~/miyabi-private && cargo clean"

# Tmp cleanup
ssh mugen "sudo apt-get clean && sudo apt-get autoclean"
```

### Updates

```bash
# System updates
ssh mugen "sudo apt-get update && sudo apt-get upgrade -y"

# Rust updates
ssh mugen "rustup update"

# Node.js updates
ssh mugen "npm install -g npm@latest"
```

---

## 🚨 Troubleshooting

### Connection Issues

```bash
# Test network connectivity
ping -c 4 44.250.27.197

# SSH with verbose logging
ssh -vvv mugen

# Check SSH key permissions
ls -la ~/.ssh/mugen-key.pem
# Should be: -rw------- (600)

# Fix permissions if needed
chmod 600 ~/.ssh/mugen-key.pem
```

### Permission Denied

```bash
# Verify SSH key
head -n 1 ~/.ssh/mugen-key.pem
# Should show: -----BEGIN RSA PRIVATE KEY-----

# Check SSH config
cat ~/.ssh/config | grep -A 10 "Host mugen"
```

### Host Key Verification Failed

```bash
# Remove old host key
ssh-keygen -R 44.250.27.197
ssh-keygen -R mugen

# Reconnect
ssh mugen
```

---

## 📚 Related Documentation

### Setup Guides
- **Mac/Linux**: `EC2-Setup-Package/QUICK_START.md`
- **Android**: `EC2-Setup-Package/TERMUX_ANDROID_QUICK_START.md`
- **Detailed Manual**: `EC2-Setup-Package/EC2_SETUP.md`

### Infrastructure Docs
- **Overview**: `docs/infrastructure/MUGEN_MACHINE_OVERVIEW.md`
- **Config**: `.miyabi/infrastructure/machines.toml`

### Operations
- **tmux Operations**: `.claude/TMUX_OPERATIONS.md`
- **Orchestra Integration**: `.claude/MIYABI_ORCHESTRA_INTEGRATION.md`

---

## 🎯 Best Practices

### Development Workflow

1. **Use tmux for long-running tasks**
   ```bash
   ssh mugen -t tmux new -A -s dev
   # Detach: Ctrl+b d
   # Reattach: ssh mugen -t tmux attach -t dev
   ```

2. **Use Git Worktrees for parallel tasks**
   ```bash
   cd ~/miyabi-private
   git worktree add ../worktree-feature-x feature-x
   cd ../worktree-feature-x
   cargo build
   ```

3. **Monitor resources before heavy tasks**
   ```bash
   free -h  # Check available memory
   df -h    # Check disk space
   ```

4. **Regular backups**
   ```bash
   # Backup critical files to local
   scp -r mugen:~/miyabi-private/.git ~/Backups/miyabi-git-$(date +%Y%m%d)
   ```

### Security

1. **Never share SSH key**
   - Keep `mugen-key.pem` private
   - Use 600 permissions
   - Don't commit to Git

2. **Use SSH Agent Forwarding (optional)**
   ```bash
   ssh -A mugen
   # Allows git operations without copying GitHub keys to MUGEN
   ```

3. **Regular security updates**
   ```bash
   ssh mugen "sudo apt-get update && sudo apt-get upgrade -y"
   ```

---

## 💡 Tips & Tricks

### Aliases

Add to your local `~/.bashrc` or `~/.zshrc`:

```bash
# MUGEN shortcuts
alias m='ssh mugen'
alias mugen-status='ping -c 4 44.250.27.197'
alias mugen-resources='ssh mugen "free -h && df -h"'
alias mugen-sync='rsync -avz --exclude target ~/miyabi-private/ mugen:~/miyabi-private/'
```

### VS Code Extensions (for Remote Development)

Must-have extensions when connected via Remote-SSH:
- rust-analyzer
- CodeLLDB (for debugging)
- Even Better TOML
- GitLens

### Persistent Sessions

```bash
# Start persistent tmux session on MUGEN
ssh mugen -t tmux new -A -s persistent

# Your work continues even if SSH disconnects
# Reconnect anytime with the same command
```

---

## 📊 Current Status (as of 2025-11-08)

```
Status: ✅ Running
Uptime: 3 hours 33 minutes
Load Average: 1.05, 0.86, 0.52
Memory: 122GB / 124GB available (1% used)
Disk: 162GB / 194GB available (17% used)
```

**Last verified**: 2025-11-08 19:08 JST

---

## 🔗 Quick Reference

| Task | Command |
|------|---------|
| Connect | `ssh mugen` or `m` |
| Check status | `ssh mugen "uptime"` |
| Check resources | `ssh mugen "free -h && df -h"` |
| Upload file | `scp file.txt mugen:~/` |
| Download file | `scp mugen:~/file.txt ~/Downloads/` |
| Port forward | `ssh -L 8888:localhost:8888 mugen` |
| tmux session | `ssh mugen -t tmux new -A -s dev` |
| VS Code connect | Remote-SSH: Connect to Host → mugen |

---

**MUGEN (無限) - 無限の可能性を、どこからでも 🔥💪**
