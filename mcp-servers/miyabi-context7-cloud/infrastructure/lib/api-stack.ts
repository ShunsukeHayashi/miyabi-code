import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as waf from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  stage: string;
  userPool: cognito.UserPool;
  resolverFunction: lambda.Function;
  queryFunction: lambda.Function;
  indexFunction: lambda.Function;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { stage, userPool, resolverFunction, queryFunction, indexFunction } = props;

    // API Gateway
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `miyabi-context7-${stage}`,
      description: 'Miyabi Context7 - Documentation Retrieval API',
      deployOptions: {
        stageName: stage,
        throttlingRateLimit: stage === 'prod' ? 10000 : 100,
        throttlingBurstLimit: stage === 'prod' ? 5000 : 50,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: stage !== 'prod',
        metricsEnabled: true,
        tracingEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          new logs.LogGroup(this, 'ApiAccessLogs', {
            retention: logs.RetentionDays.ONE_MONTH,
          })
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key', 'X-Tenant-Id'],
      },
    });

    // Cognito Authorizer
    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuth', {
      cognitoUserPools: [userPool],
      authorizerName: 'CognitoAuthorizer',
    });

    // API Key Authorizer (for MCP clients)
    const apiKeyAuthorizer = new apigateway.RequestAuthorizer(this, 'ApiKeyAuth', {
      handler: new lambda.Function(this, 'ApiKeyAuthFunction', {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import os
import boto3

def handler(event, context):
    api_key = event.get('headers', {}).get('x-api-key', '')
    
    # Validate API key against DynamoDB
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['METADATA_TABLE'])
    
    try:
        response = table.get_item(Key={'PK': f'APIKEY#{api_key}', 'SK': 'METADATA'})
        if 'Item' in response:
            tenant_id = response['Item'].get('TenantId', '')
            return {
                'principalId': tenant_id,
                'policyDocument': {
                    'Version': '2012-10-17',
                    'Statement': [{
                        'Action': 'execute-api:Invoke',
                        'Effect': 'Allow',
                        'Resource': event['methodArn']
                    }]
                },
                'context': {
                    'tenantId': tenant_id,
                    'plan': response['Item'].get('Plan', 'free')
                }
            }
    except Exception as e:
        print(f'Auth error: {e}')
    
    return {
        'principalId': 'unauthorized',
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': 'Deny',
                'Resource': event['methodArn']
            }]
        }
    }
        `),
        environment: {
          METADATA_TABLE: cdk.Fn.importValue(`MiyabiContext7-MetadataTable-${stage}`),
        },
      }),
      identitySources: [apigateway.IdentitySource.header('x-api-key')],
      resultsCacheTtl: cdk.Duration.minutes(5),
    });

    // Lambda integrations
    const resolverIntegration = new apigateway.LambdaIntegration(resolverFunction);
    const queryIntegration = new apigateway.LambdaIntegration(queryFunction);
    const indexIntegration = new apigateway.LambdaIntegration(indexFunction);

    // API Resources
    const v1 = this.api.root.addResource('v1');

    // /v1/resolve-library-id
    const resolveResource = v1.addResource('resolve-library-id');
    resolveResource.addMethod('POST', resolverIntegration, {
      authorizer: apiKeyAuthorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    // /v1/get-library-docs
    const docsResource = v1.addResource('get-library-docs');
    docsResource.addMethod('POST', queryIntegration, {
      authorizer: apiKeyAuthorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    // /v1/index (authenticated users only)
    const indexResource = v1.addResource('index');
    indexResource.addMethod('POST', indexIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // /v1/libraries
    const librariesResource = v1.addResource('libraries');
    librariesResource.addMethod('GET', resolverIntegration, {
      authorizer: apiKeyAuthorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    // MCP-compatible endpoints
    const mcp = this.api.root.addResource('mcp');
    
    // /mcp/tools/list
    const mcpTools = mcp.addResource('tools');
    mcpTools.addResource('list').addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          'application/json': JSON.stringify({
            tools: [
              {
                name: 'resolve_library_id',
                description: 'Resolve library name to Miyabi Context7 library ID',
                inputSchema: {
                  type: 'object',
                  properties: {
                    libraryName: { type: 'string', description: 'Library name to search for' }
                  },
                  required: ['libraryName']
                }
              },
              {
                name: 'get_library_docs',
                description: 'Get documentation for a library using semantic search',
                inputSchema: {
                  type: 'object',
                  properties: {
                    context7CompatibleLibraryID: { type: 'string' },
                    topic: { type: 'string' },
                    tokens: { type: 'integer', default: 5000 }
                  },
                  required: ['context7CompatibleLibraryID']
                }
              }
            ]
          })
        }
      }],
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      }
    }), {
      methodResponses: [{ statusCode: '200' }]
    });

    // /mcp/tools/call
    mcpTools.addResource('call').addMethod('POST', queryIntegration, {
      authorizer: apiKeyAuthorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    // Usage Plan
    const usagePlan = this.api.addUsagePlan('UsagePlan', {
      name: `miyabi-context7-${stage}`,
      throttle: {
        rateLimit: stage === 'prod' ? 1000 : 100,
        burstLimit: stage === 'prod' ? 500 : 50,
      },
      quota: {
        limit: stage === 'prod' ? 1000000 : 10000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiStage({
      stage: this.api.deploymentStage,
    });

    // WAF Web ACL
    const webAcl = new waf.CfnWebACL(this, 'WebAcl', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `miyabi-context7-waf-${stage}`,
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
            sampledRequestsEnabled: true,
          },
          statement: {
            rateBasedStatement: {
              limit: stage === 'prod' ? 10000 : 1000,
              aggregateKeyType: 'IP',
            },
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSet',
            sampledRequestsEnabled: true,
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
        },
      ],
    });

    // Associate WAF with API Gateway
    new waf.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: this.api.deploymentStage.stageArn,
      webAclArn: webAcl.attrArn,
    });

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.RestApiOrigin(this.api),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        cachePolicy: new cloudfront.CachePolicy(this, 'CachePolicy', {
          defaultTtl: cdk.Duration.seconds(0),
          maxTtl: cdk.Duration.minutes(5),
          queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
          headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
            'Authorization',
            'x-api-key',
            'x-tenant-id'
          ),
        }),
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      comment: `Miyabi Context7 API - ${stage}`,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      exportName: `MiyabiContext7-ApiUrl-${stage}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      exportName: `MiyabiContext7-CloudFrontUrl-${stage}`,
    });
  }
}
