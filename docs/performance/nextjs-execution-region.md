# Next.js execution region experiment

This runbook describes how to choose the Vercel Function region for `apps/www` from measurements rather than defaults. Next.js on Vercel reads Supabase PostgreSQL directly through `DATABASE_URL` ([apps/www/src/lib/db/index.ts](../../apps/www/src/lib/db/index.ts)), so every server render, proxy check and Server Action that touches the database pays the round trip between the Function region and the database. The API Worker reaches the same database through Hyperdrive ([ADR 0006](../adr/0006-use-hyperdrive-for-api-database-access.md)) and is out of scope here.

The region is not versioned in this repository unless `apps/www/vercel.json` (or the `vercel.json` at the Vercel project's Root Directory) contains a `regions` entry. Without it, the Function region comes from the Vercel dashboard (Project Settings → Functions → Function Region). See [Vercel region configuration](https://vercel.com/docs/functions/configuring-functions/region).

## Scope

In scope: the Function region for the Next.js deployment, chosen and versioned in one revertible change.

Out of scope, each needing its own measured change:

- Moving the Supabase project or pooler to another region.
- Enabling Hyperdrive query caching for auth or Account reads.
- Changing Cloudflare Worker placement.

## 1. Facts to confirm before measuring

Record each answer in the results write-up. Do not paste connection strings, cookies or tokens anywhere.

| Fact | Where to read it |
| --- | --- |
| Current Function Region and whether the dashboard overrides the default | Vercel → Project Settings → Functions |
| Plan and how many Function regions it allows | Vercel → Settings → Billing |
| Supabase project region | Supabase → Project Settings → General / Infrastructure |
| Which endpoint Vercel's `DATABASE_URL` uses: direct (`db.<ref>.supabase.co`), Supavisor session mode (`:5432`) or transaction mode (`:6543`), and the pooler region in `aws-<n>-<region>.pooler.supabase.com` | Vercel → Project Settings → Environment Variables (Production and Preview), read host and port only |
| Whether Preview deployments use the same database as Production | Same as above |
| Whether sign-in works on a Preview deployment URL. Session cookies are issued by the API Worker and shared across `.playlistwizard.app` ([ADR 0004](../adr/0004-use-workers-as-canonical-auth-server.md)), so a Preview on `*.vercel.app` does not receive them unless it is served from a `playlistwizard.app` subdomain | Sign in on a Preview URL |

The candidate region is the Vercel region closest to the database endpoint, for example:

| Supabase (AWS) region | Nearest Vercel region |
| --- | --- |
| `ap-northeast-1` (Tokyo) | `hnd1` |
| `ap-northeast-3` (Osaka) | `kix1` |
| `ap-northeast-2` (Seoul) | `icn1` |
| `ap-southeast-1` (Singapore) | `sin1` |
| `us-east-1` (N. Virginia) | `iad1` |
| `us-west-1` (N. California) | `sfo1` |
| `eu-central-1` (Frankfurt) | `fra1` |

If the database is already next to the current region, the experiment still runs to version the current region with evidence.

## 2. Deployments to compare

Compare identical code and data. Only the region may differ.

1. Pick one commit. Deploy it as the baseline (current region).
2. From a throwaway branch at the same commit, add `vercel.json` at the Vercel project's Root Directory with only the candidate region, and let Vercel build a Preview deployment:

   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "regions": ["hnd1"]
   }
   ```

3. Confirm the region of each deployment from the deployment's Functions tab and from the `executionRegion` the benchmark prints. The first segment of `x-vercel-id` is the edge that accepted the request, and the last region segment is where the Function ran. A Cloudflare `cf-ray` suffix only tells you which Cloudflare location accepted the request.

If Preview deployments use a different database from Production, or cannot sign in, they cannot measure authenticated paths. In that case record public paths on Previews and decide with the project owner whether a short, announced production switch in the dashboard (with the rollback below ready) is acceptable for authenticated measurements.

## 3. What to measure

Run all measurements from the same client location and network, and alternate between the two deployments in rounds so time-of-day effects hit both. Use at least 30 samples per cell; the script reports p50/p95 only from 20 samples upward.

| Path type | Example paths | Tool |
| --- | --- | --- |
| Public HTML | `/ja`, `/ja/privacy`, `/ja/sign-in` | `benchmark-region.ts` |
| Authenticated server render (session, Account and DB reads) | `/ja/playlists?<focused Account query>`, `/ja/settings?<focused Account query>` copied from the browser address bar after sign-in | `benchmark-region.ts` with `BENCHMARK_COOKIE` |
| Authenticated client navigation (RSC payloads) | Playlists → browser, Playlists → settings, search | Browser DevTools Network panel, Vercel Speed Insights |
| Playlist read Server Actions | Loading the Playlists page and the Playlist browser | Browser DevTools (`POST` with `Next-Action` header), Sentry traces |

Server Action IDs change on every build, so the script does not call them. Measure them in the browser on each deployment.

For each path, take two runs:

- **Cold**: new connection per request and an idle gap, which approximates a first visit and gives Functions a chance to scale down. With a 60-second gap, 30 samples take about 30 minutes per path. The script cannot confirm a Function cold start from outside, so check the deployment logs if the distinction matters:

  ```sh
  node apps/www/scripts/benchmark-region.ts --base-url <deployment-url> \
    --path /ja --path /ja/privacy --samples 30 --connection fresh \
    --interval-ms 60000 --label <region>-cold --out <region>-public-cold.json
  ```

- **Warm**: reused connection after warm-up, which approximates in-app navigation:

  ```sh
  node apps/www/scripts/benchmark-region.ts --base-url <deployment-url> \
    --path /ja --path /ja/privacy --samples 30 --connection reuse --warmup 3 \
    --label <region>-warm --out <region>-public-warm.json
  ```

For authenticated paths, pass the `Cookie` request header value copied from DevTools through the environment, and use a test User whose data you are allowed to read:

```sh
read -rs BENCHMARK_COOKIE && export BENCHMARK_COOKIE
node apps/www/scripts/benchmark-region.ts --base-url <deployment-url> \
  --path '/ja/playlists?<focused Account query>' --samples 30 --connection reuse --warmup 3 \
  --label <region>-auth-warm --out <region>-auth-warm.json
unset BENCHMARK_COOKIE
```

The script sends sequential read-only `GET` requests, never follows redirects and never writes the cookie to its output. A `3xx` on a protected page means the cookie has expired or the URL lacks the focused Account. Discard that run.

How to read the output:

- `ttfbMs` is request start to response headers, including DNS, TCP and TLS on fresh connections.
- `serverWaitMs` is connection established to response headers. It covers forwarding from the edge to the Function region, queueing and application work, including database round trips. The region change should show up here.
- Results where `vercelCache` is `HIT` or `executionRegion` is `none` were served from the edge cache without running a Function. They say nothing about Function placement.
- `serverTiming` holds the `Server-Timing` header when the deployment emits one.

## 4. Functional checks on the candidate deployment

- Sign in with Google, including the auth callback, and confirm the session survives a reload.
- Sign out.
- Link a second Account and switch the focused Account.
- Load Playlists and the Playlist browser and confirm Playlist reads succeed.

## 5. Decision and versioning

Pick the region with lower `serverWaitMs` p50 and p95 for the authenticated server render and the Server Action timings. Public HTML alone is not enough, because it can be served without touching the database. If the candidate does not win clearly, keep the current region.

Version the winner in one PR:

- Add or update `vercel.json` at the Vercel project's Root Directory with the winning `regions` value, even if the winner is the current region, so the choice no longer depends on the dashboard.
- Add the result JSON files and a short write-up under `docs/performance/results/`. Include the facts from section 1, the client location, the commit, the sample counts and the p50/p95 tables.
- Stay within the plan's region limit.

## Rollback

Revert the PR that added `regions`. Vercel then uses the dashboard Function Region again on the next deployment. If the dashboard value was changed during the experiment, set it back to the value recorded in section 1.
