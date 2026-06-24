import { spawnSync } from "node:child_process";

const formatPathspecs = [
  ":(glob)**/*.cjs",
  ":(glob)**/*.css",
  ":(glob)**/*.html",
  ":(glob)**/*.js",
  ":(glob)**/*.json",
  ":(glob)**/*.jsonc",
  ":(glob)**/*.jsx",
  ":(glob)**/*.less",
  ":(glob)**/*.mjs",
  ":(glob)**/*.scss",
  ":(glob)**/*.ts",
  ":(glob)**/*.tsx",
  ":(glob)**/*.yaml",
  ":(glob)**/*.yml",
];

/**
 * Runs a command synchronously and exits with its status when the command fails.
 *
 * Keeping command execution in one helper makes failures from Git and Oxfmt
 * visible in both local PoC runs and CI.
 */
function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout ?? "";
}

/**
 * Returns format-supported files from the pull request's base diff.
 *
 * Oxfmt intentionally starts with changed files because formatting the full
 * Biome-formatted repository would create a large unrelated migration diff.
 */
function getChangedFiles() {
  const baseRef = process.env.OXFMT_BASE_REF ?? "origin/develop";
  const output = runCommand("git", [
    "diff",
    `${baseRef}...HEAD`,
    "--name-only",
    "--diff-filter=ACMRT",
    "-z",
    "--",
    ...formatPathspecs,
  ]);

  return output.split("\0").filter(Boolean);
}

const files = getChangedFiles();

if (files.length > 0) {
  runCommand(
    "pnpm",
    ["exec", "oxfmt", "--check", "--no-error-on-unmatched-pattern", ...files],
    { stdio: "inherit" },
  );
}
