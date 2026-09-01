import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  if (!token || !owner || !repo) return NextResponse.json({ connected: false, reason: 'GitHub environment is not configured' })
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, cache: 'no-store' })
  if (!response.ok) return NextResponse.json({ connected: false, status: response.status }, { status: 502 })
  const data = await response.json()
  return NextResponse.json({ connected: true, repository: { fullName: data.full_name, defaultBranch: data.default_branch, private: data.private, url: data.html_url } })
}
