---
name: git-cm
description: "Generate commit message and automatically commit staged changes. ONLY use when user explicitly invokes /git-cm slash command. Do NOT trigger on general git questions."
---

# Git Auto-Commit

Generate commit message and execute commit automatically.

## General Rules
- If user specifies language (e.g., "日本語で", "in English"), write commit message in that language
- If user wants to add details (e.g., "with details", "bodyあり"), ALWAYS write commit message with Body segment

## Workflow

### 1. Check Staged Changes

```bash
git diff --cached --stat
```

If empty, stop and tell user to `git add` first.

### 2. Analyze Diff

```bash
git diff --cached
```

For large diffs (>500 lines), check `--stat` first, then view key files selectively.

If needed for context:
- Read full file for new files
- Check `git log --oneline -5`

### 3. Generate & Execute Commit

Conventional Commits format:

```
<type>: <subject>

<body>
```

**Types:** feat, fix, docs, style, refactor, perf, test, chore

**Scope:** app, youtube, spotify, core, logger, shared-ui, shared, env

**Rules:**
- Subject: imperative, lowercase, no period, ≤50 chars
- Body: what/why not how, wrap 72 chars, keep simple if possible
  - The Body is optional: skip if the diff is very small to describe details

**Execute directly:**

```bash
git commit -m "type(scope): subject" -m "body paragraph"
```

For multi-line body, use multiple `-m` flags.

## Examples

**Simple:**
```bash
git commit -m "fix(app): correct token expiration check"
```

**With body:**
```bash
git commit -m "feat(app): add user search endpoint" -m "Implement fuzzy search across username and email fields."
```