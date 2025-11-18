# Docker Build & Push to ECR - Runbook

**Issue**: #1020
**Part of**: M1 Infrastructure Blitz (#1018)
**Depends on**: Issue #1019 (ECR Repository Setup)
**Created**: 2025-11-18
**Owner**: MUGEN (Primary), Mac (Fallback)
**Duration**: ~20 minutes

---

## 🎯 Objectives

1. Build optimized Docker image for miyabi-web-api
2. Tag image with latest and git SHA
3. Push image to AWS ECR
4. Validate image deployment readiness

---

## ✅ Prerequisites

Before starting, verify:

```bash
# 1. ECR repository exists (from Issue #1019)
aws ecr describe-repositories \
  --repository-names miyabi-web-api \
  --region us-west-2

# Expected output:
# {
#     "repositories": [
#         {
#             "repositoryArn": "arn:aws:ecr:us-west-2:112530848482:repository/miyabi-web-api",
#             "repositoryName": "miyabi-web-api",
#             ...
#         }
#     ]
# }

# 2. AWS CLI configured with correct credentials
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "...",
#     "Account": "112530848482",
#     "Arn": "arn:aws:iam::112530848482:user/..."
# }

# 3. Docker installed and running
docker --version
docker info

# Expected: Docker version 20.10+ running

# 4. Repository up to date with main branch
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
git fetch origin
git status
```

---

## 📦 Task 1: Build Docker Image (10 min)

### 1.1 Navigate to Repository Root

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
```

### 1.2 Verify Dockerfile Health Check

```bash
# Verify HEALTHCHECK is enabled (from Issue #1019)
grep -A 2 "HEALTHCHECK" crates/miyabi-web-api/Dockerfile
```

**Expected output**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
```

### 1.3 Build Multi-platform Image

```bash
# Build for linux/amd64 (AWS ECS requirement)
docker buildx build \
  --platform linux/amd64 \
  -t miyabi-web-api:latest \
  -f crates/miyabi-web-api/Dockerfile \
  --progress=plain \
  .
```

**Build Progress Indicators**:
- ✅ Stage 1: Builder stage (Rust compilation) - ~8 minutes
- ✅ Stage 2: Runtime stage (Debian + app binary) - ~2 minutes

**Expected Output**:
```
[+] Building 600.5s (18/18) FINISHED
 => [internal] load build definition from Dockerfile
 => [builder 1/8] FROM docker.io/library/rust:1.90-slim-bookworm
 => [builder 8/8] RUN cargo build --release --bin miyabi-web-api
 => [runtime 5/5] COPY --from=builder /app/target/release/miyabi-web-api /usr/local/bin/
 => exporting to image
 => => naming to docker.io/library/miyabi-web-api:latest
```

### 1.4 Verify Build Success

```bash
# Check image exists
docker images miyabi-web-api:latest

# Expected output:
# REPOSITORY        TAG       IMAGE ID       CREATED          SIZE
# miyabi-web-api    latest    abc123def456   10 seconds ago   450MB

# Verify image size < 500 MB
docker inspect miyabi-web-api:latest --format='{{.Size}}' | awk '{print $1/1024/1024 " MB"}'
```

---

## 🏷️ Task 2: Tag Image for ECR (2 min)

### 2.1 Get Current Git SHA

```bash
GIT_SHA=$(git rev-parse --short HEAD)
echo "Git SHA: ${GIT_SHA}"
```

**Expected output**:
```
Git SHA: afe07d0
```

### 2.2 Tag with ECR Repository URL

```bash
# Account ID: 112530848482
# Region: us-west-2
ECR_REPO="112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api"

# Tag with 'latest'
docker tag miyabi-web-api:latest ${ECR_REPO}:latest

# Tag with git SHA
docker tag miyabi-web-api:latest ${ECR_REPO}:${GIT_SHA}
```

### 2.3 Verify Tags

```bash
docker images ${ECR_REPO}

# Expected output:
# REPOSITORY                                                    TAG         IMAGE ID       CREATED         SIZE
# 112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api  latest      abc123def456   2 minutes ago   450MB
# 112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api  afe07d0     abc123def456   2 minutes ago   450MB
```

---

## 🔐 Task 3: ECR Login & Push (5 min)

### 3.1 Login to ECR

```bash
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin \
  112530848482.dkr.ecr.us-west-2.amazonaws.com
```

**Expected output**:
```
Login Succeeded
```

**Troubleshooting**:
- If login fails: Check AWS credentials with `aws sts get-caller-identity`
- If permission denied: Verify IAM user has `ecr:GetAuthorizationToken` permission

### 3.2 Push Latest Tag

```bash
docker push ${ECR_REPO}:latest
```

**Expected output**:
```
The push refers to repository [112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api]
abc123def456: Pushed
...
latest: digest: sha256:... size: 2841
```

**Progress Indicators**:
- Layer upload progress bars
- Total push time: ~3-5 minutes (depending on bandwidth)

### 3.3 Push Git SHA Tag

```bash
docker push ${ECR_REPO}:${GIT_SHA}
```

**Expected output**:
```
The push refers to repository [112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api]
abc123def456: Layer already exists
...
afe07d0: digest: sha256:... size: 2841
```

**Note**: This should be much faster (~10 seconds) because layers already exist.

---

## ✅ Task 4: Validate Image in ECR (3 min)

### 4.1 Verify Images in ECR

```bash
aws ecr describe-images \
  --repository-name miyabi-web-api \
  --region us-west-2 \
  --output table
```

**Expected output**:
```
-----------------------------------------------------------
|                    DescribeImages                       |
+---------------------------------------------------------+
||                    imageDetails                       ||
|+--------------+----------------------------------------+|
|| imagePushedAt| 2025-11-18T12:30:00+09:00             ||
|| imageTags    | ["latest", "afe07d0"]                 ||
|| imageDigest  | sha256:...                            ||
|| imageSizeInBytes | 471859200 (~450 MB)               ||
|+--------------+----------------------------------------+|
```

### 4.2 Check Image Scan Results

```bash
aws ecr describe-image-scan-findings \
  --repository-name miyabi-web-api \
  --image-id imageTag=latest \
  --region us-west-2
```

**Expected**: No CRITICAL or HIGH severity vulnerabilities

### 4.3 Test Pull and Run Locally

```bash
# Pull from ECR
docker pull ${ECR_REPO}:latest

# Run container
docker run -d -p 8080:8080 --name miyabi-ecr-test \
  -e DATABASE_URL="dummy" \
  -e REDIS_URL="dummy" \
  ${ECR_REPO}:latest

# Wait for startup
echo "Waiting for container to start..."
sleep 10

# Test health endpoint
curl -v http://localhost:8080/health

# Expected output:
# < HTTP/1.1 200 OK
# {"status":"healthy"}

# Check container logs
docker logs miyabi-ecr-test | tail -20

# Cleanup
docker stop miyabi-ecr-test
docker rm miyabi-ecr-test
```

---

## 🎯 Acceptance Criteria

All of the following must be ✅ before proceeding to Day 3:

- [ ] Docker image builds successfully without errors
- [ ] Build time < 15 minutes
- [ ] Image size < 500 MB
- [ ] Image tagged with both `latest` and git SHA
- [ ] Both tags pushed to ECR successfully
- [ ] Images visible in AWS ECR console
- [ ] Image scan completed with no critical vulnerabilities
- [ ] Health check endpoint responds correctly
- [ ] Container starts and runs without errors

---

## 📊 Validation Commands (Summary)

```bash
# Quick validation script
cat > /tmp/validate-ecr-push.sh <<'EOF'
#!/bin/bash
set -e

echo "🔍 Validating ECR Push..."

# 1. Check ECR images
echo "1️⃣ Checking ECR images..."
IMAGE_COUNT=$(aws ecr describe-images \
  --repository-name miyabi-web-api \
  --region us-west-2 \
  --query 'length(imageDetails)' \
  --output text)

if [ "$IMAGE_COUNT" -ge 1 ]; then
  echo "✅ Found $IMAGE_COUNT image(s) in ECR"
else
  echo "❌ No images found in ECR"
  exit 1
fi

# 2. Check tags
echo "2️⃣ Checking image tags..."
TAGS=$(aws ecr describe-images \
  --repository-name miyabi-web-api \
  --region us-west-2\
  --query 'imageDetails[0].imageTags' \
  --output text)

if echo "$TAGS" | grep -q "latest"; then
  echo "✅ 'latest' tag found"
else
  echo "❌ 'latest' tag missing"
  exit 1
fi

# 3. Pull and test
echo "3️⃣ Testing image pull..."
docker pull 112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api:latest
echo "✅ Image pulled successfully"

echo ""
echo "🎉 All validations passed!"
EOF

chmod +x /tmp/validate-ecr-push.sh
/tmp/validate-ecr-push.sh
```

---

## 🚨 Troubleshooting

### Issue: Build fails with "ERROR [builder X/Y]"

**Solution**:
```bash
# Check Rust version
docker run --rm rust:1.90-slim-bookworm rustc --version

# Clean and rebuild
docker system prune -f
docker buildx build --no-cache ...
```

### Issue: ECR login fails

**Solution**:
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check IAM permissions
aws iam get-user-policy --user-name <your-user> --policy-name ECRAccess

# Re-authenticate
aws configure
```

### Issue: Push fails with "denied: requested access to the resource is denied"

**Solution**:
```bash
# Verify repository exists
aws ecr describe-repositories --repository-names miyabi-web-api --region us-west-2

# Check IAM permissions for ecr:PushImage
aws iam simulate-principal-policy \
  --policy-source-arn $(aws sts get-caller-identity --query Arn --output text) \
  --action-names ecr:PutImage ecr:InitiateLayerUpload ecr:UploadLayerPart ecr:CompleteLayerUpload \
  --resource-arns "arn:aws:ecr:us-west-2:112530848482:repository/miyabi-web-api"
```

### Issue: Health check fails in validation

**Solution**:
```bash
# Check container logs
docker logs miyabi-ecr-test

# Check if app is listening on port 8080
docker exec miyabi-ecr-test netstat -tuln | grep 8080

# Try with environment variables
docker run -d -p 8080:8080 \
  -e DATABASE_URL="postgresql://dummy" \
  -e REDIS_URL="redis://dummy" \
  -e RUST_LOG="debug" \
  --name miyabi-ecr-test \
  ${ECR_REPO}:latest
```

---

## 📝 Post-Execution Checklist

After completing all tasks:

1. Update Issue #1020:
```bash
gh issue comment 1020 --body "✅ Docker Build & Push Complete

**Summary**:
- Image built successfully
- Pushed to ECR with tags: latest, ${GIT_SHA}
- Image size: $(docker inspect ${ECR_REPO}:latest --format='{{.Size}}' | awk '{print $1/1024/1024 " MB"}')
- Scan status: No critical vulnerabilities

**Next**: Ready for Day 3 - VPC & Infrastructure Deployment"
```

2. Record in session log:
```bash
echo "$(date '+%Y-%m-%d %H:%M:%S') - Issue #1020 completed" >> .ai/logs/session-2025-11-18-infinity-mode.md
```

3. Update Plans.md with completion status

---

## 🔗 Next Steps

**Issue #1021**: Deploy VPC, Security Groups & IAM Roles (Day 3)

**Dependencies**:
- ✅ ECR repository exists (#1019)
- ✅ Docker image available in ECR (#1020)
- ⏳ Terraform configuration for VPC

---

## 📚 References

- [ECR Setup Runbook](.ai/runbooks/ecr-setup-runbook.md)
- [Dockerfile](../../crates/miyabi-web-api/Dockerfile)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

---

**Generated**: 2025-11-18
**Format**: Miyabi Runbook v2.0
**Status**: Ready for execution

🌸 Miyabi Society - Orchestrating Infrastructure Excellence 🌸
