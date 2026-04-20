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

export type Job = {
  id: string;
  type: JobType;
  stepsId: string[];
};
