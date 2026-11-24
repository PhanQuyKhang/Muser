import { normalizeUsername, validateDisplayName, validateUsername } from "./profile-validation";

describe("validateUsername", () => {
  it("normalizes case and surrounding spaces first", () => {
    expect(normalizeUsername("  Alex.Nguyen ")).toBe("alex.nguyen");
    expect(validateUsername("  Alex_99 ")).toBeNull();
  });
  it("applies the length bounds", () => {
    expect(validateUsername("")).toBe("required");
    expect(validateUsername("ab")).toBe("too-short");
    expect(validateUsername("a".repeat(21))).toBe("too-long");
    expect(validateUsername("a".repeat(20))).toBeNull();
  });
  it("only allows letters, digits, dots and underscores, not at the ends", () => {
    expect(validateUsername("bad name")).toBe("invalid-chars");
    expect(validateUsername("emoji😀")).toBe("invalid-chars");
    expect(validateUsername(".dot")).toBe("invalid-chars");
    expect(validateUsername("under_")).toBe("invalid-chars");
    expect(validateUsername("a.b_c")).toBeNull();
  });
});

describe("validateDisplayName", () => {
  it("requires a non-blank name up to 40 characters", () => {
    expect(validateDisplayName("   ")).toBe("required");
    expect(validateDisplayName("x".repeat(41))).toBe("too-long");
    expect(validateDisplayName("Alex")).toBeNull();
  });
});
