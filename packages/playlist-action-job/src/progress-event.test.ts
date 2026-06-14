import { describe, expect, it } from "vitest";
import { JobStatus, JobType, parseBackendJob } from "./job";
import {
  createJobProgressSnapshotEvent,
  createJobProgressUpdatedEvent,
  JobProgressEventType,
  parseSerializedJobProgressEvent,
  serializeJobProgressEvent,
} from "./progress-event";

const rawJobWithSensitiveFields = {
  id: "job-1",
  type: JobType.Create,
  status: JobStatus.Running,
  completeSteps: 1,
  totalSteps: 3,
  error: { message: "provider token leaked" },
  stack: "secret stack",
  userId: "user-1",
};

describe("BackendJob progress event contract", () => {
  it("builds sanitized BackendJob objects from broader inputs", () => {
    expect(parseBackendJob(rawJobWithSensitiveFields)).toEqual({
      id: "job-1",
      type: JobType.Create,
      status: JobStatus.Running,
      completeSteps: 1,
      totalSteps: 3,
    });
  });

  it("drops extra fields from job.updated events before serialization", () => {
    const serialized = serializeJobProgressEvent(
      createJobProgressUpdatedEvent(rawJobWithSensitiveFields),
    );

    expect(JSON.parse(serialized)).toEqual({
      type: JobProgressEventType.JobUpdated,
      job: {
        id: "job-1",
        type: JobType.Create,
        status: JobStatus.Running,
        completeSteps: 1,
        totalSteps: 3,
      },
    });
    expect(serialized).not.toContain("provider token leaked");
    expect(serialized).not.toContain("secret stack");
    expect(serialized).not.toContain("user-1");
  });

  it("drops extra fields from snapshot events before serialization", () => {
    const serialized = serializeJobProgressEvent(
      createJobProgressSnapshotEvent([rawJobWithSensitiveFields]),
    );

    expect(JSON.parse(serialized)).toEqual({
      type: JobProgressEventType.Snapshot,
      jobs: [
        {
          id: "job-1",
          type: JobType.Create,
          status: JobStatus.Running,
          completeSteps: 1,
          totalSteps: 3,
        },
      ],
    });
    expect(serialized).not.toContain("provider token leaked");
    expect(serialized).not.toContain("secret stack");
    expect(serialized).not.toContain("user-1");
  });

  it("parses serialized events through the shared schema", () => {
    expect(
      parseSerializedJobProgressEvent(
        JSON.stringify(
          createJobProgressUpdatedEvent(rawJobWithSensitiveFields),
        ),
      ),
    ).toEqual({
      type: JobProgressEventType.JobUpdated,
      job: {
        id: "job-1",
        type: JobType.Create,
        status: JobStatus.Running,
        completeSteps: 1,
        totalSteps: 3,
      },
    });
  });
});
