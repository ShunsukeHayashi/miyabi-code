import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

interface DataStackProps extends cdk.StackProps {
  stage: string;
}

export class DataStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly auroraCluster: rds.DatabaseCluster;
  public readonly metadataTable: dynamodb.Table;
  public readonly documentsBucket: s3.Bucket;
  public readonly redisCluster: elasticache.CfnCacheCluster;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // VPC for Aurora and ElastiCache
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: stage === 'prod' ? 2 : 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Security Group for Lambda to access Aurora/Redis
    this.securityGroup = new ec2.SecurityGroup(this, 'LambdaSg', {
      vpc: this.vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // Aurora Security Group
    const auroraSg = new ec2.SecurityGroup(this, 'AuroraSg', {
      vpc: this.vpc,
      description: 'Security group for Aurora',
    });
    auroraSg.addIngressRule(this.securityGroup, ec2.Port.tcp(5432), 'Lambda access');

    // Aurora Serverless v2 with PostgreSQL + pgvector
    this.auroraCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: stage === 'prod' ? 64 : 8,
      writer: rds.ClusterInstance.serverlessV2('Writer', {
        autoMinorVersionUpgrade: true,
      }),
      readers: stage === 'prod' ? [
        rds.ClusterInstance.serverlessV2('Reader1', {
          scaleWithWriter: true,
        }),
      ] : [],
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [auroraSg],
      defaultDatabaseName: 'context7',
      credentials: rds.Credentials.fromGeneratedSecret('context7admin'),
      backup: {
        retention: cdk.Duration.days(stage === 'prod' ? 30 : 7),
      },
      deletionProtection: stage === 'prod',
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB for metadata (tenant info, library metadata)
    this.metadataTable = new dynamodb.Table(this, 'MetadataTable', {
      tableName: `miyabi-context7-metadata-${stage}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: stage === 'prod',
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'TTL',
    });

    // GSI for queries by tenant
    this.metadataTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for library lookups
    this.metadataTable.addGlobalSecondaryIndex({
      indexName: 'LibraryIndex',
      partitionKey: { name: 'LibraryId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // S3 for document storage
    this.documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: `miyabi-context7-docs-${stage}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: stage === 'prod',
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: stage !== 'prod',
    });

    // ElastiCache Redis for caching
    const redisSg = new ec2.SecurityGroup(this, 'RedisSg', {
      vpc: this.vpc,
      description: 'Security group for Redis',
    });
    redisSg.addIngressRule(this.securityGroup, ec2.Port.tcp(6379), 'Lambda access');

    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis',
      subnetIds: this.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      }).subnetIds,
      cacheSubnetGroupName: `miyabi-context7-redis-${stage}`,
    });

    this.redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: stage === 'prod' ? 'cache.r6g.large' : 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
      vpcSecurityGroupIds: [redisSg.securityGroupId],
      clusterName: `miyabi-context7-${stage}`,
    });
    this.redisCluster.addDependency(redisSubnetGroup);

    // Outputs
    new cdk.CfnOutput(this, 'AuroraEndpoint', {
      value: this.auroraCluster.clusterEndpoint.hostname,
      exportName: `MiyabiContext7-AuroraEndpoint-${stage}`,
    });

    new cdk.CfnOutput(this, 'AuroraSecretArn', {
      value: this.auroraCluster.secret?.secretArn || '',
      exportName: `MiyabiContext7-AuroraSecretArn-${stage}`,
    });

    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: this.documentsBucket.bucketName,
      exportName: `MiyabiContext7-DocumentsBucket-${stage}`,
    });

    new cdk.CfnOutput(this, 'MetadataTableName', {
      value: this.metadataTable.tableName,
      exportName: `MiyabiContext7-MetadataTable-${stage}`,
    });
  }
}
