export type PlanApprovalStatus='pending'|'approved'|'rejected'
export type PlanApproval={status:PlanApprovalStatus;approvedBy?:string;reason?:string;updatedAt:string}
export function approvePlan(userId:string):PlanApproval{if(!userId)throw new Error('User is required');return {status:'approved',approvedBy:userId,updatedAt:new Date().toISOString()}}
export function rejectPlan(userId:string,reason:string):PlanApproval{if(!userId)throw new Error('User is required');if(!reason?.trim())throw new Error('Rejection reason is required');return {status:'rejected',approvedBy:userId,reason:reason.trim(),updatedAt:new Date().toISOString()}}
