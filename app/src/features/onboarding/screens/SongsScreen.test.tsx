import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import { createFakeServices, renderWithServices } from "@/test/fakes";
import { makeSong } from "@/test/fixtures";
import { useOnboardingDraft } from "../onboarding.store";
import { SongsScreen } from "./SongsScreen";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
}));

const songs = ["One", "Two", "Three", "Four", "Five", "Six"].map((title, index) =>
  makeSong(`s${index}`, title, "Artist", 100 - index),
);

function services(searchSongs = [songs[5]!]) {
  return createFakeServices({
    catalog: {
      listSongs: jest.fn(async () => ({ items: songs, nextCursor: null })),
      search: jest.fn(async () => ({ songs: searchSongs, artists: [] })),
    },
  });
}

const row = (title: string) => screen.getByRole("checkbox", { name: new RegExp(`^${title},`) });

describe("SongsScreen (S07)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingDraft.getState().reset();
  });

  it("shows suggestions with a selected counter", async () => {
    await renderWithServices(<SongsScreen />, services());
    expect(await screen.findByText("A few to get you started")).toBeTruthy();
    expect(await screen.findByRole("checkbox", { name: /^One,/ })).toBeTruthy();
    expect(screen.getByText("0 / 5 selected")).toBeTruthy();
  });

  it("stops at five songs and lets a selected one be removed", async () => {
    await renderWithServices(<SongsScreen />, services());
    await screen.findByRole("checkbox", { name: /^One,/ });
    for (const title of ["One", "Two", "Three", "Four", "Five"]) await fireEvent.press(row(title));

    expect(screen.getByText("5 / 5 selected")).toBeTruthy();
    expect(row("Six").props.accessibilityState).toMatchObject({ disabled: true });

    await fireEvent.press(row("One"));
    expect(screen.getByText("4 / 5 selected")).toBeTruthy();
    expect(row("Six").props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("searches the catalog after a pause in typing", async () => {
    const fake = services();
    await renderWithServices(<SongsScreen />, fake);
    await screen.findByRole("checkbox", { name: /^One,/ });
    await fireEvent.changeText(screen.getByLabelText("Search songs or artists"), "six");

    expect(await screen.findByText("Search results")).toBeTruthy();
    await waitFor(() => expect(fake.catalog.search).toHaveBeenCalledWith("six"));
  });

  it("shows an empty state when nothing matches", async () => {
    await renderWithServices(<SongsScreen />, services([]));
    await screen.findByRole("checkbox", { name: /^One,/ });
    await fireEvent.changeText(screen.getByLabelText("Search songs or artists"), "zzz");
    expect(await screen.findByText("No songs found. Try another title or artist.")).toBeTruthy();
  });

  it("continues to artists, and skip clears the picks", async () => {
    await renderWithServices(<SongsScreen />, services());
    await fireEvent.press(await screen.findByRole("checkbox", { name: /^One,/ }));
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    expect(router.push).toHaveBeenCalledWith("/artists");
    expect(useOnboardingDraft.getState().songIds).toEqual(["s0"]);

    await fireEvent.press(screen.getByRole("button", { name: "Skip" }));
    expect(useOnboardingDraft.getState().songIds).toEqual([]);
  });
});
