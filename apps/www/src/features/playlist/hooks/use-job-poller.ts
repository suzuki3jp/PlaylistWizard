"use client";
import { useQuery } from "@tanstack/react-query";
import type { JobResponse } from "@/lib/schemas/jobs";
import { JobStatus } from "@/lib/schemas/jobs";

async function fetchJob(jobId: string): Promise<JobResponse> {
  const res = await fetch(`/api/v1/jobs/${jobId}`);
  if (!res.ok) throw new Error(`Failed to fetch job: ${res.status}`);
  return res.json() as Promise<JobResponse>;
}

export function useJobPoller(jobId: string) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJob(jobId),
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (
        status === JobStatus.Completed ||
        status === JobStatus.Failed ||
        status === JobStatus.Cancelled
      )
        return false;
      if (query.state.status === "error") return 10000;
      return 2000;
    },
  });
}
