# 🚀 ECR Repository Setup - Execution Runbook

**Issue**: #1019
**Created**: 2025-11-18
**Owner**: Infrastructure Team

---

## 📋 Prerequisites

- [x] AWS CLI installed and configured
- [x] AWS credentials with ECR permissions
- [x] Target region: `us-west-2`
- [x] AWS Account ID: `112530848482`

---

## 🎯 Objective

Create ECR repository for `miyabi-web-api` with security best practices enabled.

---

## ✅ Step 1: Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name miyabi-web-api \
  --region us-west-2 \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  --tags Key=Project,Value=miyabi Key=Environment,Value=prod Key=ManagedBy,Value=terraform
```

**Expected Output**:
```json
{
    "repository": {
        "repositoryArn": "arn:aws:ecr:us-west-2:112530848482:repository/miyabi-web-api",
        "registryId": "112530848482",
        "repositoryName": "miyabi-web-api",
        "repositoryUri": "112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api"
    }
}
```

**Repository URI**: `112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api`

---

## ✅ Step 2: Verify Repository

```bash
aws ecr describe-repositories \
  --repository-names miyabi-web-api \
  --region us-west-2
```

**Validation Checklist**:
- [ ] Repository exists in `us-west-2`
- [ ] Image scanning on push: `enabled`
- [ ] Encryption: `AES256`
- [ ] Tags applied correctly

---

## ✅ Step 3: Set Lifecycle Policy (Optional)

Keep only the last 10 images to reduce storage costs:

```bash
cat > /tmp/lifecycle-policy.json <<'EOF'
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
EOF

aws ecr put-lifecycle-policy \
  --repository-name miyabi-web-api \
  --lifecycle-policy-text file:///tmp/lifecycle-policy.json \
  --region us-west-2
```

---

## ✅ Step 4: Configure Repository Permissions (Optional)

Allow ECS task execution role to pull images:

```bash
cat > /tmp/repo-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowECSTaskExecutionRole",
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability"
      ]
    }
  ]
}
EOF

aws ecr set-repository-policy \
  --repository-name miyabi-web-api \
  --policy-text file:///tmp/repo-policy.json \
  --region us-west-2
```

---

## 🔍 Validation

### Test ECR Login

```bash
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin \
  112530848482.dkr.ecr.us-west-2.amazonaws.com
```

**Expected**: `Login Succeeded`

---

## 📊 Completion Checklist

- [ ] ECR repository created
- [ ] Image scanning enabled
- [ ] Encryption configured
- [ ] Tags applied
- [ ] Lifecycle policy set
- [ ] Repository permissions configured
- [ ] ECR login tested successfully
- [ ] Repository URI documented

---

## 🔗 Next Steps

**Issue #1020**: Docker Image Build & Push to ECR

---

## 📝 Notes

- Repository URI will be used in ECS task definitions
- Make sure to update Terraform/CDK if infrastructure as code is used
- Document this URI in deployment configuration

---

**Status**: ✅ Ready to Execute
**Estimated Time**: 5-10 minutes
