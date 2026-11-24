import {
  validateEmail,
  validateExistingPassword,
  validateNewPassword,
  validatePasswordConfirmation,
} from "./auth-validation";

describe("validateEmail", () => {
  it("requires a value", () => {
    expect(validateEmail("")).toBe("required");
    expect(validateEmail("   ")).toBe("required");
  });
  it("rejects malformed addresses", () => {
    expect(validateEmail("nope")).toBe("invalid-email");
    expect(validateEmail("a@b")).toBe("invalid-email");
  });
  it("accepts a normal address, ignoring surrounding spaces", () => {
    expect(validateEmail(" you@example.com ")).toBeNull();
  });
});

describe("passwords", () => {
  it("login only requires a value", () => {
    expect(validateExistingPassword("")).toBe("required");
    expect(validateExistingPassword("x")).toBeNull();
  });
  it("a new password needs at least 8 characters", () => {
    expect(validateNewPassword("")).toBe("required");
    expect(validateNewPassword("1234567")).toBe("too-short");
    expect(validateNewPassword("12345678")).toBeNull();
  });
  it("confirmation must match", () => {
    expect(validatePasswordConfirmation("abc12345", "")).toBe("required");
    expect(validatePasswordConfirmation("abc12345", "abc12346")).toBe("mismatch");
    expect(validatePasswordConfirmation("abc12345", "abc12345")).toBeNull();
  });
});
