import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  stage: string;
  api: apigateway.RestApi;
  functions: lambda.Function[];
  auroraCluster: rds.DatabaseCluster;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { stage, api, functions, auroraCluster } = props;

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `miyabi-context7-alerts-${stage}`,
      displayName: 'Miyabi Context7 Alerts',
    });

    // Add email subscription (configure in console or via parameter)
    // alertTopic.addSubscription(new subscriptions.EmailSubscription('alerts@miyabi.ai'));

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `MiyabiContext7-${stage}`,
    });

    // API Gateway Metrics
    const apiRequests = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Count',
      dimensionsMap: {
        ApiName: api.restApiName,
        Stage: stage,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    });

    const api4xxErrors = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      dimensionsMap: {
        ApiName: api.restApiName,
        Stage: stage,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    });

    const api5xxErrors = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: {
        ApiName: api.restApiName,
        Stage: stage,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    });

    const apiLatency = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiName: api.restApiName,
        Stage: stage,
      },
      statistic: 'p99',
      period: cdk.Duration.minutes(1),
    });

    // Lambda Metrics
    const lambdaMetrics = functions.map(fn => ({
      invocations: fn.metricInvocations({ period: cdk.Duration.minutes(1) }),
      errors: fn.metricErrors({ period: cdk.Duration.minutes(1) }),
      duration: fn.metricDuration({ period: cdk.Duration.minutes(1), statistic: 'p99' }),
      throttles: fn.metricThrottles({ period: cdk.Duration.minutes(1) }),
      concurrentExecutions: fn.metric('ConcurrentExecutions', {
        period: cdk.Duration.minutes(1),
        statistic: 'Maximum',
      }),
    }));

    // Aurora Metrics
    const auroraConnections = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'DatabaseConnections',
      dimensionsMap: {
        DBClusterIdentifier: auroraCluster.clusterIdentifier,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    const auroraCPU = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        DBClusterIdentifier: auroraCluster.clusterIdentifier,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    const auroraACU = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'ServerlessDatabaseCapacity',
      dimensionsMap: {
        DBClusterIdentifier: auroraCluster.clusterIdentifier,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    // Dashboard Widgets
    dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: '# Miyabi Context7 - API Metrics',
        width: 24,
        height: 1,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Requests',
        left: [apiRequests],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Errors',
        left: [api4xxErrors, api5xxErrors],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Latency (p99)',
        left: [apiLatency],
        width: 8,
        height: 6,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: '# Lambda Functions',
        width: 24,
        height: 1,
      })
    );

    // Lambda widgets for each function
    functions.forEach((fn, i) => {
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: `${fn.functionName} - Invocations & Errors`,
          left: [lambdaMetrics[i].invocations],
          right: [lambdaMetrics[i].errors],
          width: 8,
          height: 6,
        }),
        new cloudwatch.GraphWidget({
          title: `${fn.functionName} - Duration (p99)`,
          left: [lambdaMetrics[i].duration],
          width: 8,
          height: 6,
        }),
        new cloudwatch.GraphWidget({
          title: `${fn.functionName} - Concurrency`,
          left: [lambdaMetrics[i].concurrentExecutions, lambdaMetrics[i].throttles],
          width: 8,
          height: 6,
        })
      );
    });

    dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: '# Aurora Database',
        width: 24,
        height: 1,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Aurora Connections',
        left: [auroraConnections],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Aurora CPU',
        left: [auroraCPU],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Aurora ACU (Serverless Capacity)',
        left: [auroraACU],
        width: 8,
        height: 6,
      })
    );

    // Alarms
    // API 5XX Error Rate
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      alarmName: `MiyabiContext7-API5xx-${stage}`,
      metric: api5xxErrors,
      threshold: stage === 'prod' ? 10 : 5,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api5xxAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // API Latency
    const latencyAlarm = new cloudwatch.Alarm(this, 'LatencyAlarm', {
      alarmName: `MiyabiContext7-Latency-${stage}`,
      metric: apiLatency,
      threshold: 5000, // 5 seconds
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    latencyAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // Lambda Errors
    functions.forEach((fn, i) => {
      const errorAlarm = new cloudwatch.Alarm(this, `LambdaErrors-${fn.node.id}`, {
        alarmName: `MiyabiContext7-LambdaErrors-${fn.functionName}`,
        metric: lambdaMetrics[i].errors,
        threshold: stage === 'prod' ? 10 : 3,
        evaluationPeriods: 3,
        datapointsToAlarm: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      errorAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

      const throttleAlarm = new cloudwatch.Alarm(this, `LambdaThrottles-${fn.node.id}`, {
        alarmName: `MiyabiContext7-LambdaThrottles-${fn.functionName}`,
        metric: lambdaMetrics[i].throttles,
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      throttleAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));
    });

    // Aurora CPU
    const auroraCpuAlarm = new cloudwatch.Alarm(this, 'AuroraCpuAlarm', {
      alarmName: `MiyabiContext7-AuroraCPU-${stage}`,
      metric: auroraCPU,
      threshold: 80,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    auroraCpuAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // Outputs
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      exportName: `MiyabiContext7-DashboardUrl-${stage}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      exportName: `MiyabiContext7-AlertTopic-${stage}`,
    });
  }
}
