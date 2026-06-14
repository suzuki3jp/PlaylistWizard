import * as v from "valibot";
import { type BackendJob, backendJobSchema } from "./job";
import { enumValues } from "./schema-utils";

export const JobProgressEventType = {
  Snapshot: "snapshot",
  JobUpdated: "job.updated",
  JobRemoved: "job.removed",
  Error: "error",
} as const;

export const JobProgressErrorCode = {
  Unavailable: "JOB_PROGRESS_UNAVAILABLE",
} as const;

const jobProgressErrorCodeSchema = v.picklist(enumValues(JobProgressErrorCode));

export const jobProgressSnapshotEventSchema = v.object({
  type: v.literal(JobProgressEventType.Snapshot),
  jobs: v.array(backendJobSchema),
});

export const jobProgressJobUpdatedEventSchema = v.object({
  type: v.literal(JobProgressEventType.JobUpdated),
  job: backendJobSchema,
});

export const jobProgressJobRemovedEventSchema = v.object({
  type: v.literal(JobProgressEventType.JobRemoved),
  jobId: v.string(),
});

export const jobProgressErrorEventSchema = v.object({
  type: v.literal(JobProgressEventType.Error),
  code: jobProgressErrorCodeSchema,
});

export const jobProgressEventSchema = v.union([
  jobProgressSnapshotEventSchema,
  jobProgressJobUpdatedEventSchema,
  jobProgressJobRemovedEventSchema,
  jobProgressErrorEventSchema,
]);

export type JobProgressEvent = v.InferOutput<typeof jobProgressEventSchema>;

export const createJobProgressSnapshotEvent = (
  jobs: readonly unknown[],
): JobProgressEvent =>
  v.parse(jobProgressSnapshotEventSchema, {
    type: JobProgressEventType.Snapshot,
    jobs,
  });

export const createJobProgressUpdatedEvent = (job: unknown): JobProgressEvent =>
  v.parse(jobProgressJobUpdatedEventSchema, {
    type: JobProgressEventType.JobUpdated,
    job,
  });

export const createJobProgressRemovedEvent = (
  jobId: string,
): JobProgressEvent =>
  v.parse(jobProgressJobRemovedEventSchema, {
    type: JobProgressEventType.JobRemoved,
    jobId,
  });

export const createJobProgressErrorEvent = (
  code: typeof JobProgressErrorCode.Unavailable,
): JobProgressEvent =>
  v.parse(jobProgressErrorEventSchema, {
    type: JobProgressEventType.Error,
    code,
  });

export const parseJobProgressEvent = (input: unknown): JobProgressEvent =>
  v.parse(jobProgressEventSchema, input);

export const parseSerializedJobProgressEvent = (
  input: string,
): JobProgressEvent => parseJobProgressEvent(JSON.parse(input));

export const serializeJobProgressEvent = (input: unknown): string =>
  JSON.stringify(parseJobProgressEvent(input));

export type JobProgressSnapshotEvent = ReturnType<
  typeof createJobProgressSnapshotEvent
>;

export type JobProgressUpdatedEvent = {
  type: typeof JobProgressEventType.JobUpdated;
  job: BackendJob;
};
