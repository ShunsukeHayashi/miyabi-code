#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SessionSyncStack } from '../lib/session-sync-stack';

const app = new cdk.App();

// 環境変数から設定を取得
const environment = (process.env.DEPLOY_ENV || 'dev') as 'dev' | 'staging' | 'prod';
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'ap-northeast-1';

// スタック作成
new SessionSyncStack(app, `MiyabiSessionSync-${environment}`, {
  environment,
  env: {
    account,
    region,
  },
  tags: {
    Project: 'Miyabi',
    Component: 'SessionSync',
    Environment: environment,
  },
});

app.synth();
