# Security Policy

## Supported versions

Bellwether is a continuously-deployed web app — there are no released versions. The `main` branch is the only supported line, and fixes ship to the live site.

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report privately through one of:

1. **GitHub private vulnerability reporting** (preferred) — go to the repository's **Security** tab → **Report a vulnerability**. This opens a private advisory visible only to maintainers.
2. **Email** — contactme@marshallcahill.com with subject line `[Bellwether security]`.

Please include:

- A description of the issue and its impact
- Steps to reproduce (or a proof of concept)
- Affected URL(s), component, or file path
- Any suggested remediation, if you have one

## What to expect

- **Acknowledgement** within 5 business days.
- An assessment and, where valid, a remediation timeline.
- Credit in the fix (or the security advisory) if you'd like it — let us know.

## Scope

Bellwether has no user accounts, no database, and no payment flow. It serves checked-in JSON data and renders it client/server-side. The most relevant classes of issue are therefore:

- XSS or content-injection in rendered data or user-supplied query params
- Dependency vulnerabilities (we run Dependabot)
- Secrets accidentally committed to the repo or build artifacts
- Supply-chain issues in the data-import scripts

Out of scope: the accuracy of economic data itself (open a regular issue using the **Data correction** template), and findings that require physical access or social engineering of a maintainer.

## Known dependency exceptions

Advisories we have assessed as not reachable in this application, and
therefore dismissed rather than patched. Each is revisited when its
condition changes. Anyone running `npm audit` against this repo will see
these, so the reasoning is recorded here rather than only in the GitHub UI.

### sharp — libvips CVEs (CVE-2026-33327/33328/35590/35591)

Installed: `sharp@0.34.5`. Fixed in `0.35.0`.

`sharp` is an **optional, transitive** dependency of Next.js — it is not in
our `package.json`. `next@16.2.12` declares `sharp ^0.34.5`, so `0.35.0`
falls outside the range it accepts; neither Dependabot nor npm can move it,
and forcing it via `overrides` would mean shipping a combination Next does
not support.

It is reached only through `next/image`. Every `<Image src>` in this app is
a local static path under `public/`, and neither `images.remotePatterns`
nor `images.domains` is configured — so Next will not fetch or optimise any
remote image. The libvips CVEs require attacker-controlled image input,
which has no path to reach it here.

**Revisit if any of these become true:**

- `images.remotePatterns` or `images.domains` is added to `next.config`
- user-supplied or third-party images are introduced
- Next widens its `sharp` range — at which point simply take the upgrade

## A note on secrets

The only secret the project uses is a free FRED API key, supplied at build/refresh time via `.env.local` (gitignored) or a GitHub Actions secret. It is never required at runtime and is never committed. If you ever find a credential in the repo or its history, treat it as a vulnerability and report it privately.
