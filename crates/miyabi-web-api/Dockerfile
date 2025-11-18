# Miyabi Web API - Production Dockerfile for AWS ECS / GCP Cloud Run
# Multi-stage build for optimal image size
# Compatible with: AWS ECR + ECS, GCP Cloud Run

# Stage 1: Builder
FROM rust:1-slim-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /build

# Copy workspace manifest
COPY Cargo.toml Cargo.lock ./

# Copy all crates (workspace members)
COPY crates ./crates

# Set SQLX_OFFLINE to skip compile-time verification (no database needed)
ENV SQLX_OFFLINE=true

# Build dependencies (cached layer)
RUN cargo build --release --package miyabi-web-api

# Stage 2: Runtime
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash miyabi

# Copy binary from builder
COPY --from=builder /build/target/release/miyabi-web-api /usr/local/bin/miyabi-web-api

# Copy migrations (if exists)
COPY --from=builder /build/crates/miyabi-web-api/migrations /app/migrations

# Set working directory
WORKDIR /app

# Change ownership
RUN chown -R miyabi:miyabi /app

# Switch to non-root user
USER miyabi

# Expose port (Cloud Run uses PORT env var)
EXPOSE 8080

# Health check for AWS ECS / Cloud Run
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Set default environment variables
ENV RUST_LOG=info
ENV SERVER_ADDRESS=0.0.0.0:8080

# Run the application
CMD ["/usr/local/bin/miyabi-web-api"]
