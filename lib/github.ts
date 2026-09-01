const api='https://api.github.com'
function headers(){return {Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}}
function repo(){const {GITHUB_OWNER:o,GITHUB_REPO:r}=process.env;if(!o||!r)throw new Error('GitHub repository is not configured');return `${o}/${r}`}
export async function githubGet(path:string){const r=await fetch(`${api}/repos/${repo()}${path}`,{headers:headers(),cache:'no-store'});if(!r.ok)throw new Error(`GitHub API ${r.status}`);return r.json()}
export async function githubConfigured(){return Boolean(process.env.GITHUB_TOKEN&&process.env.GITHUB_OWNER&&process.env.GITHUB_REPO)}
