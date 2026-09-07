export const TASK_STATUSES = ['backlog','ready','active','review','testing','done','blocked'] as const
export type TaskStatus = typeof TASK_STATUSES[number]

export const CODING_RUN_STATUSES = ['queued','planning','awaiting_approval','executing','verifying','review','completed','failed','cancelled'] as const
export type CodingRunStatus = typeof CODING_RUN_STATUSES[number]

export const DECISION_STATUSES = ['proposed','approved','superseded'] as const
export type DecisionStatus = typeof DECISION_STATUSES[number]

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && TASK_STATUSES.includes(value as TaskStatus)
}

export function isDecisionStatus(value: unknown): value is DecisionStatus {
  return typeof value === 'string' && DECISION_STATUSES.includes(value as DecisionStatus)
}

export function isCodingRunStatus(value: unknown): value is CodingRunStatus {
  return typeof value === 'string' && CODING_RUN_STATUSES.includes(value as CodingRunStatus)
}
