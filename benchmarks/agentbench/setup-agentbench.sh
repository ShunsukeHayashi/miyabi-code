#!/bin/bash
# AgentBench FC 環境セットアップスクリプト
# Usage: ./setup-agentbench.sh [step]
#
# Steps:
#   deps    - Install Python dependencies
#   docker  - Build required Docker images
#   compose - Start Docker Compose environment
#   all     - Run all steps

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTBENCH_DIR="${PROJECT_ROOT}/AgentBench"

echo "📦 AgentBench FC Setup Script"
echo "Working directory: ${AGENTBENCH_DIR}"
echo ""

# Function: Install dependencies
install_deps() {
    echo "📥 Step 1: Installing Python dependencies..."
    cd "${AGENTBENCH_DIR}"

    if [ ! -f requirements.txt ]; then
        echo "❌ Error: requirements.txt not found"
        exit 1
    fi

    pip install -r requirements.txt
    echo "✅ Dependencies installed"
}

# Function: Build Docker images
build_docker_images() {
    echo "🐳 Step 2: Building Docker images..."
    cd "${AGENTBENCH_DIR}"

    # MySQL for DBBench
    echo "  - Pulling MySQL 8..."
    docker pull mysql:8

    # OS Interaction images
    echo "  - Building OS Interaction images..."
    docker build -t local-os/default \
        -f ./data/os_interaction/res/dockerfiles/default \
        ./data/os_interaction/res/dockerfiles

    docker build -t local-os/packages \
        -f ./data/os_interaction/res/dockerfiles/packages \
        ./data/os_interaction/res/dockerfiles

    docker build -t local-os/ubuntu \
        -f ./data/os_interaction/res/dockerfiles/ubuntu \
        ./data/os_interaction/res/dockerfiles

    echo "✅ Docker images built"
}

# Function: Setup Freebase data
setup_freebase() {
    echo "📚 Step 3: Freebase data setup..."
    echo ""
    echo "⚠️  Freebase data setup requires manual steps:"
    echo "   1. Download Freebase dump from: https://github.com/dki-lab/Freebase-Setup"
    echo "   2. Follow setup instructions to create virtuoso_db/virtuoso.db"
    echo "   3. Place virtuoso.db in: ${AGENTBENCH_DIR}/virtuoso_db/"
    echo ""
    echo "   Required space: ~40GB"
    echo "   Estimated time: 2-4 hours"
    echo ""

    read -p "Have you completed Freebase setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Freebase setup incomplete. Please complete setup before proceeding."
        exit 1
    fi

    echo "✅ Freebase setup confirmed"
}

# Function: Start Docker Compose
start_compose() {
    echo "🚀 Step 4: Starting Docker Compose environment..."
    cd "${AGENTBENCH_DIR}"

    if [ ! -f extra/docker-compose.yml ]; then
        echo "❌ Error: docker-compose.yml not found"
        exit 1
    fi

    docker compose -f extra/docker-compose.yml up -d

    echo ""
    echo "✅ Docker Compose started"
    echo ""
    echo "📊 Running services:"
    docker compose -f extra/docker-compose.yml ps
}

# Function: Stop Docker Compose
stop_compose() {
    echo "🛑 Stopping Docker Compose environment..."
    cd "${AGENTBENCH_DIR}"
    docker compose -f extra/docker-compose.yml down
    echo "✅ Docker Compose stopped"
}

# Function: Show status
show_status() {
    echo "📊 AgentBench FC Status"
    echo ""

    cd "${AGENTBENCH_DIR}"

    # Check Python dependencies
    if python3 -c "import importlib.util; exit(0 if importlib.util.find_spec('agentbench') else 1)" 2>/dev/null; then
        echo "✅ Python dependencies: Installed"
    else
        echo "❌ Python dependencies: Not installed"
    fi

    # Check Docker images
    echo ""
    echo "Docker images:"
    docker images | grep -E "(mysql|local-os)" || echo "  ❌ No required images found"

    # Check Docker Compose
    echo ""
    if docker compose -f extra/docker-compose.yml ps --format=table | grep -q "Up"; then
        echo "✅ Docker Compose: Running"
        docker compose -f extra/docker-compose.yml ps
    else
        echo "❌ Docker Compose: Not running"
    fi
}

# Main execution
case "${1:-help}" in
    deps)
        install_deps
        ;;
    docker)
        build_docker_images
        ;;
    freebase)
        setup_freebase
        ;;
    compose)
        start_compose
        ;;
    stop)
        stop_compose
        ;;
    status)
        show_status
        ;;
    all)
        install_deps
        build_docker_images
        setup_freebase
        start_compose
        ;;
    help|*)
        echo "Usage: $0 [step]"
        echo ""
        echo "Steps:"
        echo "  deps      - Install Python dependencies"
        echo "  docker    - Build required Docker images"
        echo "  freebase  - Setup Freebase data (interactive)"
        echo "  compose   - Start Docker Compose environment"
        echo "  stop      - Stop Docker Compose environment"
        echo "  status    - Show current status"
        echo "  all       - Run all setup steps"
        echo ""
        echo "Example:"
        echo "  $0 all              # Full setup"
        echo "  $0 deps             # Install Python deps only"
        echo "  $0 compose          # Start environment"
        echo "  $0 status           # Check status"
        ;;
esac
