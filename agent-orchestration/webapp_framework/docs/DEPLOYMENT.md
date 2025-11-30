# Deployment Guide

## Production Deployment

### Using Gunicorn

1. Install Gunicorn:
```bash
pip install gunicorn
```

2. Run your app:
```bash
gunicorn -w 4 -b 0.0.0.0:8000 myapp:app
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app"]
```

### Environment Variables

Set configuration via environment:
```python
import os
app.configure("SECRET_KEY", os.getenv("SECRET_KEY"))
```

## Security

- Use HTTPS in production
- Set secure cookies
- Enable CSRF protection
- Rate limit endpoints
