import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Mock agent status data
  // TODO: Integrate with actual Miyabi agent system
  const agents = [
    { name: 'CoordinatorAgent', status: 'running', progress: 75, currentTask: 'Issue #531 分析中' },
    { name: 'CodeGenAgent', status: 'running', progress: 45, currentTask: 'Next.js コンポーネント生成中' },
    { name: 'ReviewAgent', status: 'idle', progress: 0 },
    { name: 'PRAgent', status: 'idle', progress: 0 },
    { name: 'DeploymentAgent', status: 'idle', progress: 0 },
    { name: 'IssueAgent', status: 'completed', progress: 100 },
    { name: 'RefresherAgent', status: 'completed', progress: 100 },
  ]

  res.status(200).json({ agents })
}
