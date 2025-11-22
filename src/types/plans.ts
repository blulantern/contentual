import { SocialPlatform } from './platforms';

export type PlanType = 'full-time' | 'part-time';

export type TaskType =
  | 'content-creation'
  | 'posting'
  | 'engagement'
  | 'analytics'
  | 'planning'
  | 'batch-filming'
  | 'editing';

export interface PlanTask {
  id: string;
  time: string;
  duration: number;
  type: TaskType;
  title: string;
  description: string;
  platform?: SocialPlatform;
  contentIdea?: string;
  completed: boolean;
  notes?: string;
}

export interface DailyPlan {
  date: Date;
  tasks: PlanTask[];
}

export interface WeeklyPlan {
  id: string;
  type: PlanType;
  weekStart: Date;
  weekEnd: Date;
  days: DailyPlan[];
  generatedAt: Date;
  customized: boolean;
}
