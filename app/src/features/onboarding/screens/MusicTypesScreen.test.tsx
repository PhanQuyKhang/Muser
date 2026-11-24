import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";

import { createFakeServices, renderWithServices } from "@/test/fakes";
import { makeTag } from "@/test/fixtures";
import { useOnboardingDraft } from "../onboarding.store";
import { MusicTypesScreen } from "./MusicTypesScreen";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
}));

const tags = [
  makeTag("genre_pop", "Pop", "genre"),
  makeTag("genre_jazz", "Jazz", "genre"),
  makeTag("mood_chill", "Chill", "mood"),
];

function services() {
  return createFakeServices({ catalog: { listTags: jest.fn(async () => tags) } });
}

describe("MusicTypesScreen (S06)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingDraft.getState().reset();
  });

  it("lists genres and moods and records the selection", async () => {
    await renderWithServices(<MusicTypesScreen />, services());
    await fireEvent.press(await screen.findByRole("button", { name: "Pop" }));
    await fireEvent.press(screen.getByRole("button", { name: "Chill" }));

    expect(useOnboardingDraft.getState().tagIds).toEqual(["genre_pop", "mood_chill"]);
    expect(screen.getByRole("button", { name: "Pop" }).props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByRole("button", { name: "Jazz" }).props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it("continues to songs with the selection kept", async () => {
    await renderWithServices(<MusicTypesScreen />, services());
    await fireEvent.press(await screen.findByRole("button", { name: "Pop" }));
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    expect(router.push).toHaveBeenCalledWith("/songs");
    expect(useOnboardingDraft.getState().tagIds).toEqual(["genre_pop"]);
  });

  it("skips without keeping the selection", async () => {
    await renderWithServices(<MusicTypesScreen />, services());
    await fireEvent.press(await screen.findByRole("button", { name: "Pop" }));
    await fireEvent.press(screen.getByRole("button", { name: "Skip" }));
    expect(useOnboardingDraft.getState().tagIds).toEqual([]);
    expect(router.push).toHaveBeenCalledWith("/songs");
  });

  it("offers Retry when tags fail to load", async () => {
    const failing = createFakeServices({
      catalog: {
        listTags: jest.fn(async () => {
          throw new Error("down");
        }),
      },
    });
    await renderWithServices(<MusicTypesScreen />, failing);
    expect(await screen.findByRole("button", { name: "Retry" })).toBeTruthy();
  });
});
