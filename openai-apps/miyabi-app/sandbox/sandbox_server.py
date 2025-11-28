#!/usr/bin/env python3
"""
Miyabi Sandbox Server
Runs inside Docker container, executes tools in isolated environment
"""

import os
import json
import subprocess
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Miyabi Sandbox Server")

# Workspace root (mounted from host)
WORKSPACE = Path(os.getenv("MIYABI_ROOT", "/workspace"))
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
USER_ID = os.getenv("USER_ID", "unknown")


class ToolRequest(BaseModel):
    tool: str
    arguments: Dict[str, Any] = {}


class ToolResponse(BaseModel):
    content: list
    isError: bool = False


def run_command(cmd: list, cwd: Path = WORKSPACE) -> tuple[str, str, int]:
    """Run a command and return stdout, stderr, returncode"""
    try:
        result = subprocess.run(
            cmd,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
        )
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "", "Command timed out", 1
    except Exception as e:
        return "", str(e), 1


# Tool implementations
async def git_status(args: dict) -> ToolResponse:
    path = args.get("path", str(WORKSPACE))
    stdout, stderr, code = run_command(["git", "status", "--porcelain"], Path(path))
    return ToolResponse(
        content=[{"type": "text", "text": stdout if code == 0 else stderr}],
        isError=code != 0
    )


async def git_log(args: dict) -> ToolResponse:
    path = args.get("path", str(WORKSPACE))
    limit = args.get("limit", 10)
    stdout, stderr, code = run_command(
        ["git", "log", f"-{limit}", "--oneline"],
        Path(path)
    )
    return ToolResponse(
        content=[{"type": "text", "text": stdout if code == 0 else stderr}],
        isError=code != 0
    )


async def read_file(args: dict) -> ToolResponse:
    path = args.get("path", "")
    if not path:
        return ToolResponse(content=[{"type": "text", "text": "Path required"}], isError=True)

    file_path = Path(path)
    if not file_path.is_absolute():
        file_path = WORKSPACE / file_path

    # Security: ensure path is within workspace
    try:
        file_path = file_path.resolve()
        if not str(file_path).startswith(str(WORKSPACE.resolve())):
            return ToolResponse(
                content=[{"type": "text", "text": "Access denied: path outside workspace"}],
                isError=True
            )
    except Exception:
        pass

    if not file_path.exists():
        return ToolResponse(
            content=[{"type": "text", "text": f"File not found: {path}"}],
            isError=True
        )

    try:
        content = file_path.read_text()
        limit = args.get("limit", 1000)
        lines = content.split("\n")[:limit]
        return ToolResponse(content=[{"type": "text", "text": "\n".join(lines)}])
    except Exception as e:
        return ToolResponse(content=[{"type": "text", "text": str(e)}], isError=True)


async def write_file(args: dict) -> ToolResponse:
    path = args.get("path", "")
    content = args.get("content", "")

    if not path:
        return ToolResponse(content=[{"type": "text", "text": "Path required"}], isError=True)

    file_path = Path(path)
    if not file_path.is_absolute():
        file_path = WORKSPACE / file_path

    # Security: ensure path is within workspace
    try:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        resolved = file_path.resolve()
        if not str(resolved).startswith(str(WORKSPACE.resolve())):
            return ToolResponse(
                content=[{"type": "text", "text": "Access denied: path outside workspace"}],
                isError=True
            )
    except Exception:
        pass

    try:
        file_path.write_text(content)
        return ToolResponse(content=[{"type": "text", "text": f"Written to {path}"}])
    except Exception as e:
        return ToolResponse(content=[{"type": "text", "text": str(e)}], isError=True)


async def list_directory(args: dict) -> ToolResponse:
    path = args.get("path", str(WORKSPACE))
    dir_path = Path(path)
    if not dir_path.is_absolute():
        dir_path = WORKSPACE / dir_path

    if not dir_path.exists():
        return ToolResponse(
            content=[{"type": "text", "text": f"Directory not found: {path}"}],
            isError=True
        )

    try:
        entries = []
        for entry in sorted(dir_path.iterdir()):
            entry_type = "dir" if entry.is_dir() else "file"
            entries.append(f"[{entry_type}] {entry.name}")
        return ToolResponse(content=[{"type": "text", "text": "\n".join(entries)}])
    except Exception as e:
        return ToolResponse(content=[{"type": "text", "text": str(e)}], isError=True)


async def cargo_build(args: dict) -> ToolResponse:
    release = args.get("release", False)
    package = args.get("package", "")

    cmd = ["cargo", "build"]
    if release:
        cmd.append("--release")
    if package:
        cmd.extend(["-p", package])

    stdout, stderr, code = run_command(cmd)
    output = stdout + "\n" + stderr
    return ToolResponse(
        content=[{"type": "text", "text": output[:5000]}],
        isError=code != 0
    )


async def cargo_test(args: dict) -> ToolResponse:
    package = args.get("package", "")
    test_name = args.get("test_name", "")

    cmd = ["cargo", "test"]
    if package:
        cmd.extend(["-p", package])
    if test_name:
        cmd.append(test_name)

    stdout, stderr, code = run_command(cmd)
    output = stdout + "\n" + stderr
    return ToolResponse(
        content=[{"type": "text", "text": output[:5000]}],
        isError=code != 0
    )


async def run_bash(args: dict) -> ToolResponse:
    command = args.get("command", "")
    if not command:
        return ToolResponse(content=[{"type": "text", "text": "Command required"}], isError=True)

    # Security: basic command sanitization
    dangerous = ["rm -rf /", "mkfs", "dd if=", ":(){", "chmod -R 777 /"]
    for d in dangerous:
        if d in command:
            return ToolResponse(
                content=[{"type": "text", "text": f"Dangerous command blocked: {d}"}],
                isError=True
            )

    stdout, stderr, code = run_command(["bash", "-c", command])
    output = stdout + stderr
    return ToolResponse(
        content=[{"type": "text", "text": output[:5000]}],
        isError=code != 0
    )


# Tool registry
TOOLS = {
    "git_status": git_status,
    "git_log": git_log,
    "read_file": read_file,
    "write_file": write_file,
    "list_directory": list_directory,
    "cargo_build": cargo_build,
    "cargo_test": cargo_test,
    "run_command": run_bash,
}


@app.get("/health")
async def health():
    return {"status": "ok", "user_id": USER_ID, "workspace": str(WORKSPACE)}


@app.post("/execute")
async def execute_tool(request: ToolRequest) -> ToolResponse:
    """Execute a tool in the sandbox"""
    tool_name = request.tool
    arguments = request.arguments

    if tool_name not in TOOLS:
        return ToolResponse(
            content=[{"type": "text", "text": f"Unknown tool: {tool_name}"}],
            isError=True
        )

    try:
        result = await TOOLS[tool_name](arguments)
        return result
    except Exception as e:
        return ToolResponse(
            content=[{"type": "text", "text": f"Tool error: {str(e)}"}],
            isError=True
        )


@app.get("/workspace/info")
async def workspace_info():
    """Get workspace information"""
    return {
        "workspace": str(WORKSPACE),
        "exists": WORKSPACE.exists(),
        "user_id": USER_ID,
        "has_git": (WORKSPACE / ".git").exists(),
    }


if __name__ == "__main__":
    print(f"Starting Miyabi Sandbox Server")
    print(f"  User: {USER_ID}")
    print(f"  Workspace: {WORKSPACE}")
    uvicorn.run(app, host="0.0.0.0", port=8080)
