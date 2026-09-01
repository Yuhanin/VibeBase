import { NextResponse } from 'next/server'

export async function GET() {
  const { GITHUB_TOKEN: token, GITHUB_OWNER: owner, GITHUB_REPO: repo } = process.env
  if (!token || !owner || !repo) return NextResponse.json({ branches: [], connected: false })
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, cache: 'no-store' })
  if (!response.ok) return NextResponse.json({ branches: [], connected: false, status: response.status }, { status: 502 })
  const branches = await response.json()
  return NextResponse.json({ connected: true, branches: branches.map((b: { name: string; protected: boolean }) => ({ name: b.name, protected: b.protected })) })
}
