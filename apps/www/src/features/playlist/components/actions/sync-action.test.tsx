import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { RefreshCw } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskStatus, TaskType } from "../tasks-monitor";
import SyncAction from "./sync-action";

const mocks = vi.hoisted(() => ({
  createTask: vi.fn(async () => "task-id"),
  definition: {
    version: 1,
    name: "Definition",
    provider: "google",
    playlists: [{ id: "target", dependencies: [{ id: "source" }] }],
  } as const,
  enqueueSyncJob: vi.fn(),
  isJobProgressReady: true,
  isPlaylistActionJobEnabled: true,
  legacyExecute: vi.fn(),
  removeTask: vi.fn(),
  updateTaskStatus: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "user-id" } } }),
}));
vi.mock("@/features/accounts", () => ({
  useFocusedAccount: () => [{ id: "account-id" }],
}));
vi.mock("@/features/structured-playlists-definition/context", () => ({
  useStructuredPlaylistsDefinition: () => [mocks.definition],
}));
vi.mock("@/presentation/hooks/useFeatureFlag", () => ({
  useFeatureFlag: () => mocks.isPlaylistActionJobEnabled,
}));
vi.mock("@/presentation/hooks/t/client", () => ({
  useT: () => ({ t: (key: string) => key }),
}));
vi.mock("@/common/emit-ga4-event", () => ({ emitGa4Event: vi.fn() }));
vi.mock("@/common/sleep", () => ({ sleep: vi.fn(async () => undefined) }));
vi.mock("@/usecase/actions/enqueue-job", () => ({
  enqueueSyncJob: mocks.enqueueSyncJob,
}));
vi.mock("@/usecase/sync-structured-playlists", () => ({
  SyncStructuredPlaylistsUsecase: vi.fn(function () {
    return { execute: mocks.legacyExecute };
  }),
}));
vi.mock("../../job-progress-provider", () => ({
  useJobProgress: () => ({ isReady: mocks.isJobProgressReady }),
}));
vi.mock("../../contexts/tasks", () => ({
  useTask: () => ({
    dispatchers: {
      createTask: mocks.createTask,
      removeTask: mocks.removeTask,
      updateTaskMessage: vi.fn(),
      updateTaskProgress: vi.fn(),
      updateTaskStatus: mocks.updateTaskStatus,
    },
  }),
}));
vi.mock("../../contexts/history", () => ({
  useHistory: () => ({ addCommand: vi.fn() }),
}));
vi.mock("../../queries/use-playlists", () => ({
  useInvalidatePlaylistsQuery: () => vi.fn(),
}));
vi.mock("../structured-playlists-definition-preview", () => ({
  StructuredPlaylistsDefinitionPreview: () => null,
}));

const renderSyncAction = () =>
  render(
    <SyncAction
      icon={RefreshCw}
      label="Sync"
      disabled={false}
      t={((key: string) => key) as never}
    />,
  );

const openDialog = () => {
  fireEvent.click(screen.getByRole("button", { name: "Sync" }));
  return screen.getByRole("button", { name: "sync.dialog.confirm" });
};

describe("SyncAction", () => {
  beforeEach(() => {
    mocks.isJobProgressReady = true;
    mocks.isPlaylistActionJobEnabled = true;
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("enqueues one Sync Job instead of running Sync in the browser", async () => {
    mocks.enqueueSyncJob.mockResolvedValue({ success: true, jobId: "job-id" });
    renderSyncAction();

    const confirm = openDialog();
    await act(async () => {
      fireEvent.click(confirm);
    });

    expect(mocks.enqueueSyncJob).toHaveBeenCalledExactlyOnceWith({
      accountId: "account-id",
      definition: mocks.definition,
    });
    expect(mocks.legacyExecute).not.toHaveBeenCalled();
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("shows an enqueue failure as a failed Sync task", async () => {
    mocks.enqueueSyncJob.mockResolvedValue({
      success: false,
      status: 500,
      error: "Failed to enqueue job",
    });
    renderSyncAction();

    const confirm = openDialog();
    await act(async () => {
      fireEvent.click(confirm);
    });

    expect(mocks.createTask).toHaveBeenCalledWith(
      TaskType.Sync,
      "sync.progress.enqueue-failed",
    );
    expect(mocks.updateTaskStatus).toHaveBeenCalledWith(
      "task-id",
      TaskStatus.Error,
    );
    expect(mocks.legacyExecute).not.toHaveBeenCalled();
  });

  it("submits once while an enqueue request is in flight", async () => {
    let resolveEnqueue: (value: unknown) => void = () => undefined;
    mocks.enqueueSyncJob.mockReturnValue(
      new Promise((resolve) => {
        resolveEnqueue = resolve;
      }),
    );
    renderSyncAction();
    const confirm = openDialog();

    await act(async () => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });
    expect(confirm).toBeDisabled();

    await act(async () => {
      resolveEnqueue({ success: true, jobId: "job-id" });
    });

    expect(mocks.enqueueSyncJob).toHaveBeenCalledOnce();
  });

  it("blocks submission from an open dialog when job progress disconnects", async () => {
    const { rerender } = renderSyncAction();
    const confirm = openDialog();
    expect(confirm).toBeEnabled();

    mocks.isJobProgressReady = false;
    rerender(
      <SyncAction
        icon={RefreshCw}
        label="Sync"
        disabled={false}
        t={((key: string) => key) as never}
      />,
    );

    expect(confirm).toBeDisabled();
    await act(async () => {
      fireEvent.click(confirm);
    });
    expect(mocks.enqueueSyncJob).not.toHaveBeenCalled();
  });

  it("keeps the in-browser Sync when the Job flag is disabled", async () => {
    mocks.isPlaylistActionJobEnabled = false;
    mocks.isJobProgressReady = false;
    mocks.legacyExecute.mockResolvedValue({
      isOk: () => true,
    });
    renderSyncAction();

    const confirm = openDialog();
    await act(async () => {
      fireEvent.click(confirm);
    });

    expect(mocks.legacyExecute).toHaveBeenCalledOnce();
    expect(mocks.enqueueSyncJob).not.toHaveBeenCalled();
  });
});
