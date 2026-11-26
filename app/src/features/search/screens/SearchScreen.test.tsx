import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { createFakeServices, renderWithServices } from "@/test/fakes";
import { makeSong } from "@/test/fixtures";
import { SearchScreen } from "./SearchScreen";

const songs = [makeSong("s1", "One", "Alpha"), makeSong("s2", "Two", "Beta")];

describe("SearchScreen (S15)", () => {
  const services = () =>
    createFakeServices({
      catalog: { listSongs: jest.fn(async () => ({ items: songs, nextCursor: null })) },
    });

  it("filters the catalog by artist and likes a result", async () => {
    const fake = services();
    await renderWithServices(<SearchScreen />, fake);
    await fireEvent.changeText(screen.getByLabelText("Search songs or artists"), "beta");

    await fireEvent.press(await screen.findByRole("button", { name: "Like Two" }));
    expect(screen.queryByText("One")).toBeNull();
    await waitFor(() => expect(fake.library.like).toHaveBeenCalledWith("s2", "search", undefined));
  });

  it("shows an empty state when nothing matches", async () => {
    await renderWithServices(<SearchScreen />, services());
    await fireEvent.changeText(screen.getByLabelText("Search songs or artists"), "zzz");
    expect(await screen.findByText("No songs found. Try another title or artist.")).toBeTruthy();
  });
});
