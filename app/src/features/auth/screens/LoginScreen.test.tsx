import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import { AuthError } from "@/domain/auth";
import { createFakeServices, renderWithServices } from "@/test/fakes";
import { LoginScreen } from "./LoginScreen";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

async function fill(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText("Email"), email);
  await fireEvent.changeText(screen.getByLabelText("Password"), password);
}

describe("LoginScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows validation errors and does not call the provider", async () => {
    const { services } = await renderWithServices(<LoginScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByText("Enter your email.")).toBeTruthy();
    expect(screen.getByText("Enter your password.")).toBeTruthy();
    expect(services.auth.signIn).not.toHaveBeenCalled();
  });

  it("shows the credential error on the password field", async () => {
    const services = createFakeServices({
      auth: {
        signIn: jest.fn(async () => {
          throw new AuthError("invalid-credentials");
        }),
      },
    });
    await renderWithServices(<LoginScreen />, services);
    await fill("you@example.com", "wrong-pass");
    await fireEvent.press(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Email or password is incorrect.")).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("signs in and hands routing to the opening screen", async () => {
    const { services } = await renderWithServices(<LoginScreen />);
    await fill("you@example.com", "correct-pass");
    await fireEvent.press(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(services.auth.signIn).toHaveBeenCalledWith("you@example.com", "correct-pass");
  });

  it("links to sign up and password reset", async () => {
    await renderWithServices(<LoginScreen />);
    await fireEvent.press(screen.getByRole("link", { name: "Create account" }));
    expect(router.push).toHaveBeenCalledWith("/signup");
    await fireEvent.press(screen.getByRole("link", { name: "Forgot password?" }));
    expect(router.push).toHaveBeenCalledWith("/reset-password");
  });
});
