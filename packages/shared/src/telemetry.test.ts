import { describe, expect, it } from "vitest";
import {
  annotateExternalHttpSpan,
  annotateTransactionEvent,
  classifyExternalHttpUrl,
  TELEMETRY_ATTRIBUTES,
} from "./telemetry";

describe("classifyExternalHttpUrl", () => {
  it("groups paginated YouTube requests by endpoint regardless of query", () => {
    const first = classifyExternalHttpUrl(
      "https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PL1&maxResults=50",
    );
    const next = classifyExternalHttpUrl(
      "https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PL2&pageToken=CDIQAA",
    );

    expect(first).toEqual({
      service: "youtube",
      endpoint: "/youtube/v3/playlistItems",
    });
    expect(next).toEqual(first);
  });

  it("treats both YouTube Data API hosts as the same service", () => {
    expect(
      classifyExternalHttpUrl(
        "https://www.googleapis.com/youtube/v3/playlists",
      ),
    ).toEqual({ service: "youtube", endpoint: "/youtube/v3/playlists" });
  });

  it("keeps different YouTube resources in different groups", () => {
    expect(
      classifyExternalHttpUrl(
        "https://www.googleapis.com/youtube/v3/videos?id=abc",
      )?.endpoint,
    ).toBe("/youtube/v3/videos");
    expect(
      classifyExternalHttpUrl(
        "https://www.googleapis.com/youtube/v3/search?q=x",
      )?.endpoint,
    ).toBe("/youtube/v3/search");
  });

  it("collapses unknown YouTube resources into one bounded group", () => {
    expect(
      classifyExternalHttpUrl(
        "https://www.googleapis.com/youtube/v3/someNewResource/abc123",
      )?.endpoint,
    ).toBe("/youtube/v3/other");
  });

  it("ignores non-YouTube and unparsable URLs", () => {
    expect(
      classifyExternalHttpUrl("https://oauth2.googleapis.com/token"),
    ).toBeNull();
    expect(
      classifyExternalHttpUrl("https://www.googleapis.com/drive/v3/files"),
    ).toBeNull();
    expect(classifyExternalHttpUrl("/youtube/v3/playlists")).toBeNull();
  });
});

describe("annotateExternalHttpSpan", () => {
  it("adds service and endpoint attributes to YouTube client spans", () => {
    const span = annotateExternalHttpSpan({
      op: "http.client",
      description:
        "GET https://youtube.googleapis.com/youtube/v3/playlistItems",
      data: {
        "url.full":
          "https://youtube.googleapis.com/youtube/v3/playlistItems?pageToken=X",
      },
    });

    expect(span.data[TELEMETRY_ATTRIBUTES.externalService]).toBe("youtube");
    expect(span.data[TELEMETRY_ATTRIBUTES.externalEndpoint]).toBe(
      "/youtube/v3/playlistItems",
    );
  });

  it("falls back to the description when no URL attribute exists", () => {
    const span = annotateExternalHttpSpan({
      op: "http.client",
      description: "POST https://www.googleapis.com/youtube/v3/playlists",
      data: {},
    });

    expect(span.data[TELEMETRY_ATTRIBUTES.externalEndpoint]).toBe(
      "/youtube/v3/playlists",
    );
  });

  it("leaves spans that are not HTTP client requests untouched", () => {
    const span = annotateExternalHttpSpan({
      op: "db",
      description: "https://www.googleapis.com/youtube/v3/playlists",
      data: {},
    });

    expect(span.data).toEqual({});
  });
});

describe("annotateTransactionEvent", () => {
  it("writes the resolved route to the root and every child span", () => {
    const event = annotateTransactionEvent(
      {
        transaction: "GET /[lang]/playlists",
        contexts: { trace: { data: {} } },
        spans: [
          { op: "http.server.middleware", description: "middleware", data: {} },
          {
            op: "http.client",
            description:
              "GET https://youtube.googleapis.com/youtube/v3/playlists",
            data: {},
          },
        ],
      },
      {
        layer: "nextjs.node",
        resolveRoute: () => ({ route: "/playlists", locale: "ja" }),
      },
    );

    for (const data of [
      event.contexts?.trace?.data,
      ...(event.spans ?? []).map((span) => span.data),
    ]) {
      expect(data).toMatchObject({
        [TELEMETRY_ATTRIBUTES.layer]: "nextjs.node",
        [TELEMETRY_ATTRIBUTES.route]: "/playlists",
        [TELEMETRY_ATTRIBUTES.locale]: "ja",
      });
    }
    expect(event.spans?.[1].data[TELEMETRY_ATTRIBUTES.externalEndpoint]).toBe(
      "/youtube/v3/playlists",
    );
  });

  it("reuses a route that instrumentation already set on the root span", () => {
    const event = annotateTransactionEvent(
      {
        contexts: {
          trace: { data: { [TELEMETRY_ATTRIBUTES.route]: "/v1/jobs" } },
        },
        spans: [{ op: "db", data: {} }],
      },
      { layer: "worker" },
    );

    expect(event.spans?.[0].data).toEqual({
      [TELEMETRY_ATTRIBUTES.layer]: "worker",
      [TELEMETRY_ATTRIBUTES.route]: "/v1/jobs",
    });
  });

  it("adds only the layer when no route is known", () => {
    const event = annotateTransactionEvent(
      { contexts: { trace: {} }, spans: [] },
      { layer: "worker", resolveRoute: () => null },
    );

    expect(event.contexts?.trace?.data).toEqual({
      [TELEMETRY_ATTRIBUTES.layer]: "worker",
    });
  });
});
