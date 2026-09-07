export type RiskLevel = 'low'|'medium'|'high'
export type PlanFile = { path:string; action:'create'|'update'|'delete'; reason:string }
export type CodingPlan = {
  version:'1.0'
  summary:string
  steps:string[]
  files:PlanFile[]
  dependencies:string[]
  tests:string[]
  verification:string[]
  risks:{ level:RiskLevel; description:string }[]
}

const BLOCKED = ['.env','.env.local','.env.production','credentials','private_key','service_role','.git/','node_modules/']

export function validatePlan(plan: CodingPlan) {
  if (plan.version !== '1.0') throw new Error('Unsupported plan version')
  if (!plan.summary?.trim() || !Array.isArray(plan.steps) || plan.steps.length === 0) throw new Error('Plan must contain a summary and steps')
  if (!Array.isArray(plan.files) || !Array.isArray(plan.dependencies) || !Array.isArray(plan.tests) || !Array.isArray(plan.verification) || !Array.isArray(plan.risks)) throw new Error('Plan collections are invalid')
  for (const file of plan.files) {
    const path = file.path?.replaceAll('\\','/')
    if (!path || path.startsWith('/') || path.includes('..') || BLOCKED.some(x => path === x || path.startsWith(x) || path.toLowerCase().includes(x))) throw new Error(`Unsafe plan path: ${file.path}`)
    if (!['create','update','delete'].includes(file.action) || !file.reason?.trim()) throw new Error(`Invalid plan file: ${file.path}`)
  }
  return plan
}

export function assertPlanApprovalReady(plan: CodingPlan) {
  validatePlan(plan)
  if (plan.files.length === 0) throw new Error('Plan must identify affected files before approval')
  if (plan.tests.length === 0) throw new Error('Plan must include tests before approval')
  if (plan.verification.length === 0) throw new Error('Plan must include verification steps before approval')
  return plan
}

export function planFromContext(ctx: any): CodingPlan {
  const title = ctx?.task?.title || 'Task'
  return {
    version:'1.0',
    summary:`Implement ${title} using the project context and existing architecture.`,
    steps:['Review requirements and relevant project context','Identify minimal implementation surface','Implement changes with existing conventions','Run automated tests and validation','Verify the resulting workflow'],
    files:[],
    dependencies:[],
    tests:['typecheck','lint','relevant unit/integration tests'],
    verification:['CI passes','no unauthorized files changed','production smoke test passes'],
    risks:[{ level:'medium', description:'Affected files must be resolved before this plan can be approved.' }],
  }
}
