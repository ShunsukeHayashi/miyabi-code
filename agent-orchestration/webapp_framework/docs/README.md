# WebApp Framework

A lightweight Python web application framework with built-in routing, templating, authentication, and database support.

## Features

- **Routing**: Flexible URL routing with path parameters
- **HTTP**: Headers, cookies, and session management
- **Templating**: Simple template engine with filters
- **Database**: ORM, query builder, and migrations
- **Authentication**: User authentication and permissions
- **Validation**: Input validation and sanitization
- **Testing**: Built-in test client and fixtures
- **CLI**: Development server and command tools

## Installation

```bash
pip install webapp-framework
```

## Quick Start

```python
from webapp_framework.core.application import Application
from webapp_framework.core.response import Response

app = Application("MyApp")

@app.route("/")
def index():
    return Response.html("<h1>Hello, World!</h1>")

if __name__ == "__main__":
    app.run(debug=True)
```

## Documentation

- [Quick Start Guide](QUICKSTART.md)
- [API Reference](API_REFERENCE.md)
- [Deployment Guide](DEPLOYMENT.md)

## License

MIT License
