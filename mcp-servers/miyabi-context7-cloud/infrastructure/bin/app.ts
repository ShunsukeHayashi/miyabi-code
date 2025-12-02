#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { DataStack } from '../lib/data-stack';
import { ComputeStack } from '../lib/compute-stack';
import { ApiStack } from '../lib/api-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

const stage = app.node.tryGetContext('stage') || 'prod';

// 1. Authentication Stack
const authStack = new AuthStack(app, `MiyabiContext7Auth-${stage}`, {
  env,
  stage,
});

// 2. Data Stack (Aurora, DynamoDB, S3, ElastiCache)
const dataStack = new DataStack(app, `MiyabiContext7Data-${stage}`, {
  env,
  stage,
});

// 3. Compute Stack (Lambda, Step Functions, SQS)
const computeStack = new ComputeStack(app, `MiyabiContext7Compute-${stage}`, {
  env,
  stage,
  vpc: dataStack.vpc,
  auroraCluster: dataStack.auroraCluster,
  metadataTable: dataStack.metadataTable,
  documentsBucket: dataStack.documentsBucket,
  redisCluster: dataStack.redisCluster,
});

// 4. API Stack (API Gateway, CloudFront)
const apiStack = new ApiStack(app, `MiyabiContext7Api-${stage}`, {
  env,
  stage,
  userPool: authStack.userPool,
  resolverFunction: computeStack.resolverFunction,
  queryFunction: computeStack.queryFunction,
  indexFunction: computeStack.indexFunction,
});

// 5. Monitoring Stack (CloudWatch, Alarms)
const monitoringStack = new MonitoringStack(app, `MiyabiContext7Monitor-${stage}`, {
  env,
  stage,
  api: apiStack.api,
  functions: [
    computeStack.resolverFunction,
    computeStack.queryFunction,
    computeStack.indexFunction,
  ],
  auroraCluster: dataStack.auroraCluster,
});

// Tags
cdk.Tags.of(app).add('Project', 'MiyabiContext7');
cdk.Tags.of(app).add('Stage', stage);
