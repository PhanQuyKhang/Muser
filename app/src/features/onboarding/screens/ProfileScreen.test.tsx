import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import { useSessionStore } from "@/application/session";
import { OnboardingError } from "@/domain/onboarding";
import { createFakeServices, renderWithServices } from "@/test/fakes";
import { testUser } from "@/test/fixtures";
import { ProfileScreen } from "./ProfileScreen";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false) },
}));

const continueButton = () => screen.getByRole("button", { name: "Continue" });

async function fill(name: string, username: string) {
  await fireEvent.changeText(screen.getByLabelText("Display name"), name);
  await fireEvent.changeText(screen.getByLabelText("Username"), username);
}

describe("ProfileScreen (S05)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.getState().setUser(testUser);
  });
  afterEach(() => useSessionStore.setState({ status: "initializing", user: null }));

  it("starts with Continue disabled", async () => {
    await renderWithServices(<ProfileScreen />);
    expect(continueButton().props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByText("1 of 5")).toBeTruthy();
  });

  it("checks availability, then creates the profile with a normalized username", async () => {
    const { services } = await renderWithServices(<ProfileScreen />);
    await fill("  Alex  ", "Alex.N");
    expect(await screen.findByText("That username is available.")).toBeTruthy();

    await fireEvent.press(continueButton());
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/music-types"));
    expect(services.onboarding.createProfile).toHaveBeenCalledWith({
      username: "alex.n",
      displayName: "Alex",
    });
  });

  it("blocks a username that is taken", async () => {
    const services = createFakeServices({
      onboarding: { isUsernameAvailable: jest.fn(async () => false) },
    });
    await renderWithServices(<ProfileScreen />, services);
    await fill("Alex", "alex");
    expect(await screen.findByText("That username is taken. Try another one.")).toBeTruthy();
    expect(continueButton().props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("rejects invalid characters without calling the server", async () => {
    const { services } = await renderWithServices(<ProfileScreen />);
    await fill("Alex", "bad name");
    expect(screen.getByText("Letters, numbers, dots and underscores only.")).toBeTruthy();
    expect(continueButton().props.accessibilityState).toMatchObject({ disabled: true });
    expect(services.onboarding.isUsernameAvailable).not.toHaveBeenCalled();
  });

  it("shows taken when the server rejects the username at creation", async () => {
    const services = createFakeServices({
      onboarding: {
        createProfile: jest.fn(async () => {
          throw new OnboardingError("username-taken");
        }),
      },
    });
    await renderWithServices(<ProfileScreen />, services);
    await fill("Alex", "alex");
    await screen.findByText("That username is available.");
    await fireEvent.press(continueButton());
    expect(await screen.findByText("That username is taken. Try another one.")).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });
});
