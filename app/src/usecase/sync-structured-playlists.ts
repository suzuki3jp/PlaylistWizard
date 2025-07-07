import type {
  PrimitiveFullPlaylistInterface,
  PrimitivePlaylistItemInterface,
} from "@/entity";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { deserialize } from "@/repository/structured-playlists/deserialize";
import { type Result, err, ok } from "neverthrow";
import type { Failure as FailureData } from "./actions/plain-result";
import { AddPlaylistItemUsecase } from "./add-playlist-item";
import { FetchFullPlaylistUsecase } from "./fetch-full-playlist";
import type { StructuredPlaylistDefinitionInterface } from "./interface/structured-playlists";

export interface SyncStructuredPlaylistsUsecaseOptions {
  accessToken: string;
  repository: ProviderRepositoryType;
  definitionJson: string;
  onParsedDefinition?: (
    definition: StructuredPlaylistDefinitionInterface,
  ) => void;
  onValidatedDependencies?: () => void;
  onFetchedPlaylist?: (
    playlistId: string,
    playlist: PrimitiveFullPlaylistInterface,
  ) => void;
  onPlannedSyncSteps?: (steps: SyncStep[]) => void;
  onCalculatedQuota?: (quota: number) => void;
  onQuotaExceeded?: (required: number, limit: number) => void;
  onExecutingSyncStep?: (
    step: SyncStep,
    current: number,
    total: number,
  ) => void;
  onExecutedSyncStep?: (step: SyncStep, current: number, total: number) => void;
  onGeneratedReport?: (report: SyncReport) => void;
}

export interface SyncStep {
  type: "add_item";
  playlistId: string;
  item: PrimitivePlaylistItemInterface;
  sourcePlaylistId: string;
}

export interface SyncReport {
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  quotaUsed: number;
  errors: Array<{
    step: SyncStep;
    error: FailureData;
  }>;
}

export class SyncStructuredPlaylistsUsecase {
  constructor(private options: SyncStructuredPlaylistsUsecaseOptions) {}

  async execute(): Promise<SyncResult> {
    const {
      accessToken,
      repository,
      definitionJson,
      onParsedDefinition,
      onValidatedDependencies,
      onFetchedPlaylist,
      onPlannedSyncSteps,
      onCalculatedQuota,
      onQuotaExceeded,
      onExecutingSyncStep,
      onExecutedSyncStep,
      onGeneratedReport,
    } = this.options;

    const quotaLimit = 10000; // Fixed quota limit: 10k

    try {
      // 1. Parse the JSON
      const parseResult = await this.parseDefinition(
        definitionJson,
        onParsedDefinition,
        onValidatedDependencies,
      );
      if (parseResult.isErr()) {
        return err(parseResult.error);
      }
      const definition = parseResult.value;

      // 2. Fetch playlists
      const fetchResult = await this.fetchPlaylists(
        definition,
        accessToken,
        repository,
        onFetchedPlaylist,
      );
      if (fetchResult.isErr()) {
        return err(fetchResult.error);
      }
      const playlistsMap = fetchResult.value;

      // 3. Plan sync steps
      const planResult = this.planSyncSteps(
        definition.playlists,
        playlistsMap,
        onPlannedSyncSteps,
      );
      if (planResult.isErr()) {
        return err(planResult.error);
      }
      const syncSteps = planResult.value;

      // 4. Check quota
      const quotaResult = this.checkQuota(
        syncSteps,
        quotaLimit,
        onCalculatedQuota,
        onQuotaExceeded,
      );
      if (quotaResult.isErr()) {
        return err(quotaResult.error);
      }

      // 5. Execute sync steps
      const executeResult = await this.executeSyncSteps(
        syncSteps,
        accessToken,
        repository,
        onExecutingSyncStep,
        onExecutedSyncStep,
      );
      if (executeResult.isErr()) {
        return err(executeResult.error);
      }
      const report = executeResult.value;

      // 6. Generate report
      onGeneratedReport?.(report);
      return ok(report);
    } catch (error) {
      return err({
        type: "unknown_error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  /**
   * Phase 1: Parse and validate the definition JSON
   */
  private async parseDefinition(
    definitionJson: string,
    onParsedDefinition?: (
      definition: StructuredPlaylistDefinitionInterface,
    ) => void,
    onValidatedDependencies?: () => void,
  ): Promise<Result<StructuredPlaylistDefinitionInterface, SyncError>> {
    const parseResult = deserialize(definitionJson);
    if (parseResult.isErr()) {
      return err({
        type: "parse_error",
        message: `Failed to parse definition: ${parseResult.error}`,
      });
    }

    const definition = parseResult.value;
    onParsedDefinition?.(definition);

    // Dependencies are already validated in deserialize
    onValidatedDependencies?.();

    return ok(definition);
  }

  /**
   * Phase 2: Fetch all required playlists
   */
  private async fetchPlaylists(
    definition: StructuredPlaylistDefinitionInterface,
    accessToken: string,
    repository: ProviderRepositoryType,
    onFetchedPlaylist?: (
      playlistId: string,
      playlist: PrimitiveFullPlaylistInterface,
    ) => void,
  ): Promise<Result<Map<string, PrimitiveFullPlaylistInterface>, SyncError>> {
    const playlistsMap = new Map<string, PrimitiveFullPlaylistInterface>();
    const fetchErrors: Array<{ playlistId: string; error: FailureData }> = [];

    for (const playlistId of this.getAllPlaylistIds(definition.playlists)) {
      const fetchUsecase = new FetchFullPlaylistUsecase({
        accessToken,
        repository,
        playlistId,
      });

      const fetchResult = await fetchUsecase.execute();

      if (fetchResult.isOk()) {
        const playlist = fetchResult.value.toJSON();
        playlistsMap.set(playlistId, playlist);
        onFetchedPlaylist?.(playlistId, playlist);
      } else {
        fetchErrors.push({ playlistId, error: fetchResult.error });
      }
    }

    if (fetchErrors.length > 0) {
      return err({
        type: "fetch_error",
        message: `Failed to fetch ${fetchErrors.length} playlists`,
        details: fetchErrors,
      });
    }

    return ok(playlistsMap);
  }

  /**
   * Phase 3: Plan synchronization steps
   */
  private planSyncSteps(
    playlists: StructuredPlaylistDefinitionInterface["playlists"],
    playlistsMap: Map<string, PrimitiveFullPlaylistInterface>,
    onPlannedSyncSteps?: (steps: SyncStep[]) => void,
  ): Result<SyncStep[], SyncError> {
    const steps: SyncStep[] = [];

    const processPlaylist = (playlist: (typeof playlists)[0]) => {
      const targetPlaylist = playlistsMap.get(playlist.id);
      if (!targetPlaylist) return;

      // Process dependencies first (topological order)
      if (playlist.dependencies) {
        for (const dependency of playlist.dependencies) {
          processPlaylist(dependency);
        }
      }

      // Add items from dependencies to current playlist
      if (playlist.dependencies) {
        for (const dependency of playlist.dependencies) {
          const sourcePlaylist = playlistsMap.get(dependency.id);
          if (!sourcePlaylist) continue;

          for (const item of sourcePlaylist.items) {
            // Check if item already exists in target playlist
            const itemExists = targetPlaylist.items.some(
              (existingItem: PrimitivePlaylistItemInterface) =>
                existingItem.videoId === item.videoId,
            );

            if (!itemExists) {
              steps.push({
                type: "add_item",
                playlistId: playlist.id,
                item,
                sourcePlaylistId: dependency.id,
              });
            }
          }
        }
      }
    };

    for (const playlist of playlists) {
      processPlaylist(playlist);
    }

    onPlannedSyncSteps?.(steps);
    return ok(steps);
  }

  /**
   * Phase 4: Check quota requirements
   */
  private checkQuota(
    syncSteps: SyncStep[],
    quotaLimit: number,
    onCalculatedQuota?: (quota: number) => void,
    onQuotaExceeded?: (required: number, limit: number) => void,
  ): Result<void, SyncError> {
    // Each add_item operation costs 50 quota points
    const quotaRequired = syncSteps.length * 50;
    onCalculatedQuota?.(quotaRequired);

    if (quotaRequired > quotaLimit) {
      onQuotaExceeded?.(quotaRequired, quotaLimit);
      return err({
        type: "quota_exceeded",
        message: `Required quota (${quotaRequired}) exceeds limit (${quotaLimit})`,
      });
    }

    return ok(undefined);
  }

  /**
   * Phase 5: Execute synchronization steps
   */
  private async executeSyncSteps(
    syncSteps: SyncStep[],
    accessToken: string,
    repository: ProviderRepositoryType,
    onExecutingSyncStep?: (
      step: SyncStep,
      current: number,
      total: number,
    ) => void,
    onExecutedSyncStep?: (
      step: SyncStep,
      current: number,
      total: number,
    ) => void,
  ): Promise<Result<SyncReport, SyncError>> {
    const report: SyncReport = {
      totalSteps: syncSteps.length,
      successfulSteps: 0,
      failedSteps: 0,
      quotaUsed: 0,
      errors: [],
    };

    for (let i = 0; i < syncSteps.length; i++) {
      const step = syncSteps[i];
      onExecutingSyncStep?.(step, i + 1, syncSteps.length);

      const addItemUsecase = new AddPlaylistItemUsecase({
        accessToken,
        repository,
        playlistId: step.playlistId,
        resourceId: step.item.videoId,
      });

      const executeResult = await addItemUsecase.execute();

      // Each operation uses 50 quota points
      report.quotaUsed += 50;

      if (executeResult.isOk()) {
        report.successfulSteps++;
      } else {
        report.failedSteps++;
        report.errors.push({ step, error: executeResult.error });
      }

      onExecutedSyncStep?.(step, i + 1, syncSteps.length);
    }

    return ok(report);
  }

  private getAllPlaylistIds(
    playlists: StructuredPlaylistDefinitionInterface["playlists"],
  ): string[] {
    const ids = new Set<string>();

    function collectIds(
      playlistArray: StructuredPlaylistDefinitionInterface["playlists"],
    ) {
      for (const playlist of playlistArray) {
        ids.add(playlist.id);
        if (playlist.dependencies) {
          collectIds(playlist.dependencies);
        }
      }
    }

    collectIds(playlists);
    return Array.from(ids);
  }
}

export interface SyncError {
  type: "parse_error" | "fetch_error" | "quota_exceeded" | "unknown_error";
  message: string;
  details?: unknown;
}

export type SyncResult = Result<SyncReport, SyncError>;
