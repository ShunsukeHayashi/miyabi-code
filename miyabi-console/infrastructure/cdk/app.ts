#!/usr/bin/env node

/**
 * Miyabi Console - CDK App Entry Point
 *
 * Usage:
 *   cdk deploy --profile miyabi-production
 *   cdk destroy --profile miyabi-production
 */

import * as cdk from 'aws-cdk-lib';
import { MiyabiConsoleStack } from './miyabi-console-stack';

const app = new cdk.App();

// Production Stack
new MiyabiConsoleStack(app, 'MiyabiConsoleProductionStack', {
  env: {
    account: '112530848482', // Hayashi-san's AWS account
    region: 'ap-northeast-1', // Tokyo region
  },
  domainName: 'miyabi-world.com',
  // If hosted zone already exists, provide ID:
  // hostedZoneId: 'Z1234567890ABC',
  description: 'Miyabi Console - Production Infrastructure',
  tags: {
    Environment: 'Production',
    Project: 'Miyabi',
    ManagedBy: 'CDK',
    Owner: 'Hayashi',
  },
});

// Optional: Staging Stack
// new MiyabiConsoleStack(app, 'MiyabiConsoleStagingStack', {
//   env: {
//     account: '112530848482',
//     region: 'ap-northeast-1',
//   },
//   domainName: 'staging.miyabi-world.com',
//   description: 'Miyabi Console - Staging Infrastructure',
//   tags: {
//     Environment: 'Staging',
//     Project: 'Miyabi',
//     ManagedBy: 'CDK',
//   },
// });

app.synth();
