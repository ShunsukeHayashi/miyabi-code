# GitHub Actions Self-Hosted Runners Module

Terraform module for deploying AWS EC2-based GitHub Actions self-hosted runners (MUGEN and MAJIN).

## Features

- **MUGEN Runner**: Build and deployment coordinator
  - t3.large (2 vCPU, 8 GB RAM)
  - Docker, Terraform, Rust, AWS CLI
  - Labels: `self-hosted`, `Linux`, `X64`, `mugen`, `docker`, `terraform`

- **MAJIN Runner**: Testing and GPU workloads
  - g4dn.xlarge (4 vCPU, 16 GB RAM, NVIDIA T4 GPU)
  - GPU-enabled Docker with NVIDIA Container Toolkit
  - Labels: `self-hosted`, `Linux`, `X64`, `majin`, `docker`, `gpu`, `testing`

- **Security**:
  - Encrypted EBS volumes
  - IMDSv2 enforced
  - IAM roles for AWS API access
  - Security groups with least privilege

- **Observability**:
  - CloudWatch Logs integration
  - Health check scripts
  - Automatic alerting via SNS

## Usage

```hcl
module "github_runners" {
  source = "../../modules/github-runners"

  project_name  = "miyabi"
  environment   = "dev"
  vpc_id        = module.networking.vpc_id
  vpc_cidr      = "10.0.0.0/16"

  public_subnet_ids = module.networking.public_subnet_ids

  github_org          = "customer-cloud"
  github_runner_token = data.aws_secretsmanager_secret_version.github_token.secret_string

  mugen_instance_type = "t3.large"
  mugen_volume_size   = 100

  majin_instance_type = "g4dn.xlarge"
  majin_volume_size   = 150

  artifacts_bucket        = aws_s3_bucket.artifacts.id
  terraform_state_bucket  = aws_s3_bucket.terraform_state.id
  terraform_lock_table    = aws_dynamodb_table.terraform_locks.id

  log_retention_days = 7
}
```

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.0 |
| aws | ~> 5.0 |

## Providers

| Name | Version |
|------|---------|
| aws | ~> 5.0 |

## Resources Created

### EC2 Instances
- MUGEN runner instance
- MAJIN runner instance
- Elastic IPs for both runners

### Security
- Security group for runners
- IAM role for runner operations
- IAM instance profile
- IAM policies for ECR, S3, Secrets Manager, CloudWatch

### Monitoring
- CloudWatch Log Groups for each runner
- Health check cron jobs
- Auto-recovery scripts

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| project_name | Project name for resource tagging | `string` | `"miyabi"` | no |
| environment | Environment name (dev, staging, prod) | `string` | n/a | yes |
| vpc_id | VPC ID where runners will be deployed | `string` | n/a | yes |
| vpc_cidr | VPC CIDR block for security group rules | `string` | n/a | yes |
| public_subnet_ids | List of public subnet IDs | `list(string)` | n/a | yes |
| github_org | GitHub organization name | `string` | `"customer-cloud"` | no |
| github_runner_token | GitHub runner registration token | `string` | n/a | yes |
| mugen_instance_type | EC2 instance type for MUGEN | `string` | `"t3.large"` | no |
| mugen_volume_size | Root volume size in GB for MUGEN | `number` | `100` | no |
| majin_instance_type | EC2 instance type for MAJIN | `string` | `"g4dn.xlarge"` | no |
| majin_volume_size | Root volume size in GB for MAJIN | `number` | `150` | no |
| artifacts_bucket | S3 bucket for build artifacts | `string` | n/a | yes |
| log_retention_days | CloudWatch log retention days | `number` | `7` | no |

## Outputs

| Name | Description |
|------|-------------|
| mugen_instance_id | EC2 instance ID for MUGEN |
| mugen_public_ip | Elastic IP for MUGEN |
| majin_instance_id | EC2 instance ID for MAJIN |
| majin_public_ip | Elastic IP for MAJIN |
| security_group_id | Security group ID |
| iam_role_arn | IAM role ARN |
| runner_endpoints | SSH connection endpoints |

## Cost Estimation

**Monthly Costs (us-west-2)**:

### MUGEN (t3.large)
- EC2: ~$60/month (on-demand)
- EBS (100 GB): ~$10/month
- EIP: $3.65/month
- **Total**: ~$73.65/month

### MAJIN (g4dn.xlarge)
- EC2: ~$380/month (on-demand)
- EBS (150 GB): ~$15/month
- EIP: $3.65/month
- **Total**: ~$398.65/month

### Combined
- **Total Monthly Cost**: ~$472/month
- **Savings vs GitHub-hosted**: ~$2,060 minutes/month saved (100% of free tier)

## GitHub Runner Registration Token

The `github_runner_token` must be obtained from GitHub:

1. Go to: https://github.com/organizations/customer-cloud/settings/actions/runners/new
2. Copy the registration token
3. Store in AWS Secrets Manager:
   ```bash
   aws secretsmanager create-secret \
     --name miyabi/github/runner-token \
     --secret-string "YOUR_TOKEN_HERE" \
     --region us-west-2
   ```

4. Reference in Terraform:
   ```hcl
   data "aws_secretsmanager_secret_version" "github_token" {
     secret_id = "miyabi/github/runner-token"
   }
   ```

## Post-Deployment

### Verify Runners

1. Check GitHub:
   - Go to: https://github.com/organizations/customer-cloud/settings/actions/runners
   - Verify `mugen` and `majin` are online

2. SSH to runners:
   ```bash
   # MUGEN
   ssh -i ~/.ssh/your-key.pem ubuntu@<MUGEN_PUBLIC_IP>

   # MAJIN
   ssh -i ~/.ssh/your-key.pem ubuntu@<MAJIN_PUBLIC_IP>
   ```

3. Check runner status:
   ```bash
   systemctl status actions.runner.*
   ```

4. View logs:
   ```bash
   journalctl -u actions.runner.* -f
   ```

### Health Monitoring

- Runners perform self-health checks every 5 minutes
- GPU health checks (MAJIN) every 10 minutes
- Alerts sent to SNS topic on failures
- Auto-restart on service failures

## Security Considerations

1. **Token Management**: Store GitHub runner tokens in AWS Secrets Manager
2. **Network Access**: Runners in public subnets but limited by security groups
3. **IAM Permissions**: Least privilege IAM policies
4. **Encryption**: EBS volumes encrypted at rest
5. **Updates**: Runners auto-update daily at 2 AM UTC

## Troubleshooting

### Runner not appearing in GitHub

1. Check instance logs:
   ```bash
   tail -f /var/log/github-runner-setup.log
   ```

2. Verify runner service:
   ```bash
   systemctl status actions.runner.*
   ```

3. Check GitHub registration:
   ```bash
   cd /home/runner/actions-runner
   ./config.sh --check
   ```

### GPU not detected (MAJIN)

1. Verify NVIDIA drivers:
   ```bash
   nvidia-smi
   ```

2. Check Docker GPU support:
   ```bash
   docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
   ```

## License

MIT
