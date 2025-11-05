import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { repo = 'customer-cloud/miyabi-private', state = 'open', limit = '10' } = req.query

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/issues?state=${state}&per_page=${limit}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Miyabi-Dashboard',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
          })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const issues = await response.json()

    const formattedIssues = issues.map((issue: any) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      labels: issue.labels.map((label: any) => label.name),
      url: issue.html_url,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    }))

    res.status(200).json({ issues: formattedIssues })
  } catch (error) {
    console.error('Error fetching issues:', error)
    res.status(500).json({ error: 'Failed to fetch issues' })
  }
}
