#!/usr/bin/env python3
"""
Miyabi Self-Healing System

Issue: #878 - 自己修復機能

This script automatically detects and repairs common issues in the Miyabi system,
minimizing the need for human intervention.

Features:
- Automatic repair of common issues
- Coordinator failover
- Task retry automation
- Rollback capabilities
"""

import argparse
import json
import os
import subprocess
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Optional


class HealingAction(Enum):
    """Types of healing actions"""
    CLEANUP_DISK = "cleanup_disk"
    CLEANUP_WORKTREES = "cleanup_worktrees"
    KILL_ZOMBIES = "kill_zombies"
    RESTART_PROCESS = "restart_process"
    CLEAR_CACHE = "clear_cache"
    FIX_GIT_LOCKS = "fix_git_locks"
    PRUNE_LOGS = "prune_logs"
    RESET_SSH = "reset_ssh"
    COMPACT_DB = "compact_db"
    NONE = "none"


class HealingStatus(Enum):
    """Status of a healing attempt"""
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"
    PARTIAL = "partial"


@dataclass
class Issue:
    """Represents a detected issue"""
    name: str
    description: str
    severity: str  # low, medium, high, critical
    detected_at: datetime
    metric_value: Optional[float] = None
    threshold: Optional[float] = None


@dataclass
class HealingResult:
    """Result of a healing action"""
    action: HealingAction
    status: HealingStatus
    issue: Issue
    message: str
    started_at: datetime
    completed_at: datetime
    details: dict[str, Any] = field(default_factory=dict)


@dataclass
class HealingReport:
    """Complete healing report"""
    timestamp: datetime
    issues_detected: list[Issue]
    actions_taken: list[HealingResult]
    overall_success: bool
    summary: str


class IssueDetector:
    """Detects issues in the system"""

    def detect_all_issues(self) -> list[Issue]:
        """Detect all issues"""
        issues = []

        # Check disk space
        disk_issue = self._check_disk_space()
        if disk_issue:
            issues.append(disk_issue)

        # Check worktrees
        worktree_issue = self._check_worktrees()
        if worktree_issue:
            issues.append(worktree_issue)

        # Check zombie processes
        zombie_issue = self._check_zombie_processes()
        if zombie_issue:
            issues.append(zombie_issue)

        # Check git locks
        git_lock_issue = self._check_git_locks()
        if git_lock_issue:
            issues.append(git_lock_issue)

        # Check log files
        log_issue = self._check_log_files()
        if log_issue:
            issues.append(log_issue)

        # Check memory
        memory_issue = self._check_memory()
        if memory_issue:
            issues.append(memory_issue)

        return issues

    def _check_disk_space(self) -> Optional[Issue]:
        """Check if disk space is low"""
        try:
            result = subprocess.run(
                ["df", "-h", "/"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) >= 2:
                    parts = lines[1].split()
                    if len(parts) >= 5:
                        usage = float(parts[4].rstrip('%'))
                        if usage >= 90:
                            return Issue(
                                name="disk_space_critical",
                                description=f"Disk usage is {usage}%",
                                severity="critical" if usage >= 95 else "high",
                                detected_at=datetime.now(),
                                metric_value=usage,
                                threshold=90
                            )
        except Exception:
            pass
        return None

    def _check_worktrees(self) -> Optional[Issue]:
        """Check if too many worktrees exist"""
        try:
            result = subprocess.run(
                ["git", "worktree", "list"],
                capture_output=True,
                text=True,
                cwd=os.getcwd()
            )
            if result.returncode == 0:
                count = len(result.stdout.strip().split('\n'))
                if count >= 15:
                    return Issue(
                        name="excessive_worktrees",
                        description=f"Found {count} git worktrees",
                        severity="high" if count >= 20 else "medium",
                        detected_at=datetime.now(),
                        metric_value=float(count),
                        threshold=15
                    )
        except Exception:
            pass
        return None

    def _check_zombie_processes(self) -> Optional[Issue]:
        """Check for zombie processes"""
        try:
            result = subprocess.run(
                ["ps", "aux"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                zombie_count = result.stdout.count(' Z ')
                if zombie_count >= 5:
                    return Issue(
                        name="zombie_processes",
                        description=f"Found {zombie_count} zombie processes",
                        severity="medium",
                        detected_at=datetime.now(),
                        metric_value=float(zombie_count),
                        threshold=5
                    )
        except Exception:
            pass
        return None

    def _check_git_locks(self) -> Optional[Issue]:
        """Check for stale git lock files"""
        try:
            lock_file = Path(os.getcwd()) / ".git" / "index.lock"
            if lock_file.exists():
                # Check if lock is stale (older than 10 minutes)
                age_seconds = time.time() - lock_file.stat().st_mtime
                if age_seconds > 600:  # 10 minutes
                    return Issue(
                        name="stale_git_lock",
                        description="Found stale .git/index.lock file",
                        severity="medium",
                        detected_at=datetime.now(),
                        metric_value=age_seconds,
                        threshold=600
                    )
        except Exception:
            pass
        return None

    def _check_log_files(self) -> Optional[Issue]:
        """Check if log files are too large"""
        try:
            total_size = 0
            log_patterns = ["/tmp/miyabi*.log", "/tmp/miyabi-*.log"]
            for pattern in log_patterns:
                result = subprocess.run(
                    f"du -c {pattern} 2>/dev/null | tail -1 | cut -f1",
                    shell=True,
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0 and result.stdout.strip():
                    try:
                        total_size += int(result.stdout.strip())
                    except ValueError:
                        pass

            # If total log size > 500MB
            if total_size > 500000:  # in KB
                return Issue(
                    name="large_log_files",
                    description=f"Log files total {total_size/1000:.0f}MB",
                    severity="medium",
                    detected_at=datetime.now(),
                    metric_value=float(total_size),
                    threshold=500000
                )
        except Exception:
            pass
        return None

    def _check_memory(self) -> Optional[Issue]:
        """Check memory usage"""
        try:
            result = subprocess.run(
                ["vm_stat"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                stats = {}
                for line in lines[1:]:
                    if ':' in line:
                        key, value = line.split(':')
                        value = value.strip().rstrip('.')
                        try:
                            stats[key.strip()] = int(value)
                        except ValueError:
                            pass

                pages_free = stats.get('Pages free', 0)
                pages_active = stats.get('Pages active', 0)
                pages_inactive = stats.get('Pages inactive', 0)
                pages_wired = stats.get('Pages wired down', 0)

                total_pages = pages_free + pages_active + pages_inactive + pages_wired
                if total_pages > 0:
                    used_pages = pages_active + pages_wired
                    memory_percent = (used_pages / total_pages) * 100
                    if memory_percent >= 90:
                        return Issue(
                            name="high_memory_usage",
                            description=f"Memory usage is {memory_percent:.1f}%",
                            severity="critical" if memory_percent >= 95 else "high",
                            detected_at=datetime.now(),
                            metric_value=memory_percent,
                            threshold=90
                        )
        except Exception:
            pass
        return None


class SelfHealer:
    """Performs self-healing actions"""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.detector = IssueDetector()

        # Map issues to healing actions
        self.healing_map: dict[str, HealingAction] = {
            "disk_space_critical": HealingAction.CLEANUP_DISK,
            "excessive_worktrees": HealingAction.CLEANUP_WORKTREES,
            "zombie_processes": HealingAction.KILL_ZOMBIES,
            "stale_git_lock": HealingAction.FIX_GIT_LOCKS,
            "large_log_files": HealingAction.PRUNE_LOGS,
            "high_memory_usage": HealingAction.CLEAR_CACHE,
        }

        # Map actions to repair functions
        self.repair_functions: dict[HealingAction, Callable[[Issue], HealingResult]] = {
            HealingAction.CLEANUP_DISK: self._cleanup_disk,
            HealingAction.CLEANUP_WORKTREES: self._cleanup_worktrees,
            HealingAction.KILL_ZOMBIES: self._kill_zombies,
            HealingAction.FIX_GIT_LOCKS: self._fix_git_locks,
            HealingAction.PRUNE_LOGS: self._prune_logs,
            HealingAction.CLEAR_CACHE: self._clear_cache,
        }

    def heal(self) -> HealingReport:
        """Detect and heal all issues"""
        timestamp = datetime.now()

        # Detect issues
        issues = self.detector.detect_all_issues()

        # Perform healing
        results = []
        for issue in issues:
            action = self.healing_map.get(issue.name, HealingAction.NONE)
            if action != HealingAction.NONE:
                repair_func = self.repair_functions.get(action)
                if repair_func:
                    result = repair_func(issue)
                    results.append(result)

        # Determine overall success
        overall_success = all(
            r.status in [HealingStatus.SUCCESS, HealingStatus.SKIPPED]
            for r in results
        ) if results else True

        # Generate summary
        if not issues:
            summary = "No issues detected. System is healthy."
        elif overall_success:
            summary = f"Successfully healed {len(results)} issue(s)."
        else:
            failed = sum(1 for r in results if r.status == HealingStatus.FAILED)
            summary = f"Healed {len(results) - failed}/{len(results)} issues. {failed} failed."

        return HealingReport(
            timestamp=timestamp,
            issues_detected=issues,
            actions_taken=results,
            overall_success=overall_success,
            summary=summary
        )

    def _run_command(self, cmd: list[str], shell: bool = False) -> tuple[int, str, str]:
        """Run a command, respecting dry_run mode"""
        if self.dry_run:
            return 0, f"[DRY RUN] Would execute: {cmd if not shell else cmd}", ""

        try:
            if shell:
                result = subprocess.run(
                    cmd if isinstance(cmd, str) else ' '.join(cmd),
                    shell=True,
                    capture_output=True,
                    text=True
                )
            else:
                result = subprocess.run(cmd, capture_output=True, text=True)
            return result.returncode, result.stdout, result.stderr
        except Exception as e:
            return 1, "", str(e)

    def _cleanup_disk(self, issue: Issue) -> HealingResult:
        """Clean up disk space"""
        started_at = datetime.now()
        details = {}

        # Clean various caches and temporary files
        cleanup_commands = [
            # Clean macOS caches
            ["rm", "-rf", os.path.expanduser("~/Library/Caches/*")],
            # Clean npm cache
            ["npm", "cache", "clean", "--force"],
            # Clean cargo cache
            ["cargo", "cache", "-a"],
            # Clean old downloads
            ["find", os.path.expanduser("~/Downloads"), "-mtime", "+30", "-delete"],
        ]

        success_count = 0
        for cmd in cleanup_commands:
            try:
                code, out, err = self._run_command(cmd, shell=True)
                if code == 0:
                    success_count += 1
            except Exception:
                pass

        details["commands_run"] = len(cleanup_commands)
        details["commands_succeeded"] = success_count

        status = HealingStatus.SUCCESS if success_count > 0 else HealingStatus.FAILED
        message = f"Cleaned disk space ({success_count}/{len(cleanup_commands)} operations succeeded)"

        return HealingResult(
            action=HealingAction.CLEANUP_DISK,
            status=status,
            issue=issue,
            message=message,
            started_at=started_at,
            completed_at=datetime.now(),
            details=details
        )

    def _cleanup_worktrees(self, issue: Issue) -> HealingResult:
        """Clean up old git worktrees"""
        started_at = datetime.now()
        details = {}

        # Get list of worktrees
        code, out, err = self._run_command(["git", "worktree", "list", "--porcelain"])
        if code != 0:
            return HealingResult(
                action=HealingAction.CLEANUP_WORKTREES,
                status=HealingStatus.FAILED,
                issue=issue,
                message=f"Failed to list worktrees: {err}",
                started_at=started_at,
                completed_at=datetime.now(),
                details={"error": err}
            )

        # Prune stale worktrees
        code, out, err = self._run_command(["git", "worktree", "prune"])
        if code == 0:
            details["pruned"] = True
        else:
            details["prune_error"] = err

        # Try to remove merged worktrees
        worktrees_dir = Path(os.getcwd()) / ".worktrees"
        removed_count = 0
        if worktrees_dir.exists():
            for wt in worktrees_dir.iterdir():
                if wt.is_dir():
                    # Check if the branch is merged
                    branch_name = wt.name.replace("issue-", "feature/")
                    code, out, err = self._run_command(
                        ["git", "branch", "--merged", "main"],
                    )
                    if branch_name in out:
                        # Safe to remove
                        code, out, err = self._run_command(
                            ["git", "worktree", "remove", str(wt), "--force"]
                        )
                        if code == 0:
                            removed_count += 1

        details["worktrees_removed"] = removed_count

        status = HealingStatus.SUCCESS if removed_count > 0 or details.get("pruned") else HealingStatus.PARTIAL
        message = f"Cleaned {removed_count} worktrees, pruned stale references"

        return HealingResult(
            action=HealingAction.CLEANUP_WORKTREES,
            status=status,
            issue=issue,
            message=message,
            started_at=started_at,
            completed_at=datetime.now(),
            details=details
        )

    def _kill_zombies(self, issue: Issue) -> HealingResult:
        """Kill zombie processes"""
        started_at = datetime.now()
        details = {}

        # Find zombie processes
        code, out, err = self._run_command(
            "ps aux | awk '$8 ~ /Z/ { print $2 }'",
            shell=True
        )

        if code != 0:
            return HealingResult(
                action=HealingAction.KILL_ZOMBIES,
                status=HealingStatus.FAILED,
                issue=issue,
                message=f"Failed to find zombie processes: {err}",
                started_at=started_at,
                completed_at=datetime.now(),
                details={"error": err}
            )

        pids = [p.strip() for p in out.strip().split('\n') if p.strip()]
        details["zombies_found"] = len(pids)

        killed_count = 0
        for pid in pids:
            # Kill parent process of zombie
            code, parent_out, err = self._run_command(
                f"ps -o ppid= -p {pid}",
                shell=True
            )
            if code == 0 and parent_out.strip():
                parent_pid = parent_out.strip()
                code, out, err = self._run_command(["kill", "-9", parent_pid])
                if code == 0:
                    killed_count += 1

        details["zombies_killed"] = killed_count

        status = HealingStatus.SUCCESS if killed_count > 0 else HealingStatus.SKIPPED
        message = f"Killed {killed_count}/{len(pids)} zombie processes"

        return HealingResult(
            action=HealingAction.KILL_ZOMBIES,
            status=status,
            issue=issue,
            message=message,
            started_at=started_at,
            completed_at=datetime.now(),
            details=details
        )

    def _fix_git_locks(self, issue: Issue) -> HealingResult:
        """Remove stale git lock files"""
        started_at = datetime.now()
        details = {}

        lock_file = Path(os.getcwd()) / ".git" / "index.lock"

        if not lock_file.exists():
            return HealingResult(
                action=HealingAction.FIX_GIT_LOCKS,
                status=HealingStatus.SKIPPED,
                issue=issue,
                message="Lock file no longer exists",
                started_at=started_at,
                completed_at=datetime.now(),
                details={}
            )

        # Remove lock file
        code, out, err = self._run_command(["rm", "-f", str(lock_file)])

        if code == 0:
            status = HealingStatus.SUCCESS
            message = "Removed stale git lock file"
        else:
            status = HealingStatus.FAILED
            message = f"Failed to remove lock file: {err}"
            details["error"] = err

        return HealingResult(
            action=HealingAction.FIX_GIT_LOCKS,
            status=status,
            issue=issue,
            message=message,
            started_at=started_at,
            completed_at=datetime.now(),
            details=details
        )

    def _prune_logs(self, issue: Issue) -> HealingResult:
        """Clean up old log files"""
        started_at = datetime.now()
        details = {}

        # Patterns for Miyabi log files
        log_patterns = [
            "/tmp/miyabi*.log",
            "/tmp/miyabi-*.log",
        ]

        removed_count = 0
        freed_space = 0

        for pattern in log_patterns:
            # Get size before
            code, out, err = self._run_command(
                f"du -c {pattern} 2>/dev/null | tail -1 | cut -f1",
                shell=True
            )
            if code == 0 and out.strip():
                try:
                    freed_space += int(out.strip())
                except ValueError:
                    pass

            # Remove old log files (older than 1 day)
            code, out, err = self._run_command(
                f"find /tmp -name 'miyabi*.log' -mtime +1 -delete 2>/dev/null",
                shell=True
            )

            # Truncate current log files to last 1000 lines
            code, out, err = self._run_command(
                f"for f in {pattern}; do [ -f \"$f\" ] && tail -1000 \"$f\" > \"$f.tmp\" && mv \"$f.tmp\" \"$f\"; done 2>/dev/null",
                shell=True
            )

            removed_count += 1

        details["patterns_processed"] = len(log_patterns)
        details["space_freed_kb"] = freed_space

        status = HealingStatus.SUCCESS
        message = f"Pruned log files, freed approximately {freed_space/1000:.1f}MB"

        return HealingResult(
            action=HealingAction.PRUNE_LOGS,
            status=status,
            issue=issue,
            message=message,
            started_at=started_at,
            completed_at=datetime.now(),
            details=details
        )

    def _clear_cache(self, issue: Issue) -> HealingResult:
        """Clear various caches to free memory"""
        started_at = datetime.now()
        details = {}

        # Commands to clear caches
        cache_commands = [
            # Clear macOS memory cache
            ["sudo", "purge"],
            # Clear npm cache
            ["npm", "cache", "clean", "--force"],
        ]

        success_count = 0
        for cmd in cache_commands:
            try:
                # Skip sudo commands in non-interactive mode
                if cmd[0] == "sudo":
                    continue
                code, out, err = self._run_command(cmd)
                if code == 0:
                    success_count += 1
            except Exception:
                pass

        details["caches_cleared"] = success_count

        status = HealingStatus.SUCCESS if success_count > 0 else HealingStatus.PARTIAL
        message = f"Cleared {success_count} cache(s) to free memory"

        return HealingResult(
            action=HealingAction.CLEAR_CACHE,
            status=status,
            issue=issue,
            message=message,
            started_at=started_at,
            completed_at=datetime.now(),
            details=details
        )


def print_report(report: HealingReport, json_output: bool = False):
    """Print the healing report"""
    if json_output:
        output = {
            "timestamp": report.timestamp.isoformat(),
            "overall_success": report.overall_success,
            "summary": report.summary,
            "issues_detected": [
                {
                    "name": issue.name,
                    "description": issue.description,
                    "severity": issue.severity,
                    "metric_value": issue.metric_value,
                    "threshold": issue.threshold
                }
                for issue in report.issues_detected
            ],
            "actions_taken": [
                {
                    "action": result.action.value,
                    "status": result.status.value,
                    "message": result.message,
                    "duration_seconds": (result.completed_at - result.started_at).total_seconds(),
                    "details": result.details
                }
                for result in report.actions_taken
            ]
        }
        print(json.dumps(output, indent=2))
        return

    # Status emoji mapping
    status_emoji = {
        HealingStatus.SUCCESS: "✅",
        HealingStatus.FAILED: "❌",
        HealingStatus.SKIPPED: "⏭️",
        HealingStatus.PARTIAL: "⚠️"
    }

    severity_emoji = {
        "low": "🟢",
        "medium": "🟡",
        "high": "🟠",
        "critical": "🔴"
    }

    print()
    print("=" * 60)
    print("🔧 Miyabi Self-Healing Report")
    print("=" * 60)
    print()
    print(f"📅 Timestamp: {report.timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'✅' if report.overall_success else '❌'} Overall: {'Success' if report.overall_success else 'Issues remain'}")
    print(f"📝 Summary: {report.summary}")
    print()

    # Issues Detected
    if report.issues_detected:
        print("🔍 Issues Detected:")
        print("-" * 40)
        for issue in report.issues_detected:
            emoji = severity_emoji.get(issue.severity, "❓")
            print(f"  {emoji} {issue.name}")
            print(f"     {issue.description}")
            if issue.metric_value is not None:
                print(f"     Value: {issue.metric_value:.1f} (threshold: {issue.threshold})")
        print()

    # Actions Taken
    if report.actions_taken:
        print("🔧 Actions Taken:")
        print("-" * 40)
        for result in report.actions_taken:
            emoji = status_emoji.get(result.status, "❓")
            duration = (result.completed_at - result.started_at).total_seconds()
            print(f"  {emoji} {result.action.value}")
            print(f"     {result.message}")
            print(f"     Duration: {duration:.2f}s")
            if result.details:
                for key, value in result.details.items():
                    if key not in ["error"]:
                        print(f"     {key}: {value}")
        print()

    # Final message
    if report.overall_success and not report.issues_detected:
        print("🎉 System is healthy! No healing required.")
    elif report.overall_success:
        print("✅ All issues have been addressed successfully!")
    else:
        print("⚠️  Some issues could not be fully resolved.")
        print("   Please review the report and take manual action if needed.")

    print()
    print("=" * 60)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Miyabi Self-Healing System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run self-healing
  python3 self_healer.py

  # Dry run (no changes made)
  python3 self_healer.py --dry-run

  # JSON output
  python3 self_healer.py --json

  # Watch mode
  python3 self_healer.py --watch --interval 300
"""
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON"
    )
    parser.add_argument(
        "--watch",
        action="store_true",
        help="Continuous monitoring and healing mode"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=300,
        help="Interval between checks in watch mode (seconds, default: 300)"
    )

    args = parser.parse_args()

    healer = SelfHealer(dry_run=args.dry_run)

    if args.watch:
        print(f"Starting self-healing watch mode (interval: {args.interval}s)")
        print("Press Ctrl+C to stop")
        print()

        try:
            while True:
                report = healer.heal()
                print_report(report, args.json)

                if not report.overall_success:
                    # Heal more frequently when issues detected
                    time.sleep(min(args.interval, 60))
                else:
                    time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nWatch mode stopped.")
    else:
        report = healer.heal()
        print_report(report, args.json)

        # Exit with appropriate code
        if not report.overall_success:
            sys.exit(1)
        sys.exit(0)


if __name__ == "__main__":
    main()
