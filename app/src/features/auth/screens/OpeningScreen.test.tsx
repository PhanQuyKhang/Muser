import { screen } from "@testing-library/react-native";

import { useSessionStore } from "@/application/session";
import { createFakeServices, renderWithServices } from "@/test/fakes";
import { OpeningScreen } from "./OpeningScreen";

jest.mock("expo-router", () => {
  const { Text: RNText } = jest.requireActual<typeof import("react-native")>("react-native");
  return { Redirect: ({ href }: { href: string }) => <RNText>{`redirect:${href}`}</RNText> };
});

const user = { uid: "u1", email: "a@b.co" };

describe("OpeningScreen routing", () => {
  afterEach(() => useSessionStore.setState({ status: "initializing", user: null }));

  it("waits while the session is being restored", async () => {
    await renderWithServices(<OpeningScreen />);
    expect(screen.getByText("Find your next favorite.")).toBeTruthy();
    expect(screen.queryByText(/redirect:/)).toBeNull();
  });

  it("routes a signed-out user to Log in", async () => {
    useSessionStore.getState().setUser(null);
    await renderWithServices(<OpeningScreen />);
    expect(screen.getByText("redirect:/login")).toBeTruthy();
  });

  it("routes a finished user to Explore", async () => {
    useSessionStore.getState().setUser(user);
    await renderWithServices(<OpeningScreen />);
    expect(await screen.findByText("redirect:/explore")).toBeTruthy();
  });

  it("resumes unfinished setup", async () => {
    useSessionStore.getState().setUser(user);
    const services = createFakeServices({
      me: {
        getMe: jest.fn(async () => ({ ...user, hasProfile: false, onboardingCompleted: false })),
      },
    });
    await renderWithServices(<OpeningScreen />, services);
    expect(await screen.findByText("redirect:/profile")).toBeTruthy();
  });

  it("offers Retry when the profile lookup fails", async () => {
    useSessionStore.getState().setUser(user);
    const services = createFakeServices({
      me: {
        getMe: jest.fn(async () => {
          throw new Error("down");
        }),
      },
    });
    await renderWithServices(<OpeningScreen />, services);
    expect(await screen.findByRole("button", { name: "Retry" })).toBeTruthy();
  });
});
