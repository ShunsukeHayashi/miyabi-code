#!/bin/bash
# Miyabi Infrastructure Validation Script
# Version: 1.0.0
# Purpose: Validate all M1 infrastructure components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-west-2"
CLUSTER_NAME="miyabi-cluster-dev"
SERVICE_NAME="miyabi-service-dev"
LOG_GROUP="/ecs/miyabi-dev"

# Functions
print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check AWS CLI
    if command -v aws &> /dev/null; then
        print_success "AWS CLI installed"
    else
        print_error "AWS CLI not installed"
        exit 1
    fi

    # Check Terraform
    if command -v terraform &> /dev/null; then
        print_success "Terraform installed"
    else
        print_warning "Terraform not installed (optional)"
    fi

    # Check AWS credentials
    if aws sts get-caller-identity &> /dev/null; then
        print_success "AWS credentials configured"
    else
        print_error "AWS credentials not configured"
        exit 1
    fi
}

# Test 1: VPC and Networking
test_vpc() {
    print_header "Test 1: VPC and Networking"

    # Get VPC ID
    if cd infrastructure/terraform/environments/dev 2>/dev/null && VPC_ID=$(terraform output -raw vpc_id 2>/dev/null); then
        print_success "VPC exists: $VPC_ID"

        # Check subnets
        SUBNET_COUNT=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region $AWS_REGION --query 'Subnets | length(@)')
        if [ "$SUBNET_COUNT" -eq 4 ]; then
            print_success "All 4 subnets exist (2 public, 2 private)"
        else
            print_error "Expected 4 subnets, found $SUBNET_COUNT"
        fi

        # Check NAT Gateway
        NAT_COUNT=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=available" --region $AWS_REGION --query 'NatGateways | length(@)')
        if [ "$NAT_COUNT" -ge 1 ]; then
            print_success "NAT Gateway is available"
        else
            print_error "NAT Gateway not found or not available"
        fi

        cd - > /dev/null
    else
        print_error "VPC not found or Terraform not initialized"
    fi
}

# Test 2: Security Groups
test_security_groups() {
    print_header "Test 2: Security Groups"

    SG_NAMES=("alb-sg" "ecs-sg" "rds-sg" "redis-sg")

    for SG_NAME in "${SG_NAMES[@]}"; do
        if aws ec2 describe-security-groups --filters "Name=group-name,Values=miyabi-${SG_NAME}-dev" --region $AWS_REGION --query 'SecurityGroups[0].GroupId' --output text | grep -q "sg-"; then
            print_success "Security Group: miyabi-${SG_NAME}-dev"
        else
            print_error "Security Group not found: miyabi-${SG_NAME}-dev"
        fi
    done
}

# Test 3: ECS Cluster and Service
test_ecs() {
    print_header "Test 3: ECS Cluster and Service"

    # Check cluster
    CLUSTER_STATUS=$(aws ecs describe-clusters --clusters $CLUSTER_NAME --region $AWS_REGION --query 'clusters[0].status' --output text 2>/dev/null || echo "NOT_FOUND")
    if [ "$CLUSTER_STATUS" = "ACTIVE" ]; then
        print_success "ECS Cluster is ACTIVE"
    else
        print_error "ECS Cluster not ACTIVE (status: $CLUSTER_STATUS)"
    fi

    # Check service
    SERVICE_STATUS=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null || echo "NOT_FOUND")
    if [ "$SERVICE_STATUS" = "ACTIVE" ]; then
        print_success "ECS Service is ACTIVE"

        # Check running tasks
        RUNNING_COUNT=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].runningCount' --output text)
        DESIRED_COUNT=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].desiredCount' --output text)

        if [ "$RUNNING_COUNT" -eq "$DESIRED_COUNT" ]; then
            print_success "Running tasks: $RUNNING_COUNT/$DESIRED_COUNT"
        else
            print_error "Task count mismatch: Running=$RUNNING_COUNT, Desired=$DESIRED_COUNT"
        fi
    else
        print_error "ECS Service not ACTIVE (status: $SERVICE_STATUS)"
    fi
}

# Test 4: Application Load Balancer
test_alb() {
    print_header "Test 4: Application Load Balancer"

    # Check ALB
    ALB_STATE=$(aws elbv2 describe-load-balancers --names miyabi-alb-dev --region $AWS_REGION --query 'LoadBalancers[0].State.Code' --output text 2>/dev/null || echo "NOT_FOUND")
    if [ "$ALB_STATE" = "active" ]; then
        print_success "ALB is active"

        # Get ALB DNS
        ALB_DNS=$(aws elbv2 describe-load-balancers --names miyabi-alb-dev --region $AWS_REGION --query 'LoadBalancers[0].DNSName' --output text)
        print_success "ALB DNS: $ALB_DNS"

        # Check target group health
        if cd infrastructure/terraform/environments/dev 2>/dev/null; then
            TG_ARN=$(terraform output -raw target_group_arn 2>/dev/null)
            HEALTHY_COUNT=$(aws elbv2 describe-target-health --target-group-arn "$TG_ARN" --region $AWS_REGION --query 'TargetHealthDescriptions[?TargetHealth.State==`healthy`] | length(@)' 2>/dev/null || echo "0")
            TOTAL_COUNT=$(aws elbv2 describe-target-health --target-group-arn "$TG_ARN" --region $AWS_REGION --query 'TargetHealthDescriptions | length(@)' 2>/dev/null || echo "0")

            if [ "$HEALTHY_COUNT" -gt 0 ]; then
                print_success "Healthy targets: $HEALTHY_COUNT/$TOTAL_COUNT"
            else
                print_error "No healthy targets (found $TOTAL_COUNT targets)"
            fi

            cd - > /dev/null
        fi
    else
        print_error "ALB not active (state: $ALB_STATE)"
    fi
}

# Test 5: ElastiCache Redis
test_redis() {
    print_header "Test 5: ElastiCache Redis"

    REDIS_STATUS=$(aws elasticache describe-cache-clusters --cache-cluster-id miyabi-cache-dev --region $AWS_REGION --query 'CacheClusters[0].CacheClusterStatus' --output text 2>/dev/null || echo "NOT_FOUND")
    if [ "$REDIS_STATUS" = "available" ]; then
        print_success "Redis cluster is available"

        # Get endpoint
        REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters --cache-cluster-id miyabi-cache-dev --show-cache-node-info --region $AWS_REGION --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' --output text)
        print_success "Redis endpoint: $REDIS_ENDPOINT:6379"
    else
        print_error "Redis not available (status: $REDIS_STATUS)"
    fi
}

# Test 6: CloudWatch Logs
test_cloudwatch() {
    print_header "Test 6: CloudWatch Logs"

    if aws logs describe-log-groups --log-group-name-prefix $LOG_GROUP --region $AWS_REGION --query 'logGroups[0].logGroupName' --output text | grep -q "$LOG_GROUP"; then
        print_success "CloudWatch log group exists: $LOG_GROUP"

        # Check recent logs
        LOG_STREAM_COUNT=$(aws logs describe-log-streams --log-group-name $LOG_GROUP --region $AWS_REGION --query 'logStreams | length(@)' 2>/dev/null || echo "0")
        if [ "$LOG_STREAM_COUNT" -gt 0 ]; then
            print_success "Log streams: $LOG_STREAM_COUNT"
        else
            print_warning "No log streams found (service may not have started yet)"
        fi
    else
        print_error "CloudWatch log group not found"
    fi

    # Check alarms
    ALARM_COUNT=$(aws cloudwatch describe-alarms --alarm-name-prefix miyabi-service --region $AWS_REGION --query 'MetricAlarms | length(@)')
    if [ "$ALARM_COUNT" -ge 3 ]; then
        print_success "CloudWatch alarms configured: $ALARM_COUNT"
    else
        print_warning "Expected 3+ alarms, found $ALARM_COUNT"
    fi
}

# Test 7: API Health Check
test_api() {
    print_header "Test 7: API Health Check"

    if cd infrastructure/terraform/environments/dev 2>/dev/null; then
        ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null)

        if [ -n "$ALB_DNS" ]; then
            print_success "Testing API at http://$ALB_DNS/health"

            # Test health endpoint
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$ALB_DNS/health" --max-time 10 || echo "000")

            if [ "$HTTP_CODE" = "200" ]; then
                print_success "API health check: HTTP $HTTP_CODE OK"

                # Get response
                RESPONSE=$(curl -s "http://$ALB_DNS/health" --max-time 10)
                echo "Response: $RESPONSE"
            else
                print_error "API health check failed: HTTP $HTTP_CODE"
            fi
        fi

        cd - > /dev/null
    fi
}

# Test 8: Auto-Scaling Configuration
test_autoscaling() {
    print_header "Test 8: Auto-Scaling Configuration"

    POLICY_COUNT=$(aws application-autoscaling describe-scaling-policies --service-namespace ecs --resource-id "service/$CLUSTER_NAME/$SERVICE_NAME" --region $AWS_REGION --query 'ScalingPolicies | length(@)' 2>/dev/null || echo "0")

    if [ "$POLICY_COUNT" -ge 3 ]; then
        print_success "Auto-scaling policies: $POLICY_COUNT (CPU, Memory, Requests)"
    else
        print_error "Expected 3 auto-scaling policies, found $POLICY_COUNT"
    fi

    # Check scaling target
    MIN_CAP=$(aws application-autoscaling describe-scalable-targets --service-namespace ecs --resource-id "service/$CLUSTER_NAME/$SERVICE_NAME" --region $AWS_REGION --query 'ScalableTargets[0].MinCapacity' --output text 2>/dev/null || echo "0")
    MAX_CAP=$(aws application-autoscaling describe-scalable-targets --service-namespace ecs --resource-id "service/$CLUSTER_NAME/$SERVICE_NAME" --region $AWS_REGION --query 'ScalableTargets[0].MaxCapacity' --output text 2>/dev/null || echo "0")

    if [ "$MIN_CAP" = "2" ] && [ "$MAX_CAP" = "4" ]; then
        print_success "Scaling range: $MIN_CAP-$MAX_CAP tasks"
    else
        print_warning "Unexpected scaling range: $MIN_CAP-$MAX_CAP (expected 2-4)"
    fi
}

# Generate summary report
generate_summary() {
    print_header "Validation Summary"

    echo ""
    echo "All infrastructure components have been validated."
    echo ""
    echo "Next steps:"
    echo "  1. Review CloudWatch metrics and logs"
    echo "  2. Run E2E integration tests (see .ai/runbooks/frontend-integration-testing.md)"
    echo "  3. Review M1 Completion Report (docs/M1_COMPLETION_REPORT.md)"
    echo ""
    echo "Documentation:"
    echo "  - Infrastructure Runbook: docs/INFRASTRUCTURE_RUNBOOK.md"
    echo "  - API Documentation: docs/API_DOCUMENTATION.md"
    echo "  - Troubleshooting Guide: docs/TROUBLESHOOTING.md"
    echo ""
}

# Main execution
main() {
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║  Miyabi Infrastructure Validation - M1                         ║"
    echo "║  Version: 1.0.0                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"

    check_prerequisites
    test_vpc
    test_security_groups
    test_ecs
    test_alb
    test_redis
    test_cloudwatch
    test_api
    test_autoscaling
    generate_summary

    echo ""
    print_success "Infrastructure validation complete!"
    echo ""
}

# Run main
main
