# ECR Repository (if not exists)
resource "aws_ecr_repository" "mcp_sse_gateway" {
  name                 = "${var.project_name}-sse-gateway"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-sse-gateway"
    Environment = var.environment
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "mcp_sse" {
  name = "${var.project_name}-mcp-sse-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "${var.project_name}-mcp-sse-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "mcp_sse" {
  name              = "/ecs/${var.project_name}-sse-gateway-${var.environment}"
  retention_in_days = 7

  tags = {
    Name        = "${var.project_name}-sse-gateway-${var.environment}"
    Environment = var.environment
  }
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-mcp-sse-task-exec-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-mcp-sse-task-exec-${var.environment}"
    Environment = var.environment
  }
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Task (application runtime)
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-mcp-sse-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-mcp-sse-task-${var.environment}"
    Environment = var.environment
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-mcp-sse-alb-${var.environment}"
  description = "Security group for MCP SSE Gateway ALB"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from allowed CIDR"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    description = "HTTP from allowed CIDR (for health check)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-mcp-sse-alb-${var.environment}"
    Environment = var.environment
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-mcp-sse-tasks-${var.environment}"
  description = "Security group for MCP SSE Gateway ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-mcp-sse-tasks-${var.environment}"
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "mcp_sse" {
  name               = "${var.project_name}-mcp-sse-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false
  idle_timeout               = 300 # SSE requires longer timeout

  tags = {
    Name        = "${var.project_name}-mcp-sse-${var.environment}"
    Environment = var.environment
  }
}

# Target Group
resource "aws_lb_target_group" "mcp_sse" {
  name        = "${var.project_name}-mcp-sse-${var.environment}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name        = "${var.project_name}-mcp-sse-${var.environment}"
    Environment = var.environment
  }
}

# ALB Listener (HTTPS if certificate provided, otherwise HTTP)
resource "aws_lb_listener" "mcp_sse" {
  load_balancer_arn = aws_lb.mcp_sse.arn
  port              = var.certificate_arn != "" ? 443 : 80
  protocol          = var.certificate_arn != "" ? "HTTPS" : "HTTP"
  certificate_arn   = var.certificate_arn != "" ? var.certificate_arn : null

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.mcp_sse.arn
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "mcp_sse" {
  family                   = "${var.project_name}-sse-gateway-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "miyabi-sse-gateway"
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = tostring(var.container_port)
        },
        {
          name  = "MIYABI_RULES_API_URL"
          value = var.miyabi_rules_api_url
        },
        {
          name  = "MIYABI_API_KEY"
          value = var.miyabi_api_key
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.mcp_sse.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "node -e \"require('http').get('http://localhost:${var.container_port}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.project_name}-sse-gateway-${var.environment}"
    Environment = var.environment
  }
}

# ECS Service
resource "aws_ecs_service" "mcp_sse" {
  name            = "${var.project_name}-sse-gateway-${var.environment}"
  cluster         = aws_ecs_cluster.mcp_sse.id
  task_definition = aws_ecs_task_definition.mcp_sse.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.mcp_sse.arn
    container_name   = "miyabi-sse-gateway"
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.mcp_sse]

  tags = {
    Name        = "${var.project_name}-sse-gateway-${var.environment}"
    Environment = var.environment
  }
}
