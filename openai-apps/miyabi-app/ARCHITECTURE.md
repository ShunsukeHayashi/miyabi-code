# Miyabi OpenAI App - v2.0.0 Architecture

## 📁 Directory Structure

```
openai-apps/miyabi-app/
├── server/                      # Python Backend
│   ├── core/                    # Core modules
│   │   ├── __init__.py
│   │   ├── config.py           # Configuration management (Pydantic Settings)
│   │   ├── security.py         # Auth, rate limiting, token store
│   │   ├── logging.py          # Structured logging (JSON/text)
│   │   └── exceptions.py       # Custom exceptions & handlers
│   │
│   ├── routers/                 # API routers
│   │   ├── __init__.py
│   │   ├── health.py           # Health checks (/health, /health/live, /health/ready)
│   │   ├── mcp.py              # MCP protocol (/mcp)
│   │   ├── oauth.py            # OAuth 2.1 (/oauth/*)
│   │   └── github.py           # GitHub API (/github/*)
│   │
│   ├── tests/                   # Test suite
│   │   ├── __init__.py
│   │   ├── test_core.py        # Unit tests
│   │   └── test_api.py         # Integration tests
│   │
│   ├── main.py                  # Original main (legacy)
│   ├── main_v2.py              # New modular main
│   ├── requirements.txt         # Dependencies
│   ├── pytest.ini              # Test configuration
│   └── .env.example            # Environment template
│
├── src/                         # React Frontend
│   ├── components/             # UI widgets
│   └── main.tsx
│
├── onboarding-ui/              # Onboarding flow
├── admin-ui/                   # Admin dashboard
└── assets/                     # Static assets
```

## 🔄 Request Flow

```
Client Request
     │
     ▼
┌─────────────────┐
│   FastAPI App   │
│  (main_v2.py)   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────┐
│ CORS  │ │ Request   │
│       │ │ Context   │
└───┬───┘ └─────┬─────┘
    │           │
    └─────┬─────┘
          ▼
┌─────────────────┐
│    Routers      │
├─────────────────┤
│ /health         │ → Health checks
│ /mcp            │ → MCP protocol
│ /oauth/*        │ → Authentication
│ /github/*       │ → GitHub API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Core Modules   │
├─────────────────┤
│ config.py       │ → Settings
│ security.py     │ → Auth/Rate limit
│ logging.py      │ → Structured logs
│ exceptions.py   │ → Error handling
└─────────────────┘
```

## 🛡️ Security Features

### Authentication
- **OAuth 2.1** with PKCE support
- **Bearer tokens** (static or OAuth-issued)
- **GitHub OAuth App** integration
- **Token persistence** (Redis optional)

### Rate Limiting
- Per-IP rate limiting (60/min default)
- Burst allowance (10 requests)
- Retry-After headers

### CORS
- Configurable allowed origins
- Production: whitelist only
- Development: allow all

## 📊 API Endpoints

### Health
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Server info |
| `/health` | GET | Full health check |
| `/health/live` | GET | Liveness probe |
| `/health/ready` | GET | Readiness probe |
| `/health/metrics` | GET | System metrics |

### MCP Protocol
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp` | POST | JSON-RPC 2.0 endpoint |

**Methods:**
- `initialize` - Server initialization
- `tools/list` - List available tools
- `tools/call` - Execute a tool

### OAuth
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/oauth/authorize` | GET | Authorization |
| `/oauth/callback` | GET | GitHub callback |
| `/oauth/token` | POST | Token exchange |
| `/oauth/revoke` | POST | Token revocation |

### GitHub
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/github/issues` | GET | List issues |
| `/github/issues/{n}` | GET | Get issue |
| `/github/issues` | POST | Create issue |
| `/github/pulls` | GET | List PRs |
| `/github/pulls/{n}` | GET | Get PR |
| `/github/repo` | GET | Repo info |

## 🚀 Deployment

### Development
```bash
cd server
pip install -r requirements.txt
python main_v2.py
```

### Production
```bash
uvicorn main_v2:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY server/ .
RUN pip install -r requirements.txt
CMD ["uvicorn", "main_v2:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🧪 Testing

```bash
cd server
pytest                    # Run all tests
pytest -v                 # Verbose
pytest --cov=.            # With coverage
pytest tests/test_api.py  # Specific file
```
