import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';

interface ComputeStackProps extends cdk.StackProps {
  stage: string;
  vpc: ec2.Vpc;
  auroraCluster: rds.DatabaseCluster;
  metadataTable: dynamodb.Table;
  documentsBucket: s3.Bucket;
  redisCluster: elasticache.CfnCacheCluster;
}

export class ComputeStack extends cdk.Stack {
  public readonly resolverFunction: lambda.Function;
  public readonly queryFunction: lambda.Function;
  public readonly indexFunction: lambda.Function;
  public readonly indexQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const { stage, vpc, auroraCluster, metadataTable, documentsBucket, redisCluster } = props;

    // Lambda Security Group
    const lambdaSg = new ec2.SecurityGroup(this, 'LambdaSg', {
      vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // Common Lambda environment
    const commonEnv = {
      STAGE: stage,
      AURORA_SECRET_ARN: auroraCluster.secret?.secretArn || '',
      AURORA_ENDPOINT: auroraCluster.clusterEndpoint.hostname,
      AURORA_DATABASE: 'context7',
      METADATA_TABLE: metadataTable.tableName,
      DOCUMENTS_BUCKET: documentsBucket.bucketName,
      REDIS_ENDPOINT: redisCluster.attrRedisEndpointAddress,
      REDIS_PORT: redisCluster.attrRedisEndpointPort,
    };

    // Lambda Layer for shared dependencies
    const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/layers/shared')),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
      description: 'Shared dependencies for Context7 functions',
    });

    // Common Lambda props
    const commonLambdaProps = {
      runtime: lambda.Runtime.PYTHON_3_11,
      architecture: lambda.Architecture.ARM_64,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSg],
      layers: [sharedLayer],
      environment: commonEnv,
      tracing: lambda.Tracing.ACTIVE,
    };

    // Resolver Function - resolve library names to IDs
    this.resolverFunction = new lambda.Function(this, 'ResolverFunction', {
      ...commonLambdaProps,
      functionName: `miyabi-context7-resolver-${stage}`,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/api')),
      handler: 'resolver.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      reservedConcurrentExecutions: stage === 'prod' ? undefined : 10,
    });

    // Query Function - semantic search for documents
    this.queryFunction = new lambda.Function(this, 'QueryFunction', {
      ...commonLambdaProps,
      functionName: `miyabi-context7-query-${stage}`,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/api')),
      handler: 'query.handler',
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      reservedConcurrentExecutions: stage === 'prod' ? undefined : 20,
    });

    // Index Queue (for async processing)
    const deadLetterQueue = new sqs.Queue(this, 'IndexDLQ', {
      queueName: `miyabi-context7-index-dlq-${stage}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    this.indexQueue = new sqs.Queue(this, 'IndexQueue', {
      queueName: `miyabi-context7-index-${stage}`,
      visibilityTimeout: cdk.Duration.minutes(15),
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3,
      },
    });

    // Index Function - process documents and generate embeddings
    this.indexFunction = new lambda.Function(this, 'IndexFunction', {
      ...commonLambdaProps,
      functionName: `miyabi-context7-indexer-${stage}`,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/indexer')),
      handler: 'handler.handler',
      memorySize: 2048,
      timeout: cdk.Duration.minutes(10),
      reservedConcurrentExecutions: stage === 'prod' ? 50 : 5,
    });

    // Add SQS trigger to Index Function
    this.indexFunction.addEventSource(new eventsources.SqsEventSource(this.indexQueue, {
      batchSize: 1,
      maxConcurrency: stage === 'prod' ? 50 : 5,
    }));

    // Grant permissions
    auroraCluster.secret?.grantRead(this.resolverFunction);
    auroraCluster.secret?.grantRead(this.queryFunction);
    auroraCluster.secret?.grantRead(this.indexFunction);

    metadataTable.grantReadData(this.resolverFunction);
    metadataTable.grantReadData(this.queryFunction);
    metadataTable.grantReadWriteData(this.indexFunction);

    documentsBucket.grantRead(this.queryFunction);
    documentsBucket.grantReadWrite(this.indexFunction);

    this.indexQueue.grantSendMessages(this.resolverFunction);
    this.indexQueue.grantSendMessages(this.queryFunction);

    // Bedrock permissions
    const bedrockPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: ['*'],
    });

    this.queryFunction.addToRolePolicy(bedrockPolicy);
    this.indexFunction.addToRolePolicy(bedrockPolicy);

    // Step Functions for complex indexing workflows
    const parseDocTask = new tasks.LambdaInvoke(this, 'ParseDocument', {
      lambdaFunction: this.indexFunction,
      payload: sfn.TaskInput.fromObject({
        action: 'parse',
        'document.$': '$.document',
      }),
      resultPath: '$.parseResult',
    });

    const chunkDocTask = new tasks.LambdaInvoke(this, 'ChunkDocument', {
      lambdaFunction: this.indexFunction,
      payload: sfn.TaskInput.fromObject({
        action: 'chunk',
        'content.$': '$.parseResult.Payload.content',
      }),
      resultPath: '$.chunkResult',
    });

    const generateEmbeddingsTask = new tasks.LambdaInvoke(this, 'GenerateEmbeddings', {
      lambdaFunction: this.indexFunction,
      payload: sfn.TaskInput.fromObject({
        action: 'embed',
        'chunks.$': '$.chunkResult.Payload.chunks',
      }),
      resultPath: '$.embedResult',
    });

    const storeVectorsTask = new tasks.LambdaInvoke(this, 'StoreVectors', {
      lambdaFunction: this.indexFunction,
      payload: sfn.TaskInput.fromObject({
        action: 'store',
        'vectors.$': '$.embedResult.Payload.vectors',
        'metadata.$': '$.document.metadata',
      }),
      resultPath: '$.storeResult',
    });

    const indexWorkflow = parseDocTask
      .next(chunkDocTask)
      .next(generateEmbeddingsTask)
      .next(storeVectorsTask);

    new sfn.StateMachine(this, 'IndexStateMachine', {
      stateMachineName: `miyabi-context7-index-${stage}`,
      definitionBody: sfn.DefinitionBody.fromChainable(indexWorkflow),
      timeout: cdk.Duration.minutes(30),
      tracingEnabled: true,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ResolverFunctionArn', {
      value: this.resolverFunction.functionArn,
      exportName: `MiyabiContext7-ResolverFunction-${stage}`,
    });

    new cdk.CfnOutput(this, 'QueryFunctionArn', {
      value: this.queryFunction.functionArn,
      exportName: `MiyabiContext7-QueryFunction-${stage}`,
    });

    new cdk.CfnOutput(this, 'IndexQueueUrl', {
      value: this.indexQueue.queueUrl,
      exportName: `MiyabiContext7-IndexQueue-${stage}`,
    });
  }
}
