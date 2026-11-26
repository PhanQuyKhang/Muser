import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { PlayerProvider } from "@/features/player/PlayerProvider";
import { createFakeServices, renderWithServices } from "@/test/fakes";
import { makeSong, makeTag } from "@/test/fixtures";
import { ExploreScreen } from "./ExploreScreen";

let mockFocused = true;
jest.mock("expo-router", () => ({ useIsFocused: () => mockFocused, router: { push: jest.fn() } }));

const songs = [makeSong("s1", "One", "Alpha"), makeSong("s2", "Two", "Beta")];
const profile = { uid: "u2", username: "jamie", displayName: "Jamie", avatarPath: null };

const renderExplore = (services: ReturnType<typeof createFakeServices>) =>
  renderWithServices(
    <PlayerProvider>
      <ExploreScreen />
    </PlayerProvider>,
    services,
  );

describe("ExploreScreen (S10, S11)", () => {
  it("skips without liking, then likes the next card", async () => {
    const services = createFakeServices({
      discovery: { recommend: jest.fn(async () => ({ level: "explore" as const, songs })) },
    });
    await renderExplore(services);

    expect(await screen.findByText("One")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Skip" }));
    expect(await screen.findByText("Two")).toBeTruthy();
    expect(services.library.like).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("button", { name: "Like" }));
    await waitFor(() =>
      expect(services.library.like).toHaveBeenCalledWith("s2", "my_explore", undefined),
    );
    expect(await screen.findByText("That’s all for now")).toBeTruthy();
  });

  it("shows the genre, the level wording and the sharing state on the card", async () => {
    const services = createFakeServices({
      discovery: {
        recommend: jest.fn(async () => ({
          level: "familiar" as const,
          songs: [{ ...songs[0]!, tagIds: ["genre_pop"] }],
        })),
      },
      catalog: { listTags: jest.fn(async () => [makeTag("genre_pop", "Pop", "genre")]) },
    });
    await renderExplore(services);

    expect(await screen.findByText("POP")).toBeTruthy();
    expect(screen.getByText("Close to the sounds you love")).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Private likes" })).toBeTruthy();
  });

  it("applies a discovery level, and closing the sheet changes nothing", async () => {
    const services = createFakeServices();
    await renderExplore(services);
    const open = await screen.findByRole("button", { name: "Discovery level: Explore" });

    await fireEvent.press(open);
    await fireEvent.press(screen.getByRole("radio", { name: "Surprise" }));
    await fireEvent.press(screen.getAllByRole("button", { name: "Close" })[0]!);
    expect(services.discovery.recommend).not.toHaveBeenCalledWith("surprise");

    await fireEvent.press(open);
    await fireEvent.press(screen.getByRole("radio", { name: "Surprise" }));
    await fireEvent.press(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(services.discovery.recommend).toHaveBeenCalledWith("surprise"));
  });

  it("sends a heart on a friend's song without liking it", async () => {
    const consoleError = jest.spyOn(console, "error");
    const services = createFakeServices({
      social: {
        listFriends: jest.fn(async () => [{ pairId: "p", profile }]),
        listDiscoveries: jest.fn(async () => [
          {
            song: songs[0]!,
            sharers: [{ ...profile, shareId: "sh1", sharedAt: "2026-11-01", heartSent: false }],
          },
        ]),
      },
    });
    await renderExplore(services);
    await fireEvent.press(screen.getByRole("tab", { name: "My Friends" }));

    await fireEvent.press(await screen.findByRole("button", { name: "Send heart to Jamie" }));
    await waitFor(() =>
      expect(services.social.sendHeart).toHaveBeenCalledWith("sh1", expect.any(String)),
    );
    expect(await screen.findByRole("button", { name: "Heart sent" })).toBeTruthy();
    expect(screen.getByText("Picked by someone you know")).toBeTruthy();
    expect(services.library.like).not.toHaveBeenCalled();
    // React reports siblings with colliding keys.
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("same key");
    consoleError.mockRestore();
  });
});
