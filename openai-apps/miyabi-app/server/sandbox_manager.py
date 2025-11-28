#!/usr/bin/env python3
"""
Miyabi Sandbox Manager
Manages user sandboxes with database persistence
"""

import os
import json
import asyncio
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional
import subprocess
import httpx

# Database imports
import asyncpg
from asyncpg import Pool

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:temppass@localhost:5433/miyabi")
SANDBOX_IMAGE = os.getenv("SANDBOX_IMAGE", "miyabi-sandbox:latest")
SANDBOXES_ROOT = Path(os.getenv("SANDBOXES_ROOT", "/data/sandboxes"))
IDLE_TIMEOUT_MINUTES = int(os.getenv("SANDBOX_IDLE_TIMEOUT", "15"))


class SandboxManager:
    """Manages Docker-based sandboxes for each user"""

    def __init__(self):
        self.db_pool: Optional[Pool] = None
        self.active_sandboxes: Dict[str, "Sandbox"] = {}

    async def initialize(self):
        """Initialize database connection and create tables"""
        self.db_pool = await asyncpg.create_pool(DATABASE_URL)

        # Create tables if not exist
        async with self.db_pool.acquire() as conn:
            # Create tables without foreign keys for simplicity
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS mcp_users (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) UNIQUE NOT NULL,
                    github_id VARCHAR(255),
                    github_username VARCHAR(255),
                    email VARCHAR(255),
                    plan VARCHAR(50) DEFAULT 'free',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Add plan column if not exists (migration)
            await conn.execute('''
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                   WHERE table_name='mcp_users' AND column_name='plan') THEN
                        ALTER TABLE mcp_users ADD COLUMN plan VARCHAR(50) DEFAULT 'free';
                    END IF;
                END $$;
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS mcp_user_projects (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    project_name VARCHAR(255) NOT NULL,
                    github_repo VARCHAR(255),
                    github_token_encrypted TEXT,
                    project_root VARCHAR(512),
                    settings JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, project_name)
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS mcp_oauth_tokens (
                    id SERIAL PRIMARY KEY,
                    token_hash VARCHAR(64) UNIQUE NOT NULL,
                    user_id VARCHAR(255) NOT NULL,
                    scope VARCHAR(255),
                    expires_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS mcp_sandbox_sessions (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    container_id VARCHAR(64),
                    container_name VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'created',
                    port INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            await conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_mcp_oauth_tokens_hash ON mcp_oauth_tokens(token_hash)
            ''')

            await conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_mcp_users_user_id ON mcp_users(user_id)
            ''')
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS mcp_subscriptions (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    plan VARCHAR(50) DEFAULT 'free',
                    status VARCHAR(50) DEFAULT 'active',
                    stripe_customer_id VARCHAR(255),
                    stripe_subscription_id VARCHAR(255),
                    current_period_start TIMESTAMP,
                    current_period_end TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id)
                )
            ''')

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS mcp_usage (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    tool_name VARCHAR(255),
                    tokens_used INTEGER DEFAULT 0,
                    execution_time_ms INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            await conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_mcp_usage_user_date
                ON mcp_usage(user_id, created_at)
            ''')


        print("Database initialized successfully")

    async def close(self):
        """Close database connection"""
        if self.db_pool:
            await self.db_pool.close()

    # User Management
    async def create_user(self, user_id: str, github_id: str = None, github_username: str = None, email: str = None, plan: str = "free") -> dict:
        """Create a new user"""
        async with self.db_pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO mcp_users (user_id, github_id, github_username, email, plan)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id) DO UPDATE SET
                    github_id = COALESCE($2, mcp_users.github_id),
                    github_username = COALESCE($3, mcp_users.github_username),
                    email = COALESCE($4, mcp_users.email),
                    plan = COALESCE($5, mcp_users.plan),
                    last_active = CURRENT_TIMESTAMP
            ''', user_id, github_id, github_username, email, plan)

            # Create default project for user
            await self.create_project(user_id, "default")

        return await self.get_user(user_id)

    async def get_user(self, user_id: str) -> Optional[dict]:
        """Get user by ID"""
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(
                'SELECT * FROM mcp_users WHERE user_id = $1', user_id
            )
            if row:
                return dict(row)
        return None

    async def update_user_activity(self, user_id: str):
        """Update user last active timestamp"""
        async with self.db_pool.acquire() as conn:
            await conn.execute(
                'UPDATE mcp_users SET last_active = CURRENT_TIMESTAMP WHERE user_id = $1',
                user_id
            )

    # Project Management
    async def create_project(self, user_id: str, project_name: str, github_repo: str = None, github_token: str = None) -> dict:
        """Create a project for user"""
        project_root = str(SANDBOXES_ROOT / user_id / project_name)

        async with self.db_pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO mcp_user_projects (user_id, project_name, github_repo, project_root)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id, project_name) DO UPDATE SET
                    github_repo = COALESCE($3, mcp_user_projects.github_repo),
                    updated_at = CURRENT_TIMESTAMP
            ''', user_id, project_name, github_repo, project_root)

        # Create project directory
        Path(project_root).mkdir(parents=True, exist_ok=True)

        return await self.get_project(user_id, project_name)

    async def get_project(self, user_id: str, project_name: str = "default") -> Optional[dict]:
        """Get project configuration"""
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow('''
                SELECT * FROM mcp_user_projects
                WHERE user_id = $1 AND project_name = $2
            ''', user_id, project_name)
            if row:
                return dict(row)
        return None

    async def get_user_projects(self, user_id: str) -> list:
        """Get all projects for a user"""
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(
                'SELECT * FROM mcp_user_projects WHERE user_id = $1 ORDER BY created_at',
                user_id
            )
            return [dict(row) for row in rows]


    async def delete_project(self, user_id: str, project_name: str) -> bool:
        """Delete a user project"""
        async with self.db_pool.acquire() as conn:
            result = await conn.execute(
                'DELETE FROM mcp_user_projects WHERE user_id = $1 AND project_name = $2',
                user_id, project_name
            )
            return result != 'DELETE 0'

    async def update_project(self, user_id: str, project_name: str, settings: dict) -> dict:
        """Update project settings"""
        async with self.db_pool.acquire() as conn:
            await conn.execute('''
                UPDATE mcp_user_projects
                SET settings = $3, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND project_name = $2
            ''', user_id, project_name, json.dumps(settings))
        return await self.get_project(user_id, project_name)

    # Token Management
    async def store_token(self, token: str, user_id: str, scope: str, expires_in: int = 3600):
        """Store OAuth token with user mapping"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        async with self.db_pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO mcp_oauth_tokens (token_hash, user_id, scope, expires_at)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (token_hash) DO UPDATE SET
                    expires_at = $4
            ''', token_hash, user_id, scope, expires_at)

    async def get_user_by_token(self, token: str) -> Optional[str]:
        """Get user_id from token"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow('''
                SELECT user_id FROM mcp_oauth_tokens
                WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP
            ''', token_hash)
            if row:
                return row['user_id']
        return None

    async def revoke_token(self, token: str):
        """Revoke a token"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        async with self.db_pool.acquire() as conn:
            await conn.execute(
                'DELETE FROM mcp_oauth_tokens WHERE token_hash = $1',
                token_hash
            )

    # Sandbox Management
    async def get_or_create_sandbox(self, user_id: str, project_name: str = "default") -> "Sandbox":
        """Get existing sandbox or create new one"""
        sandbox_key = f"{user_id}:{project_name}"

        # Check active sandboxes
        if sandbox_key in self.active_sandboxes:
            sandbox = self.active_sandboxes[sandbox_key]
            if await sandbox.is_running():
                await sandbox.touch()
                return sandbox

        # Check database for existing container
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow('''
                SELECT * FROM mcp_sandbox_sessions
                WHERE user_id = $1 AND status = 'running'
                ORDER BY created_at DESC LIMIT 1
            ''', user_id)

            if row:
                # Try to reconnect to existing container
                sandbox = Sandbox(
                    user_id=user_id,
                    project_name=project_name,
                    container_id=row['container_id'],
                    port=row['port']
                )
                if await sandbox.is_running():
                    self.active_sandboxes[sandbox_key] = sandbox
                    return sandbox

        # Create new sandbox
        project = await self.get_project(user_id, project_name)
        if not project:
            project = await self.create_project(user_id, project_name)

        sandbox = await self._create_sandbox(user_id, project)
        self.active_sandboxes[sandbox_key] = sandbox

        # Record in database
        async with self.db_pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO mcp_sandbox_sessions (user_id, container_id, container_name, status, port)
                VALUES ($1, $2, $3, 'running', $4)
            ''', user_id, sandbox.container_id, sandbox.container_name, sandbox.port)

        return sandbox

    async def _create_sandbox(self, user_id: str, project: dict) -> "Sandbox":
        """Create a new Docker sandbox"""
        import random

        container_name = f"sandbox-{user_id}-{random.randint(1000, 9999)}"
        port = random.randint(10000, 60000)
        project_root = project.get('project_root', str(SANDBOXES_ROOT / user_id / "default"))

        # Ensure directory exists
        Path(project_root).mkdir(parents=True, exist_ok=True)

        # Create container
        cmd = [
            "docker", "run", "-d",
            "--name", container_name,
            "-p", f"{port}:8080",
            "-v", f"{project_root}:/workspace",
            "-e", f"USER_ID={user_id}",
            "-e", "MIYABI_ROOT=/workspace",
            "--memory", "2g",
            "--cpus", "1",
            SANDBOX_IMAGE
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"Failed to create container: {result.stderr}")

        container_id = result.stdout.strip()[:12]

        sandbox = Sandbox(
            user_id=user_id,
            project_name=project.get('project_name', 'default'),
            container_id=container_id,
            container_name=container_name,
            port=port
        )

        # Wait for container to be ready
        await sandbox.wait_ready()

        return sandbox

    async def stop_sandbox(self, user_id: str, project_name: str = "default"):
        """Stop a user sandbox"""
        sandbox_key = f"{user_id}:{project_name}"

        if sandbox_key in self.active_sandboxes:
            sandbox = self.active_sandboxes[sandbox_key]
            await sandbox.stop()
            del self.active_sandboxes[sandbox_key]

        async with self.db_pool.acquire() as conn:
            await conn.execute('''
                UPDATE mcp_sandbox_sessions SET status = 'stopped'
                WHERE user_id = $1 AND status = 'running'
            ''', user_id)

    async def cleanup_idle_sandboxes(self):
        """Stop sandboxes that have been idle too long"""
        cutoff = datetime.utcnow() - timedelta(minutes=IDLE_TIMEOUT_MINUTES)

        for key, sandbox in list(self.active_sandboxes.items()):
            if sandbox.last_active < cutoff:
                print(f"Stopping idle sandbox: {key}")
                await sandbox.stop()
                del self.active_sandboxes[key]


    # Subscription Management
    async def get_subscription(self, user_id: str) -> Optional[dict]:
        """Get user subscription"""
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(
                'SELECT * FROM mcp_subscriptions WHERE user_id = $1',
                user_id
            )
            if row:
                return dict(row)
        return None

    async def create_subscription(self, user_id: str, plan: str = 'free') -> dict:
        """Create or update subscription"""
        async with self.db_pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO mcp_subscriptions (user_id, plan, status)
                VALUES ($1, $2, 'active')
                ON CONFLICT (user_id) DO UPDATE SET
                    plan = $2,
                    updated_at = CURRENT_TIMESTAMP
            ''', user_id, plan)
        return await self.get_subscription(user_id)

    async def cancel_subscription(self, user_id: str) -> bool:
        """Cancel/suspend user subscription"""
        async with self.db_pool.acquire() as conn:
            result = await conn.execute('''
                UPDATE mcp_subscriptions
                SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1
            ''', user_id)
            return 'UPDATE 1' in result

    async def suspend_user(self, user_id: str) -> bool:
        """Suspend user access (admin action)"""
        async with self.db_pool.acquire() as conn:
            # Create or update subscription status
            await conn.execute('''
                INSERT INTO mcp_subscriptions (user_id, plan, status)
                VALUES ($1, 'free', 'suspended')
                ON CONFLICT (user_id) DO UPDATE SET
                    status = 'suspended',
                    updated_at = CURRENT_TIMESTAMP
            ''', user_id)
            # Revoke all tokens
            await conn.execute(
                'DELETE FROM mcp_oauth_tokens WHERE user_id = $1',
                user_id
            )
            # Stop any running sandboxes
            await self.stop_sandbox(user_id)
        return True

    async def reactivate_user(self, user_id: str) -> bool:
        """Reactivate suspended user"""
        async with self.db_pool.acquire() as conn:
            result = await conn.execute('''
                UPDATE mcp_subscriptions
                SET status = 'active', updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1
            ''', user_id)
            return 'UPDATE 1' in result

    async def check_user_access(self, user_id: str) -> dict:
        """Check if user has valid access"""
        sub = await self.get_subscription(user_id)
        if not sub:
            # New user - create free subscription
            sub = await self.create_subscription(user_id, 'free')

        return {
            'has_access': sub['status'] == 'active',
            'plan': sub['plan'],
            'status': sub['status'],
        }

    # Usage Tracking
    async def record_usage(self, user_id: str, tool_name: str, tokens: int = 0, execution_ms: int = 0):
        """Record tool usage for billing"""
        async with self.db_pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO mcp_usage (user_id, tool_name, tokens_used, execution_time_ms)
                VALUES ($1, $2, $3, $4)
            ''', user_id, tool_name, tokens, execution_ms)

    async def get_usage_summary(self, user_id: str, days: int = 30) -> dict:
        """Get usage summary for billing period"""
        async with self.db_pool.acquire() as conn:
            query = f'''
                SELECT
                    COUNT(*) as total_calls,
                    SUM(tokens_used) as total_tokens,
                    SUM(execution_time_ms) as total_time_ms
                FROM mcp_usage
                WHERE user_id = $1
                AND created_at > CURRENT_TIMESTAMP - INTERVAL '{days} days'
            '''
            row = await conn.fetchrow(query, user_id)
            return {
                'total_calls': row['total_calls'] or 0,
                'total_tokens': row['total_tokens'] or 0,
                'total_time_ms': row['total_time_ms'] or 0,
            }

    async def list_all_users(self) -> list:
        """List all users (admin)"""
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch('''
                SELECT u.user_id, u.github_username, u.created_at, u.last_active,
                       s.plan, s.status
                FROM mcp_users u
                LEFT JOIN mcp_subscriptions s ON u.user_id = s.user_id
                ORDER BY u.created_at DESC
            ''')
            return [dict(row) for row in rows]


class Sandbox:
    """Represents a user sandbox container"""

    def __init__(self, user_id: str, project_name: str, container_id: str,
                 container_name: str = None, port: int = 8080):
        self.user_id = user_id
        self.project_name = project_name
        self.container_id = container_id
        self.container_name = container_name or f"sandbox-{container_id}"
        self.port = port
        self.last_active = datetime.utcnow()
        self.base_url = f"http://localhost:{port}"

    async def is_running(self) -> bool:
        """Check if container is running"""
        result = subprocess.run(
            ["docker", "inspect", "-f", "{{.State.Running}}", self.container_id],
            capture_output=True, text=True
        )
        return result.stdout.strip() == "true"

    async def wait_ready(self, timeout: int = 30):
        """Wait for sandbox to be ready"""
        import time
        start = time.time()
        while time.time() - start < timeout:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(f"{self.base_url}/health", timeout=2)
                    if response.status_code == 200:
                        return True
            except Exception:
                pass
            await asyncio.sleep(0.5)
        raise RuntimeError("Sandbox failed to start")

    def touch(self):
        """Update last active timestamp"""
        self.last_active = datetime.utcnow()

    async def execute(self, tool: str, arguments: dict) -> dict:
        """Execute a tool in the sandbox"""
        self.touch()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/execute",
                json={"tool": tool, "arguments": arguments},
                timeout=300
            )
            return response.json()

    async def stop(self):
        """Stop the container"""
        subprocess.run(["docker", "stop", self.container_id], capture_output=True)
        subprocess.run(["docker", "rm", self.container_id], capture_output=True)



# Singleton instance
sandbox_manager = SandboxManager()
