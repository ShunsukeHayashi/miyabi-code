# Miyabi Frontend Infrastructure - Main Configuration
# S3 + CloudFront for miyabi-console hosting

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment for remote state
  # backend "s3" {
  #   bucket         = "miyabi-terraform-state"
  #   key            = "frontend/terraform.tfstate"
  #   region         = "ap-northeast-1"
  #   encrypt        = true
  #   dynamodb_table = "miyabi-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# Provider for CloudFront ACM certificate (must be us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = var.tags
  }
}

# ==============================================================================
# S3 Bucket for Static Website Hosting
# ==============================================================================

resource "aws_s3_bucket" "webui" {
  bucket = "${var.project_name}-webui-${var.aws_account_id}"

  tags = {
    Name = "${var.project_name}-webui"
  }
}

resource "aws_s3_bucket_public_access_block" "webui" {
  bucket = aws_s3_bucket.webui.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "webui" {
  bucket = aws_s3_bucket.webui.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "webui" {
  bucket = aws_s3_bucket.webui.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ==============================================================================
# CloudFront Origin Access Control
# ==============================================================================

resource "aws_cloudfront_origin_access_control" "webui" {
  name                              = "${var.project_name}-webui-oac"
  description                       = "OAC for ${var.project_name} WebUI S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ==============================================================================
# S3 Bucket Policy for CloudFront
# ==============================================================================

data "aws_iam_policy_document" "webui_cloudfront" {
  statement {
    sid    = "AllowCloudFrontServicePrincipal"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.webui.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.webui.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "webui" {
  bucket = aws_s3_bucket.webui.id
  policy = data.aws_iam_policy_document.webui_cloudfront.json
}

# ==============================================================================
# CloudFront Distribution
# ==============================================================================

resource "aws_cloudfront_distribution" "webui" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} WebUI Distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_200"  # US, Europe, Asia
  http_version        = "http2and3"

  # Custom domain (optional)
  aliases = var.acm_certificate_arn != "" ? [var.domain_name, "www.${var.domain_name}"] : []

  # S3 Origin
  origin {
    domain_name              = aws_s3_bucket.webui.bucket_regional_domain_name
    origin_id                = "S3-${var.project_name}-webui"
    origin_access_control_id = aws_cloudfront_origin_access_control.webui.id
  }

  # API Origin (optional)
  dynamic "origin" {
    for_each = var.api_origin_domain != "" ? [1] : []
    content {
      domain_name = var.api_origin_domain
      origin_id   = "API"

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  # Default cache behavior (S3 static files)
  default_cache_behavior {
    target_origin_id       = "S3-${var.project_name}-webui"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # Managed cache policy: CachingOptimized
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  # API proxy behavior (optional)
  dynamic "ordered_cache_behavior" {
    for_each = var.api_origin_domain != "" ? [1] : []
    content {
      path_pattern           = "/api/*"
      target_origin_id       = "API"
      viewer_protocol_policy = "https-only"
      allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods         = ["GET", "HEAD"]
      compress               = true

      # Managed cache policy: CachingDisabled
      cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"

      # Managed origin request policy: AllViewerExceptHostHeader
      origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
    }
  }

  # SPA routing: 403/404 -> index.html
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  # SSL Certificate
  viewer_certificate {
    # Use custom certificate if provided, otherwise CloudFront default
    acm_certificate_arn            = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null
    cloudfront_default_certificate = var.acm_certificate_arn == ""
    minimum_protocol_version       = var.acm_certificate_arn != "" ? "TLSv1.2_2021" : null
    ssl_support_method             = var.acm_certificate_arn != "" ? "sni-only" : null
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "${var.project_name}-webui-distribution"
  }
}

# ==============================================================================
# Route53 Records (optional - requires hosted zone)
# ==============================================================================

# Uncomment if you have a Route53 hosted zone
# data "aws_route53_zone" "main" {
#   name         = var.domain_name
#   private_zone = false
# }
#
# resource "aws_route53_record" "webui" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = var.domain_name
#   type    = "A"
#
#   alias {
#     name                   = aws_cloudfront_distribution.webui.domain_name
#     zone_id                = aws_cloudfront_distribution.webui.hosted_zone_id
#     evaluate_target_health = false
#   }
# }
#
# resource "aws_route53_record" "webui_www" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = "www.${var.domain_name}"
#   type    = "A"
#
#   alias {
#     name                   = aws_cloudfront_distribution.webui.domain_name
#     zone_id                = aws_cloudfront_distribution.webui.hosted_zone_id
#     evaluate_target_health = false
#   }
# }
