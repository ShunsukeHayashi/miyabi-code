# GitHub Actions Self-Hosted Runners Module
# Provisions EC2 instances for MUGEN and MAJIN coordinators

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data source for latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security Group for GitHub Actions Runners
resource "aws_security_group" "runners" {
  name_prefix = "${var.project_name}-runners-${var.environment}"
  description = "Security group for GitHub Actions self-hosted runners"
  vpc_id      = var.vpc_id

  # Allow outbound HTTPS for GitHub API
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS to GitHub API"
  }

  # Allow outbound HTTP for package updates
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP for package updates"
  }

  # Allow SSH from VPC CIDR (for management)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "SSH from VPC"
  }

  # Allow Docker daemon (if needed)
  ingress {
    from_port   = 2375
    to_port     = 2376
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Docker daemon"
  }

  tags = {
    Name        = "${var.project_name}-runners-sg-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Role for GitHub Actions Runners
resource "aws_iam_role" "runner" {
  name_prefix = "${var.project_name}-runner-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-runner-role-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Policy for Runner Operations
resource "aws_iam_role_policy" "runner_policy" {
  name_prefix = "${var.project_name}-runner-policy"
  role        = aws_iam_role.runner.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRAccess"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Sid    = "SecretsManagerAccess"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:*:*:secret:${var.project_name}/*"
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/github-runners/*"
      },
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.artifacts_bucket}",
          "arn:aws:s3:::${var.artifacts_bucket}/*"
        ]
      },
      {
        Sid    = "TerraformStateAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.terraform_state_bucket}",
          "arn:aws:s3:::${var.terraform_state_bucket}/*"
        ]
      },
      {
        Sid    = "DynamoDBStatelock"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = "arn:aws:dynamodb:*:*:table/${var.terraform_lock_table}"
      }
    ]
  })
}

# Attach SSM managed policy for Session Manager access
resource "aws_iam_role_policy_attachment" "runner_ssm" {
  role       = aws_iam_role.runner.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "runner" {
  name_prefix = "${var.project_name}-runner-${var.environment}"
  role        = aws_iam_role.runner.name

  tags = {
    Name        = "${var.project_name}-runner-profile-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# MUGEN Runner Instance
resource "aws_instance" "mugen" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.mugen_instance_type
  subnet_id     = var.public_subnet_ids[0] # Use public subnet for direct internet access

  vpc_security_group_ids = [aws_security_group.runners.id]
  iam_instance_profile   = aws_iam_instance_profile.runner.name

  user_data = templatefile("${path.module}/user-data-mugen.sh", {
    github_org            = var.github_org
    github_runner_token   = var.github_runner_token
    runner_name           = "mugen"
    runner_labels         = "self-hosted,Linux,X64,mugen,docker,terraform"
    cloudwatch_log_group  = "/aws/github-runners/${var.environment}/mugen"
  })

  root_block_device {
    volume_size           = var.mugen_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_tokens   = "required" # IMDSv2
    http_endpoint = "enabled"
  }

  tags = {
    Name        = "${var.project_name}-mugen-runner-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    RunnerType  = "MUGEN"
    Role        = "Build and Deploy"
  }
}

# MAJIN Runner Instance
resource "aws_instance" "majin" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.majin_instance_type
  subnet_id     = var.public_subnet_ids[1] # Use public subnet for direct internet access

  vpc_security_group_ids = [aws_security_group.runners.id]
  iam_instance_profile   = aws_iam_instance_profile.runner.name

  user_data = templatefile("${path.module}/user-data-majin.sh", {
    github_org            = var.github_org
    github_runner_token   = var.github_runner_token
    runner_name           = "majin"
    runner_labels         = "self-hosted,Linux,X64,majin,docker,gpu,testing"
    cloudwatch_log_group  = "/aws/github-runners/${var.environment}/majin"
  })

  root_block_device {
    volume_size           = var.majin_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_tokens   = "required" # IMDSv2
    http_endpoint = "enabled"
  }

  tags = {
    Name        = "${var.project_name}-majin-runner-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    RunnerType  = "MAJIN"
    Role        = "Testing and GPU Workloads"
  }
}

# Elastic IPs for stable runner addressing
resource "aws_eip" "mugen" {
  instance = aws_instance.mugen.id
  domain   = "vpc"

  tags = {
    Name        = "${var.project_name}-mugen-eip-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_eip" "majin" {
  instance = aws_instance.majin.id
  domain   = "vpc"

  tags = {
    Name        = "${var.project_name}-majin-eip-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# CloudWatch Log Groups for runner logs
resource "aws_cloudwatch_log_group" "mugen" {
  name              = "/aws/github-runners/${var.environment}/mugen"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.project_name}-mugen-logs-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cloudwatch_log_group" "majin" {
  name              = "/aws/github-runners/${var.environment}/majin"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.project_name}-majin-logs-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}
