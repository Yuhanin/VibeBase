export type FileChange = { path:string; content?:string; operation:'create'|'update'|'delete' }

const BLOCKED = ['.env','.env.local','.env.production','node_modules/','.git/','credentials','private_key','service_role']

export function validateChanges(changes: FileChange[]) {
  if (!Array.isArray(changes) || changes.length === 0) throw new Error('At least one file change is required')
  if (changes.length > 50) throw new Error('Too many file changes')
  const seen = new Set<string>()
  for (const change of changes) {
    if (!change.path || !['create','update','delete'].includes(change.operation)) throw new Error('Invalid file change')
    const path = change.path.replaceAll('\\','/')
    if (seen.has(path)) throw new Error(`Duplicate file change: ${path}`)
    seen.add(path)
    if (path.startsWith('/') || path.includes('..')) throw new Error('Unsafe file path')
    if (BLOCKED.some(x => path === x || path.startsWith(x) || path.toLowerCase().includes(x))) throw new Error(`Protected path: ${path}`)
    if (change.operation !== 'delete' && typeof change.content !== 'string') throw new Error(`Content is required for ${path}`)
  }
  return true
}

export function buildAgentContract(request: string, changes: FileChange[]) {
  validateChanges(changes)
  return {
    version:'2.0',
    request:request.trim(),
    changes:changes.map(({ path,content,operation })=>({ path,content,operation })),
    rules:['No secrets or credentials','Only approved files','No shell execution','Preserve architecture','Tests/build required','One atomic Git commit per execution'],
  }
}
