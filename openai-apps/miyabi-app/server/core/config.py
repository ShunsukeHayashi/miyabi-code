#!/usr/bin/env python3
"""
Miyabi MCP Server - Configuration Management
Centralized configuration with environment validation
"""

import os
import secrets
from pathlib import Path
from typing import List, Optional
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with validation"""
    
    # ===========================================
    # Core Settings
    # ===========================================
    app_name: str = "Miyabi MCP Server"
    app_version: str = "2.0.0"
    debug: bool = Field(default=False, description="Debug mode")
    environment: str = Field(default="development", description="Environment: development, staging, production")
    
    # ===========================================
    # Server Settings
    # ===========================================
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    workers: int = Field(default=4, description="Number of workers")
    
    # ===========================================
    # Miyabi Project Settings
    # ===========================================
    miyabi_root: Path = Field(
        default_factory=lambda: Path.home() / "miyabi-private",
        description="Miyabi project root directory"
    )
    base_url: str = Field(default="http://localhost:4444", description="Asset server base URL")
    
    # ===========================================
    # GitHub Settings
    # ===========================================
    github_token: str = Field(default="", description="GitHub API token")
    github_repo_owner: str = Field(default="customer-cloud", description="GitHub repository owner")
    github_repo_name: str = Field(default="miyabi-private", description="GitHub repository name")
    
    # ===========================================
    # Authentication Settings
    # ===========================================
    access_token: str = Field(default="", description="Static access token for simple auth")
    jwt_secret: str = Field(default_factory=lambda: secrets.token_urlsafe(32), description="JWT secret key")
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")
    jwt_expire_minutes: int = Field(default=60, description="JWT expiration time in minutes")
    
    # ===========================================
    # OAuth 2.1 Settings
    # ===========================================
    oauth_client_id: str = Field(default="miyabi-mcp-client", description="OAuth client ID")
    oauth_client_secret: str = Field(default_factory=lambda: secrets.token_urlsafe(32), description="OAuth client secret")
    oauth_issuer: str = Field(default="https://miyabi-mcp.local", description="OAuth issuer URL")
    
    # ===========================================
    # GitHub OAuth App Settings
    # ===========================================
    github_oauth_client_id: str = Field(default="", description="GitHub OAuth App client ID")
    github_oauth_client_secret: str = Field(default="", description="GitHub OAuth App client secret")
    github_oauth_callback_url: str = Field(default="", description="GitHub OAuth callback URL")
    
    # ===========================================
    # Security Settings
    # ===========================================
    allowed_origins: List[str] = Field(
        default=["https://chat.openai.com", "https://chatgpt.com"],
        description="CORS allowed origins"
    )
    rate_limit_per_minute: int = Field(default=60, description="Rate limit per minute per IP")
    rate_limit_burst: int = Field(default=10, description="Rate limit burst allowance")
    
    # ===========================================
    # Redis Settings (for token persistence)
    # ===========================================
    redis_url: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")
    redis_enabled: bool = Field(default=False, description="Enable Redis for token storage")
    
    # ===========================================
    # Database Settings
    # ===========================================
    database_url: str = Field(
        default="postgresql://postgres:temppass@localhost:5433/miyabi",
        description="PostgreSQL connection URL"
    )
    database_pool_size: int = Field(default=10, description="Database connection pool size")
    
    # ===========================================
    # Logging Settings
    # ===========================================
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(default="json", description="Log format: json or text")
    log_file: Optional[str] = Field(default=None, description="Log file path")
    
    # ===========================================
    # Sandbox Settings
    # ===========================================
    sandbox_enabled: bool = Field(default=False, description="Enable sandbox mode")
    sandbox_image: str = Field(default="miyabi-sandbox:latest", description="Sandbox Docker image")
    sandboxes_root: Path = Field(default=Path("/data/sandboxes"), description="Sandboxes root directory")
    sandbox_idle_timeout: int = Field(default=15, description="Sandbox idle timeout in minutes")
    
    # ===========================================
    # Feature Flags
    # ===========================================
    enable_websocket: bool = Field(default=False, description="Enable WebSocket support")
    enable_metrics: bool = Field(default=True, description="Enable Prometheus metrics")
    enable_tracing: bool = Field(default=False, description="Enable distributed tracing")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        # Map environment variables with MIYABI_ prefix
        env_prefix = ""
        
        # Custom env var names
        fields = {
            "miyabi_root": {"env": "MIYABI_ROOT"},
            "github_token": {"env": "GITHUB_TOKEN"},
            "github_repo_owner": {"env": "MIYABI_REPO_OWNER"},
            "github_repo_name": {"env": "MIYABI_REPO_NAME"},
            "access_token": {"env": "MIYABI_ACCESS_TOKEN"},
        }
    
    @property
    def github_repo_full_name(self) -> str:
        """Get full repository name"""
        return f"{self.github_repo_owner}/{self.github_repo_name}"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.environment == "development"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Alias for convenience
settings = get_settings()
