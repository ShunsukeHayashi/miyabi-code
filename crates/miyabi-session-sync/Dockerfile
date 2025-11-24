# Build stage
FROM rust:1.75-bookworm as builder

WORKDIR /usr/src/app

# Copy workspace files
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates

# Build only the session-sync binary
RUN cargo build --release -p miyabi-session-sync

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    openssh-client \
    rsync \
    && rm -rf /var/lib/apt/lists/*

# Copy binary
COPY --from=builder /usr/src/app/target/release/miyabi-session-sync /usr/local/bin/

# Create non-root user
RUN useradd -m -u 1000 miyabi
USER miyabi

# Set environment variables
ENV RUST_LOG=info
ENV PORT=9876

# Expose port
EXPOSE 9876

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:9876/health || exit 1

# Run the server
CMD ["miyabi-session-sync", "--port", "9876"]
