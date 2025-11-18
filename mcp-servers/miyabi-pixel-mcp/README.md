# Miyabi Pixel MCP Server

**Version**: 1.0.0
**Target**: Google Pixel / Android (Termux)
**Optimization**: Zero dependencies, low memory, battery efficient

---

## 📱 Overview

Pure Node.js MCP (Model Context Protocol) server optimized for Google Pixel devices running Termux.

### Features

- ✅ Zero external dependencies (Node.js stdlib only)
- ✅ Battery-efficient implementation
- ✅ Low memory footprint (~10MB)
- ✅ Termux-API integration
- ✅ 6 MCP tools for device management

---

## 🚀 Quick Start

### Prerequisites

1. **Termux** (from F-Droid, NOT Google Play)
   - Download: https://f-droid.org/en/packages/com.termux/

2. **Termux:API** (from F-Droid)
   - Download: https://f-droid.org/en/packages/com.termux.api/
   - Required for battery, location, notification features

### Installation

#### Method 1: Deploy from Development Machine (Recommended)

```bash
# On your development machine (macOS/Linux)
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-pixel-mcp
./deploy-to-pixel.sh
```

This script will:
1. Check device connection
2. Create deployment package
3. Push to device via adb
4. Extract to Termux home directory

#### Method 2: Manual Installation

```bash
# On Pixel device in Termux
pkg install nodejs git
git clone <repository-url>
cd miyabi-pixel-mcp
node index.js --test
```

---

## 🔧 Setup

### 1. Install Node.js in Termux

```bash
pkg update
pkg install nodejs
node --version  # Should be >= 18.0.0
```

### 2. Install Termux:API

```bash
pkg install termux-api

# Test API
termux-battery-status
termux-location
```

### 3. Setup Storage Access

```bash
termux-setup-storage
# Grant storage permission when prompted
```

### 4. Test MCP Server

```bash
cd ~/miyabi-mcp
node index.js --test
```

Expected output:
```
miyabi-pixel-mcp v1.0.0
Running in Termux: true
```

---

## 🛠️ Available MCP Tools

### 1. `pixel_device_info`
Get device information (model, manufacturer, Android version)

**Input**: None
**Output**: Device info JSON

### 2. `termux_exec`
Execute shell command in Termux environment

**Input**: `{ "command": "ls -la" }`
**Output**: `{ "exitCode": 0, "stdout": "...", "stderr": "..." }`

### 3. `termux_storage_list`
List Termux storage locations

**Input**: None
**Output**: Storage paths and entries

### 4. `pixel_battery_status`
Get battery status via Termux-API

**Input**: None
**Output**: Battery level, charging status, temperature

**Requires**: Termux:API installed

### 5. `pixel_location`
Get device GPS location via Termux-API

**Input**: None
**Output**: Latitude, longitude, accuracy

**Requires**: Termux:API installed + location permission

### 6. `pixel_notification`
Send Android notification via Termux-API

**Input**: `{ "title": "Hello", "content": "Message" }`
**Output**: Notification sent confirmation

**Requires**: Termux:API installed

---

## 📖 Usage Examples

### Test Device Info

```bash
# Start MCP server
node index.js

# In another Termux session, send MCP request via stdio
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"pixel_device_info","arguments":{}}}' | node index.js
```

### Execute Command

```bash
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"termux_exec","arguments":{"command":"uname -a"}}}' | node index.js
```

### Get Battery Status

```bash
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"pixel_battery_status","arguments":{}}}' | node index.js
```

---

## 🔗 Integration with Claude

### Option 1: Local Termux Usage

Run MCP server in background:
```bash
node index.js > ~/mcp.log 2>&1 &
```

### Option 2: Remote Access (Future)

Use SSE gateway for remote Claude Desktop access:
- See: `/docs/MCP_SSE_GATEWAY_DEPLOYMENT.md`

---

## 🐛 Troubleshooting

### "Termux:API not installed" Error

**Solution**:
```bash
pkg install termux-api
# Restart Termux after installation
```

### "Permission denied" for Location/Battery

**Solution**:
1. Open Android Settings
2. Apps → Termux → Permissions
3. Enable Location, Phone (for battery info)

### "Storage not setup" Error

**Solution**:
```bash
termux-setup-storage
# Grant permission when prompted
```

### MCP Server Not Responding

**Solution**:
```bash
# Check if Node.js is running
pgrep -f "node index.js"

# Check logs
tail -f ~/mcp.log

# Restart server
pkill -f "node index.js"
node index.js
```

---

## 📊 Performance

**Memory Usage**: ~10MB (Node.js + MCP server)
**Battery Impact**: Minimal (event-driven, no polling)
**Startup Time**: <1 second
**Response Time**: <100ms per tool call

---

## 🔒 Security Notes

- MCP server runs locally in Termux sandbox
- No network access by default
- All Termux:API calls require explicit user permissions
- Recommended: Use only on trusted networks

---

## 📝 Development

### File Structure

```
miyabi-pixel-mcp/
├── index.js           # MCP server implementation (350+ lines)
├── package.json       # Package definition (zero dependencies)
├── README.md          # This file
└── deploy-to-pixel.sh # Deployment script (adb)
```

### Testing Locally

On development machine:
```bash
node index.js --test
```

### Debugging

Enable verbose logging:
```bash
LOG_LEVEL=debug node index.js
```

---

## 🚀 Deployment

### Update on Device

```bash
# On development machine
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-pixel-mcp
./deploy-to-pixel.sh

# On Pixel device
cd ~/miyabi-mcp
node index.js --test
```

---

## 📞 Support

For issues or questions:
- Check this README first
- Review Termux logs: `~/mcp.log`
- Verify Termux:API installation: `pkg list-installed | grep termux-api`

---

## 🔗 Related Documentation

- **Miyabi Project**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/`
- **SSE Gateway**: `/docs/MCP_SSE_GATEWAY_DEPLOYMENT.md`
- **MCP Servers**: `/mcp-servers/`

---

**Device Tested**: Pixel 9 Pro XL, Android 16
**Termux Version**: Latest from F-Droid
**Node.js Version**: 20.x LTS
