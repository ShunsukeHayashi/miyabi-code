# Task Queue Module Outputs

output "agent_tasks_queue_url" {
  description = "URL of the main agent tasks queue"
  value       = aws_sqs_queue.agent_tasks.url
}

output "agent_tasks_queue_arn" {
  description = "ARN of the main agent tasks queue"
  value       = aws_sqs_queue.agent_tasks.arn
}

output "agent_tasks_queue_name" {
  description = "Name of the main agent tasks queue"
  value       = aws_sqs_queue.agent_tasks.name
}

output "high_priority_queue_url" {
  description = "URL of the high priority queue"
  value       = aws_sqs_queue.high_priority.url
}

output "high_priority_queue_arn" {
  description = "ARN of the high priority queue"
  value       = aws_sqs_queue.high_priority.arn
}

output "agent_results_queue_url" {
  description = "URL of the agent results queue"
  value       = aws_sqs_queue.agent_results.url
}

output "agent_results_queue_arn" {
  description = "ARN of the agent results queue"
  value       = aws_sqs_queue.agent_results.arn
}

output "dlq_queue_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.agent_tasks_dlq.url
}

output "dlq_queue_arn" {
  description = "ARN of the dead letter queue"
  value       = aws_sqs_queue.agent_tasks_dlq.arn
}

output "fifo_queue_url" {
  description = "URL of the FIFO queue (if enabled)"
  value       = var.enable_fifo_queue ? aws_sqs_queue.ordered_tasks[0].url : null
}

output "fifo_queue_arn" {
  description = "ARN of the FIFO queue (if enabled)"
  value       = var.enable_fifo_queue ? aws_sqs_queue.ordered_tasks[0].arn : null
}

output "queue_access_policy_arn" {
  description = "ARN of the IAM policy for queue access"
  value       = aws_iam_policy.task_queue_access.arn
}

output "queue_urls" {
  description = "Map of all queue URLs"
  value = {
    tasks         = aws_sqs_queue.agent_tasks.url
    high_priority = aws_sqs_queue.high_priority.url
    results       = aws_sqs_queue.agent_results.url
    dlq           = aws_sqs_queue.agent_tasks_dlq.url
  }
}

output "queue_arns" {
  description = "Map of all queue ARNs"
  value = {
    tasks         = aws_sqs_queue.agent_tasks.arn
    high_priority = aws_sqs_queue.high_priority.arn
    results       = aws_sqs_queue.agent_results.arn
    dlq           = aws_sqs_queue.agent_tasks_dlq.arn
  }
}
