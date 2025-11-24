//! AWS Resource Types
//!
//! Type definitions for AWS resources, accounts, and service agents.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// AWS Account representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AwsAccount {
    pub id: String,
    pub name: String,
    pub role: AccountRole,
    pub region: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AccountRole {
    Management,
    Production,
    Security,
    Development,
}

/// AWS Resource representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AwsResource {
    pub id: String,
    pub arn: String,
    pub resource_type: AwsResourceType,
    pub region: String,
    pub account_id: String,
    pub state: ResourceState,
    pub owner_agent: HistoricalAgent,
    pub dependencies: Vec<String>,
    pub tags: HashMap<String, String>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AwsResourceType {
    Ec2Instance,
    S3Bucket,
    LambdaFunction,
    RdsInstance,
    DynamoDbTable,
    CloudFormationStack,
    VpcNetwork,
    CloudFrontDistribution,
    ApiGateway,
    LoadBalancer,
    AutoScalingGroup,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ResourceState {
    Creating,
    Active,
    Updating,
    Deleting,
    Failed,
    Terminated,
}

/// Service Agent representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceAgent {
    pub name: String,
    pub service_type: AwsResourceType,
    pub dependencies: Vec<String>,
    pub state: ResourceState,
    pub autonomy_level: u8,
    pub decision_maker: HistoricalAgent,
    pub cost_per_day: f64,
    pub health_status: HealthStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum HistoricalAgent {
    BillGates,      // EC2, Lambda (compute)
    SteveJobs,      // CloudFront, S3 (frontend)
    Napoleon,       // Auto Scaling, Load Balancer (strategy)
    Hannibal,       // Lambda@Edge, CloudFront Functions (tactics)
    Drucker,        // CloudWatch, X-Ray (management)
    Kotler,         // API Gateway, SNS (marketing/communication)
    Noguchi,        // RDS, DynamoDB (research data)
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum HealthStatus {
    Healthy,
    Degraded,
    Unhealthy,
    Unknown,
}

/// AWS Agent Task
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AwsTask {
    pub id: Uuid,
    pub task_type: AwsTaskType,
    pub resource_type: AwsResourceType,
    pub account_id: String,
    pub region: String,
    pub parameters: HashMap<String, serde_json::Value>,
    pub dependencies: Vec<String>,
    pub assigned_agent: HistoricalAgent,
    pub status: TaskStatus,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AwsTaskType {
    CreateResource,
    UpdateResource,
    DeleteResource,
    DiscoverResources,
    OptimizeCosts,
    SecurityAudit,
    HealthCheck,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Cancelled,
    Blocked,
}

impl HistoricalAgent {
    /// Assign historical agent based on resource type
    pub fn for_resource_type(resource_type: &AwsResourceType) -> Self {
        match resource_type {
            // Compute (Bill Gates)
            AwsResourceType::Ec2Instance => Self::BillGates,
            AwsResourceType::LambdaFunction => Self::BillGates,

            // Frontend/CDN (Steve Jobs)
            AwsResourceType::CloudFrontDistribution => Self::SteveJobs,
            AwsResourceType::S3Bucket => Self::SteveJobs,

            // Scaling/Strategy (Napoleon)
            AwsResourceType::AutoScalingGroup => Self::Napoleon,
            AwsResourceType::LoadBalancer => Self::Napoleon,

            // API/Communication (Kotler)
            AwsResourceType::ApiGateway => Self::Kotler,

            // Data/Research (Noguchi)
            AwsResourceType::RdsInstance => Self::Noguchi,
            AwsResourceType::DynamoDbTable => Self::Noguchi,

            // Default
            _ => Self::BillGates,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_historical_agent_assignment() {
        assert_eq!(
            HistoricalAgent::for_resource_type(&AwsResourceType::Ec2Instance),
            HistoricalAgent::BillGates
        );
        assert_eq!(
            HistoricalAgent::for_resource_type(&AwsResourceType::S3Bucket),
            HistoricalAgent::SteveJobs
        );
        assert_eq!(
            HistoricalAgent::for_resource_type(&AwsResourceType::LoadBalancer),
            HistoricalAgent::Napoleon
        );
    }
}
