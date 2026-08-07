import { describe, expect, it } from "vitest";
import { matchSubindex } from "./subindex-match";

/**
 * Every case below is an excerpt of real ISM Report on Business prose that
 * produced a wrong value in production, kept verbatim. They are regression
 * tests, not illustrations: each one stored a plausible-looking number under
 * the wrong name, and none was detectable by looking at the value alone.
 */

const value = (name: string, html: string) => {
  const m = matchSubindex(name, html);
  return m ? Number(m[1]) : null;
};

describe("matchSubindex — canonical phrasing", () => {
  it("reads the registered value", () => {
    expect(value("Inventories", "The Inventories Index registered 47.1 percent in March, down 1.7 percentage points.")).toBe(47.1);
  });

  it("allows a qualifier between 'registered' and the number", () => {
    // Services March 2021. Demanding the number right after "registered" made
    // this sentence fail, and the search fell through to the next one — "the
    // previous high was in October 2018, when the Services PMI registered 60.9
    // percent" — publishing a 2018 value as March 2021 for a year.
    const html =
      "The Business Activity Index registered an all-time high of 69.4 percent in March, " +
      "an increase of 13.9 percentage points from the February reading of 55.5 percent.";
    expect(value("Business Activity", html)).toBe(69.4);
  });

  it("does not mistake 'percentage points' for the value", () => {
    expect(value("New Orders", "The New Orders Index registered 51.8 percent, a decrease of 0.7 percentage point from 52.5 percent.")).toBe(51.8);
  });
});

describe("matchSubindex — mentions that must NOT win", () => {
  it("does not cross into a neighbouring index within one sentence", () => {
    // Manufacturing March 2026. Anchored on Supplier Deliveries, the old
    // pattern skated past two other indices and captured the Prices value of
    // 78.3, which is why the subindex mean missed the headline by 3.84.
    const html =
      "The Supplier Deliveries Index indicated increasingly slowing deliveries, the Inventories " +
      "Index contracted at a faster rate, and the Prices Index took another big leap - to 78.3 " +
      "percent, from 70.5 percent in February. " +
      "The Supplier Deliveries Index registered 58.9 percent, a 3.8-percentage point increase.";
    expect(value("Supplier Deliveries", html)).toBe(58.9);
  });

  it("skips a parenthetical historical reference", () => {
    // Manufacturing May 2026: the 65.7 belongs to May 2022, two sentences
    // before the real figure.
    const html =
      "The Supplier Deliveries Index stayed at its highest level since May 2022 (65.7 percent). " +
      "The Supplier Deliveries Index registered 60.6 percent, the same as in April.";
    expect(value("Supplier Deliveries", html)).toBe(60.6);
  });

  it("prefers 'the reading of' over a prior month's reading", () => {
    // Services March 2026. February's 59.9 appears first; the definite article
    // is what separates the current figure from the comparison.
    const html =
      "The Business Activity Index remained in expansion territory in March but dropped from " +
      "February's reading of 59.9 percent to 53.9 percent. " +
      "The Business Activity Index continued in expansion in March; the reading of 53.9 percent " +
      "is 6 percentage points lower than the 59.9 percent recorded in February.";
    expect(value("Business Activity", html)).toBe(53.9);
  });
});

describe("matchSubindex — the 'activity' phrasing", () => {
  it("reads a component that is never written as '{name} Index'", () => {
    // Services June 2023. Every other tier anchors on "{name} Index", which
    // this page never writes, so the component came back null — and because a
    // single missing component drops the whole month, June 2023 had no
    // subindex row at all.
    const html =
      "Employment Employment activity in the services sector grew in June after contracting in " +
      "May, with three consecutive months of growth before that; the index registered 53.1 " +
      "percent, up 3.9 percentage points.";
    expect(value("Employment", html)).toBe(53.1);
  });

  it("returns null when the component is genuinely absent", () => {
    expect(matchSubindex("Employment", "The New Orders Index registered 51.8 percent.")).toBeNull();
  });
});
