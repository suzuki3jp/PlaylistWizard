export type EnqueueJobResult =
  | { type: "success"; jobId: string }
  | { type: "account_not_found" }
  | { type: "enqueue_failed" };
