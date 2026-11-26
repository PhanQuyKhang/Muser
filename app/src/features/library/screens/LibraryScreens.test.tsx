import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { createFakeServices, renderWithServices } from "@/test/fakes";
import { makeEntry, makePlaylist, makeSong } from "@/test/fixtures";
import { filterEntries } from "../filter";
import { LikedScreen } from "./LikedScreen";
import { PlaylistsScreen } from "./PlaylistsScreen";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

const one = makeEntry(makeSong("s1", "One", "Alpha"), "2026-11-01T00:00:00.000Z");
const two = makeEntry(makeSong("s2", "Café", "Beta"), "2026-11-02T00:00:00.000Z");

describe("filterEntries", () => {
  it("sorts by when the song was added", () => {
    expect(filterEntries([one, two], "", "newest").map((e) => e.songId)).toEqual(["s2", "s1"]);
    expect(filterEntries([two, one], "", "oldest").map((e) => e.songId)).toEqual(["s1", "s2"]);
  });

  it("matches title or artist, ignoring case and accents", () => {
    expect(filterEntries([one, two], "cafe", "newest")).toEqual([two]);
    expect(filterEntries([one, two], "ALPHA", "newest")).toEqual([one]);
  });
});

describe("PlaylistsScreen (S12)", () => {
  it("lists Liked and playlists, and creates one with a trimmed name", async () => {
    const services = createFakeServices({
      library: { listPlaylists: jest.fn(async () => [makePlaylist("p9", "Road trip")]) },
    });
    await renderWithServices(<PlaylistsScreen />, services);
    expect(await screen.findByText("Road trip")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Create playlist" }));
    await fireEvent.changeText(screen.getByLabelText("Playlist name"), "  Night  ");
    // The header button and the sheet button share their name; the sheet one is last.
    await fireEvent.press(screen.getAllByRole("button", { name: "Create playlist" }).at(-1)!);
    await waitFor(() => expect(services.library.createPlaylist).toHaveBeenCalledWith("Night"));
  });
});

describe("LikedScreen (S13)", () => {
  it("asks before unliking", async () => {
    const services = createFakeServices({ library: { listLikes: jest.fn(async () => [one]) } });
    await renderWithServices(<LikedScreen />, services);

    await fireEvent.press(await screen.findByRole("button", { name: "More options for One" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Unlike song" }));
    expect(services.library.unlike).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Unlike song" }));
    await waitFor(() => expect(services.library.unlike).toHaveBeenCalledWith("s1"));
  });

  it("asks for each song's cover", async () => {
    const services = createFakeServices({ library: { listLikes: jest.fn(async () => [one]) } });
    await renderWithServices(<LikedScreen />, services);
    await waitFor(() => expect(services.media.getArtwork).toHaveBeenCalledWith("s1"));
  });

  it("offers Retry when loading fails", async () => {
    const services = createFakeServices({
      library: {
        listLikes: jest.fn(async () => {
          throw new Error("offline");
        }),
      },
    });
    await renderWithServices(<LikedScreen />, services);
    expect(await screen.findByRole("button", { name: "Retry" })).toBeTruthy();
  });
});
