// Mirrors prisma/schema.prisma enums — keep in sync.

export const INDUSTRY_PACKS = [
  'AGENCY',
  'REAL_ESTATE',
  'RECRUITMENT',
  'CLINIC',
  'CA',
  'LEGAL',
] as const;
export type IndustryPack = (typeof INDUSTRY_PACKS)[number];

export const PLANS = ['TRIAL', 'STARTER', 'PRO', 'BUSINESS'] as const;
export type Plan = (typeof PLANS)[number];

export const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'AGENT'] as const;
export type Role = (typeof ROLES)[number];

export const DEAL_STATUSES = ['OPEN', 'WON', 'LOST'] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const DOC_STATUSES = ['UPLOADED', 'PROCESSING', 'READY', 'FAILED'] as const;
export type DocStatus = (typeof DOC_STATUSES)[number];

export const CHANNELS = ['whatsapp', 'phone', 'email', 'webchat'] as const;
export type Channel = (typeof CHANNELS)[number];

export const AGENT_TYPES = ['receptionist', 'employee', 'doc_processor', 'custom'] as const;
export type AgentType = (typeof AGENT_TYPES)[number];

export const ACTOR_TYPES = ['user', 'ai_agent', 'system'] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];
