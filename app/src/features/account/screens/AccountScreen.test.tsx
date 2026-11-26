import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { createFakeServices, renderWithServices } from "@/test/fakes";
import { AccountScreen } from "./AccountScreen";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

describe("AccountScreen (S20)", () => {
  it("asks before signing out", async () => {
    const services = createFakeServices();
    await renderWithServices(<AccountScreen />, services);
    expect(await screen.findByText("Private discoveries")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByText("Sign out of Muser?")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Stay here" }));
    expect(services.auth.signOut).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));
    await fireEvent.press(screen.getAllByRole("button", { name: "Sign out" }).at(-1)!);
    await waitFor(() => expect(services.auth.signOut).toHaveBeenCalled());
  });
});
