import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import { AuthError } from "@/domain/auth";
import { createFakeServices, renderWithServices } from "@/test/fakes";
import { SignUpScreen } from "./SignUpScreen";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

async function fill(email: string, password: string, confirm: string) {
  await fireEvent.changeText(screen.getByLabelText("Email"), email);
  await fireEvent.changeText(screen.getByLabelText("Password"), password);
  await fireEvent.changeText(screen.getByLabelText("Confirm password"), confirm);
}

describe("SignUpScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects a short password and a mismatch", async () => {
    const { services } = await renderWithServices(<SignUpScreen />);
    await fill("you@example.com", "short", "different");
    await fireEvent.press(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Use at least 8 characters.")).toBeTruthy();
    expect(screen.getByText("Passwords don't match.")).toBeTruthy();
    expect(services.auth.signUp).not.toHaveBeenCalled();
  });

  it("creates the account and hands routing to the opening screen", async () => {
    const { services } = await renderWithServices(<SignUpScreen />);
    await fill("you@example.com", "long-enough-1", "long-enough-1");
    await fireEvent.press(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(services.auth.signUp).toHaveBeenCalledWith("you@example.com", "long-enough-1");
  });

  it("shows an email-in-use error on the email field", async () => {
    const services = createFakeServices({
      auth: {
        signUp: jest.fn(async () => {
          throw new AuthError("email-in-use");
        }),
      },
    });
    await renderWithServices(<SignUpScreen />, services);
    await fill("you@example.com", "long-enough-1", "long-enough-1");
    await fireEvent.press(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("An account with this email already exists.")).toBeTruthy();
  });
});
