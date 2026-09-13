import { validatePlan, type CodingPlan } from './ai-planning'

const SYSTEM_PROMPT = `You are the VibeBase planning engine. Produce a conservative implementation plan grounded only in the supplied project/task context. Return JSON only with this exact shape:
{"version":"1.0","summary":"...","steps":["..."],"files":[{"path":"relative/path","action":"create|update|delete","reason":"..."}],"dependencies":["..."],"tests":["..."],"verification":["..."],"risks":[{"level":"low|medium|high","description":"..."}]}
Rules: identify concrete repository-relative files when evidence supports them; never include .env, credentials, keys, node_modules or .git; keep the change surface minimal; include tests and post-deployment verification; make uncertainty explicit as risk instead of inventing facts.`

export async function generateAiCodingPlan(context: unknown, request: string): Promise<CodingPlan | null> {
  const apiKey = process.env.AI_API_KEY
  if (!apiKey) return null
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.AI_MODEL || 'gpt-4.1-mini'
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method:'POST',
    headers:{ 'content-type':'application/json', authorization:`Bearer ${apiKey}` },
    body:JSON.stringify({
      model,
      temperature:0.1,
      response_format:{ type:'json_object' },
      messages:[
        { role:'system', content:SYSTEM_PROMPT },
        { role:'user', content:`CODING REQUEST:\n${request}\n\nTASK CONTEXT:\n${JSON.stringify(context)}` },
      ],
    }),
    cache:'no-store',
  })
  if (!response.ok) throw new Error(`AI planner request failed (${response.status})`)
  const payload = await response.json()
  const text = payload.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) throw new Error('AI planner returned no plan')
  let parsed: CodingPlan
  try { parsed = JSON.parse(text) as CodingPlan } catch { throw new Error('AI planner returned invalid JSON') }
  return validatePlan(parsed)
}
