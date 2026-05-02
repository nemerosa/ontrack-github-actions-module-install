# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run lint    # ESLint (flat config, v10)
npm test        # Jest — integration tests (skip when env secrets are absent)
```

There is no `build` step in this repo — it is a plain Node.js library, not a bundled GitHub Action. The published package contains `index.js` directly.

## Architecture

This is a reusable Node.js module published as `@nemerosa/ontrack-github-actions-module-install` to GitHub Packages. It is consumed by other `ontrack-github-actions-*` repos to download and configure the [Yontrack CLI](https://github.com/nemerosa/ontrack-cli).

**Public API** (`index.js`):

```js
const cli = require('@nemerosa/ontrack-github-actions-module-install');
const { dir, cliExecutable, version } = await cli.install({
  version,             // optional — defaults to latest GitHub release
  githubToken,         // required when version is omitted
  acceptDraft,         // include draft releases when picking latest
  logging,             // verbose console output
  yontrackUrl,         // when set, the CLI is configured for this Yontrack instance
  yontrackToken,       // required when yontrackUrl is set
  yontrackLocalConfig, // CLI config name (default: "default")
  connRetryCount,
  connRetryWait,
});
```

**Flow:**
1. `downloadCLI` — resolves the version (latest GitHub release if none provided), maps `os.platform()`/`os.arch()` to the binary suffix, downloads from the `nemerosa/ontrack-cli` GitHub releases, and writes the binary to a tmp dir.
2. `configureCLI` — when `yontrackUrl` is set, runs `yontrack config create ...` to set up the local CLI config.

**Tests** (`index.test.js`) are integration tests that hit the real network and (optionally) a real Yontrack instance. Tests requiring `GITHUB_TOKEN`, `YONTRACK_URL`, or `YONTRACK_TOKEN` are gated to skip when those env vars are unset, so PR CI without secrets passes cleanly.

## Release process

Releases are automated via `semantic-release` (`.releaserc`). Commit messages follow Angular convention. With the configured `releaseRules`, every conventional-commit type triggers at least a patch; `feat` is minor; `refactor` and any commit with a `BREAKING CHANGE:` footer (or `type!:` shorthand) is major.

The CI workflow on `main`:
1. Runs `npx semantic-release` — publishes to GH Packages, commits an updated `CHANGELOG.md` / `package.json` / `package-lock.json` via `@semantic-release/git`, and creates a `vX.Y.Z` GitHub release.
2. Force-updates floating `vX` and `vX.Y` tags to point at the new release, so consumers can pin to a major/minor and ride patch updates.

## NPM registry

This package is published to **GitHub Packages**, not npmjs.com. Consumers need an `.npmrc` configured with `@nemerosa:registry=https://npm.pkg.github.com` and a `NODE_AUTH_TOKEN` with `read:packages` scope.
