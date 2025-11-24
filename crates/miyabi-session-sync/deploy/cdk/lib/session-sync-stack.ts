import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface SessionSyncStackProps extends cdk.StackProps {
  environment: 'dev' | 'staging' | 'prod';
}

export class SessionSyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SessionSyncStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // VPC for Fargate
    const vpc = new ec2.Vpc(this, 'SessionSyncVpc', {
      maxAzs: 2,
      natGateways: environment === 'prod' ? 2 : 1,
    });

    // ECR Repository
    const repository = new ecr.Repository(this, 'SessionSyncRepo', {
      repositoryName: `miyabi-session-sync-${environment}`,
      removalPolicy: environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep only 10 images',
        },
      ],
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'SessionSyncCluster', {
      vpc,
      clusterName: `miyabi-session-sync-${environment}`,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'SessionSyncTask', {
      memoryLimitMiB: environment === 'prod' ? 2048 : 512,
      cpu: environment === 'prod' ? 1024 : 256,
    });

    // Container
    const container = taskDefinition.addContainer('SessionSyncContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'session-sync',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        RUST_LOG: 'info',
        PORT: '9876',
        ENVIRONMENT: environment,
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:9876/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: 9876,
      protocol: ecs.Protocol.TCP,
    });

    // Fargate Service
    const service = new ecs.FargateService(this, 'SessionSyncService', {
      cluster,
      taskDefinition,
      desiredCount: environment === 'prod' ? 2 : 1,
      assignPublicIp: false,
      serviceName: `session-sync-${environment}`,
      circuitBreaker: {
        enable: true,
        rollback: true,
      },
    });

    // Application Load Balancer
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      'SessionSyncALB',
      {
        vpc,
        internetFacing: true,
        loadBalancerName: `session-sync-${environment}`,
      }
    );

    // HTTP Listener
    const listener = alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    listener.addTargets('SessionSyncTarget', {
      port: 9876,
      targets: [service],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // Lambda Function (Alternative lightweight deployment)
    const lambdaFunction = new lambda.Function(this, 'SessionSyncLambda', {
      functionName: `miyabi-session-sync-lambda-${environment}`,
      runtime: lambda.Runtime.PROVIDED_AL2023,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('../target/lambda'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        RUST_LOG: 'info',
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // API Gateway for Lambda
    const httpApi = new apigateway.HttpApi(this, 'SessionSyncApi', {
      apiName: `session-sync-api-${environment}`,
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ['*'],
      },
    });

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigateway.HttpMethod.ANY],
      integration: new integrations.HttpLambdaIntegration(
        'LambdaIntegration',
        lambdaFunction
      ),
    });

    // Outputs
    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'ALB DNS Name for Fargate deployment',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway URL for Lambda deployment',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI for pushing images',
    });
  }
}
