# =====================================================
# Miyabi Web API - Multi-stage Dockerfile
# =====================================================

# ---------------------------------
# Stage 1: Development
# ---------------------------------
FROM rust:1.75-slim as development

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install cargo-watch for hot reload
RUN cargo install cargo-watch

# Copy Cargo files for dependency caching
COPY Cargo.toml Cargo.lock ./
COPY crates/miyabi-web-api/Cargo.toml ./crates/miyabi-web-api/

# Create dummy main.rs to build dependencies
RUN mkdir -p crates/miyabi-web-api/src && \
    echo "fn main() {}" > crates/miyabi-web-api/src/main.rs

# Build dependencies (cached layer)
RUN cargo build --package miyabi-web-api

# Remove dummy main.rs
RUN rm crates/miyabi-web-api/src/main.rs

# Copy source code
COPY crates/miyabi-web-api/src ./crates/miyabi-web-api/src
COPY crates/miyabi-web-api/migrations ./crates/miyabi-web-api/migrations

# Expose port
EXPOSE 8080

# Default command (cargo watch for hot reload)
CMD ["cargo", "watch", "-x", "run", "--package", "miyabi-web-api"]

# ---------------------------------
# Stage 2: Builder (for production)
# ---------------------------------
FROM rust:1.75-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./
COPY crates/miyabi-web-api ./crates/miyabi-web-api

# Build release binary
RUN cargo build --release --package miyabi-web-api

# ---------------------------------
# Stage 3: Runtime (production)
# ---------------------------------
FROM debian:bookworm-slim as runtime

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/miyabi-web-api /app/miyabi-web-api

# Copy migrations
COPY --from=builder /app/crates/miyabi-web-api/migrations /app/migrations

# Create non-root user
RUN useradd -m -u 1000 miyabi && \
    chown -R miyabi:miyabi /app

USER miyabi

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run binary
CMD ["/app/miyabi-web-api"]
