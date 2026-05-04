declare const _jobId: unique symbol;
export type JobId = string & { readonly [_jobId]: never };
export const toJobId = (id: string): JobId => id as JobId;

export const JobType = {
  Create: "Create",
  Copy: "Copy",
  Shuffle: "Shuffle",
  Merge: "Merge",
  Extract: "Extract",
  Delete: "Delete",
  Deduplicate: "Deduplicate",
  Sync: "Sync",
} as const;
export type JobType = (typeof JobType)[keyof typeof JobType];

export const JobStatus = {
  Pending: "Pending",
  Running: "Running",
  Completed: "Completed",
  Failed: "Failed",
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export type Job = {
  id: JobId;
  type: JobType;
  status: JobStatus;
  completeSteps: number;
  totalSteps: number;
  userId: string;
  accountId: string;
  error?: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export const calculateProgress = (
  status: JobStatus,
  completeSteps: number,
  totalSteps: number,
): number => {
  if (status === JobStatus.Completed && totalSteps === 0) return 1;
  if (totalSteps === 0) return 0;
  return completeSteps / totalSteps;
};
