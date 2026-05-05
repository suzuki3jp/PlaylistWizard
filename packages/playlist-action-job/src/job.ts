import * as v from "valibot";
import { enumValues } from "./schema-utils";

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

export const jobTypeSchema = v.picklist(enumValues(JobType));
export type JobType = v.InferOutput<typeof jobTypeSchema>;

export const JobStatus = {
  Pending: "Pending",
  Running: "Running",
  Completed: "Completed",
  Failed: "Failed",
} as const;

export const jobStatusSchema = v.picklist(enumValues(JobStatus));
export type JobStatus = v.InferOutput<typeof jobStatusSchema>;

export const backendJobSchema = v.object({
  id: v.string(),
  type: jobTypeSchema,
  status: jobStatusSchema,
  completeSteps: v.pipe(v.number(), v.integer()),
  totalSteps: v.pipe(v.number(), v.integer()),
});

export type BackendJob = v.InferOutput<typeof backendJobSchema>;

export const createJobRequestSchema = v.object({
  accountId: v.string(),
  payload: v.object({
    newPlaylistName: v.pipe(v.string(), v.minLength(1)),
  }),
});

export type CreateJobRequest = v.InferOutput<typeof createJobRequestSchema>;

export const createJobResponseSchema = v.object({
  jobId: v.string(),
});

export type CreateJobResponse = v.InferOutput<typeof createJobResponseSchema>;

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
