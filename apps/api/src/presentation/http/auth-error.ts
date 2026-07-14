import type { Context } from "hono";
import type { Env } from "../../env";

const GITHUB_BUG_ISSUE_URL =
  "https://github.com/suzuki3jp/playlistwizard/issues/new?template=bug.yml";

// Mirrors the English generic error copy in apps/www/src/features/error/view.tsx.
// Keep both pages aligned because Better Auth callback failures render outside Next.js.
export const renderAuthErrorPage = (): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PlaylistWizard Auth Error</title>
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        min-height: 100vh;
        margin: 0;
        background: #030712;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      main {
        display: flex;
        min-height: 100vh;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
      }

      section {
        width: 100%;
        max-width: 448px;
        text-align: center;
      }

      .icon-wrap {
        display: flex;
        justify-content: center;
        margin-bottom: 24px;
      }

      .icon {
        display: flex;
        width: 80px;
        height: 80px;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
        background: rgb(239 68 68 / 20%);
        color: #ef4444;
        font-size: 42px;
        font-weight: 700;
        line-height: 1;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 0;
      }

      p {
        margin: 0;
        color: #9ca3af;
        line-height: 1.6;
      }

      .support {
        margin-top: 32px;
        border-top: 1px solid #1f2937;
        padding-top: 32px;
        font-size: 14px;
      }

      a {
        color: #f472b6;
        text-decoration: none;
      }

      a:hover {
        color: #f9a8d4;
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <main>
      <section aria-labelledby="auth-error-title">
        <div class="icon-wrap" aria-hidden="true">
          <div class="icon">!</div>
        </div>

        <h1 id="auth-error-title">Oops! Something Went Wrong</h1>
        <p>We're sorry, but something unexpected happened. Please try again in a moment.</p>

        <p class="support">
          If the issue continues, please let us know by creating a <a href="${GITHUB_BUG_ISSUE_URL}" target="_blank" rel="noreferrer">GitHub Issue</a>.
        </p>
      </section>
    </main>
  </body>
</html>`;

export const authError = (c: Context<{ Bindings: Env }>): Response =>
  c.html(renderAuthErrorPage());
