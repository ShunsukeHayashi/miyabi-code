#!/usr/bin/env python3
"""
Miyabi Task Execution API
Phase 2: ChatGPT -> Miyabi Task Auto-Execution Pipeline

Endpoints:
- POST /tasks - Create and queue a new task
- GET /tasks/{task_id} - Get task status
- GET /tasks - List recent tasks
- POST /tasks/{task_id}/cancel - Cancel a running task
"""

import os
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List
from enum import Enum

from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/tasks", tags=["Task Execution"])

# In-memory task storage (production: use Redis/DB)
tasks_store: Dict[str, Dict[str, Any]] = {}


class TaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentType(str, Enum):
    COORDINATOR = "coordinator"
    CODEGEN = "codegen"
    REVIEW = "review"
    ISSUE = "issue"
    PR = "pr"
    DEPLOY = "deploy"


class CreateTaskRequest(BaseModel):
    """Request to create a new task"""
    instruction: str = Field(..., description="Natural language task instruction")
    repository: Optional[str] = Field(None, description="Target repository (owner/repo)")
    agent: Optional[AgentType] = Field(None, description="Specific agent to use")
    issue_number: Optional[int] = Field(None, description="Related GitHub issue number")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional options")


class TaskResponse(BaseModel):
    """Task status response"""
    task_id: str
    status: TaskStatus
    instruction: str
    agent: Optional[str] = None
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    progress: int = 0
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class TaskListResponse(BaseModel):
    """List of tasks"""
    tasks: List[TaskResponse]
    total: int


def parse_instruction(instruction: str) -> Dict[str, Any]:
    """Parse natural language instruction to determine agent and parameters"""
    instruction_lower = instruction.lower()

    # Agent detection based on keywords
    if any(kw in instruction_lower for kw in ["issue", "バグ", "問題", "課題"]):
        return {"agent": AgentType.ISSUE, "action": "analyze"}
    elif any(kw in instruction_lower for kw in ["review", "レビュー", "確認"]):
        return {"agent": AgentType.REVIEW, "action": "review"}
    elif any(kw in instruction_lower for kw in ["pr", "pull request", "プルリク"]):
        return {"agent": AgentType.PR, "action": "create"}
    elif any(kw in instruction_lower for kw in ["deploy", "デプロイ", "リリース"]):
        return {"agent": AgentType.DEPLOY, "action": "deploy"}
    elif any(kw in instruction_lower for kw in ["実装", "作成", "追加", "implement", "create", "add"]):
        return {"agent": AgentType.CODEGEN, "action": "implement"}
    else:
        return {"agent": AgentType.COORDINATOR, "action": "coordinate"}


async def execute_task(task_id: str):
    """Background task execution"""
    task = tasks_store.get(task_id)
    if not task:
        return

    try:
        task["status"] = TaskStatus.RUNNING
        task["started_at"] = datetime.utcnow().isoformat()
        task["progress"] = 10

        # Simulate agent execution (replace with actual agent calls)
        agent = task.get("agent", AgentType.COORDINATOR)
        instruction = task["instruction"]

        # Progress updates
        for progress in [25, 50, 75, 90]:
            await asyncio.sleep(1)  # Simulate work
            task["progress"] = progress

            if task["status"] == TaskStatus.CANCELLED:
                return

        # Complete
        task["status"] = TaskStatus.COMPLETED
        task["completed_at"] = datetime.utcnow().isoformat()
        task["progress"] = 100
        task["result"] = {
            "agent": agent.value if isinstance(agent, AgentType) else agent,
            "instruction": instruction,
            "message": f"Task completed by {agent}",
            "artifacts": []
        }

    except Exception as e:
        task["status"] = TaskStatus.FAILED
        task["completed_at"] = datetime.utcnow().isoformat()
        task["error"] = str(e)


@router.post("", response_model=TaskResponse)
async def create_task(
    request: CreateTaskRequest,
    background_tasks: BackgroundTasks,
    authorization: Optional[str] = Header(None)
):
    """
    Create and queue a new task for execution

    The task will be processed by the appropriate Miyabi agent based on
    the instruction content or the explicitly specified agent.
    """
    # Parse instruction if no agent specified
    parsed = parse_instruction(request.instruction)
    agent = request.agent or parsed["agent"]

    task_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    task = {
        "task_id": task_id,
        "status": TaskStatus.QUEUED,
        "instruction": request.instruction,
        "agent": agent.value if isinstance(agent, AgentType) else agent,
        "repository": request.repository,
        "issue_number": request.issue_number,
        "options": request.options or {},
        "created_at": now,
        "started_at": None,
        "completed_at": None,
        "progress": 0,
        "result": None,
        "error": None,
    }

    tasks_store[task_id] = task

    # Queue background execution
    background_tasks.add_task(execute_task, task_id)

    return TaskResponse(**task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """Get task status by ID"""
    task = tasks_store.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskResponse(**task)


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    limit: int = 20,
    status: Optional[TaskStatus] = None
):
    """List recent tasks, optionally filtered by status"""
    tasks = list(tasks_store.values())

    if status:
        tasks = [t for t in tasks if t["status"] == status]

    # Sort by created_at descending
    tasks.sort(key=lambda t: t["created_at"], reverse=True)
    tasks = tasks[:limit]

    return TaskListResponse(
        tasks=[TaskResponse(**t) for t in tasks],
        total=len(tasks)
    )


@router.post("/{task_id}/cancel")
async def cancel_task(task_id: str):
    """Cancel a queued or running task"""
    task = tasks_store.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task["status"] in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel task with status: {task['status']}")

    task["status"] = TaskStatus.CANCELLED
    task["completed_at"] = datetime.utcnow().isoformat()

    return {"message": "Task cancelled", "task_id": task_id}
