import type { StructuredPlaylistsDefinition } from "../../../packages/core/src/structured-playlists/schema";
import type { JobType } from "../job";

export type Step =
  | CreatePlaylistStep
  | AddPlaylistItemStep
  | MovePlaylistItemStep
  | DeletePlaylistStep
  | DeletePlaylistItemStep;

export type CommonStep = {
  /**
   * Step ID
   */
  id: string;

  /**
   * Whether the step is done
   */
  done: boolean;
  type: StepType;
};

enum StepType {
  PlanSteps = "PlanSteps",
  CreatePlaylist = "CreatePlaylist",
  AddPlaylistItem = "AddPlaylistItem",
  DeletePlaylistItem = "DeletePlaylistItem",
  MovePlaylistItem = "MovePlaylistItem",
  DeletePlaylist = "DeletePlaylist",
}

export type PlanStepsStep<Job extends JobType> = {
  type: typeof StepType.PlanSteps;
  jobType: Job;
  payload: PlanStepsStepPayloads[Job];
};

export type PlanStepsStepPayloads = {
  [JobType.Create]: {
    name: string;
  };
  [JobType.Copy]: {
    sourcePlaylistId: string;
    target:
      | {
          createNew: true;
          newPlaylistName?: string;
        }
      | {
          createNew: false;
          id: string;
        };
    allowDuplicates?: boolean;
  };
  [JobType.Shuffle]: {
    sourcePlaylistId: string;
  };
  [JobType.Merge]: {
    sourcePlaylistIds: string[];
    newPlaylistName?: string;
    allowDuplicates?: boolean;
  };
  [JobType.Extract]: {
    sourcePlaylistId: string;
    artistName: string;
    allowDuplicates?: boolean;
  };
  [JobType.Delete]: {
    playlistId: string;
  };
  [JobType.Deduplicate]: {
    playlistId: string;
  };
  [JobType.Sync]: {
    structuredPlaylistDefinition: StructuredPlaylistsDefinition;
  };
};

export type CreatePlaylistStep = {
  type: typeof StepType.CreatePlaylist;
  payload: {
    name: string;
  };
} & CommonStep;

export type AddPlaylistItemStep = {
  type: typeof StepType.AddPlaylistItem;
  payload: {
    playlistId: string;
    videoId: string;
  };
} & CommonStep;

export type DeletePlaylistItemStep = {
  type: typeof StepType.DeletePlaylistItem;
  payload: {
    playlistId: string;
    videoId: string;
  };
} & CommonStep;

export type MovePlaylistItemStep = {
  type: typeof StepType.MovePlaylistItem;
  payload: {
    playlistId: string;
    fromIndex: number;
    toIndex: number;
  };
} & CommonStep;

export type DeletePlaylistStep = {
  type: typeof StepType.DeletePlaylist;
  payload: {
    playlistId: string;
  };
} & CommonStep;
