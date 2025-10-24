# Claudable Docker Image
# AI-driven Next.js application builder with Claude Code integration

FROM node:18-slim

# Install system dependencies including Python 3.10+
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Clone Claudable repository
ARG CLAUDABLE_VERSION=main
RUN git clone --depth 1 --branch ${CLAUDABLE_VERSION} https://github.com/opactorai/Claudable.git .

# Install dependencies (this handles both Node.js and Python)
RUN npm install

# Create volume for SQLite database persistence
VOLUME ["/app/apps/api/data"]

# Expose ports
# 3000: Frontend (Next.js)
# 8080: Backend API (FastAPI)
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start development servers
CMD ["npm", "run", "dev"]
