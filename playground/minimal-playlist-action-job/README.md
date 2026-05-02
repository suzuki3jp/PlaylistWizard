# Playlist Action Job

## What is Playlist Action
The actions to organize playlists (copy, merge, etc.) are called Playlist Actions in PlaylistWizard.

## What is Playlist Action Job
Playlist Action Job is Playlist Actions running on the backend.
It persists Playlist Actions, meaning that even if you reload browser window, Playlist Actions are never lost during processing

## Architecture
1. User submits a request to run a Playlist Action from the UI
2. Write job data to the DB
3. Enqueue a planning step to Cloudflare Queues to calculate job steps and enqueue the calculated job steps
4. Run the steps on Cloudflare workers
5. Mark the job as done in the DB when all steps are complete

## Security
Cloudflare Queues can only be enqueued from Cloudflare Workers, so we verify the session token on Cloudflare Workers and enqueue jobs only after authentication succeeds.

## Authentication
Request to enqueue the job with the user session token from Next.js
→ Receive the request on Cloudflare Workers and request /api/auth/get-session
   (Next.js API route) to verify the session token
→ Enqueue the job to Cloudflare Queues and write job data to the DB
   with user_id and account_id


## Minimal Start
Playlist Action Job's implementation is divided into the following phases.

### Phase 1: Implement foundations
- Cloudflare Queues
- Cloudflare Workers
  - Endpoints
    - Register a Job
      - Receive the session token
      - Receive the job data
  - Verify the session token
- Next.js app
  - Request to Cloudflare Workers to register jobs

- All APIs are implemented with Hono, type-safe, with a generated client
- Only supports Job.CreatePlaylist
- A/B Tests (Feature Toggle)
- Job.CreatePlaylist is gated behind an A/B test to start from minimal rollout
- Released at 0% — only accessible to developers
- Purpose: debugging the Playlist Action Job architecture in production

### Phase 2: Expand supported Playlist Action Jobs
Supports:
- Copy
- Shuffle
- Merge
- Extract
- Delete
- Deduplicate
- Sync

### Phase 3: Rollout
Roll out the A/B test from 0% to 100%.
