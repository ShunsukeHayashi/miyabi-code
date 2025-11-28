#!/usr/bin/env python3
"""
Miyabi MCP Server - Exception Handlers
Centralized error handling with structured responses
"""

import traceback
from typing import Any, Dict, Optional

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_401_UNAUTHORIZED,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_422_UNPROCESSABLE_ENTITY,
    HTTP_429_TOO_MANY_REQUESTS,
    HTTP_500_INTERNAL_SERVER_ERROR,
)

from .logging import get_logger

logger = get_logger("miyabi.exceptions")


# ===========================================
# Custom Exceptions
# ===========================================

class MiyabiException(Exception):
    """Base exception for Miyabi application"""
    
    def __init__(
        self,
        message: str,
        status_code: int = HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or "INTERNAL_ERROR"
        self.details = details or {}
        super().__init__(message)


class AuthenticationError(MiyabiException):
    """Authentication failed"""
    
    def __init__(self, message: str = "Authentication required", details: Optional[Dict] = None):
        super().__init__(
            message=message,
            status_code=HTTP_401_UNAUTHORIZED,
            error_code="AUTH_REQUIRED",
            details=details
        )


class AuthorizationError(MiyabiException):
    """Authorization failed"""
    
    def __init__(self, message: str = "Permission denied", details: Optional[Dict] = None):
        super().__init__(
            message=message,
            status_code=HTTP_403_FORBIDDEN,
            error_code="PERMISSION_DENIED",
            details=details
        )


class NotFoundError(MiyabiException):
    """Resource not found"""
    
    def __init__(self, resource: str, identifier: Any = None, details: Optional[Dict] = None):
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} '{identifier}' not found"
        
        super().__init__(
            message=message,
            status_code=HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            details=details or {"resource": resource, "identifier": identifier}
        )


class ValidationError(MiyabiException):
    """Validation failed"""
    
    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict] = None):
        super().__init__(
            message=message,
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details=details or {"field": field}
        )


class RateLimitError(MiyabiException):
    """Rate limit exceeded"""
    
    def __init__(self, retry_after: int = 60, details: Optional[Dict] = None):
        super().__init__(
            message=f"Rate limit exceeded. Retry after {retry_after} seconds.",
            status_code=HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_EXCEEDED",
            details=details or {"retry_after": retry_after}
        )


class GitHubError(MiyabiException):
    """GitHub API error"""
    
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(
            message=message,
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="GITHUB_ERROR",
            details=details
        )


class AgentExecutionError(MiyabiException):
    """Agent execution failed"""
    
    def __init__(self, agent: str, message: str, details: Optional[Dict] = None):
        super().__init__(
            message=f"Agent '{agent}' execution failed: {message}",
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="AGENT_EXECUTION_ERROR",
            details=details or {"agent": agent}
        )


# ===========================================
# Error Response Builder
# ===========================================

def build_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[Dict] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """Build standardized error response"""
    response = {
        "error": {
            "code": error_code,
            "message": message,
            "status": status_code,
        }
    }
    
    if details:
        response["error"]["details"] = details
    
    if request_id:
        response["error"]["request_id"] = request_id
    
    return response


# ===========================================
# Exception Handlers
# ===========================================

async def miyabi_exception_handler(request: Request, exc: MiyabiException) -> JSONResponse:
    """Handle MiyabiException"""
    logger.error(
        f"MiyabiException: {exc.message}",
        data={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "details": exc.details,
            "path": request.url.path,
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=build_error_response(
            status_code=exc.status_code,
            error_code=exc.error_code,
            message=exc.message,
            details=exc.details,
        )
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTPException"""
    error_code = {
        HTTP_400_BAD_REQUEST: "BAD_REQUEST",
        HTTP_401_UNAUTHORIZED: "UNAUTHORIZED",
        HTTP_403_FORBIDDEN: "FORBIDDEN",
        HTTP_404_NOT_FOUND: "NOT_FOUND",
        HTTP_422_UNPROCESSABLE_ENTITY: "VALIDATION_ERROR",
        HTTP_429_TOO_MANY_REQUESTS: "RATE_LIMIT_EXCEEDED",
        HTTP_500_INTERNAL_SERVER_ERROR: "INTERNAL_ERROR",
    }.get(exc.status_code, "ERROR")
    
    logger.warning(
        f"HTTPException: {exc.detail}",
        data={
            "status_code": exc.status_code,
            "path": request.url.path,
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=build_error_response(
            status_code=exc.status_code,
            error_code=error_code,
            message=str(exc.detail),
        ),
        headers=getattr(exc, "headers", None)
    )


async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle Pydantic validation errors"""
    from pydantic import ValidationError as PydanticValidationError
    
    if isinstance(exc, PydanticValidationError):
        errors = exc.errors()
        details = {
            "validation_errors": [
                {
                    "field": ".".join(str(loc) for loc in err["loc"]),
                    "message": err["msg"],
                    "type": err["type"],
                }
                for err in errors
            ]
        }
        
        logger.warning(
            "Validation error",
            data={"errors": errors, "path": request.url.path}
        )
        
        return JSONResponse(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            content=build_error_response(
                status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                error_code="VALIDATION_ERROR",
                message="Request validation failed",
                details=details,
            )
        )
    
    # Fallback for other exceptions
    return await generic_exception_handler(request, exc)


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions"""
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        exc_info=True,
        data={
            "exception_type": type(exc).__name__,
            "path": request.url.path,
            "method": request.method,
        }
    )
    
    # Don't expose internal errors in production
    from .config import settings
    message = "An internal error occurred"
    details = None
    
    if settings.debug:
        message = str(exc)
        details = {
            "exception_type": type(exc).__name__,
            "traceback": traceback.format_exc().split("\n"),
        }
    
    return JSONResponse(
        status_code=HTTP_500_INTERNAL_SERVER_ERROR,
        content=build_error_response(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="INTERNAL_ERROR",
            message=message,
            details=details,
        )
    )


def register_exception_handlers(app: FastAPI):
    """Register all exception handlers with the FastAPI app"""
    app.add_exception_handler(MiyabiException, miyabi_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
    
    # Pydantic validation errors
    try:
        from pydantic import ValidationError as PydanticValidationError
        app.add_exception_handler(PydanticValidationError, validation_exception_handler)
    except ImportError:
        pass
