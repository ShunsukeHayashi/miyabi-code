# Pixel/Termux Auto-Recovery System

Issue: #875 - Pixel Termux自動復旧

## Overview

The Miyabi Pixel/Termux Auto-Recovery System automatically detects and recovers from connection issues with mobile Coordinator devices.

## Features

- **Network Scanning**: Automatically scans local network for Termux devices
- **Device Identification**: Identifies Termux SSH servers by banner
- **Config Auto-Update**: Updates SSH config and /etc/hosts with new IP
- **Fallback Support**: Reassigns tasks to MUGEN when Pixel is unavailable
- **Watch Mode**: Continuous monitoring and recovery
- **Dry Run Mode**: Preview changes before applying

## Quick Start

```bash
# Run single recovery attempt
./run_recovery.sh

# Dry run (see what would be done)
./run_recovery.sh --dry-run

# Scan network only
./run_recovery.sh --scan-only

# Continuous monitoring
./run_recovery.sh --watch --interval 120

# JSON output
./run_recovery.sh --json
```

## Problem Addressed

```
ssh: connect to host 192.168.3.9 port 8022: Connection refused
```

**Causes**:
- Device offline or in sleep mode
- Network change (IP address changed via DHCP)
- Termux SSH server stopped
- Wi-Fi reconnection to different access point

## Recovery Process

### Step 1: Check Current Status
Attempts SSH connection to the configured hostname.

### Step 2: Network Scan
Scans the local network (default: 192.168.3.0/24) for devices with port 8022 open.

### Step 3: Device Identification
Identifies Termux devices by checking SSH banner for known identifiers.

### Step 4: Update Configurations
- Updates `~/.ssh/config` with new IP address
- Updates `/etc/hosts` (requires sudo)
- Flushes DNS cache on macOS

### Step 5: Verify Recovery
Re-tests SSH connection to confirm recovery.

### Step 6: Fallback (if device not found)
Checks MUGEN availability and prepares task reassignment.

## Usage

### CLI Options

```
USAGE:
    ./run_recovery.sh [OPTIONS]

OPTIONS:
    -d, --dry-run       Show what would be done without making changes
    -j, --json          Output as JSON
    -v, --verbose       Verbose output
    -n, --network NET   Network prefix to scan (e.g., 192.168.1)
    -s, --scan-only     Only scan network, don't recover
    -w, --watch         Continuous monitoring mode
    -i, --interval SEC  Interval between checks (default: 60)
    -h, --help          Show help message
```

### Python Script

```bash
# Single run
python3 pixel_recovery.py

# Dry run
python3 pixel_recovery.py --dry-run

# Scan only
python3 pixel_recovery.py --scan-only

# Verbose with different network
python3 pixel_recovery.py -v -n 192.168.1
```

## Sample Output

```
============================================================
🔧 Miyabi Pixel Recovery System
============================================================

📍 Step 1: Checking current connection status...
  ❌ SSH connection failed: Connection refused

📍 Step 2: Scanning network for Pixel device...
  ℹ️ Scanning network 192.168.3.0/24 for port 8022...
  ℹ️ Found 1 device(s) with port 8022 open

📍 Step 3: Identifying Termux devices...
  ℹ️ Checking 192.168.3.15...
  ✅ Found Termux device at 192.168.3.15

📍 Step 4: Updating configurations for new IP: 192.168.3.15...
  ℹ️ Updating SSH config: pixel -> 192.168.3.15
  ✅ SSH config updated. Backup at /Users/user/.ssh/config.bak
  ℹ️ Updating hosts file: pixel -> 192.168.3.15
  ✅ Hosts file updated

📍 Step 5: Verifying recovery...
  ✅ SSH connection successful (0.45s)

============================================================
📊 Recovery Report
============================================================

📅 Timestamp: 2025-11-26 15:30:00
✅ Status: SUCCESS
📝 Message: Successfully recovered connection to pixel
🌐 New IP: 192.168.3.15
⏱️  Duration: 12.34s

🔧 Actions Taken:
   • checked_status
   • network_scan
   • device_identification
   • ssh_config_updated
   • hosts_updated
   • dns_cache_flushed

============================================================
```

## JSON Output Format

```json
{
  "timestamp": "2025-11-26T15:30:00",
  "device": "pixel",
  "status": "success",
  "message": "Successfully recovered connection to pixel",
  "new_ip": "192.168.3.15",
  "actions_taken": [
    "checked_status",
    "network_scan",
    "device_identification",
    "ssh_config_updated",
    "hosts_updated"
  ],
  "duration_seconds": 12.34,
  "details": {
    "old_status": "unreachable",
    "new_status": "online",
    "ssh_config_updated": true,
    "hosts_updated": true
  }
}
```

## Integration

### With Self-Healing System

```bash
# Check Pixel and heal if needed
./run_recovery.sh --json > /tmp/pixel_status.json

if jq -e '.status != "success"' /tmp/pixel_status.json > /dev/null; then
    # Run self-healing
    ../self-healing/run_healing.sh
fi
```

### Cron Job

```bash
# Check every 5 minutes
*/5 * * * * /path/to/scripts/recovery/run_recovery.sh --quiet 2>&1 | logger -t miyabi-pixel
```

### systemd Service

```ini
# /etc/systemd/system/miyabi-pixel-recovery.service
[Unit]
Description=Miyabi Pixel Recovery Service
After=network.target

[Service]
Type=simple
ExecStart=/path/to/run_recovery.sh --watch --interval 300
Restart=always

[Install]
WantedBy=multi-user.target
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Recovery successful or device already online |
| 1 | Partial recovery (config updated but verification failed) |
| 2 | Recovery failed (device not found) |

## Configuration

### Default Settings (in pixel_recovery.py)

```python
DEFAULT_PIXEL_CONFIG = {
    "name": "pixel",
    "hostname": "pixel",
    "port": 8022,
    "user": "u0_a306",  # Common Termux user
    "network_prefix": "192.168.3",
    "scan_range": (1, 254),
}
```

### SSH Config Requirements

The script expects an SSH config entry like:

```
Host pixel
    HostName 192.168.3.9
    Port 8022
    User u0_a306
    IdentityFile ~/.ssh/id_ed25519
```

## Future Enhancements

1. **Wake-on-LAN**: Send magic packet to wake device
2. **mDNS/Bonjour**: Use multicast DNS for discovery
3. **ADB Bridge**: Use Android Debug Bridge as fallback
4. **Push Notification**: Send notification to device to restart Termux
5. **Multi-Device**: Support multiple mobile coordinators

## Troubleshooting

### Device Not Found After Scan

1. Verify device is on same network
2. Check if Termux SSH server is running: `sshd`
3. Verify correct port (default: 8022)
4. Try scanning different network prefix

### SSH Config Not Updated

1. Check SSH config file permissions
2. Verify hostname exists in SSH config
3. Check backup file for original settings

### Permission Denied for /etc/hosts

The script requires sudo access to update /etc/hosts. Either:
- Run with sudo
- Manually update /etc/hosts
- Use SSH config only (HostName directive)

## Related Issues

- Issue #875: Pixel Termux自動復旧
- Issue #876: tmuxレイアウト自動最適化
- Issue #877: 障害予測システム
- Issue #878: 自己修復機能
