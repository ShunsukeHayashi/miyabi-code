# Miyabi MCP Server - Authentication Guide

## Overview

This MCP server implements OAuth 2.1-compliant Bearer token authentication as specified in the [MCP Authorization Specification](https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization).

## Authentication Methods

### Development Mode (Default)

When `MIYABI_ACCESS_TOKEN` is not set, the server runs in development mode with authentication disabled.

```bash
# No auth required
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Production Mode (Bearer Token)

Set `MIYABI_ACCESS_TOKEN` in your `.env` file to enable authentication:

```bash
# Generate a secure token
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Add to .env
echo "MIYABI_ACCESS_TOKEN=your_generated_token_here" >> .env
```

All requests must include the Bearer token:

```bash
curl -X POST https://your-server.com/mcp \
  -H "Authorization: Bearer your_generated_token_here" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## MCP Specification Compliance

✅ **OAuth 2.1 Subset**: Bearer token in Authorization header
✅ **Header-Only Tokens**: Tokens never in query strings
✅ **HTTPS Required**: Production deployments must use HTTPS
✅ **Error Codes**: Returns 401 for invalid/expired tokens
✅ **WWW-Authenticate**: Proper challenge headers on auth failures

## Error Responses

### 401 Unauthorized - Missing Token

```json
{
  "detail": "Bearer token required. Include Authorization header."
}
```

Response headers:
```
WWW-Authenticate: Bearer
```

### 401 Unauthorized - Invalid Token

```json
{
  "detail": "Invalid or expired access token"
}
```

## Security Best Practices

1. **Always use HTTPS in production** - MCP spec requires it
2. **Rotate tokens regularly** - Implement token expiration policies
3. **Store tokens securely** - Never commit tokens to version control
4. **Use environment variables** - Load tokens from `.env` files
5. **Implement rate limiting** - Protect against brute force attacks
6. **Monitor failed auth attempts** - Log and alert on suspicious activity

## FastAPI Security Features

The implementation uses FastAPI's built-in security utilities:

- `HTTPBearer`: OAuth 2.1 Bearer token scheme
- `Depends`: Dependency injection for auth verification
- Automatic OpenAPI/Swagger documentation with auth UI

## Testing Authentication

### Test Development Mode

```bash
# Should succeed (no auth)
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Test Production Mode

```bash
# Set token
export MIYABI_ACCESS_TOKEN="test-token-123"

# Should fail without token
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Should succeed with token
curl -X POST http://localhost:8000/mcp \
  -H "Authorization: Bearer test-token-123" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Future Enhancements

- **Full OAuth 2.1 Flow**: Authorization Code Grant with PKCE
- **Token Expiration**: Time-limited access tokens
- **Refresh Tokens**: Long-lived credential rotation
- **Scopes**: Granular permission control
- **Multi-tenancy**: Per-user token management
- **Audit Logging**: Track all authenticated requests

## References

- [MCP Authorization Specification](https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization)
- [OAuth 2.1 RFC](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
