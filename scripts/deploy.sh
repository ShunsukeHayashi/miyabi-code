#!/bin/bash

# AI Course Platform Production Deployment Script
# This script handles the complete deployment process

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_ENV="${DEPLOY_ENV:-production}"
SERVICE_NAME="ai-course-platform"
BACKUP_RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handling
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Deployment failed! Check logs above for details."
    fi
}
trap cleanup EXIT

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check for required tools
    local required_tools=("docker" "docker-compose" "node" "npm" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed or not in PATH"
            exit 1
        fi
    done

    # Check for required environment variables
    local required_vars=("JWT_SECRET" "NEXTAUTH_SECRET" "DATABASE_URL")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done

    # Check Node.js version
    local node_version=$(node --version | sed 's/v//')
    local required_version="20.0.0"
    if ! node -e "process.exit(require('semver').gte('$node_version', '$required_version') ? 0 : 1)" 2>/dev/null; then
        log_error "Node.js version $node_version is not supported. Minimum required: $required_version"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Security validation
validate_security() {
    log_info "Running security validation..."

    cd "$PROJECT_ROOT"

    # Run security audit
    npm audit --audit-level=high

    # Check JWT secret strength
    if [ ${#JWT_SECRET} -lt 32 ]; then
        log_error "JWT_SECRET must be at least 32 characters long"
        exit 1
    fi

    # Validate SSL configuration
    if [[ "$DATABASE_URL" != *"sslmode=require"* ]] && [ "$DEPLOY_ENV" = "production" ]; then
        log_warn "Database SSL is not enforced in production"
    fi

    log_success "Security validation completed"
}

# Build application
build_application() {
    log_info "Building application..."

    cd "$PROJECT_ROOT"

    # Install dependencies
    npm ci --frozen-lockfile

    # Run type checking
    npm run type-check

    # Run linting
    npm run lint

    # Run tests
    npm run test

    # Build the application
    npm run build

    log_success "Application built successfully"
}

# Database operations
setup_database() {
    log_info "Setting up database..."

    # Wait for database to be ready
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if npm run db:ping > /dev/null 2>&1; then
            log_success "Database is ready"
            break
        fi

        log_info "Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done

    if [ $attempt -gt $max_attempts ]; then
        log_error "Database is not ready after $max_attempts attempts"
        exit 1
    fi

    # Run database migrations
    npm run db:migrate:deploy

    # Seed database if needed
    if [ "${SEED_DATABASE:-false}" = "true" ]; then
        npm run db:seed
    fi

    log_success "Database setup completed"
}

# Create backup
create_backup() {
    log_info "Creating pre-deployment backup..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="/tmp/backup_$timestamp"

    mkdir -p "$backup_dir"

    # Database backup
    if command -v pg_dump &> /dev/null; then
        pg_dump "$DATABASE_URL" > "$backup_dir/database.sql"
        log_success "Database backup created"
    else
        log_warn "pg_dump not available, skipping database backup"
    fi

    # File backup (if applicable)
    if [ -d "$PROJECT_ROOT/uploads" ]; then
        cp -r "$PROJECT_ROOT/uploads" "$backup_dir/"
        log_success "File uploads backup created"
    fi

    # Compress backup
    tar -czf "/tmp/backup_$timestamp.tar.gz" -C "/tmp" "backup_$timestamp"
    rm -rf "$backup_dir"

    # Upload to cloud storage (if configured)
    if [ -n "${BACKUP_BUCKET:-}" ] && command -v aws &> /dev/null; then
        aws s3 cp "/tmp/backup_$timestamp.tar.gz" "s3://$BACKUP_BUCKET/backups/"
        log_success "Backup uploaded to S3"
    fi

    log_success "Backup created: backup_$timestamp.tar.gz"
}

# Deploy with Docker Compose
deploy_with_docker() {
    log_info "Deploying with Docker Compose..."

    cd "$PROJECT_ROOT"

    # Build Docker image
    docker build -f Dockerfile.production -t "$SERVICE_NAME:latest" .

    # Tag with timestamp for rollback capability
    local timestamp=$(date +%Y%m%d_%H%M%S)
    docker tag "$SERVICE_NAME:latest" "$SERVICE_NAME:$timestamp"

    # Deploy with docker-compose
    docker-compose -f docker-compose.production.yml down --remove-orphans
    docker-compose -f docker-compose.production.yml up -d

    # Wait for services to be healthy
    local services=("app" "db" "redis")
    for service in "${services[@]}"; do
        log_info "Waiting for $service to be healthy..."

        local max_attempts=30
        local attempt=1

        while [ $attempt -le $max_attempts ]; do
            if docker-compose -f docker-compose.production.yml ps "$service" | grep -q "healthy"; then
                log_success "$service is healthy"
                break
            fi

            log_info "Waiting for $service... (attempt $attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        done

        if [ $attempt -gt $max_attempts ]; then
            log_error "$service failed to become healthy"
            docker-compose -f docker-compose.production.yml logs "$service"
            exit 1
        fi
    done

    log_success "Docker deployment completed"
}

# Post-deployment verification
verify_deployment() {
    log_info "Verifying deployment..."

    local app_url="${APP_URL:-http://localhost:3000}"
    local max_attempts=10
    local attempt=1

    # Health check
    while [ $attempt -le $max_attempts ]; do
        if curl -f "$app_url/api/health" > /dev/null 2>&1; then
            log_success "Health check passed"
            break
        fi

        log_info "Health check attempt $attempt/$max_attempts..."
        sleep 5
        ((attempt++))
    done

    if [ $attempt -gt $max_attempts ]; then
        log_error "Health check failed after $max_attempts attempts"
        exit 1
    fi

    # Performance check
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$app_url/api/health")
    if (( $(echo "$response_time > 2.0" | bc -l) )); then
        log_warn "Health check response time is high: ${response_time}s"
    else
        log_success "Health check response time: ${response_time}s"
    fi

    # Cache warming
    log_info "Warming cache..."
    npm run cache:warm || log_warn "Cache warming failed"

    log_success "Deployment verification completed"
}

# Cleanup old resources
cleanup_old_resources() {
    log_info "Cleaning up old resources..."

    # Remove old Docker images (keep last 5)
    docker images "$SERVICE_NAME" --format "table {{.Tag}}\t{{.CreatedAt}}" | \
        grep -E '[0-9]{8}_[0-9]{6}' | \
        sort -k2 -r | \
        tail -n +6 | \
        awk '{print $1}' | \
        xargs -r -I {} docker rmi "$SERVICE_NAME:{}"

    # Clean up old backups
    find /tmp -name "backup_*.tar.gz" -mtime +$BACKUP_RETENTION_DAYS -delete 2>/dev/null || true

    log_success "Cleanup completed"
}

# Rollback function
rollback() {
    log_warn "Rolling back deployment..."

    # Get previous image tag
    local previous_tag=$(docker images "$SERVICE_NAME" --format "table {{.Tag}}" | \
        grep -E '[0-9]{8}_[0-9]{6}' | \
        sort -r | \
        sed -n '2p')

    if [ -z "$previous_tag" ]; then
        log_error "No previous version available for rollback"
        exit 1
    fi

    # Tag previous version as latest
    docker tag "$SERVICE_NAME:$previous_tag" "$SERVICE_NAME:latest"

    # Restart services
    docker-compose -f docker-compose.production.yml down
    docker-compose -f docker-compose.production.yml up -d

    log_success "Rollback to $previous_tag completed"
}

# Main deployment function
main() {
    local start_time=$(date +%s)

    log_info "Starting deployment of $SERVICE_NAME to $DEPLOY_ENV environment..."

    # Handle rollback flag
    if [ "${1:-}" = "--rollback" ]; then
        rollback
        exit 0
    fi

    # Pre-deployment checks
    check_prerequisites
    validate_security

    # Create backup before deployment
    create_backup

    # Build and test
    build_application

    # Deploy
    deploy_with_docker

    # Database setup
    setup_database

    # Post-deployment verification
    verify_deployment

    # Cleanup
    cleanup_old_resources

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_success "Deployment completed successfully in ${duration}s"
    log_info "Application is running at ${APP_URL:-http://localhost:3000}"
}

# Script help
show_help() {
    cat << EOF
AI Course Platform Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    --rollback      Rollback to the previous deployment
    -h, --help      Show this help message

ENVIRONMENT VARIABLES:
    DEPLOY_ENV      Deployment environment (default: production)
    APP_URL         Application URL for verification
    SEED_DATABASE   Set to 'true' to seed database after migration
    BACKUP_BUCKET   S3 bucket for storing backups

EXAMPLES:
    # Normal deployment
    $0

    # Rollback to previous version
    $0 --rollback

    # Deploy with database seeding
    SEED_DATABASE=true $0

EOF
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac