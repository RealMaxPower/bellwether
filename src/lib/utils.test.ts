import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps custom text sizes alongside text colours", () => {
    expect(cn("text-caption text-ink-400")).toBe("text-caption text-ink-400");
    expect(cn("font-serif text-title-1 text-ink-700")).toBe("font-serif text-title-1 text-ink-700");
  });

  it("still resolves conflicts within the custom scales", () => {
    expect(cn("text-body-lg", "text-caption")).toBe("text-caption");
    expect(cn("shadow-card", "shadow-drawer")).toBe("shadow-drawer");
    expect(cn("animate-fade-in", "animate-slide-in-right")).toBe("animate-slide-in-right");
  });

  it("keeps a custom shadow alongside a shadow colour", () => {
    expect(cn("shadow-card shadow-ink-700/20")).toBe("shadow-card shadow-ink-700/20");
  });
});
