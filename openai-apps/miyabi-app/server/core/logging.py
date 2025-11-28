#!/usr/bin/env python3
"""
Miyabi MCP Server - Structured Logging
JSON-formatted logging with context and tracing support
"""

import sys
import json
import logging
import traceback
from typing import Any, Dict, Optional
from datetime import datetime
from contextvars import ContextVar

from .config import settings

# Context variables for request tracing
request_id_var: ContextVar[str] = ContextVar("request_id", default="")
user_id_var: ContextVar[str] = ContextVar("user_id", default="")


class JsonFormatter(logging.Formatter):
    """JSON log formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add request context if available
        request_id = request_id_var.get()
        if request_id:
            log_data["request_id"] = request_id
        
        user_id = user_id_var.get()
        if user_id:
            log_data["user_id"] = user_id
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info) if record.exc_info[0] else None,
            }
        
        # Add extra fields
        if hasattr(record, "extra_data"):
            log_data["extra"] = record.extra_data
        
        return json.dumps(log_data, default=str, ensure_ascii=False)


class TextFormatter(logging.Formatter):
    """Human-readable text formatter for development"""
    
    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"
    
    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, "")
        reset = self.RESET if color else ""
        
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        # Build prefix with context
        prefix_parts = [f"{color}[{record.levelname}]{reset}"]
        
        request_id = request_id_var.get()
        if request_id:
            prefix_parts.append(f"[{request_id[:8]}]")
        
        prefix = " ".join(prefix_parts)
        
        message = f"{timestamp} {prefix} {record.name}: {record.getMessage()}"
        
        if record.exc_info:
            message += "\n" + "".join(traceback.format_exception(*record.exc_info))
        
        return message


class ContextLogger(logging.Logger):
    """Logger with context support"""
    
    def _log_with_context(
        self,
        level: int,
        msg: str,
        args: tuple,
        exc_info: Any = None,
        extra: Dict[str, Any] = None,
        **kwargs
    ):
        if extra is None:
            extra = {}
        
        # Add context variables
        extra["extra_data"] = kwargs.get("data", {})
        
        super()._log(level, msg, args, exc_info=exc_info, extra=extra)
    
    def debug(self, msg: str, *args, **kwargs):
        self._log_with_context(logging.DEBUG, msg, args, **kwargs)
    
    def info(self, msg: str, *args, **kwargs):
        self._log_with_context(logging.INFO, msg, args, **kwargs)
    
    def warning(self, msg: str, *args, **kwargs):
        self._log_with_context(logging.WARNING, msg, args, **kwargs)
    
    def error(self, msg: str, *args, exc_info: bool = False, **kwargs):
        self._log_with_context(logging.ERROR, msg, args, exc_info=exc_info, **kwargs)
    
    def critical(self, msg: str, *args, exc_info: bool = False, **kwargs):
        self._log_with_context(logging.CRITICAL, msg, args, exc_info=exc_info, **kwargs)


def setup_logging():
    """Setup application logging"""
    # Set custom logger class
    logging.setLoggerClass(ContextLogger)
    
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.log_level.upper()))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    
    if settings.log_format == "json":
        console_handler.setFormatter(JsonFormatter())
    else:
        console_handler.setFormatter(TextFormatter())
    
    root_logger.addHandler(console_handler)
    
    # File handler (if configured)
    if settings.log_file:
        file_handler = logging.FileHandler(settings.log_file)
        file_handler.setFormatter(JsonFormatter())  # Always JSON for files
        root_logger.addHandler(file_handler)
    
    # Set levels for noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    
    return root_logger


def get_logger(name: str) -> ContextLogger:
    """Get a logger instance with context support"""
    return logging.getLogger(name)


# Convenience function for structured logging
def log_event(
    logger: logging.Logger,
    event: str,
    level: str = "info",
    **kwargs
):
    """Log a structured event"""
    log_func = getattr(logger, level.lower(), logger.info)
    log_func(event, data=kwargs)
