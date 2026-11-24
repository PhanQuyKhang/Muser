import { render, screen } from "@testing-library/react-native";

import { Avatar, initialsOf } from "./Avatar";

describe("initialsOf", () => {
  it("uses first and last word", () => {
    expect(initialsOf("Alex Nguyen")).toBe("AN");
    expect(initialsOf("  mia  tran  ")).toBe("MT");
  });
  it("handles one word and empty names", () => {
    expect(initialsOf("Taylor")).toBe("T");
    expect(initialsOf("   ")).toBe("");
  });
});

describe("Avatar", () => {
  it("falls back to initials without a photo", async () => {
    await render(<Avatar name="Alex Nguyen" />);
    expect(screen.getByText("AN")).toBeTruthy();
  });
});
