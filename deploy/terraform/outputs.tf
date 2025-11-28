# Miyabi Frontend Infrastructure - Outputs

output "s3_bucket_name" {
  description = "S3 bucket name for static website"
  value       = aws_s3_bucket.webui.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.webui.arn
}

output "s3_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name"
  value       = aws_s3_bucket.webui.bucket_regional_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.webui.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.webui.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.webui.domain_name
}

output "website_url" {
  description = "Website URL (CloudFront default or custom domain)"
  value       = var.acm_certificate_arn != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.webui.domain_name}"
}

output "deploy_command" {
  description = "Command to deploy frontend"
  value       = <<-EOT
    # Build and deploy frontend
    cd miyabi-console && npm run build
    aws s3 sync dist/ s3://${aws_s3_bucket.webui.id}/ --delete
    aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.webui.id} --paths "/*"
  EOT
}
