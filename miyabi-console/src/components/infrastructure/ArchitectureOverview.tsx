import { Card, CardBody, CardHeader, Divider } from '@heroui/react'

export default function ArchitectureOverview() {
  return (
    <Card className="bg-gradient-to-br from-primary-50 to-secondary-50">
      <CardHeader>
        <h3 className="text-xl font-bold">🏗️ Miyabi AWS Architecture Overview</h3>
      </CardHeader>
      <Divider />
      <CardBody className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-primary mb-2">🌐 Network Layer</h4>
            <ul className="text-sm space-y-1 text-default-700">
              <li>• <strong>VPC</strong>: 10.0.0.0/16 (miyabi-vpc-dev)</li>
              <li>• <strong>Public Subnets</strong>: 2 subnets in us-west-2a/2b</li>
              <li>• <strong>Private Subnets</strong>: 2 subnets in us-west-2a/2b</li>
              <li>• <strong>Internet Gateway</strong>: Public internet access</li>
              <li>• <strong>NAT Gateway</strong>: Private subnet outbound access</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-success mb-2">🛡️ Security Layer</h4>
            <ul className="text-sm space-y-1 text-default-700">
              <li>• <strong>ALB Security Group</strong>: HTTP/HTTPS (80, 443)</li>
              <li>• <strong>ECS Security Group</strong>: App port (8080)</li>
              <li>• <strong>RDS Security Group</strong>: PostgreSQL (5432)</li>
              <li>• <strong>Redis Security Group</strong>: Redis (6379)</li>
              <li>• <strong>IAM Roles</strong>: ECS Task Execution & Task roles</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-warning mb-2">⚙️ Compute Layer</h4>
            <ul className="text-sm space-y-1 text-default-700">
              <li>• <strong>Application Load Balancer</strong>: Traffic distribution</li>
              <li>• <strong>ECS Fargate Cluster</strong>: Container orchestration</li>
              <li>• <strong>ECS Services</strong>: miyabi-web-api service</li>
              <li>• <strong>Target Groups</strong>: Health checks & routing</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-danger mb-2">🗄️ Data Layer</h4>
            <ul className="text-sm space-y-1 text-default-700">
              <li>• <strong>RDS PostgreSQL</strong>: 15.4 (db.t3.micro)</li>
              <li>• <strong>ElastiCache Redis</strong>: 7.0 (cache.t3.micro)</li>
              <li>• <strong>Multi-AZ</strong>: High availability setup</li>
              <li>• <strong>Private Subnets</strong>: Secure database access</li>
            </ul>
          </div>
        </div>

        <Divider />

        <div className="bg-white/60 rounded-lg p-3">
          <h4 className="font-semibold text-default-700 mb-2">📊 Deployment Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="text-center">
              <p className="text-xs text-default-500">Available</p>
              <p className="text-2xl font-bold text-success">13</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-default-500">Creating</p>
              <p className="text-2xl font-bold text-warning">1</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-default-500">Planned</p>
              <p className="text-2xl font-bold text-default-400">7</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-default-500">Total</p>
              <p className="text-2xl font-bold text-primary">21</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-default-500 bg-white/40 rounded-lg p-3">
          <p className="font-semibold mb-1">🎯 Architecture Reference:</p>
          <p>Based on Miyabi System Architecture v2.0.1 - AWS Infrastructure as Code (Terraform)</p>
          <p className="mt-1">📁 Source: <code className="text-xs bg-default-100 px-1 rounded">.claude/context/architecture.puml</code></p>
        </div>
      </CardBody>
    </Card>
  )
}
