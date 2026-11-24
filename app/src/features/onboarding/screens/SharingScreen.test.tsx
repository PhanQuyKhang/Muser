import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import { useSessionStore } from "@/application/session";
import { createFakeServices, renderWithServices } from "@/test/fakes";
import { testUser } from "@/test/fixtures";
import { useOnboardingDraft } from "../onboarding.store";
import { SharingScreen } from "./SharingScreen";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
}));

describe("SharingScreen (S09)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.getState().setUser(testUser);
    const draft = useOnboardingDraft.getState();
    draft.reset();
    draft.toggleTag("genre_pop");
    useOnboardingDraft.getState().toggleSong("s1");
    useOnboardingDraft.getState().toggleArtist("a1");
  });
  afterEach(() => useSessionStore.setState({ status: "initializing", user: null }));

  it("enables sharing and finishes setup with every earlier choice", async () => {
    const { services } = await renderWithServices(<SharingScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Enable sharing" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(services.onboarding.complete).toHaveBeenCalledWith({
      seedTagIds: ["genre_pop"],
      seedSongIds: ["s1"],
      seedArtistIds: ["a1"],
      sharingEnabled: true,
    });
    expect(useOnboardingDraft.getState().tagIds).toEqual([]);
  });

  it("'Not now' finishes with sharing off", async () => {
    const { services } = await renderWithServices(<SharingScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Not now" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(services.onboarding.complete).toHaveBeenCalledWith(
      expect.objectContaining({ sharingEnabled: false }),
    );
  });

  it("Skip is the same as 'Not now'", async () => {
    const { services } = await renderWithServices(<SharingScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Skip" }));
    await waitFor(() => expect(services.onboarding.complete).toHaveBeenCalledTimes(1));
    expect(services.onboarding.complete).toHaveBeenCalledWith(
      expect.objectContaining({ sharingEnabled: false }),
    );
  });

  it("keeps the draft and shows an error when saving fails", async () => {
    const services = createFakeServices({
      onboarding: {
        complete: jest.fn(async () => {
          throw new Error("down");
        }),
      },
    });
    await renderWithServices(<SharingScreen />, services);
    await fireEvent.press(screen.getByRole("button", { name: "Enable sharing" }));
    expect(await screen.findByText(/finish setup/)).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
    expect(useOnboardingDraft.getState().tagIds).toEqual(["genre_pop"]);
  });
});
