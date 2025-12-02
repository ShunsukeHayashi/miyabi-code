#!/bin/bash
# Miyabi Context7 - Low-Cost EC2 + Qdrant Setup
# Total cost: ~$17/month instead of $350+/month

set -e

echo "🚀 Miyabi Context7 - Low-Cost Setup"
echo "===================================="

# Configuration
INSTANCE_TYPE="t3.small"  # $15/month
REGION="ap-northeast-1"
KEY_NAME="miyabi-context7"
SECURITY_GROUP="miyabi-context7-sg"

# Step 1: Create Security Group
echo "📦 Creating Security Group..."
aws ec2 create-security-group \
  --group-name $SECURITY_GROUP \
  --description "Miyabi Context7 Server" \
  --region $REGION 2>/dev/null || true

# Allow SSH (22), Qdrant (6333, 6334), API (8080)
aws ec2 authorize-security-group-ingress \
  --group-name $SECURITY_GROUP \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --region $REGION 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
  --group-name $SECURITY_GROUP \
  --protocol tcp --port 6333-6334 --cidr 0.0.0.0/0 \
  --region $REGION 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
  --group-name $SECURITY_GROUP \
  --protocol tcp --port 8080 --cidr 0.0.0.0/0 \
  --region $REGION 2>/dev/null || true

# Step 2: Create EC2 Instance with User Data
echo "🖥️ Launching EC2 Instance..."

USER_DATA=$(cat << 'EOF'
#!/bin/bash
# Install Docker
yum update -y
yum install -y docker git python3-pip
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /opt/miyabi-context7
cd /opt/miyabi-context7

# Create docker-compose.yml
cat > docker-compose.yml << 'COMPOSE'
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    restart: always

  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - QDRANT_URL=http://qdrant:6333
      - EMBEDDING_PROVIDER=local
    depends_on:
      - qdrant
    restart: always

volumes:
  qdrant_data:
COMPOSE

# Create Dockerfile for API
cat > Dockerfile << 'DOCKERFILE'
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
DOCKERFILE

# Create requirements.txt
cat > requirements.txt << 'REQS'
fastapi>=0.100.0
uvicorn>=0.22.0
qdrant-client>=1.6.0
sentence-transformers>=2.2.0
python-multipart>=0.0.6
REQS

# Start services
docker-compose up -d
EOF
)

# Launch instance
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-0f9816f78187c68fb \
  --instance-type $INSTANCE_TYPE \
  --key-name $KEY_NAME \
  --security-groups $SECURITY_GROUP \
  --user-data "$USER_DATA" \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=miyabi-context7}]" \
  --region $REGION \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "✅ Instance launched: $INSTANCE_ID"

# Wait for instance
echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text \
  --region $REGION)

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo ""
echo "Endpoints:"
echo "  API: http://$PUBLIC_IP:8080"
echo "  Qdrant: http://$PUBLIC_IP:6333"
echo ""
echo "MCP Config:"
cat << MCPCONFIG
{
  "mcpServers": {
    "miyabi-context7": {
      "type": "http",
      "url": "http://$PUBLIC_IP:8080/mcp"
    }
  }
}
MCPCONFIG
echo ""
echo "Monthly Cost: ~\$15 (t3.small)"
