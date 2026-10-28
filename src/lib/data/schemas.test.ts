import { describe, expect, it } from "vitest";
import { industryMonthlyRowSchema } from "./schemas";

// sourceUrl values are written by scrapers reading untrusted HTML and end up
// as hrefs, so the citation-host allowlist is the XSS guard for that data.
const row = (sourceUrl: string) =>
  industryMonthlyRowSchema.safeParse({ date: "2024-01-01", growing: [], contracting: [], sourceUrl });

describe("sourceUrl validation", () => {
  it("accepts https URLs on citation hosts and their subdomains", () => {
    expect(row("https://web.archive.org/web/2024/https://www.ismworld.org/").success).toBe(true);
    expect(row("https://www.nber.org/research/business-cycle-dating").success).toBe(true);
    expect(row("https://fred.stlouisfed.org/series/INDPRO").success).toBe(true);
  });

  it("rejects script and data URLs", () => {
    expect(row("javascript:alert(1)").success).toBe(false);
    expect(row("data:text/html,<script>alert(1)</script>").success).toBe(false);
  });

  it("rejects plain http and hosts outside the allowlist", () => {
    expect(row("http://web.archive.org/web/2024/x").success).toBe(false);
    expect(row("https://example.com/").success).toBe(false);
  });

  it("rejects lookalike hosts", () => {
    expect(row("https://nber.org.evil.com/").success).toBe(false);
    expect(row("https://notnber.org/").success).toBe(false);
  });
});
