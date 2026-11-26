import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import { createFakeServices, renderWithServices } from "@/test/fakes";
import { makeSong } from "@/test/fixtures";
import { SearchScreen } from "./SearchScreen";

const songs = [makeSong("s1", "One", "Alpha"), makeSong("s2", "Two", "Beta")];

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

describe("SearchScreen (S15)", () => {
  const services = () =>
    createFakeServices({
      catalog: { listSongs: jest.fn(async () => ({ items: songs, nextCursor: null })) },
    });

  it("filters the catalog by artist and likes a result", async () => {
    const fake = services();
    await renderWithServices(<SearchScreen />, fake);
    await fireEvent.changeText(screen.getByLabelText("Search songs or artists"), "beta");

    await fireEvent.press(await screen.findByRole("button", { name: "More options for Two" }));
    expect(screen.queryByText("One")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Like song" }));
    await waitFor(() => expect(fake.library.like).toHaveBeenCalledWith("s2", "search", undefined));
  });

  it("starts on the browse grid, then shows the matching artist first", async () => {
    await renderWithServices(<SearchScreen />, services());
    await fireEvent.press(screen.getByRole("button", { name: "Browse Pop" }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/search/browse/[tagId]",
      params: { tagId: "genre_pop" },
    });

    await fireEvent.changeText(screen.getByLabelText("Search songs or artists"), "alpha");
    await fireEvent.press(await screen.findByRole("button", { name: "Alpha, Artist" }));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/search/artist/[artistId]",
      params: { artistId: "artist_Alpha" },
    });

    // The search is remembered once it led somewhere.
    await fireEvent.changeText(screen.getByLabelText("Search songs or artists"), "");
    expect(await screen.findByRole("button", { name: "alpha" })).toBeTruthy();
  });

  it("shows an empty state when nothing matches", async () => {
    await renderWithServices(<SearchScreen />, services());
    await fireEvent.changeText(screen.getByLabelText("Search songs or artists"), "zzz");
    expect(await screen.findByText("No songs found. Try another title or artist.")).toBeTruthy();
  });
});
