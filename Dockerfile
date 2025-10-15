# ==============================================================================
# Miyabi Dockerfile - Rust Edition Multi-stage Build
# ==============================================================================
# Purpose: Rust workspace containerization with optimized build caching
# Target: Mac mini SSH access + GitHub Actions self-hosted runner
# Migration: TypeScript → Rust 2021 Edition (50%+ faster, 30%+ memory reduction)
# Author: Shunsuke Hayashi
# Version: 2.0 (Rust Edition)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Builder - Rust環境セットアップ
# ------------------------------------------------------------------------------
FROM rust:1.90-slim-bookworm AS base-builder

# 作業ディレクトリ設定
WORKDIR /app

# システム依存関係インストール
# - pkg-config: Rust crateのビルドに必要
# - libssl-dev: reqwest, octocrab等のHTTPS通信
# - git: git2 crateとWorktree操作
# - gh: GitHub CLI (RefresherAgent等で使用)
# - ca-certificates: SSL証明書
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    git \
    ca-certificates \
    curl \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install gh -y \
    && rm -rf /var/lib/apt/lists/*

# Rust toolchain設定
RUN rustup component add rustfmt clippy

# ------------------------------------------------------------------------------
# Stage 2: Dependencies Cache - 依存関係ビルドキャッシュ
# ------------------------------------------------------------------------------
FROM base-builder AS dependencies

# Cargo.toml とCargo.lock のみコピー（依存関係解決）
COPY Cargo.toml Cargo.lock ./
COPY crates/miyabi-types/Cargo.toml ./crates/miyabi-types/
COPY crates/miyabi-core/Cargo.toml ./crates/miyabi-core/
COPY crates/miyabi-cli/Cargo.toml ./crates/miyabi-cli/
COPY crates/miyabi-agents/Cargo.toml ./crates/miyabi-agents/
COPY crates/miyabi-github/Cargo.toml ./crates/miyabi-github/
COPY crates/miyabi-worktree/Cargo.toml ./crates/miyabi-worktree/

# ダミーソースファイル作成（依存関係のみビルド）
RUN mkdir -p crates/miyabi-types/src \
    && echo "fn main() {}" > crates/miyabi-types/src/lib.rs \
    && mkdir -p crates/miyabi-core/src \
    && echo "fn main() {}" > crates/miyabi-core/src/lib.rs \
    && mkdir -p crates/miyabi-cli/src \
    && echo "fn main() {}" > crates/miyabi-cli/src/lib.rs \
    && echo "fn main() {}" > crates/miyabi-cli/src/main.rs \
    && mkdir -p crates/miyabi-agents/src \
    && echo "fn main() {}" > crates/miyabi-agents/src/lib.rs \
    && mkdir -p crates/miyabi-github/src \
    && echo "fn main() {}" > crates/miyabi-github/src/lib.rs \
    && mkdir -p crates/miyabi-worktree/src \
    && echo "fn main() {}" > crates/miyabi-worktree/src/lib.rs

# 依存関係のみビルド（ソースコード変更時でもキャッシュ再利用）
RUN cargo build --release && rm -rf target/release/.fingerprint/miyabi-*

# ------------------------------------------------------------------------------
# Stage 3: Builder - アプリケーションビルド
# ------------------------------------------------------------------------------
FROM dependencies AS builder

# 実際のソースコードをコピー
COPY crates/ ./crates/

# リリースビルド実行
# - LTO有効（最適化）
# - Strip有効（バイナリサイズ削減）
# - Single codegen unit（最大最適化）
RUN cargo build --release --bin miyabi

# バイナリサイズ確認（デバッグ用）
RUN ls -lh target/release/miyabi && strip target/release/miyabi && ls -lh target/release/miyabi

# ------------------------------------------------------------------------------
# Stage 4: Runtime - 本番環境（最小イメージ）
# ------------------------------------------------------------------------------
FROM debian:bookworm-slim AS runtime

# ランタイム依存のみインストール
RUN apt-get update && apt-get install -y \
    ca-certificates \
    git \
    curl \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install gh -y \
    && rm -rf /var/lib/apt/lists/*

# 非rootユーザー作成（セキュリティベストプラクティス）
RUN useradd -m -u 1000 miyabi && \
    mkdir -p /app && \
    chown -R miyabi:miyabi /app

WORKDIR /app

# ビルド済みバイナリコピー
COPY --from=builder --chown=miyabi:miyabi /app/target/release/miyabi /usr/local/bin/miyabi

# .claudeディレクトリコピー（Agent prompts, commands等）
COPY --chown=miyabi:miyabi .claude/ /app/.claude/

# 環境変数設定
ENV RUST_LOG=info
ENV PATH="/usr/local/bin:${PATH}"

# ユーザー切り替え
USER miyabi

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD miyabi --version || exit 1

# デフォルトコマンド
CMD ["miyabi", "--help"]

# ------------------------------------------------------------------------------
# Stage 5: Development - 開発環境（フル機能）
# ------------------------------------------------------------------------------
FROM base-builder AS development

# 開発ツール追加インストール
RUN apt-get update && apt-get install -y \
    vim \
    less \
    jq \
    && rm -rf /var/lib/apt/lists/*

# ソースコード全体コピー
COPY . /app

# 開発用ユーザー作成
RUN useradd -m -u 1000 miyabi && \
    chown -R miyabi:miyabi /app

USER miyabi

# 環境変数
ENV RUST_LOG=debug
ENV RUST_BACKTRACE=1

# 開発サーバー起動（ホットリロード想定）
CMD ["cargo", "watch", "-x", "run"]

# ==============================================================================
# ビルドコマンド例:
#
# 1. 本番環境イメージ（最小サイズ）:
#    docker build --target runtime -t miyabi:latest .
#
# 2. 開発環境イメージ（フル機能）:
#    docker build --target development -t miyabi:dev .
#
# 3. マルチプラットフォームビルド（Mac mini ARM64 + x86_64）:
#    docker buildx build --platform linux/amd64,linux/arm64 \
#      --target runtime -t miyabi:latest .
#
# ==============================================================================
# 実行コマンド例:
#
# 1. 本番環境:
#    docker run --rm miyabi:latest miyabi status
#
# 2. 開発環境（ボリュームマウント）:
#    docker run --rm -v $(pwd):/app -it miyabi:dev bash
#
# 3. SSH経由でのアクセス（Mac mini）:
#    ssh user@mac-mini "docker run --rm miyabi:latest miyabi agent run coordinator"
#
# ==============================================================================
# Labels
LABEL org.opencontainers.image.title="Miyabi Agent Runtime - Rust Edition"
LABEL org.opencontainers.image.description="Rust-based autonomous agent runtime (50%+ faster than TypeScript)"
LABEL org.opencontainers.image.vendor="Miyabi Team"
LABEL org.opencontainers.image.source="https://github.com/ShunsukeHayashi/Miyabi"
LABEL org.opencontainers.image.documentation="https://github.com/ShunsukeHayashi/Miyabi/blob/main/docs/DOCKER.md"
LABEL org.opencontainers.image.version="2.0-rust"
