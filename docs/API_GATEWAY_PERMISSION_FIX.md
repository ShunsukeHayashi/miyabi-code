# API Gateway Permission Fix - Issue #832

**Date**: 2025-11-29
**Issue**: #832 - Pantheon Backend Lambda Deploy
**Status**: ✅ RESOLVED

---

## Problem

API Gateway was returning `500 Internal Server Error` when calling the Pantheon Lambda function (`pantheon-api`).

## Root Cause

Lambda resource policy was missing API Gateway invoke permission. The policy only allowed FunctionURL access:

```json
{
  "Sid": "FunctionURLAllowPublicAccess",
  "Effect": "Allow",
  "Principal": "*",
  "Action": "lambda:InvokeFunctionUrl",
  "Resource": "arn:aws:lambda:us-east-1:112530848482:function:pantheon-api"
}
```

## Solution

Added API Gateway invoke permission to Lambda resource policy:

```bash
AWS_PROFILE=hayashi aws lambda add-permission \
  --function-name pantheon-api \
  --statement-id apigateway-invoke-pantheon \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:112530848482:z4vnw3ytm2/*/*" \
  --region us-east-1
```

## Result

API Gateway now successfully invokes Lambda function and returns `200 OK`:

```bash
$ curl https://z4vnw3ytm2.execute-api.us-east-1.amazonaws.com/api/v1/health
{
  "status": "healthy",
  "version": "1.1.0",
  "database": {
    "connected": true,
    "latency_ms": 2
  }
}
```

## Updated Lambda Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FunctionURLAllowPublicAccess",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "lambda:InvokeFunctionUrl",
      "Resource": "arn:aws:lambda:us-east-1:112530848482:function:pantheon-api",
      "Condition": {
        "StringEquals": {
          "lambda:FunctionUrlAuthType": "NONE"
        }
      }
    },
    {
      "Sid": "apigateway-invoke-pantheon",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:us-east-1:112530848482:function:pantheon-api",
      "Condition": {
        "ArnLike": {
          "AWS:SourceArn": "arn:aws:execute-api:us-east-1:112530848482:z4vnw3ytm2/*/*"
        }
      }
    }
  ]
}
```

## Prevention

When deploying Lambda functions with API Gateway integration, ensure the Lambda resource policy includes:

1. **Principal**: `apigateway.amazonaws.com`
2. **Action**: `lambda:InvokeFunction`
3. **Source ARN**: `arn:aws:execute-api:REGION:ACCOUNT:API_ID/*/*`

### Infrastructure as Code Example

**Terraform**:
```hcl
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pantheon_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.pantheon.execution_arn}/*/*"
}
```

**AWS CDK (TypeScript)**:
```typescript
lambda.addPermission('APIGatewayInvoke', {
  principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
  action: 'lambda:InvokeFunction',
  sourceArn: api.arnForExecuteApi()
});
```

## Verification

```bash
# Test health endpoint
curl https://z4vnw3ytm2.execute-api.us-east-1.amazonaws.com/api/v1/health

# Verify Lambda policy
AWS_PROFILE=hayashi aws lambda get-policy \
  --function-name pantheon-api \
  --region us-east-1 \
  --query 'Policy' \
  --output text | jq .
```

---

**Team**: A1 Lead (Lambda Squad)
**Resolution Time**: 15 minutes
