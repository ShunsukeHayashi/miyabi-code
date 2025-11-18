# Outputs for GitHub Actions Self-Hosted Runners Module

output "mugen_instance_id" {
  description = "EC2 instance ID for MUGEN runner"
  value       = aws_instance.mugen.id
}

output "mugen_public_ip" {
  description = "Elastic IP address for MUGEN runner"
  value       = aws_eip.mugen.public_ip
}

output "mugen_private_ip" {
  description = "Private IP address for MUGEN runner"
  value       = aws_instance.mugen.private_ip
}

output "majin_instance_id" {
  description = "EC2 instance ID for MAJIN runner"
  value       = aws_instance.majin.id
}

output "majin_public_ip" {
  description = "Elastic IP address for MAJIN runner"
  value       = aws_eip.majin.public_ip
}

output "majin_private_ip" {
  description = "Private IP address for MAJIN runner"
  value       = aws_instance.majin.private_ip
}

output "security_group_id" {
  description = "Security group ID for runners"
  value       = aws_security_group.runners.id
}

output "iam_role_arn" {
  description = "IAM role ARN for runners"
  value       = aws_iam_role.runner.arn
}

output "iam_instance_profile_name" {
  description = "IAM instance profile name for runners"
  value       = aws_iam_instance_profile.runner.name
}

output "mugen_log_group" {
  description = "CloudWatch log group for MUGEN runner"
  value       = aws_cloudwatch_log_group.mugen.name
}

output "majin_log_group" {
  description = "CloudWatch log group for MAJIN runner"
  value       = aws_cloudwatch_log_group.majin.name
}

output "runner_endpoints" {
  description = "SSH connection endpoints for runners"
  value = {
    mugen = "ubuntu@${aws_eip.mugen.public_ip}"
    majin = "ubuntu@${aws_eip.majin.public_ip}"
  }
}
