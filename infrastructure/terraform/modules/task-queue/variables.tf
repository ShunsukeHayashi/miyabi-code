# Task Queue Module Variables

variable "environment" {
  description = "Environment name (staging/production)"
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be 'staging' or 'production'."
  }
}

variable "visibility_timeout" {
  description = "Visibility timeout in seconds (how long a message is hidden after being received)"
  type        = number
  default     = 300 # 5 minutes - enough time for most agent tasks
}

variable "max_retry_count" {
  description = "Maximum number of times a message can be received before going to DLQ"
  type        = number
  default     = 3
}

variable "enable_fifo_queue" {
  description = "Whether to create a FIFO queue for ordered task execution"
  type        = bool
  default     = false
}

variable "queue_depth_alarm_threshold" {
  description = "Number of messages that trigger queue depth alarm"
  type        = number
  default     = 500
}

variable "max_message_age_seconds" {
  description = "Maximum age of oldest message before alarm (in seconds)"
  type        = number
  default     = 3600 # 1 hour
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
