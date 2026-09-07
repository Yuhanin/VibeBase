import type { FileChange } from './coding-agent'

const API = 'https://api.github.com'

function headers(token:string) {
  return {
    Authorization:`Bearer ${token}`,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28',
    'Content-Type':'application/json',
  }
}

async function githubJson(url:string, init:RequestInit, label:string) {
  const response = await fetch(url, { ...init, cache:'no-store' })
  if (!response.ok) throw new Error(`${label} failed (${response.status})`)
  return response.json()
}

export async function createAtomicCommit(input:{ owner:string; repo:string; branch:string; token:string; message:string; changes:FileChange[] }) {
  const { owner,repo,branch,token,message,changes } = input
  const h = headers(token)
  const base = `${API}/repos/${owner}/${repo}`
  const ref = await githubJson(`${base}/git/ref/heads/${encodeURIComponent(branch)}`, { headers:h }, 'GitHub branch lookup')
  const parentSha = ref.object.sha as string
  const parent = await githubJson(`${base}/git/commits/${parentSha}`, { headers:h }, 'GitHub commit lookup')
  const treeEntries: Array<Record<string,unknown>> = []

  for (const change of changes) {
    if (change.operation === 'delete') {
      treeEntries.push({ path:change.path, mode:'100644', type:'blob', sha:null })
      continue
    }
    const blob = await githubJson(`${base}/git/blobs`, {
      method:'POST', headers:h, body:JSON.stringify({ content:change.content ?? '', encoding:'utf-8' }),
    }, `GitHub blob creation for ${change.path}`)
    treeEntries.push({ path:change.path, mode:'100644', type:'blob', sha:blob.sha })
  }

  const tree = await githubJson(`${base}/git/trees`, {
    method:'POST', headers:h, body:JSON.stringify({ base_tree:parent.tree.sha, tree:treeEntries }),
  }, 'GitHub tree creation')
  const commit = await githubJson(`${base}/git/commits`, {
    method:'POST', headers:h, body:JSON.stringify({ message, tree:tree.sha, parents:[parentSha] }),
  }, 'GitHub commit creation')
  await githubJson(`${base}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method:'PATCH', headers:h, body:JSON.stringify({ sha:commit.sha, force:false }),
  }, 'GitHub branch update')
  return { commitSha:commit.sha as string, parentSha, treeSha:tree.sha as string }
}
