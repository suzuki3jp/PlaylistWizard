"use client";

import {
  type BackendJob,
  JobProgressEventType,
  parseSerializedJobProgressEvent,
} from "@playlistwizard/playlist-action-job";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FeatureFlagName } from "@/lib/feature-flags";
import { useFeatureFlag } from "@/presentation/hooks/useFeatureFlag";

const SNAPSHOT_TIMEOUT_MS = 10_000;
const RECONNECT_DELAYS_MS = [1_000, 2_000, 4_000] as const;

type JobProgressContextValue = {
  dismissJobsOptimistically: (jobIds: string[]) => void;
  isReady: boolean;
  jobs: BackendJob[];
  restoreJobs: (jobs: BackendJob[]) => void;
};

const JobProgressContext = createContext<JobProgressContextValue | null>(null);

const getApiUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not set");
  return url;
};

export const createJobProgressWebSocketUrl = (apiUrl: string): string => {
  const url = new URL("/jobs/progress", apiUrl);
  if (url.protocol === "https:") {
    url.protocol = "wss:";
  } else if (url.protocol === "http:") {
    url.protocol = "ws:";
  } else {
    throw new Error(`Unsupported API URL protocol: ${url.protocol}`);
  }
  return url.toString();
};

export function JobProgressProvider({ children }: PropsWithChildren) {
  const isPlaylistActionJobEnabled = useFeatureFlag(
    FeatureFlagName.playlistActionJob,
  );
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [isReady, setIsReady] = useState(!isPlaylistActionJobEnabled);
  const [error, setError] = useState<Error | null>(null);

  const dismissJobsOptimistically = useCallback((jobIds: string[]) => {
    if (jobIds.length === 0) return;
    const dismissedJobIds = new Set(jobIds);
    setJobs((current) => current.filter((job) => !dismissedJobIds.has(job.id)));
  }, []);

  const restoreJobs = useCallback((restoredJobs: BackendJob[]) => {
    if (restoredJobs.length === 0) return;
    setJobs((current) => {
      const currentJobIds = new Set(current.map((job) => job.id));
      const missingJobs = restoredJobs.filter(
        (job) => !currentJobIds.has(job.id),
      );
      return [...current, ...missingJobs];
    });
  }, []);

  useEffect(() => {
    if (!isPlaylistActionJobEnabled) {
      setJobs([]);
      setIsReady(true);
      setError(null);
      return;
    }

    let disposed = false;
    let hasReachedReady = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let snapshotTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanupTimers = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (snapshotTimer) clearTimeout(snapshotTimer);
      reconnectTimer = null;
      snapshotTimer = null;
    };

    const connect = (attempt: number) => {
      cleanupTimers();
      setIsReady(false);

      let receivedSnapshot = false;
      socket = new WebSocket(createJobProgressWebSocketUrl(getApiUrl()));

      snapshotTimer = setTimeout(() => {
        socket?.close(1000, "Snapshot timeout");
        if (!hasReachedReady) {
          setError(new Error("Job progress snapshot timed out"));
        }
      }, SNAPSHOT_TIMEOUT_MS);

      socket.onmessage = (message) => {
        try {
          const event = parseSerializedJobProgressEvent(String(message.data));

          if (event.type === JobProgressEventType.Snapshot) {
            receivedSnapshot = true;
            hasReachedReady = true;
            if (snapshotTimer) clearTimeout(snapshotTimer);
            snapshotTimer = null;
            setJobs(event.jobs);
            setIsReady(true);
            return;
          }

          if (!receivedSnapshot) {
            throw new Error("Received job progress update before snapshot");
          }

          if (event.type === JobProgressEventType.JobUpdated) {
            setJobs((current) => {
              const withoutUpdated = current.filter(
                (job) => job.id !== event.job.id,
              );
              return [...withoutUpdated, event.job];
            });
            return;
          }

          if (event.type === JobProgressEventType.JobRemoved) {
            setJobs((current) =>
              current.filter((job) => job.id !== event.jobId),
            );
            return;
          }

          throw new Error(event.code);
        } catch (err) {
          setError(
            err instanceof Error
              ? err
              : new Error("Invalid job progress event"),
          );
          socket?.close(4002, "Invalid job progress event");
        }
      };

      socket.onerror = () => {
        socket?.close(4001, "Job progress socket error");
      };

      socket.onclose = () => {
        if (disposed) return;
        if (snapshotTimer) clearTimeout(snapshotTimer);
        snapshotTimer = null;

        if (!hasReachedReady) {
          setError(new Error("Job progress connection closed before snapshot"));
          return;
        }

        setIsReady(false);
        if (attempt >= RECONNECT_DELAYS_MS.length) {
          setError(new Error("Job progress reconnect failed"));
          return;
        }

        reconnectTimer = setTimeout(
          () => connect(attempt + 1),
          RECONNECT_DELAYS_MS[attempt],
        );
      };
    };

    connect(0);

    return () => {
      disposed = true;
      cleanupTimers();
      socket?.close(1000, "Job progress provider unmounted");
    };
  }, [isPlaylistActionJobEnabled]);

  const value = useMemo(
    () => ({
      dismissJobsOptimistically,
      isReady,
      jobs,
      restoreJobs,
    }),
    [dismissJobsOptimistically, isReady, jobs, restoreJobs],
  );

  if (error) throw error;

  return (
    <JobProgressContext.Provider value={value}>
      {children}
    </JobProgressContext.Provider>
  );
}

export const useJobProgress = (): JobProgressContextValue => {
  const context = useContext(JobProgressContext);
  if (!context) {
    throw new Error("useJobProgress must be used within JobProgressProvider");
  }
  return context;
};
