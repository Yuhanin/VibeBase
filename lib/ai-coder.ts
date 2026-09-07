import { validateChanges, type FileChange } from './coding-agent'
import type { CodingPlan } from './ai-planning'

const SYSTEM_PROMPT = `You are the VibeBase code generation engine. Return JSON only: {"changes":[{"path":"relative/path","operation":"create|update|delete","content":"complete file content for create/update"}]}. Implement exactly the approved plan. Do not add files or operations not listed in the plan. Do not output shell commands, secrets, patches, markdown, explanations, or partial snippets. For update/create return the complete final UTF-8 file content. For delete omit content.`

export async function generateAiFileChanges(input:{ context:unknown; plan:CodingPlan; sourceFiles:Record<string,string|null> }): Promise<FileChange[]> {
  const apiKey = process.env.AI_API_KEY
  if (!apiKey) throw new Error('AI provider is not configured')
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.AI_MODEL || 'gpt-4.1-mini'
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method:'POST',
    headers:{ 'content-type':'application/json', authorization:`Bearer ${apiKey}` },
    body:JSON.stringify({
      model,
      temperature:0,
      response_format:{ type:'json_object' },
      messages:[
        { role:'system', content:SYSTEM_PROMPT },
        { role:'user', content:`APPROVED PLAN:\n${JSON.stringify(input.plan)}\n\nTASK CONTEXT:\n${JSON.stringify(input.context)}\n\nSOURCE FILES (null means file does not exist):\n${JSON.stringify(input.sourceFiles)}` },
      ],
    }),
    cache:'no-store',
  })
  if (!response.ok) throw new Error(`AI code generation failed (${response.status})`)
  const payload = await response.json()
  const text = payload.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) throw new Error('AI code generator returned no changes')
  let parsed: { changes?:FileChange[] }
  try { parsed = JSON.parse(text) } catch { throw new Error('AI code generator returned invalid JSON') }
  const changes = parsed.changes ?? []
  validateChanges(changes)
  const expected = new Set(input.plan.files.map(file=>`${file.action}:${file.path}`))
  const received = new Set(changes.map(change=>`${change.operation}:${change.path.replaceAll('\\','/')}`))
  if (expected.size !== received.size || [...expected].some(key=>!received.has(key))) throw new Error('AI changes do not exactly match the approved plan')
  return changes
}
