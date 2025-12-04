# Miyabi Sandbox Container
# Lightweight runtime environment (no heavy build tools in first stage)

# ============================================
# Single-stage build (simpler, faster)
# ============================================
FROM ubuntu:24.04

LABEL maintainer="Miyabi Team <support@miyabi-world.com>"
LABEL description="Miyabi Sandbox Development Environment"
LABEL version="1.0.1"

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# ============================================
# System packages
# ============================================
RUN apt-get update && apt-get install -y \
    # Core utilities
    curl wget git vim nano tmux htop tree jq \
    # Build essentials
    build-essential pkg-config libssl-dev \
    # Python
    python3 python3-pip python3-venv \
    # Node.js prerequisites
    ca-certificates gnupg \
    # Network tools
    openssh-client net-tools iputils-ping \
    # Misc
    unzip zip sudo locales \
    && rm -rf /var/lib/apt/lists/*

# Set locale
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# ============================================
# Node.js 20 LTS
# ============================================
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    typescript \
    ts-node \
    pnpm \
    yarn

# ============================================
# Rust (install via rustup - gets latest stable)
# ============================================
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    && . "$HOME/.cargo/env" \
    && rustup component add clippy rustfmt

ENV RUSTUP_HOME=/root/.rustup
ENV CARGO_HOME=/root/.cargo
ENV PATH=/root/.cargo/bin:$PATH

# ============================================
# GitHub CLI
# ============================================
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# ============================================
# AWS CLI v2
# ============================================
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws

# ============================================
# Create workspace user
# ============================================
RUN useradd -m -s /bin/bash -G sudo miyabi \
    && echo "miyabi ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && cp -r /root/.cargo /home/miyabi/.cargo \
    && cp -r /root/.rustup /home/miyabi/.rustup \
    && chown -R miyabi:miyabi /home/miyabi/.cargo /home/miyabi/.rustup

# ============================================
# Workspace setup
# ============================================
WORKDIR /workspace
RUN chown miyabi:miyabi /workspace

# Create standard directories
RUN mkdir -p /workspace/.miyabi \
    && mkdir -p /workspace/.config \
    && mkdir -p /workspace/.cache \
    && chown -R miyabi:miyabi /workspace

# ============================================
# Environment configuration
# ============================================
ENV HOME=/workspace
ENV USER=miyabi
ENV TERM=xterm-256color
ENV RUSTUP_HOME=/home/miyabi/.rustup
ENV CARGO_HOME=/home/miyabi/.cargo
ENV PATH=/home/miyabi/.cargo/bin:$PATH

# Miyabi defaults (overridden at runtime)
ENV MIYABI_ENV=sandbox
ENV MIYABI_LOG_LEVEL=info

# ============================================
# Health check
# ============================================
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# ============================================
# Ports
# ============================================
EXPOSE 8080

# ============================================
# Entrypoint
# ============================================
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER miyabi
ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]
