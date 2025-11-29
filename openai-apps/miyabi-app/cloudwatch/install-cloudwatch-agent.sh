#!/bin/bash
# ==============================================================================
# CloudWatch Agent Installation Script for Miyabi MCP Server
# ==============================================================================
# This script installs and configures the CloudWatch Agent on EC2 instances
# to collect logs and metrics from the Miyabi MCP Server.
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/cloudwatch-agent-config.json"
AGENT_CONFIG_PATH="/opt/aws/amazon-cloudwatch-agent/etc/config.json"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"

echo ""
echo "=============================================="
log_info "CloudWatch Agent Installation"
echo "=============================================="
echo ""

# Step 1: Check prerequisites
log_step "Step 1: Checking prerequisites..."

# Check if running on Amazon Linux or Ubuntu
if [[ -f /etc/os-release ]]; then
    source /etc/os-release
    OS_NAME="$NAME"
    log_info "Detected OS: $OS_NAME"
else
    log_error "Could not detect OS"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    log_warn "AWS CLI not found. Installing..."
    if [[ "$OS_NAME" == *"Amazon Linux"* ]]; then
        sudo yum install -y aws-cli
    elif [[ "$OS_NAME" == *"Ubuntu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y awscli
    else
        log_error "Unsupported OS for automatic AWS CLI installation"
        exit 1
    fi
fi

# Check if config file exists
if [[ ! -f "$CONFIG_FILE" ]]; then
    log_error "Configuration file not found: $CONFIG_FILE"
    exit 1
fi

log_info "Prerequisites check passed"
echo ""

# Step 2: Download and install CloudWatch Agent
log_step "Step 2: Installing CloudWatch Agent..."

if command -v amazon-cloudwatch-agent-ctl &> /dev/null; then
    log_info "CloudWatch Agent already installed"
else
    log_info "Downloading CloudWatch Agent..."

    if [[ "$OS_NAME" == *"Amazon Linux"* ]]; then
        wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
        sudo rpm -U ./amazon-cloudwatch-agent.rpm
        rm -f ./amazon-cloudwatch-agent.rpm
    elif [[ "$OS_NAME" == *"Ubuntu"* ]]; then
        wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
        sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
        rm -f ./amazon-cloudwatch-agent.deb
    else
        log_error "Unsupported OS"
        exit 1
    fi

    log_info "CloudWatch Agent installed successfully"
fi
echo ""

# Step 3: Configure CloudWatch Agent
log_step "Step 3: Configuring CloudWatch Agent..."

# Create directories
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/logs

# Copy configuration
log_info "Copying configuration file..."
sudo cp "$CONFIG_FILE" "$AGENT_CONFIG_PATH"
sudo chmod 644 "$AGENT_CONFIG_PATH"

log_info "Configuration applied: $AGENT_CONFIG_PATH"
echo ""

# Step 4: Create log directories
log_step "Step 4: Creating log directories..."

sudo mkdir -p /tmp
sudo chmod 777 /tmp

log_info "Log directories created"
echo ""

# Step 5: Verify IAM role
log_step "Step 5: Verifying IAM permissions..."

INSTANCE_PROFILE=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/ || echo "")

if [[ -z "$INSTANCE_PROFILE" ]]; then
    log_warn "No IAM instance profile attached to this EC2 instance"
    log_warn "CloudWatch Agent may not have permissions to write logs"
    log_warn "Please attach the IAM role created by Terraform: miyabi-ec2-cloudwatch-role"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Installation aborted"
        exit 1
    fi
else
    log_info "IAM instance profile detected: $INSTANCE_PROFILE"
fi
echo ""

# Step 6: Start CloudWatch Agent
log_step "Step 6: Starting CloudWatch Agent..."

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:$AGENT_CONFIG_PATH

# Enable CloudWatch Agent to start on boot
if command -v systemctl &> /dev/null; then
    sudo systemctl enable amazon-cloudwatch-agent
fi

log_info "CloudWatch Agent started successfully"
echo ""

# Step 7: Verify installation
log_step "Step 7: Verifying installation..."

sleep 3

# Check agent status
AGENT_STATUS=$(sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a query \
    -m ec2 \
    -c default \
    -j | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [[ "$AGENT_STATUS" == "running" ]]; then
    log_info "✅ CloudWatch Agent is running"
else
    log_error "❌ CloudWatch Agent is not running"
    log_error "Status: $AGENT_STATUS"
    exit 1
fi

# Check agent logs
log_info "Recent agent logs:"
sudo tail -n 10 /opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log
echo ""

# Step 8: Test log collection
log_step "Step 8: Testing log collection..."

# Create test log entry
TEST_LOG_FILE="/tmp/miyabi-mcp-v2.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') - TEST - CloudWatch Agent test log entry" | sudo tee -a "$TEST_LOG_FILE"

log_info "Test log entry created: $TEST_LOG_FILE"
log_info "Logs should appear in CloudWatch within 1-2 minutes"
echo ""

# Summary
echo ""
echo "=============================================="
log_info "✅ Installation Complete!"
echo "=============================================="
echo ""
echo "CloudWatch Agent Status:"
echo "  - Status: $AGENT_STATUS"
echo "  - Config: $AGENT_CONFIG_PATH"
echo "  - Logs:   /opt/aws/amazon-cloudwatch-agent/logs/"
echo ""
echo "CloudWatch Logs:"
echo "  - Log Group: /aws/ec2/miyabi-mcp-server"
echo "  - Region:    $AWS_REGION"
echo ""
echo "Next Steps:"
echo "  1. View logs in AWS Console:"
echo "     https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#logsV2:log-groups/log-group/\$252Faws\$252Fec2\$252Fmiyabi-mcp-server"
echo ""
echo "  2. View metrics in AWS Console:"
echo "     https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#metricsV2:graph=~()"
echo ""
echo "  3. Check agent status:"
echo "     sudo systemctl status amazon-cloudwatch-agent"
echo ""
echo "  4. View agent logs:"
echo "     sudo tail -f /opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log"
echo ""
echo "  5. Restart agent (if needed):"
echo "     sudo systemctl restart amazon-cloudwatch-agent"
echo ""
