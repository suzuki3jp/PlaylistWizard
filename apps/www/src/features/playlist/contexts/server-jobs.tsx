"use client";
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useState,
} from "react";
import type { JobType } from "@/lib/schemas/jobs";

export type ServerJob = {
  jobId: string;
  type: JobType;
  label: string;
};

interface ServerJobsContextValue {
  jobs: ServerJob[];
  addJob: (job: ServerJob) => void;
  removeJob: (jobId: string) => void;
}

const ServerJobsContext = createContext<ServerJobsContextValue>({
  jobs: [],
  addJob: () => {
    throw new Error("addJob called before ServerJobsProvider was mounted");
  },
  removeJob: () => {
    throw new Error("removeJob called before ServerJobsProvider was mounted");
  },
});

export function ServerJobsProvider({ children }: PropsWithChildren) {
  const [jobs, setJobs] = useState<ServerJob[]>([]);

  const addJob = useCallback((job: ServerJob) => {
    setJobs((prev) => [...prev, job]);
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
  }, []);

  return (
    <ServerJobsContext.Provider value={{ jobs, addJob, removeJob }}>
      {children}
    </ServerJobsContext.Provider>
  );
}

export function useServerJobs() {
  return use(ServerJobsContext);
}
