#!/usr/bin/env python3
"""Export tmux orchestration status for Miyabi Desktop integration."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SESSION = "miyabi-refactor"
DEFAULT_OUTPUT = REPO_ROOT / ".ai" / "orchestra" / "desktop-feed.json"
PANE_MAP_PATH = REPO_ROOT / ".ai" / "orchestra" / "pane-map.json"
SKILL_PROXY_DIR = REPO_ROOT / ".ai" / "skill-proxy"
SKILL_PROXY_LOG = SKILL_PROXY_DIR / "skill-proxy.log"
WATCHDOG_SCRIPT = REPO_ROOT / "scripts" / "miyabi-relay-watchdog.sh"

TMUX_PANE_FORMAT = (
    "#{pane_id}\t#{pane_title}\t#{pane_current_command}\t#{pane_active}"
    "\t#{pane_width}\t#{pane_height}\t#{pane_current_path}"
)

RECENT_LINES = 40


def capture_recent_lines(pane_id: str, lines: int = RECENT_LINES) -> List[str]:
    try:
        output = run_cmd([
            "tmux",
            "capture-pane",
            "-t",
            pane_id,
            "-p",
            "-S",
            f"-{lines}",
        ]).stdout
    except subprocess.CalledProcessError:
        return []

    recent = [line.rstrip() for line in output.splitlines()]
    return recent[-lines:]


class ExportError(Exception):
    pass


def run_cmd(cmd: List[str], check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=check, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def tmux_available() -> bool:
    return subprocess.run(["tmux", "-V"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0


def collect_panes(session: str) -> List[Dict[str, Any]]:
    try:
        output = run_cmd(["tmux", "list-panes", "-t", session, "-F", TMUX_PANE_FORMAT]).stdout
    except subprocess.CalledProcessError as exc:
        raise ExportError(f"tmux list-panes failed: {exc.stderr.strip() or exc}") from exc

    panes: List[Dict[str, Any]] = []
    for line in output.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) != 7:
            raise ExportError(f"Unexpected tmux list-panes format: {line}")
        pane_id, title, command, active, width, height, path = parts
        recent_lines = capture_recent_lines(pane_id)
        panes.append(
            {
                "pane_id": pane_id,
                "title": title,
                "current_command": command,
                "active": active == "1",
                "width": int(width),
                "height": int(height),
                "current_path": path,
                "recent_output": recent_lines,
            }
        )
    return panes


def load_pane_map() -> Dict[str, Any]:
    if not PANE_MAP_PATH.exists():
        return {}
    try:
        return json.loads(PANE_MAP_PATH.read_text())
    except json.JSONDecodeError as exc:
        raise ExportError(f"Failed to parse pane map {PANE_MAP_PATH}: {exc}") from exc


def collect_relay(session: str) -> Dict[str, Any]:
    if not WATCHDOG_SCRIPT.exists():
        return {"patterns": [], "summary": {"missing_count": 0, "missing_patterns": []}}
    try:
        proc = run_cmd([str(WATCHDOG_SCRIPT), "--session", session, "--json"], check=False)
    except Exception as exc:  # noqa: BLE001
        raise ExportError(f"Failed to execute relay watchdog: {exc}") from exc
    if proc.returncode != 0:
        raise ExportError(f"Relay watchdog failed: {proc.stderr.strip() or proc.stdout.strip()}")
    try:
        data = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise ExportError(f"Invalid JSON from relay watchdog: {exc}\nOutput: {proc.stdout}") from exc

    patterns = data.get("patterns", [])
    missing = [item for item in patterns if not item.get("found")]
    data["summary"] = {
        "missing_count": len(missing),
        "missing_patterns": missing,
    }
    return data


def collect_skill_proxy() -> Dict[str, Any]:
    info: Dict[str, Any] = {
        "log_file": str(SKILL_PROXY_LOG),
        "recent_log": [],
        "active": False,
    }

    if SKILL_PROXY_LOG.exists():
        lines = SKILL_PROXY_LOG.read_text(errors="replace").splitlines()
        last_lines = lines[-40:]
        info["recent_log"] = last_lines
        # Parse timestamp from last log line if possible
        for line in reversed(last_lines):
            if line.startswith("[") and "]" in line:
                ts_str = line.split("]", 1)[0].lstrip("[")
                try:
                    ts = dt.datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
                    age = dt.datetime.now() - ts
                    info["active"] = age.total_seconds() < 600  # 10 minutes
                except ValueError:
                    pass
                break

    # Track executed commands metadata by scanning state files (sha1 filenames)
    if SKILL_PROXY_DIR.exists():
        entries = sorted(SKILL_PROXY_DIR.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True)
        recent_execs: List[Dict[str, Any]] = []
        for entry in entries:
            if entry.name.endswith(".log"):
                continue
            if not entry.is_file():
                continue
            try:
                content = entry.read_text()
            except OSError:
                continue
            record: Dict[str, Any] = {}
            for line in content.splitlines():
                if line.startswith("pane="):
                    record["pane_id"] = line.partition("=")[2]
                elif line.startswith("cmd="):
                    record["command"] = line.partition("=")[2]
                elif line.startswith("timestamp="):
                    record["timestamp"] = line.partition("=")[2]
            if record:
                recent_execs.append(record)
            if len(recent_execs) >= 20:
                break
        info["recent_executions"] = recent_execs
    else:
        info["recent_executions"] = []

    return info


def export_status(session: str, output: Path) -> Dict[str, Any]:
    if not tmux_available():
        raise ExportError("tmux is not installed or not available in PATH")

    if subprocess.run(["tmux", "has-session", "-t", session], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode != 0:
        raise ExportError(f"session '{session}' does not exist")

    panes = collect_panes(session)
    pane_map = load_pane_map()
    relay = collect_relay(session)
    skill_proxy = collect_skill_proxy()

    payload = {
        "session": session,
        "updated_at": dt.datetime.utcnow().isoformat() + "Z",
        "pane_map": pane_map,
        "panes": panes,
        "relay": relay,
        "skill_proxy": skill_proxy,
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Export tmux orchestration status for Miyabi Desktop")
    parser.add_argument("--session", default=DEFAULT_SESSION, help="tmux session name (default: %(default)s)")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="output JSON path")
    args = parser.parse_args()

    try:
        payload = export_status(args.session, Path(args.output))
    except ExportError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"Unexpected error: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
