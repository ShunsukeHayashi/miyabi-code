# Miyabi Web API - Production Dockerfile for GCP Cloud Run
# Multi-stage build for optimal image size

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

# Build dependencies (cached layer)
RUN cargo build --release --package miyabi-web-api

# Stage 2: Runtime
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
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

# Health check (TEMPORARY: Disabled for Telegram-only deployment)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#     CMD ["/usr/local/bin/miyabi-web-api", "--version"] || exit 1

# Set default environment variables
ENV RUST_LOG=info
ENV SERVER_ADDRESS=0.0.0.0:8080

# Run the application
CMD ["/usr/local/bin/miyabi-web-api"]
