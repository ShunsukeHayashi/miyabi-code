/**
 * Miyabi Console - AWS CDK Stack
 *
 * Deploys:
 * - S3 bucket for static hosting
 * - CloudFront distribution
 * - Route53 DNS configuration
 * - ACM SSL certificate
 *
 * Domain: miyabi-world.com
 * AWS Account: 112530848482
 */

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface MiyabiConsoleStackProps extends cdk.StackProps {
  domainName: string;
  hostedZoneId?: string;
}

export class MiyabiConsoleStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: MiyabiConsoleStackProps) {
    super(scope, id, props);

    const { domainName } = props;

    // ========================================
    // S3 Bucket for Static Hosting
    // ========================================
    this.bucket = new s3.Bucket(this, 'MiyabiConsoleBucket', {
      bucketName: 'miyabi-console-production',
      // Block all public access (CloudFront will access via OAI)
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // Enable versioning for rollback capability
      versioned: true,
      // Lifecycle rules
      lifecycleRules: [
        {
          // Delete old versions after 90 days
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
      // Encryption at rest
      encryption: s3.BucketEncryption.S3_MANAGED,
      // Removal policy (RETAIN for production)
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // Auto-delete objects on stack deletion (set to false for production)
      autoDeleteObjects: false,
    });

    // Output bucket name
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 bucket name for static assets',
    });

    // ========================================
    // ACM Certificate for HTTPS
    // ========================================
    // NOTE: Certificate MUST be in us-east-1 for CloudFront
    const certificate = new acm.Certificate(this, 'MiyabiConsoleCertificate', {
      domainName: domainName,
      subjectAlternativeNames: [`www.${domainName}`, `*.${domainName}`],
      validation: acm.CertificateValidation.fromDns(), // Auto DNS validation
    });

    // Output certificate ARN
    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
      description: 'ACM Certificate ARN',
    });

    // ========================================
    // CloudFront Distribution
    // ========================================

    // Origin Access Identity (OAI) for secure S3 access
    const oai = new cloudfront.OriginAccessIdentity(this, 'MiyabiConsoleOAI', {
      comment: 'OAI for Miyabi Console S3 bucket',
    });

    // Grant CloudFront read access to S3 bucket
    this.bucket.grantRead(oai);

    // Cache Policy: Optimize for SPA
    const cachePolicy = new cloudfront.CachePolicy(this, 'MiyabiCachePolicy', {
      cachePolicyName: 'MiyabiConsoleCachePolicy',
      comment: 'Cache policy for Miyabi Console SPA',
      defaultTtl: cdk.Duration.hours(24),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.days(365),
      // Enable compression
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      // Cache based on query strings (for versioned assets)
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
    });

    // Response Headers Policy: Security headers
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'MiyabiSecurityHeadersPolicy',
      {
        responseHeadersPolicyName: 'MiyabiConsoleSecurityHeaders',
        comment: 'Security headers for Miyabi Console',
        securityHeadersBehavior: {
          // Enforce HTTPS
          strictTransportSecurity: {
            accessControlMaxAge: cdk.Duration.days(365),
            includeSubdomains: true,
            preload: true,
            override: true,
          },
          // Prevent clickjacking
          frameOptions: {
            frameOption: cloudfront.HeadersFrameOption.DENY,
            override: true,
          },
          // XSS Protection
          xssProtection: {
            protection: true,
            modeBlock: true,
            override: true,
          },
          // Content Type Options
          contentTypeOptions: {
            override: true,
          },
          // Referrer Policy
          referrerPolicy: {
            referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
            override: true,
          },
        },
      }
    );

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'MiyabiConsoleDistribution', {
      comment: 'Miyabi Console Production Distribution',
      // Default root object
      defaultRootObject: 'index.html',
      // Domain names
      domainNames: [domainName, `www.${domainName}`],
      // SSL certificate
      certificate: certificate,
      // Minimum TLS version
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      // HTTP to HTTPS redirect
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      // Enable IPv6
      enableIpv6: true,
      // Price class (use all edge locations for best performance)
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      // Default behavior (S3 origin)
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, {
          originAccessIdentity: oai,
        }),
        // Viewer protocol policy: Redirect HTTP to HTTPS
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        // Allowed HTTP methods
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        // Cache policy
        cachePolicy: cachePolicy,
        // Response headers policy
        responseHeadersPolicy: responseHeadersPolicy,
        // Compress objects
        compress: true,
      },
      // Error responses for SPA (redirect all to index.html)
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      // Enable access logging
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'MiyabiConsoleLogBucket', {
        bucketName: 'miyabi-console-logs',
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        lifecycleRules: [
          {
            expiration: cdk.Duration.days(90),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }),
      logFilePrefix: 'cloudfront/',
    });

    // Output CloudFront distribution ID
    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID',
    });

    // Output CloudFront domain name
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    // ========================================
    // Route53 DNS Configuration
    // ========================================

    // Lookup existing hosted zone (if provided)
    let hostedZone: route53.IHostedZone;

    if (props.hostedZoneId) {
      hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: props.hostedZoneId,
        zoneName: domainName,
      });
    } else {
      // Create new hosted zone
      hostedZone = new route53.PublicHostedZone(this, 'MiyabiHostedZone', {
        zoneName: domainName,
        comment: 'Hosted zone for Miyabi Console',
      });

      // Output nameservers
      new cdk.CfnOutput(this, 'NameServers', {
        value: cdk.Fn.join(', ', hostedZone.hostedZoneNameServers || []),
        description: 'Route53 nameservers (configure at domain registrar)',
      });
    }

    // A Record: Root domain → CloudFront
    new route53.ARecord(this, 'MiyabiARecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(this.distribution)
      ),
      comment: 'Alias to CloudFront distribution',
    });

    // A Record: www subdomain → CloudFront
    new route53.ARecord(this, 'MiyabiWwwARecord', {
      zone: hostedZone,
      recordName: `www.${domainName}`,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(this.distribution)
      ),
      comment: 'Alias to CloudFront distribution (www)',
    });

    // ========================================
    // Deploy Static Assets
    // ========================================

    // Deployment: Upload build files to S3
    new s3deploy.BucketDeployment(this, 'MiyabiConsoleDeployment', {
      sources: [s3deploy.Source.asset('../dist')],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'], // Invalidate all cached files
      // Cache control headers
      cacheControl: [
        s3deploy.CacheControl.fromString('public, max-age=31536000, immutable'),
      ],
      // Exclude index.html from long cache
      exclude: ['index.html'],
    });

    // Deploy index.html separately with no-cache
    new s3deploy.BucketDeployment(this, 'MiyabiConsoleIndexDeployment', {
      sources: [s3deploy.Source.asset('../dist')],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/index.html'],
      cacheControl: [
        s3deploy.CacheControl.fromString('public, max-age=0, must-revalidate'),
      ],
      // Only include index.html
      include: ['index.html'],
    });

    // ========================================
    // Stack Outputs
    // ========================================

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${domainName}`,
      description: 'Miyabi Console website URL',
    });
  }
}
