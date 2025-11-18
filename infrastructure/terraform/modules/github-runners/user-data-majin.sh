#!/bin/bash
set -e

# MAJIN GitHub Actions Runner Setup Script
# This script installs and configures the GitHub Actions runner with GPU support

# Logging setup
exec > >(tee /var/log/github-runner-setup.log)
exec 2>&1

echo "=== MAJIN Runner Setup Started: $(date) ==="

# Update system
apt-get update
apt-get upgrade -y

# Install essential tools
apt-get install -y \
  curl \
  wget \
  git \
  jq \
  unzip \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release \
  build-essential \
  pkg-config \
  libssl-dev

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Install NVIDIA Container Toolkit (for GPU support)
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | tee /etc/apt/sources.list.d/nvidia-docker.list
apt-get update
apt-get install -y nvidia-container-toolkit

# Configure Docker for GPU
cat > /etc/docker/daemon.json <<EOF
{
  "runtimes": {
    "nvidia": {
      "path": "/usr/bin/nvidia-container-runtime",
      "runtimeArgs": []
    }
  },
  "default-runtime": "nvidia"
}
EOF

systemctl restart docker

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source /root/.cargo/env
rustup default stable
cargo --version

# Install testing tools
apt-get install -y \
  postgresql-client \
  redis-tools \
  siege \
  apache2-utils

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install GitHub CLI
type -p wget >/dev/null || apt-get install wget -y
wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /usr/share/keyrings/githubcli-archive-keyring.gpg > /dev/null
chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null
apt-get update
apt-get install gh -y

# Install CloudWatch Logs agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb

# Configure CloudWatch Logs agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/github-runner-setup.log",
            "log_group_name": "${cloudwatch_log_group}",
            "log_stream_name": "setup"
          },
          {
            "file_path": "/home/runner/actions-runner/_diag/*.log",
            "log_group_name": "${cloudwatch_log_group}",
            "log_stream_name": "runner"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Create runner user
useradd -m -s /bin/bash runner
usermod -aG docker runner

# Setup GitHub Actions Runner
cd /home/runner
mkdir actions-runner && cd actions-runner

# Download latest runner package
RUNNER_VERSION=$(curl -s https://api.github.com/repos/actions/runner/releases/latest | jq -r '.tag_name' | sed 's/v//')
curl -o actions-runner-linux-x64-$${RUNNER_VERSION}.tar.gz -L https://github.com/actions/runner/releases/download/v$${RUNNER_VERSION}/actions-runner-linux-x64-$${RUNNER_VERSION}.tar.gz
tar xzf actions-runner-linux-x64-$${RUNNER_VERSION}.tar.gz
rm actions-runner-linux-x64-$${RUNNER_VERSION}.tar.gz

# Change ownership
chown -R runner:runner /home/runner/actions-runner

# Configure runner (as runner user)
sudo -u runner ./config.sh \
  --url https://github.com/${github_org} \
  --token ${github_runner_token} \
  --name ${runner_name} \
  --labels ${runner_labels} \
  --work _work \
  --unattended \
  --replace

# Install and start runner service
./svc.sh install runner
./svc.sh start

# GPU health check script
cat > /usr/local/bin/gpu-health-check.sh <<'GPU_EOF'
#!/bin/bash
if ! nvidia-smi > /dev/null 2>&1; then
  echo "GPU not accessible, alerting..."
  aws sns publish \
    --topic-arn arn:aws:sns:us-west-2:*:miyabi-alerts \
    --message "MAJIN GPU not accessible at $(date)" \
    --subject "MAJIN GPU Health Alert"
fi
GPU_EOF

chmod +x /usr/local/bin/gpu-health-check.sh
echo "*/10 * * * * root /usr/local/bin/gpu-health-check.sh" >> /etc/crontab

# Runner health check script
cat > /usr/local/bin/runner-health-check.sh <<'HEALTH_EOF'
#!/bin/bash
if ! systemctl is-active --quiet actions.runner.*; then
  echo "Runner service not active, restarting..."
  systemctl restart actions.runner.*
  aws sns publish \
    --topic-arn arn:aws:sns:us-west-2:*:miyabi-alerts \
    --message "MAJIN runner restarted at $(date)" \
    --subject "MAJIN Runner Health Alert"
fi
HEALTH_EOF

chmod +x /usr/local/bin/runner-health-check.sh
echo "*/5 * * * * root /usr/local/bin/runner-health-check.sh" >> /etc/crontab

echo "=== MAJIN Runner Setup Completed: $(date) ==="
echo "Runner Name: ${runner_name}"
echo "Labels: ${runner_labels}"
echo "GPU Status: $(nvidia-smi --query-gpu=name --format=csv,noheader || echo 'No GPU')"
echo "Runner Status: $(systemctl is-active actions.runner.* || echo 'not running')"
