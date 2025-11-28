# Miyabi Sandbox Container
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Python packages
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    httpx \
    pydantic \
    PyGithub \
    psutil

# Create workspace
RUN mkdir -p /workspace /app
WORKDIR /workspace

# Copy sandbox server
COPY sandbox_server.py /app/

# Expose port
EXPOSE 8080

# Run sandbox server
CMD ["python", "/app/sandbox_server.py"]
