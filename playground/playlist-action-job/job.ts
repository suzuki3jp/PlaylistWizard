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
  id: string;
  type: JobType;
  stepsId: string[];
  completeSteps: number;
  status: JobStatus;
  /**
   * Whether the job is currently in progress and should be shown in the UI
   * True if the job status is 'Pending' or 'Running', or if the job status is
   * 'Failed' or 'Completed' and has not been displayed yet to the user
   */
  showInProgress: boolean;

  userId: string;

  /**
   * The account ID of the user who submitted the job
   * Used to retrieve the access token for making API requests to the provider.
   */
  accountId: string;
};

// # Create Job
//
// . User submits a request to create a playlist from UI
//
// --- Backend ---
// . Create a new Job as JobType.Create
// . enqueue a Step for creating a playlist as StepType.CreatePlaylist
// . Run the step on cloudflare workers
// . increment the completeSteps count
// . mark the job as done
//
// --- Frontend ---
// . Polling the backend for job status updates and displaying progress to the user
// . If the job is 'Completed' or 'Failed', mark showInProgress as false after n seconds

// # Copy Job
//
// . User submits a request to copy a playlist from UI
//
// --- Backend ---
// . Create a new Job as JobType.Copy
// . enqueue a Step for planning the copy as StepType.PlanSteps
// . Run the planning step on cloudflare workers
// . enqueue Steps for copying the playlist as StepType.CreatePlaylist or StepType.AddPlaylistItem depending on the Job Context
// . Run the copying steps on cloudflare workers
// . increment the completeSteps count
// . mark the job as done
//
// --- Frontend ---
// . Polling the backend for job status updates and displaying progress to the user
// . If the job is 'Completed' or 'Failed', mark showInProgress as false after n seconds
