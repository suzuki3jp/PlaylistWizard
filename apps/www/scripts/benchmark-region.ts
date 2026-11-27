/**
 * Next.js の実行リージョンを比較するために、デプロイメントへ読み取り専用の GET を逐次送り、
 * 接続確立・初バイトまでの時間と Vercel が返す実行リージョンを記録するスクリプト
 *
 * 手順と結果の解釈は docs/performance/nextjs-execution-region.md を参照。
 *
 * Usage (Node.js 22.18 以降は型を剥がして直接実行できる。apps/www/package.json に "type" がないため
 * MODULE_TYPELESS_PACKAGE_JSON 警告が出るが計測には影響しない。`node --no-warnings` で抑止できる):
 *   node apps/www/scripts/benchmark-region.ts --base-url <url> --path <path> [--path <path>...]
 *     [--samples 30] [--warmup 0] [--connection fresh|reuse] [--interval-ms 0]
 *     [--label <name>] [--out <file.json>]
 *
 * 認証が必要なページを計測する場合は、ブラウザからコピーした Cookie ヘッダーの値を
 * 環境変数 BENCHMARK_COOKIE で渡す。シェル履歴に残らないよう CLI 引数では受け取らず、
 * 出力にも書き出さない。
 *
 * Example:
 *   node apps/www/scripts/benchmark-region.ts --base-url https://playlistwizard.app \
 *     --path /ja --path /ja/privacy --samples 30 --label production --out iad1-public.json
 */

import { writeFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { performance } from "node:perf_hooks";
import { parseArgs } from "node:util";

/** p50/p95 を報告する最小サンプル数。これ未満では外れ値 1 件で値が大きく動くため null とする */
const MIN_SAMPLES_FOR_PERCENTILES = 20;
/** 本番へ過剰な負荷をかけないための 1 パスあたりのサンプル数上限 */
const MAX_SAMPLES = 200;
/** 応答しないサーバーで計測が止まらないよう、1 リクエストをこの時間で打ち切って失敗として記録する */
const REQUEST_TIMEOUT_MS = 30_000;

type ConnectionMode = "fresh" | "reuse";

type SuccessSample = {
  path: string;
  error: null;
  status: number;
  /** keep-alive で既存の接続を再利用したか。true の場合 DNS/TCP/TLS は計測されない */
  reusedSocket: boolean;
  dnsMs: number | null;
  tcpMs: number | null;
  tlsMs: number | null;
  /** リクエスト送信開始からレスポンスヘッダー受信まで */
  ttfbMs: number;
  /** 接続確立後からレスポンスヘッダー受信まで。転送・キューイング・アプリケーション処理を含む */
  serverWaitMs: number;
  totalMs: number;
  ingressRegion: string | null;
  executionRegion: string | null;
  vercelCache: string | null;
  serverTiming: string | null;
};

/** 接続エラーやタイムアウトでレスポンスを得られなかったリクエスト。エラー率の比較に使う */
type FailedSample = {
  path: string;
  /** `ECONNRESET` などのエラーコード。コードがない場合はメッセージ */
  error: string;
  elapsedMs: number;
};

type Sample = SuccessSample | FailedSample;

/**
 * x-vercel-id（例: `hnd1::iad1::abcde-1700000000000-0123456789ab`）を、
 * リクエストを受けたエッジのリージョンと Function を実行したリージョンに分解する。
 * エッジのキャッシュから返された場合は Function を経由しないため実行リージョンは null になる。
 *
 * @see https://vercel.com/docs/headers/request-headers#x-vercel-id
 */
function parseVercelId(value: string | undefined): {
  ingressRegion: string | null;
  executionRegion: string | null;
} {
  if (!value) return { ingressRegion: null, executionRegion: null };
  const regions = value.split("::").slice(0, -1);
  return {
    ingressRegion: regions[0] ?? null,
    executionRegion: regions.length >= 2 ? regions[regions.length - 1] : null,
  };
}

function headerValue(value: string | string[] | undefined): string | null {
  if (value === undefined) return null;
  return Array.isArray(value) ? value.join(", ") : value;
}

/**
 * 1 回の GET を送り、ソケットのイベントから各フェーズの所要時間を計測する。
 * リダイレクトは追わない。保護ページの 3xx は Cookie の失効や focused Account の欠落を示すため、
 * そのまま status として記録して呼び出し側で検出できるようにする。
 * 長時間の計測が 1 回の一時的な失敗で失われないよう、失敗は reject せず FailedSample として返す。
 */
function measure(
  url: URL,
  agent: http.Agent,
  cookie: string | undefined,
): Promise<Sample> {
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve) => {
    const start = performance.now();
    let lookupAt: number | null = null;
    let connectAt: number | null = null;
    let secureConnectAt: number | null = null;

    const req = client.request(url, {
      method: "GET",
      agent,
      headers: {
        accept: "text/html",
        "user-agent": "PlaylistWizard-region-benchmark",
        ...(cookie ? { cookie } : {}),
      },
    });
    const fail = (err: NodeJS.ErrnoException) => {
      resolve({
        path: url.pathname + url.search,
        error: err.code ?? err.message,
        elapsedMs: performance.now() - start,
      });
    };

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(
        Object.assign(new Error("Request timed out"), { code: "ETIMEDOUT" }),
      );
    });

    req.on("socket", (socket) => {
      if (req.reusedSocket) return;
      socket.once("lookup", () => {
        lookupAt = performance.now();
      });
      socket.once("connect", () => {
        connectAt = performance.now();
      });
      socket.once("secureConnect", () => {
        secureConnectAt = performance.now();
      });
    });

    req.on("response", (res) => {
      const headersAt = performance.now();
      res.resume();
      res.on("error", fail);
      res.on("end", () => {
        const endAt = performance.now();
        const connectedAt = secureConnectAt ?? connectAt ?? start;
        resolve({
          path: url.pathname + url.search,
          error: null,
          status: res.statusCode ?? 0,
          reusedSocket: req.reusedSocket,
          dnsMs: lookupAt === null ? null : lookupAt - start,
          tcpMs: connectAt === null ? null : connectAt - (lookupAt ?? start),
          tlsMs:
            secureConnectAt === null || connectAt === null
              ? null
              : secureConnectAt - connectAt,
          ttfbMs: headersAt - start,
          serverWaitMs: headersAt - connectedAt,
          totalMs: endAt - start,
          ...parseVercelId(
            headerValue(res.headers["x-vercel-id"]) ?? undefined,
          ),
          vercelCache: headerValue(res.headers["x-vercel-cache"]),
          serverTiming: headerValue(res.headers["server-timing"]),
        });
      });
    });
    req.on("error", fail);
    req.end();
  });
}

/** 最近傍順位法によるパーセンタイル。サンプル数が不足する場合は null */
function percentile(values: number[], p: number): number | null {
  if (values.length < MIN_SAMPLES_FOR_PERCENTILES) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.max(0, rank - 1)];
}

function countBy(values: (string | number | null)[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = String(value ?? "none");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/** 失敗したリクエストは件数とエラーコードだけを数え、時間の統計は成功したリクエストから求める */
function summarize(samples: Sample[]) {
  const succeeded = samples.filter((s): s is SuccessSample => s.error === null);
  const failed = samples.filter((s): s is FailedSample => s.error !== null);
  const stat = (pick: (s: SuccessSample) => number) => {
    const values = succeeded.map(pick);
    return { p50: percentile(values, 50), p95: percentile(values, 95) };
  };
  return {
    count: samples.length,
    errors: countBy(failed.map((s) => s.error)),
    statuses: countBy(succeeded.map((s) => s.status)),
    executionRegions: countBy(succeeded.map((s) => s.executionRegion)),
    ingressRegions: countBy(succeeded.map((s) => s.ingressRegion)),
    vercelCache: countBy(succeeded.map((s) => s.vercelCache)),
    ttfbMs: stat((s) => s.ttfbMs),
    serverWaitMs: stat((s) => s.serverWaitMs),
    totalMs: stat((s) => s.totalMs),
  };
}

function formatMs(value: number | null): string {
  return value === null ? "n/a" : value.toFixed(0);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isLoopback(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}

const { values: args } = parseArgs({
  options: {
    "base-url": { type: "string" },
    path: { type: "string", multiple: true },
    samples: { type: "string", default: "30" },
    warmup: { type: "string", default: "0" },
    connection: { type: "string", default: "fresh" },
    "interval-ms": { type: "string", default: "0" },
    label: { type: "string" },
    out: { type: "string" },
  },
});

const baseUrlArg = args["base-url"];
const paths = args.path ?? [];
const samples = Number(args.samples);
const warmup = Number(args.warmup);
const intervalMs = Number(args["interval-ms"]);
const connection = args.connection as ConnectionMode;

if (
  !baseUrlArg ||
  paths.length === 0 ||
  !Number.isInteger(samples) ||
  samples < 1 ||
  samples > MAX_SAMPLES ||
  !Number.isInteger(warmup) ||
  warmup < 0 ||
  !Number.isFinite(intervalMs) ||
  intervalMs < 0 ||
  !["fresh", "reuse"].includes(connection)
) {
  console.error(
    `Usage: node scripts/benchmark-region.ts --base-url <url> --path <path> [--path <path>...] [--samples 1-${MAX_SAMPLES}] [--warmup <n>] [--connection fresh|reuse] [--interval-ms <ms>] [--label <name>] [--out <file.json>]`,
  );
  process.exit(1);
}

const baseUrl = new URL(baseUrlArg);
const cookie = process.env.BENCHMARK_COOKIE || undefined;
if (cookie && baseUrl.protocol !== "https:" && !isLoopback(baseUrl.hostname)) {
  console.error("Refusing to send BENCHMARK_COOKIE over plain HTTP.");
  process.exit(1);
}

// fresh は毎回 DNS/TCP/TLS からやり直す初回訪問相当、reuse は keep-alive で接続を使い回す遷移相当
const agent =
  baseUrl.protocol === "https:"
    ? new https.Agent({ keepAlive: connection === "reuse", maxSockets: 1 })
    : new http.Agent({ keepAlive: connection === "reuse", maxSockets: 1 });

// 絶対 URL の --path は baseUrl を無視するため、Cookie が別オリジンや平文 HTTP に送られないよう計測前にすべて検証する
const urls = paths.map((path) => new URL(path, baseUrl));
const offOrigin = paths.filter((_, i) => urls[i].origin !== baseUrl.origin);
if (offOrigin.length > 0) {
  console.error(
    `--path must stay on ${baseUrl.origin}: ${offOrigin.join(", ")}`,
  );
  process.exit(1);
}

const startedAt = new Date().toISOString();
const results: Sample[] = [];
for (const url of urls) {
  for (let i = 0; i < warmup; i++) await measure(url, agent, cookie);
  for (let i = 0; i < samples; i++) {
    if (i > 0 && intervalMs > 0) await sleep(intervalMs);
    results.push(await measure(url, agent, cookie));
  }
}
agent.destroy();

const byPath = Object.fromEntries(
  urls.map((url) => {
    const key = url.pathname + url.search;
    return [key, summarize(results.filter((s) => s.path === key))];
  }),
);

const report = {
  label: args.label ?? null,
  origin: baseUrl.origin,
  startedAt,
  finishedAt: new Date().toISOString(),
  nodeVersion: process.version,
  connection,
  warmup,
  intervalMs,
  authenticated: cookie !== undefined,
  minSamplesForPercentiles: MIN_SAMPLES_FOR_PERCENTILES,
  summary: byPath,
  samples: results,
};

console.log(
  `${report.label ?? report.origin} connection=${connection} warmup=${warmup} intervalMs=${intervalMs} authenticated=${report.authenticated}`,
);
for (const [path, s] of Object.entries(byPath)) {
  console.log(
    [
      path,
      `n=${s.count}`,
      `errors=${JSON.stringify(s.errors)}`,
      `status=${JSON.stringify(s.statuses)}`,
      `exec=${JSON.stringify(s.executionRegions)}`,
      `cache=${JSON.stringify(s.vercelCache)}`,
      `ttfb(ms) p50=${formatMs(s.ttfbMs.p50)} p95=${formatMs(s.ttfbMs.p95)}`,
      `serverWait(ms) p50=${formatMs(s.serverWaitMs.p50)} p95=${formatMs(s.serverWaitMs.p95)}`,
    ].join("  "),
  );
}
if (results.some((s) => s.error !== null)) {
  console.warn(
    "Some requests failed without a response. Their timings are excluded from p50/p95 and counted under errors.",
  );
}
if (
  results.some((s) => s.error === null && (s.status < 200 || s.status >= 300))
) {
  console.warn(
    "Some responses were not 2xx. Redirects on protected pages usually mean an expired cookie or a URL without the focused Account.",
  );
}

if (args.out) {
  writeFileSync(args.out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${args.out}`);
}
