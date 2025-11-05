#!/usr/bin/env python3
"""
Agent timeline summarizer CLI.

Reads the default daily log `logs/<YYYY-MM-DD>.md` and aggregates agent
completion events within a configurable time window.
"""

from __future__ import annotations

import argparse
import datetime as dt
import pathlib
import re
import sys
from collections import defaultdict
from typing import Dict, List, Tuple

COMPLETION_PATTERN = re.compile(
    r"^\s*### \[(?P<ts>[^\]]+)\]\s+✅ Agent (?P<agent>.+?) completed task (?P<task>.+?)\s*$"
)
LOG_FILENAME_PATTERN = re.compile(r"\d{4}-\d{2}-\d{2}\.md$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Summarize agent completion events from the daily log file "
            "within a trailing time window."
        )
    )
    parser.add_argument(
        "--window-minutes",
        type=int,
        default=10,
        help="Number of minutes to include in the trailing window (default: 10).",
    )
    parser.add_argument(
        "--logs-dir",
        default="logs",
        help="Directory containing daily log files (default: logs).",
    )
    parser.add_argument(
        "--date",
        default=None,
        help="Override the date (YYYY-MM-DD) used for the log filename. Defaults to today.",
    )
    parser.add_argument(
        "--reference-time",
        default=None,
        help=(
            "Override the reference timestamp (ISO 8601) for the window end. "
            "Defaults to the current UTC time."
        ),
    )
    return parser.parse_args()


def determine_reference_time(reference_time_arg: str | None) -> dt.datetime:
    if reference_time_arg:
        try:
            ref_time = dt.datetime.fromisoformat(reference_time_arg)
        except ValueError as exc:
            raise SystemExit(f"Invalid --reference-time value: {exc}") from exc
        if ref_time.tzinfo is None:
            ref_time = ref_time.replace(tzinfo=dt.timezone.utc)
        return ref_time

    return dt.datetime.now(dt.timezone.utc)


def determine_log_path(logs_dir: str, date_override: str | None) -> pathlib.Path:
    logs_dir_path = pathlib.Path(logs_dir)

    if date_override:
        try:
            log_date = dt.date.fromisoformat(date_override)
        except ValueError as exc:
            raise SystemExit(f"Invalid --date value: {exc}") from exc
        return logs_dir_path / f"{log_date.isoformat()}.md"

    log_date = dt.datetime.now(dt.timezone.utc).date()
    candidate = logs_dir_path / f"{log_date.isoformat()}.md"
    if candidate.exists():
        return candidate

    available_logs = sorted(
        (
            path
            for path in logs_dir_path.glob("*.md")
            if LOG_FILENAME_PATTERN.match(path.name)
        ),
        reverse=True,
    )
    if available_logs:
        return available_logs[0]

    return candidate


def parse_log(
    log_path: pathlib.Path, window_start: dt.datetime, window_end: dt.datetime
) -> Dict[str, List[Tuple[dt.datetime, str]]]:
    per_agent: Dict[str, List[Tuple[dt.datetime, str]]] = defaultdict(list)

    lines = log_path.read_text(encoding="utf-8").splitlines()

    for line in lines:
        match = COMPLETION_PATTERN.match(line)
        if not match:
            continue

        try:
            ts = dt.datetime.fromisoformat(match.group("ts"))
        except ValueError:
            # Skip malformed timestamps instead of aborting the summary.
            continue

        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=dt.timezone.utc)

        if ts < window_start or ts > window_end:
            continue

        agent = match.group("agent").strip()
        task_id = match.group("task").strip()
        per_agent[agent].append((ts, task_id))

    return per_agent


def format_summary(
    per_agent: Dict[str, List[Tuple[dt.datetime, str]]], window_start: dt.datetime, reference_time: dt.datetime
) -> str:
    if not per_agent:
        start_iso = window_start.isoformat()
        end_iso = reference_time.isoformat()
        return f"対象期間内に完了イベントはありません ({start_iso} 〜 {end_iso}, 0件)"

    lines = []
    for agent in sorted(per_agent.keys()):
        events = sorted(per_agent[agent], key=lambda item: item[0], reverse=True)
        tasks = ", ".join(task for _, task in events)
        lines.append(f"{agent}: {tasks} ({len(events)}件完了)")

    return " | ".join(lines)


def main() -> None:
    args = parse_args()
    if args.window_minutes <= 0:
        raise SystemExit("--window-minutes must be a positive integer.")

    reference_time = determine_reference_time(args.reference_time)
    window_delta = dt.timedelta(minutes=args.window_minutes)
    window_start = reference_time - window_delta

    log_path = determine_log_path(args.logs_dir, args.date)
    if not log_path.exists():
        print(f"ログファイル未検出: {log_path}")
        return

    per_agent = parse_log(log_path, window_start, reference_time)
    summary = format_summary(per_agent, window_start, reference_time)
    print(summary)


if __name__ == "__main__":
    try:
        main()
    except SystemExit as exc:
        print(exc, file=sys.stderr)
        sys.exit(1 if exc.code is None else exc.code)
