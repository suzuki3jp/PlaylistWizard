# Web deployment

The [Vercel workflow](/.github/workflows/vercel.yml) deploys `main` to
Production at `playlistwizard.app` and `develop` to Preview at
`dev.playlistwizard.app`. Other branches only build. Each deployment builds the
application, migrates its environment's database, and then publishes the artifacts.
Production and Preview can run in parallel; deployments within one environment
are serialized without canceling an active run.

## GitHub configuration

Configure `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` as GitHub repository variables.
In the `Production` and `Preview` GitHub Environments, set `VERCEL_TOKEN` and
`DATABASE_URL` as secrets. The DB connection must point to the production or
development DB respectively and allow migrations. An optional `SENTRY_AUTH_TOKEN`
environment secret enables build-time source map uploads; leaving it unset skips
uploads.

The GitHub migration URL and Vercel's runtime `DATABASE_URL` must target the same
database in each environment. Different DB roles can grant migration and runtime
access separately. If both use the same role, update both stored credentials when
rotating its password. Never point the Production migration secret at the dev DB.

Restrict GitHub Environment deployment branches outside the workflow: allow
`main` and `develop` in `Production` (the package-release workflow also uses this
environment on `develop`), and only `develop` in `Preview`. Branch conditions in a
workflow do not replace Environment protection rules.

## Build and runtime configuration

Keep application runtime secrets in the matching Vercel environment. Vercel
Secret variables (formerly Sensitive) cannot be read by `vercel pull`. Redacted
entries are removed from the downloaded build cache, and build-only Sentry
authentication comes from GitHub. The build step uses placeholders for DB and
auth initialization, with a DB endpoint that cannot reach either shared database.
These values are scoped to the build process; deployed functions read the actual
runtime secrets from Vercel. The migration step receives its real DB credential
separately from GitHub.

Build-time public configuration, including `API_URL`, `NEXT_PUBLIC_API_URL`, and
`GOOGLE_ANALYTICS_ID`, must be readable Config variables in Vercel so the workflow
can pull their environment-specific values before compiling. Preview overrides
for `develop` are included. Never make a runtime secret readable just to build it.

## Database migrations

Database migrations must remain compatible with the currently deployed web app
and Cloudflare API. Add new schema first, update all consumers, and only remove
old fields in a later release. If deployment or domain assignment fails after a
migration, the DB change remains applied while the old application serves traffic.
Rolling back a Vercel deployment does not roll back the database.
