# ClickFunnels Complete Auto-Implementation
# SWML θ₄ Phase P0 Task T004
# Multi-stage Dockerfile for Rust backend

# ============================================================================
# Development stage
# ============================================================================
FROM rust:1.75-slim as development

WORKDIR /app

# Install development dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install cargo-watch for hot reload
RUN cargo install cargo-watch

# Copy workspace configuration
COPY Cargo.toml ./
COPY clickfunnels-core/Cargo.toml ./clickfunnels-core/
COPY clickfunnels-api/Cargo.toml ./clickfunnels-api/
COPY clickfunnels-db/Cargo.toml ./clickfunnels-db/
COPY clickfunnels-server/Cargo.toml ./clickfunnels-server/

# Create dummy main files to build dependencies
RUN mkdir -p clickfunnels-core/src clickfunnels-api/src clickfunnels-db/src clickfunnels-server/src && \
    echo "fn main() {}" > clickfunnels-server/src/main.rs && \
    echo "" > clickfunnels-core/src/lib.rs && \
    echo "" > clickfunnels-api/src/lib.rs && \
    echo "" > clickfunnels-db/src/lib.rs

# Build dependencies (cached layer)
RUN cargo build

# Remove dummy files
RUN rm -rf clickfunnels-*/src

# Default command for development
CMD ["cargo", "watch", "-x", "run --bin clickfunnels-server"]

# ============================================================================
# Builder stage
# ============================================================================
FROM rust:1.75-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy all source code
COPY . .

# Build release binary
RUN cargo build --release --bin clickfunnels-server

# ============================================================================
# Production stage
# ============================================================================
FROM debian:bookworm-slim as production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 app

# Copy binary from builder
COPY --from=builder /app/target/release/clickfunnels-server /usr/local/bin/clickfunnels-server

# Set permissions
RUN chown app:app /usr/local/bin/clickfunnels-server

# Switch to app user
USER app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["clickfunnels-server"]
