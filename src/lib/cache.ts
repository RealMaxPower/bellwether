import * as React from "react";

type CacheFn = <T extends (...args: never[]) => unknown>(fn: T) => T;

/**
 * react.cache is only defined in React Server Components. In a Vitest/Node
 * context it's undefined, which breaks any module that uses `cache(...)` at
 * import time. We fall back to identity in non-RSC environments — the
 * memoization is a perf optimization, not a correctness requirement.
 */
export const cache: CacheFn =
  ((React as { cache?: CacheFn }).cache ?? ((fn) => fn)) as CacheFn;
