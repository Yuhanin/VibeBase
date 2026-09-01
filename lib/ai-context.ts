export type ProjectContext = {
  project: Record<string, unknown>
  features: Record<string, unknown>[]
  tasks: Record<string, unknown>[]
  prompts: Record<string, unknown>[]
  documents: Record<string, unknown>[]
  decisions: Record<string, unknown>[]
  issues: Record<string, unknown>[]
  releases: Record<string, unknown>[]
}

function clean(value: unknown) {
  return JSON.stringify(value, (_key, v) => v === null || v === '' ? undefined : v, 2)
}

export function buildProjectContext(data: ProjectContext) {
  return [
    '# VibeBase Project Context',
    'Use this as the source of truth for AI-assisted development.',
    '\n## Project\n' + clean(data.project),
    '\n## Features\n' + clean(data.features),
    '\n## Tasks\n' + clean(data.tasks),
    '\n## Prompts\n' + clean(data.prompts),
    '\n## Knowledge / Documents\n' + clean(data.documents),
    '\n## Decisions\n' + clean(data.decisions),
    '\n## Issues\n' + clean(data.issues),
    '\n## Releases\n' + clean(data.releases),
  ].join('\n')
}

export function buildCodingPrompt(context: string, request: string) {
  return `You are the VibeBase coding assistant. Follow the project context as source of truth. Do not invent requirements that conflict with it.\n\nPROJECT CONTEXT:\n${context}\n\nUSER REQUEST:\n${request}\n\nRespond with: 1) understanding, 2) implementation plan, 3) files to change, 4) risks/tests. Keep assumptions explicit.`
}
