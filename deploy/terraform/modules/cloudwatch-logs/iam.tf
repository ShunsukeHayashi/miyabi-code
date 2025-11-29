# ==============================================================================
# IAM Resources for CloudWatch Logs
# ==============================================================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_cloudwatch" {
  count = var.create_iam_role ? 1 : 0

  name               = var.iam_role_name != "" ? var.iam_role_name : "${var.project_name}-ec2-cloudwatch-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-ec2-cloudwatch-role"
    }
  )
}

data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_cloudwatch" {
  count = var.create_iam_role ? 1 : 0

  name = "${var.project_name}-ec2-cloudwatch-profile"
  role = aws_iam_role.ec2_cloudwatch[0].name

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-ec2-cloudwatch-profile"
    }
  )
}

# CloudWatch Logs Policy
resource "aws_iam_policy" "cloudwatch_logs" {
  count = var.create_iam_role ? 1 : 0

  name        = "${var.project_name}-cloudwatch-logs-policy"
  description = "Policy for EC2 instances to write to CloudWatch Logs"
  policy      = data.aws_iam_policy_document.cloudwatch_logs.json

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-cloudwatch-logs-policy"
    }
  )
}

data "aws_iam_policy_document" "cloudwatch_logs" {
  # CloudWatch Logs permissions
  statement {
    sid    = "CloudWatchLogsWrite"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]

    resources = [
      "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/ec2/${var.project_name}-*",
      "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/ec2/${var.project_name}-*:log-stream:*"
    ]
  }

  # CloudWatch metrics permissions
  statement {
    sid    = "CloudWatchMetricsWrite"
    effect = "Allow"

    actions = [
      "cloudwatch:PutMetricData"
    ]

    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "cloudwatch:namespace"
      values   = [var.cloudwatch_namespace]
    }
  }

  # EC2 metadata permissions (for CloudWatch Agent)
  statement {
    sid    = "EC2MetadataAccess"
    effect = "Allow"

    actions = [
      "ec2:DescribeVolumes",
      "ec2:DescribeTags",
      "ec2:DescribeInstances"
    ]

    resources = ["*"]
  }

  # KMS permissions for log encryption
  statement {
    sid    = "KMSDecryptEncrypt"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey"
    ]

    resources = [aws_kms_key.cloudwatch_logs.arn]

    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["logs.${var.aws_region}.amazonaws.com"]
    }
  }
}

# Attach CloudWatch Logs policy to role
resource "aws_iam_role_policy_attachment" "cloudwatch_logs" {
  count = var.create_iam_role ? 1 : 0

  role       = aws_iam_role.ec2_cloudwatch[0].name
  policy_arn = aws_iam_policy.cloudwatch_logs[0].arn
}

# Attach AWS managed CloudWatch Agent policy
resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  count = var.create_iam_role ? 1 : 0

  role       = aws_iam_role.ec2_cloudwatch[0].name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# SSM permissions for CloudWatch Agent configuration
resource "aws_iam_role_policy_attachment" "ssm_managed_instance" {
  count = var.create_iam_role ? 1 : 0

  role       = aws_iam_role.ec2_cloudwatch[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
