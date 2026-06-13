export const formatError = (err: unknown): string => {
  if (err instanceof Error) {
    const details = err as Error & {
      body?: unknown;
      status?: unknown;
      statusCode?: unknown;
    };
    const parts = [
      err.message || err.name,
      details.status ? `status=${String(details.status)}` : null,
      details.statusCode ? `statusCode=${String(details.statusCode)}` : null,
      details.body ? `body=${JSON.stringify(details.body)}` : null,
      err.stack && !err.message ? `stack=${err.stack}` : null,
    ].filter(Boolean);

    return parts.join(" ");
  }

  if (typeof err === "string") return err || "(empty string error)";

  if (err === null) return "(null error)";
  if (err === undefined) return "(undefined error)";

  try {
    const serialized = JSON.stringify(err);
    return serialized && serialized !== "{}"
      ? serialized
      : String(err) || "(empty object error)";
  } catch {
    return String(err) || "(unserializable error)";
  }
};
