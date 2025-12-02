import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface AuthStackProps extends cdk.StackProps {
  stage: string;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly apiClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `miyabi-context7-${stage}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        tenantId: new cognito.StringAttribute({ mutable: false }),
        plan: new cognito.StringAttribute({ mutable: true }),
        apiQuota: new cognito.NumberAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // User Pool Domain
    this.userPool.addDomain('Domain', {
      cognitoDomain: {
        domainPrefix: `miyabi-context7-${stage}`,
      },
    });

    // Web Client (for dashboard)
    this.userPoolClient = new cognito.UserPoolClient(this, 'WebClient', {
      userPool: this.userPool,
      userPoolClientName: 'web-client',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          'http://localhost:3000/callback',
          `https://context7.miyabi.ai/callback`,
        ],
        logoutUrls: [
          'http://localhost:3000',
          `https://context7.miyabi.ai`,
        ],
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // API Client (for MCP/SDK access)
    this.apiClient = new cognito.UserPoolClient(this, 'ApiClient', {
      userPool: this.userPool,
      userPoolClientName: 'api-client',
      generateSecret: true,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      oAuth: {
        flows: {
          clientCredentials: true,
        },
        scopes: [
          cognito.OAuthScope.custom('context7/read'),
          cognito.OAuthScope.custom('context7/write'),
        ],
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(24),
      refreshTokenValidity: cdk.Duration.days(365),
    });

    // Resource Server for custom scopes
    this.userPool.addResourceServer('ResourceServer', {
      identifier: 'context7',
      userPoolResourceServerName: 'Context7 API',
      scopes: [
        { scopeName: 'read', scopeDescription: 'Read access to documentation' },
        { scopeName: 'write', scopeDescription: 'Write access to index documents' },
        { scopeName: 'admin', scopeDescription: 'Admin access' },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      exportName: `MiyabiContext7-UserPoolId-${stage}`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      exportName: `MiyabiContext7-UserPoolClientId-${stage}`,
    });

    new cdk.CfnOutput(this, 'ApiClientId', {
      value: this.apiClient.userPoolClientId,
      exportName: `MiyabiContext7-ApiClientId-${stage}`,
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: `miyabi-context7-${stage}.auth.${this.region}.amazoncognito.com`,
      exportName: `MiyabiContext7-CognitoDomain-${stage}`,
    });
  }
}
