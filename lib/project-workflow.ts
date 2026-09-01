export const PROJECT_PHASES = ['idea','discovery','concept','ux','design','specification','coding','testing','release','documentation'] as const
export type ProjectPhase = typeof PROJECT_PHASES[number]
export function phaseLabel(phase: ProjectPhase) { return phase.charAt(0).toUpperCase()+phase.slice(1) }
export function completion(progress:number) { return Math.max(0,Math.min(100,Math.round(progress))) }
