# Contributing to Bellwether

Thanks for your interest in Bellwether — an interactive atlas of the ISM PMI suite alongside US economic policy. This guide covers code contributions and the project's conventions. **If your change touches anything under `data/` or `src/lib/content/`, read [data/CONTRIBUTING.md](data/CONTRIBUTING.md) first** — the data layer has its own provenance and citation rules that are non-negotiable.

## Ground rules

- **Every user-visible number traces to a citation.** Bellwether's whole premise is one-click provenance. Don't add data without a primary or clearly-labelled source. See [data/CONTRIBUTING.md](data/CONTRIBUTING.md) and `LICENSING.md`.
- **Be precise with macro vocabulary.** Match terms to what the data actually shows; don't reach for the most dramatic label.
- **Discuss large changes first.** For anything beyond a bug fix or small enhancement, open an issue before writing code so we can align on approach.

## Getting started

```bash
npm install
cp .env.example .env.local         # paste your FRED key (free: https://fred.stlouisfed.org/docs/api/api_key.html)
npm run refresh-data               # fetch FRED snapshots into data/fred/
npm run dev                        # http://localhost:3000
```

The app does **not** require FRED at runtime — all market data is checked-in JSON under `data/`. The key is only needed to re-run `npm run refresh-data`.

## Before you open a PR

Run the full local gate and make sure it's green:

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit (strict)
npm run test        # vitest
```

If your change touches data, also run:

```bash
npm run check-data  # strict freshness + ISM reconciliation + NBER citation verification
```

## Conventions

- **Files:** kebab-case · **Components:** PascalCase
- All exports get JSDoc
- Strict TypeScript — `noUncheckedIndexedAccess` is on; handle `undefined`
- Max ~400 lines per file; split when bigger
- Data is validated with Zod at load time, not at use time
- JSX prose: add explicit `{" "}` after closing inline tags and `{expression}` interpolations on the same line (Next 16 / React 19 strips trailing whitespace non-deterministically)

See `docs/` for the canonical product, roadmap, and work-breakdown documents.

## Pull request process

1. Fork the repo and create a feature branch off `main`.
2. Keep the PR focused — one logical change. Update docs and tests alongside the code.
3. Fill out the PR template, including how you verified the change.
4. Ensure CI is green. Maintainers review for correctness, data provenance, and scope.

## License

This project's own code and content are released into the public domain under [CC0 1.0](LICENSE). By contributing, you agree to dedicate your contributions to the public domain under the same terms, to the extent they are yours to dedicate.

Note that some third-party material is **not** the project's to relicense: economic data values are facts (reproduced with attribution — see [data/LICENSING.md](data/LICENSING.md)), and quoted ISM commentary is included as fair-use excerpts. Don't add third-party content you can't dedicate or properly attribute.
