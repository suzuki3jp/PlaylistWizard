export const JOB_PROGRESS_STREAM_CONNECT_PATH = "/connect";
export const JOB_PROGRESS_STREAM_PUBLISH_PATH = "/publish";

const JOB_PROGRESS_STREAM_INTERNAL_ORIGIN = "https://playlistwizard.internal";

// Used only as the Request URL for DurableObjectStub.fetch. The stub dispatches
// internally to the Durable Object instance; this origin is not a public endpoint.
const createInternalRequestUrl = (pathname: string): string =>
  new URL(pathname, JOB_PROGRESS_STREAM_INTERNAL_ORIGIN).toString();

export const JOB_PROGRESS_STREAM_CONNECT_REQUEST_URL = createInternalRequestUrl(
  JOB_PROGRESS_STREAM_CONNECT_PATH,
);

export const JOB_PROGRESS_STREAM_PUBLISH_REQUEST_URL = createInternalRequestUrl(
  JOB_PROGRESS_STREAM_PUBLISH_PATH,
);
