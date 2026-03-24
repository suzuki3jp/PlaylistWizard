"use client";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Filter,
  GitMerge,
  ListX,
  Shuffle,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { JobStatus, OperationType } from "@/lib/schemas/jobs";
import { useT } from "@/presentation/hooks/t/client";
import { type ServerJob, useServerJobs } from "../contexts/server-jobs";
import { useJobPoller } from "../hooks/use-job-poller";
import { useInvalidatePlaylistsQuery } from "../queries/use-playlists";

function getJobIcon(type: ServerJob["type"]) {
  switch (type) {
    case OperationType.Copy:
      return <Copy className="h-4 w-4" />;
    case OperationType.Merge:
      return <GitMerge className="h-4 w-4" />;
    case OperationType.Extract:
      return <Filter className="h-4 w-4" />;
    case OperationType.Deduplicate:
      return <ListX className="h-4 w-4" />;
    case OperationType.Shuffle:
      return <Shuffle className="h-4 w-4" />;
  }
}

interface ServerJobItemProps {
  job: ServerJob;
  onRemove: (jobId: string) => void;
  lang: string;
}

function ServerJobItem({ job, onRemove, lang }: ServerJobItemProps) {
  const { t } = useT(lang);
  const { data } = useJobPoller(job.jobId);
  const invalidatePlaylistsQuery = useInvalidatePlaylistsQuery();

  const status = data?.status ?? JobStatus.Pending;
  const progress = data?.progress ?? 0;
  const isTerminal =
    status === JobStatus.Completed ||
    status === JobStatus.Failed ||
    status === JobStatus.Cancelled;
  const jobId = job.jobId;

  useEffect(() => {
    if (data?.status === JobStatus.Completed) {
      invalidatePlaylistsQuery();
      const timer = setTimeout(() => onRemove(jobId), 2000);
      return () => clearTimeout(timer);
    }
    if (
      data?.status === JobStatus.Failed ||
      data?.status === JobStatus.Cancelled
    ) {
      const timer = setTimeout(() => onRemove(jobId), 2000);
      return () => clearTimeout(timer);
    }
  }, [data, invalidatePlaylistsQuery, onRemove, jobId]);

  async function handleCancel() {
    await fetch(`/api/v1/jobs/${job.jobId}/cancel`, { method: "PATCH" });
  }

  function getStatusIcon() {
    if (status === JobStatus.Completed)
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === JobStatus.Failed)
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    return null;
  }

  const dotColor =
    status === JobStatus.Processing || status === JobStatus.Pending
      ? "bg-blue-500"
      : status === JobStatus.Completed
        ? "bg-green-500"
        : status === JobStatus.Failed
          ? "bg-red-500"
          : "bg-gray-500";

  const statusLabel =
    status === JobStatus.Processing || status === JobStatus.Pending
      ? t("task-progress.common.processing")
      : status === JobStatus.Completed
        ? t("task-progress.common.completed")
        : status === JobStatus.Failed
          ? t("task-progress.common.error")
          : t("task-progress.common.cancelled");

  return (
    <div className="rounded-md bg-gray-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`rounded-full p-1.5 ${dotColor}`}>
            {getJobIcon(job.type)}
          </div>
          <span className="text-sm text-white">{job.label}</span>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          {!isTerminal && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              onClick={handleCancel}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">
                {t("task-progress.common.cancel")}
              </span>
            </Button>
          )}
        </div>
      </div>
      <Progress
        value={progress}
        className="h-2"
        indicatorClassName={dotColor}
      />
      <div className="mt-1 flex justify-between">
        <span className="text-gray-400 text-xs">{statusLabel}</span>
        <span className="text-gray-400 text-xs">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export function ServerJobsMonitor({ lang }: { lang: string }) {
  const { t } = useT(lang);
  const { jobs, removeJob } = useServerJobs();

  if (jobs.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-white">
          {t("task-progress.common.title")}
        </h3>
      </div>
      <div className="max-h-60 space-y-3 overflow-y-auto">
        {jobs.map((job) => (
          <ServerJobItem
            key={job.jobId}
            job={job}
            onRemove={removeJob}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}
