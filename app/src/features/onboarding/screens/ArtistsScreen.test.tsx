import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";

import { createFakeServices, renderWithServices } from "@/test/fakes";
import { makeArtist } from "@/test/fixtures";
import { useOnboardingDraft } from "../onboarding.store";
import { ArtistsScreen } from "./ArtistsScreen";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
}));

const artists = [
  makeArtist("a1", "Dua Lipa"),
  makeArtist("a2", "SZA"),
  makeArtist("a3", "Billie Eilish"),
];

describe("ArtistsScreen (S08)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingDraft.getState().reset();
  });

  it("selects artists and goes on to sharing", async () => {
    const services = createFakeServices({
      catalog: { listArtists: jest.fn(async () => ({ items: artists, nextCursor: null })) },
    });
    await renderWithServices(<ArtistsScreen />, services);
    await fireEvent.press(await screen.findByRole("checkbox", { name: "SZA" }));
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    expect(useOnboardingDraft.getState().artistIds).toEqual(["a2"]);
    expect(router.push).toHaveBeenCalledWith("/sharing");
  });

  it("filters locally by the search text", async () => {
    const services = createFakeServices({
      catalog: { listArtists: jest.fn(async () => ({ items: artists, nextCursor: null })) },
    });
    await renderWithServices(<ArtistsScreen />, services);
    await screen.findByRole("checkbox", { name: "SZA" });
    await fireEvent.changeText(screen.getByLabelText("Search artists"), "bil");
    expect(screen.getByRole("checkbox", { name: "Billie Eilish" })).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "SZA" })).toBeNull();
  });

  it("loads more artists from the last tile", async () => {
    const listArtists = jest
      .fn()
      .mockResolvedValueOnce({ items: [artists[0]], nextCursor: "c1" })
      .mockResolvedValueOnce({ items: [artists[1]], nextCursor: null });
    await renderWithServices(<ArtistsScreen />, createFakeServices({ catalog: { listArtists } }));
    await fireEvent.press(await screen.findByRole("button", { name: "Find more" }));
    expect(await screen.findByRole("checkbox", { name: "SZA" })).toBeTruthy();
    expect(listArtists).toHaveBeenLastCalledWith({ limit: 20, cursor: "c1" });
  });
});
