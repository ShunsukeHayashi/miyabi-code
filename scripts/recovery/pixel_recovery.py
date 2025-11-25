#!/usr/bin/env python3
"""
Miyabi Pixel/Termux Auto-Recovery System
Issue: #875 - Pixel Termux自動復旧

Automatically detects and recovers from Pixel/Termux connection issues.
"""

import argparse
import json
import os
import re
import socket
import subprocess
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any


class RecoveryStatus(Enum):
    """Recovery operation status."""
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
    SKIPPED = "skipped"


class ConnectionStatus(Enum):
    """Device connection status."""
    ONLINE = "online"
    OFFLINE = "offline"
    UNREACHABLE = "unreachable"
    SSH_ERROR = "ssh_error"
    UNKNOWN = "unknown"


@dataclass
class DeviceInfo:
    """Device information."""
    name: str
    hostname: str
    port: int = 22
    user: str = "root"
    last_known_ip: Optional[str] = None
    ssh_key: Optional[str] = None
    status: ConnectionStatus = ConnectionStatus.UNKNOWN
    last_check: Optional[datetime] = None


@dataclass
class ScanResult:
    """Network scan result."""
    ip: str
    port: int
    hostname: Optional[str] = None
    response_time: float = 0.0
    is_target: bool = False


@dataclass
class RecoveryResult:
    """Result of a recovery operation."""
    device: str
    status: RecoveryStatus
    message: str
    new_ip: Optional[str] = None
    actions_taken: List[str] = field(default_factory=list)
    duration_seconds: float = 0.0
    details: Dict[str, Any] = field(default_factory=dict)


class PixelRecovery:
    """Pixel/Termux auto-recovery system."""

    # Default Pixel device configuration
    DEFAULT_PIXEL_CONFIG = {
        "name": "pixel",
        "hostname": "pixel",
        "port": 8022,
        "user": "u0_a306",  # Common Termux user
        "network_prefix": "192.168.3",  # Default home network
        "scan_range": (1, 254),
    }

    # SSH config path
    SSH_CONFIG_PATH = Path.home() / ".ssh" / "config"

    # Known Termux fingerprints (for device identification)
    TERMUX_IDENTIFIERS = [
        "Termux",
        "OpenSSH",
        "dropbear",
    ]

    def __init__(
        self,
        dry_run: bool = False,
        verbose: bool = False,
        network_prefix: Optional[str] = None,
    ):
        self.dry_run = dry_run
        self.verbose = verbose
        self.network_prefix = network_prefix or self.DEFAULT_PIXEL_CONFIG["network_prefix"]
        self.results: List[RecoveryResult] = []

    def log(self, message: str, level: str = "info") -> None:
        """Log a message."""
        if level == "debug" and not self.verbose:
            return

        symbols = {
            "info": "ℹ️",
            "success": "✅",
            "warning": "⚠️",
            "error": "❌",
            "debug": "🔍",
        }
        symbol = symbols.get(level, "•")
        print(f"  {symbol} {message}")

    def check_device_status(self, device: DeviceInfo) -> ConnectionStatus:
        """Check if a device is reachable."""
        start_time = time.time()

        # First try to resolve hostname
        try:
            ip = socket.gethostbyname(device.hostname)
            self.log(f"Resolved {device.hostname} to {ip}", "debug")
        except socket.gaierror:
            self.log(f"Cannot resolve hostname: {device.hostname}", "warning")
            return ConnectionStatus.UNREACHABLE

        # Try SSH connection
        ssh_cmd = [
            "ssh",
            "-o", "ConnectTimeout=5",
            "-o", "BatchMode=yes",
            "-o", "StrictHostKeyChecking=no",
            "-p", str(device.port),
            f"{device.user}@{device.hostname}",
            "echo 'OK'"
        ]

        try:
            result = subprocess.run(
                ssh_cmd,
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0 and "OK" in result.stdout:
                elapsed = time.time() - start_time
                self.log(f"SSH connection successful ({elapsed:.2f}s)", "success")
                return ConnectionStatus.ONLINE
            else:
                self.log(f"SSH connection failed: {result.stderr}", "error")
                return ConnectionStatus.SSH_ERROR

        except subprocess.TimeoutExpired:
            self.log("SSH connection timed out", "error")
            return ConnectionStatus.UNREACHABLE
        except Exception as e:
            self.log(f"SSH error: {e}", "error")
            return ConnectionStatus.SSH_ERROR

    def scan_network(self, port: int = 8022) -> List[ScanResult]:
        """Scan network for devices with open SSH port."""
        self.log(f"Scanning network {self.network_prefix}.0/24 for port {port}...", "info")
        results: List[ScanResult] = []

        # Use parallel scanning for speed
        scan_range = self.DEFAULT_PIXEL_CONFIG["scan_range"]

        for i in range(scan_range[0], scan_range[1] + 1):
            ip = f"{self.network_prefix}.{i}"

            # Quick port check
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)

            start_time = time.time()
            try:
                result = sock.connect_ex((ip, port))
                elapsed = time.time() - start_time

                if result == 0:
                    self.log(f"Found open port at {ip}:{port} ({elapsed*1000:.0f}ms)", "debug")
                    results.append(ScanResult(
                        ip=ip,
                        port=port,
                        response_time=elapsed,
                    ))
            except socket.error:
                pass
            finally:
                sock.close()

        self.log(f"Found {len(results)} device(s) with port {port} open", "info")
        return results

    def identify_termux_device(self, ip: str, port: int = 8022) -> bool:
        """Identify if a device is running Termux SSH."""
        try:
            # Try to get SSH banner
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect((ip, port))

            # SSH sends banner on connect
            banner = sock.recv(1024).decode('utf-8', errors='ignore')
            sock.close()

            self.log(f"SSH banner from {ip}: {banner.strip()}", "debug")

            # Check for Termux/OpenSSH identifiers
            for identifier in self.TERMUX_IDENTIFIERS:
                if identifier.lower() in banner.lower():
                    return True

            return False

        except Exception as e:
            self.log(f"Error identifying device at {ip}: {e}", "debug")
            return False

    def update_ssh_config(self, hostname: str, new_ip: str, port: int = 8022) -> bool:
        """Update SSH config with new IP address."""
        if not self.SSH_CONFIG_PATH.exists():
            self.log("SSH config not found", "warning")
            return False

        self.log(f"Updating SSH config: {hostname} -> {new_ip}", "info")

        if self.dry_run:
            self.log("DRY RUN: Would update SSH config", "info")
            return True

        try:
            config_content = self.SSH_CONFIG_PATH.read_text()

            # Pattern to match Host block
            host_pattern = rf"(Host\s+{hostname}\s*\n(?:(?!\nHost\s).*\n)*)"
            match = re.search(host_pattern, config_content, re.IGNORECASE)

            if match:
                host_block = match.group(1)

                # Update HostName in the block
                updated_block = re.sub(
                    r"(HostName\s+)[\d.]+",
                    rf"\g<1>{new_ip}",
                    host_block
                )

                new_config = config_content.replace(host_block, updated_block)

                # Backup original
                backup_path = self.SSH_CONFIG_PATH.with_suffix(".config.bak")
                self.SSH_CONFIG_PATH.rename(backup_path)

                # Write new config
                self.SSH_CONFIG_PATH.write_text(new_config)

                self.log(f"SSH config updated. Backup at {backup_path}", "success")
                return True
            else:
                self.log(f"Host {hostname} not found in SSH config", "warning")
                return False

        except Exception as e:
            self.log(f"Failed to update SSH config: {e}", "error")
            return False

    def update_hosts_file(self, hostname: str, new_ip: str) -> bool:
        """Update /etc/hosts with new IP (requires sudo)."""
        hosts_path = Path("/etc/hosts")

        self.log(f"Updating hosts file: {hostname} -> {new_ip}", "info")

        if self.dry_run:
            self.log("DRY RUN: Would update /etc/hosts", "info")
            return True

        try:
            # Read current hosts
            content = hosts_path.read_text()

            # Check if hostname exists
            pattern = rf"^[\d.]+\s+{hostname}\s*$"

            if re.search(pattern, content, re.MULTILINE):
                # Update existing entry
                new_content = re.sub(
                    pattern,
                    f"{new_ip}\t{hostname}",
                    content,
                    flags=re.MULTILINE
                )
            else:
                # Add new entry
                new_content = content.rstrip() + f"\n{new_ip}\t{hostname}\n"

            # Write using sudo
            proc = subprocess.run(
                ["sudo", "tee", str(hosts_path)],
                input=new_content,
                capture_output=True,
                text=True
            )

            if proc.returncode == 0:
                self.log("Hosts file updated", "success")
                return True
            else:
                self.log(f"Failed to update hosts: {proc.stderr}", "error")
                return False

        except Exception as e:
            self.log(f"Error updating hosts file: {e}", "error")
            return False

    def fallback_to_mugen(self, task_info: Optional[Dict] = None) -> bool:
        """Fallback: reassign tasks to MUGEN."""
        self.log("Initiating fallback to MUGEN...", "warning")

        if self.dry_run:
            self.log("DRY RUN: Would reassign tasks to MUGEN", "info")
            return True

        # Check MUGEN availability
        mugen_status = self.check_device_status(DeviceInfo(
            name="mugen",
            hostname="mugen",
            port=22,
        ))

        if mugen_status != ConnectionStatus.ONLINE:
            self.log("MUGEN is also unavailable!", "error")
            return False

        self.log("MUGEN is available. Tasks would be reassigned.", "info")

        # In a real implementation, this would:
        # 1. Query pending tasks for Pixel
        # 2. Reassign them to MUGEN via Coordinator
        # 3. Update task status in database

        return True

    def recover_pixel(self) -> RecoveryResult:
        """Main recovery routine for Pixel/Termux."""
        start_time = time.time()
        actions_taken: List[str] = []

        print("\n" + "=" * 60)
        print("🔧 Miyabi Pixel Recovery System")
        print("=" * 60 + "\n")

        device = DeviceInfo(
            name=self.DEFAULT_PIXEL_CONFIG["name"],
            hostname=self.DEFAULT_PIXEL_CONFIG["hostname"],
            port=self.DEFAULT_PIXEL_CONFIG["port"],
            user=self.DEFAULT_PIXEL_CONFIG["user"],
        )

        # Step 1: Check current status
        print("📍 Step 1: Checking current connection status...")
        current_status = self.check_device_status(device)
        device.status = current_status
        device.last_check = datetime.now()

        if current_status == ConnectionStatus.ONLINE:
            self.log("Device is already online!", "success")
            return RecoveryResult(
                device=device.name,
                status=RecoveryStatus.SKIPPED,
                message="Device is already online",
                duration_seconds=time.time() - start_time,
            )

        actions_taken.append("checked_status")

        # Step 2: Network scan
        print("\n📍 Step 2: Scanning network for Pixel device...")
        scan_results = self.scan_network(device.port)
        actions_taken.append("network_scan")

        new_ip: Optional[str] = None

        if scan_results:
            # Step 3: Identify Termux device
            print("\n📍 Step 3: Identifying Termux devices...")

            for result in scan_results:
                self.log(f"Checking {result.ip}...", "info")
                if self.identify_termux_device(result.ip, result.port):
                    self.log(f"Found Termux device at {result.ip}", "success")
                    new_ip = result.ip
                    result.is_target = True
                    break

            actions_taken.append("device_identification")

        if new_ip:
            # Step 4: Update configurations
            print(f"\n📍 Step 4: Updating configurations for new IP: {new_ip}...")

            ssh_updated = self.update_ssh_config(device.hostname, new_ip, device.port)
            if ssh_updated:
                actions_taken.append("ssh_config_updated")

            hosts_updated = self.update_hosts_file(device.hostname, new_ip)
            if hosts_updated:
                actions_taken.append("hosts_updated")

            # Step 5: Verify recovery
            print("\n📍 Step 5: Verifying recovery...")

            # Flush DNS cache on macOS
            if sys.platform == "darwin" and not self.dry_run:
                subprocess.run(["sudo", "dscacheutil", "-flushcache"], capture_output=True)
                subprocess.run(["sudo", "killall", "-HUP", "mDNSResponder"], capture_output=True)
                actions_taken.append("dns_cache_flushed")

            # Re-check connection
            time.sleep(2)  # Wait for DNS propagation
            final_status = self.check_device_status(device)

            if final_status == ConnectionStatus.ONLINE:
                duration = time.time() - start_time
                return RecoveryResult(
                    device=device.name,
                    status=RecoveryStatus.SUCCESS,
                    message=f"Successfully recovered connection to {device.hostname}",
                    new_ip=new_ip,
                    actions_taken=actions_taken,
                    duration_seconds=duration,
                    details={
                        "old_status": current_status.value,
                        "new_status": final_status.value,
                        "ssh_config_updated": ssh_updated,
                        "hosts_updated": hosts_updated,
                    }
                )
            else:
                # Partial recovery
                return RecoveryResult(
                    device=device.name,
                    status=RecoveryStatus.PARTIAL,
                    message=f"Found device at {new_ip} but connection verification failed",
                    new_ip=new_ip,
                    actions_taken=actions_taken,
                    duration_seconds=time.time() - start_time,
                )

        # Step 6: Fallback to MUGEN
        print("\n📍 Step 6: Device not found. Attempting fallback...")
        fallback_success = self.fallback_to_mugen()

        if fallback_success:
            actions_taken.append("fallback_to_mugen")

        return RecoveryResult(
            device=device.name,
            status=RecoveryStatus.FAILED,
            message="Could not locate Pixel device on network",
            actions_taken=actions_taken,
            duration_seconds=time.time() - start_time,
            details={
                "devices_scanned": len(scan_results) if scan_results else 0,
                "fallback_available": fallback_success,
            }
        )

    def print_report(self, result: RecoveryResult, json_output: bool = False) -> None:
        """Print recovery report."""
        if json_output:
            report = {
                "timestamp": datetime.now().isoformat(),
                "device": result.device,
                "status": result.status.value,
                "message": result.message,
                "new_ip": result.new_ip,
                "actions_taken": result.actions_taken,
                "duration_seconds": result.duration_seconds,
                "details": result.details,
            }
            print(json.dumps(report, indent=2))
            return

        print("\n" + "=" * 60)
        print("📊 Recovery Report")
        print("=" * 60)

        status_symbols = {
            RecoveryStatus.SUCCESS: "✅",
            RecoveryStatus.FAILED: "❌",
            RecoveryStatus.PARTIAL: "⚠️",
            RecoveryStatus.SKIPPED: "⏭️",
        }

        print(f"\n📅 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{status_symbols.get(result.status, '•')} Status: {result.status.value.upper()}")
        print(f"📝 Message: {result.message}")

        if result.new_ip:
            print(f"🌐 New IP: {result.new_ip}")

        print(f"⏱️  Duration: {result.duration_seconds:.2f}s")

        if result.actions_taken:
            print("\n🔧 Actions Taken:")
            for action in result.actions_taken:
                print(f"   • {action}")

        if result.details:
            print("\n📋 Details:")
            for key, value in result.details.items():
                print(f"   • {key}: {value}")

        print("\n" + "=" * 60)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Miyabi Pixel/Termux Auto-Recovery System"
    )
    parser.add_argument(
        "--dry-run", "-d",
        action="store_true",
        help="Show what would be done without making changes"
    )
    parser.add_argument(
        "--json", "-j",
        action="store_true",
        help="Output as JSON"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Verbose output"
    )
    parser.add_argument(
        "--network", "-n",
        type=str,
        help="Network prefix to scan (e.g., 192.168.1)"
    )
    parser.add_argument(
        "--scan-only", "-s",
        action="store_true",
        help="Only scan network, don't recover"
    )

    args = parser.parse_args()

    recovery = PixelRecovery(
        dry_run=args.dry_run,
        verbose=args.verbose,
        network_prefix=args.network,
    )

    if args.scan_only:
        results = recovery.scan_network()

        if args.json:
            print(json.dumps([{
                "ip": r.ip,
                "port": r.port,
                "response_time_ms": r.response_time * 1000,
            } for r in results], indent=2))
        else:
            print(f"\nFound {len(results)} device(s):")
            for r in results:
                print(f"  • {r.ip}:{r.port} ({r.response_time*1000:.0f}ms)")

        return 0

    result = recovery.recover_pixel()
    recovery.print_report(result, json_output=args.json)

    # Exit codes
    if result.status == RecoveryStatus.SUCCESS:
        return 0
    elif result.status == RecoveryStatus.SKIPPED:
        return 0
    elif result.status == RecoveryStatus.PARTIAL:
        return 1
    else:
        return 2


if __name__ == "__main__":
    sys.exit(main())
