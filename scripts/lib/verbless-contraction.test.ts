import { describe, expect, it } from "vitest";
import { verblessContractionRe } from "./verbless-contraction";

/**
 * Sentences are verbatim ISM Report on Business prose. A miss here does not
 * error: it leaves a month's contraction list empty and the heatmap reads it
 * as a boom.
 */

const MFG_NOUN = "(?:industries|industry|manufacturing\\s+industries)";
const SVC_NOUN =
  "(?:industries|industry|services\\s+industries|non-manufacturing\\s+industries|nmi\\s+industries)";

const list = (noun: string, text: string) => verblessContractionRe(noun).exec(text)?.[1] ?? null;

describe("verblessContractionRe", () => {
  it("reads the past-tense singular form (manufacturing, July 2026)", () => {
    expect(list(MFG_NOUN, "The only industry in contraction was Chemical Products.")).toBe(
      "Chemical Products",
    );
  });

  it("reads the present-tense plural form", () => {
    expect(
      list(SVC_NOUN, "The three industries in contraction are: Mining; Construction; and Utilities."),
    ).toBe("Mining; Construction; and Utilities");
  });

  it("reads the past-tense plural form", () => {
    expect(list(MFG_NOUN, "The two industries in contraction were: Textile Mills; and Paper Products.")).toBe(
      "Textile Mills; and Paper Products",
    );
  });

  it("does not match the methodology boilerplate", () => {
    expect(
      list(
        MFG_NOUN,
        "For the industries reporting contraction or decreases, those are listed in the order of the highest level of contraction/decrease to the least level of contraction/decrease.",
      ),
    ).toBeNull();
  });

  it("does not match a subindex sentence that merely mentions contraction", () => {
    expect(
      list(
        MFG_NOUN,
        "The New Orders Index expanded for the seventh consecutive month after four straight readings in contraction, registering 56.1 percent.",
      ),
    ).toBeNull();
  });
});
