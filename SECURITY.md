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

## A note on secrets

The only secret the project uses is a free FRED API key, supplied at build/refresh time via `.env.local` (gitignored) or a GitHub Actions secret. It is never required at runtime and is never committed. If you ever find a credential in the repo or its history, treat it as a vulnerability and report it privately.
