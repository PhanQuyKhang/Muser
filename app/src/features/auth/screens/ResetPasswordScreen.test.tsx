import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";

import { renderWithServices } from "@/test/fakes";
import { ResetPasswordScreen } from "./ResetPasswordScreen";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

describe("ResetPasswordScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("validates the email first", async () => {
    const { services } = await renderWithServices(<ResetPasswordScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Send reset link" }));
    expect(screen.getByText("Enter your email.")).toBeTruthy();
    expect(services.auth.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("shows the inbox confirmation, then returns to log in", async () => {
    const { services } = await renderWithServices(<ResetPasswordScreen />);
    await fireEvent.changeText(screen.getByLabelText("Email"), "you@example.com");
    await fireEvent.press(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Check your inbox.")).toBeTruthy();
    expect(screen.getByText(/you@example\.com/)).toBeTruthy();
    expect(services.auth.sendPasswordReset).toHaveBeenCalledWith("you@example.com");

    await fireEvent.press(screen.getByRole("button", { name: "Back to log in" }));
    expect(router.replace).toHaveBeenCalledWith("/login");
  });
});
