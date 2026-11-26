import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

import { usePlayerStore } from "@/application/player";
import { ExploreScreen } from "@/features/explore/screens/ExploreScreen";
import { LikedScreen } from "@/features/library/screens/LikedScreen";
import { createFakeServices, renderWithServices } from "@/test/fakes";
import { makeEntry, makeSong } from "@/test/fixtures";
import { MiniPlayer } from "./components/MiniPlayer";
import { PlayerProvider } from "./PlayerProvider";

let mockFocused = true;
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn() },
  useIsFocused: () => mockFocused,
}));

const liked = [
  makeEntry(makeSong("s1", "One", "Alpha"), "2026-11-02T00:00:00.000Z"),
  makeEntry(makeSong("s2", "Two", "Beta"), "2026-11-01T00:00:00.000Z"),
];
const library = { listLikes: jest.fn(async () => liked) };
const store = () => usePlayerStore.getState();

function player() {
  return jest.mocked(useAudioPlayer).mock.results.at(-1)!.value as unknown as {
    source: string | null;
    loop: boolean;
  };
}

describe("Playing from a list", () => {
  beforeEach(() => {
    mockFocused = true;
    jest.mocked(useAudioPlayer).mockClear();
  });

  it("plays the tapped song once and keeps the earlier ones reachable", async () => {
    await renderWithServices(
      <PlayerProvider>
        <LikedScreen />
        <MiniPlayer />
      </PlayerProvider>,
      createFakeServices({ library }),
    );

    await fireEvent.press(await screen.findByRole("button", { name: "Play Two" }));
    await waitFor(() => expect(player().source).toBe("https://preview.test/s2.mp3"));
    expect(player().loop).toBe(false);
    expect(screen.getByText("Now playing · Beta")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Previous song" }));
    await waitFor(() => expect(player().source).toBe("https://preview.test/s1.mp3"));
  });

  it("moves to the next song when one finishes, and stops after the last", async () => {
    const status = jest.mocked(useAudioPlayerStatus);
    const original = status.getMockImplementation()!;
    // Every loaded clip reports that it has ended.
    status.mockImplementation((current) => {
      const { source } = current as unknown as { source: string | null };
      return {
        id: current.id,
        isLoaded: true,
        error: null,
        currentTime: 0,
        duration: 30,
        didJustFinish: Boolean(source),
      } as ReturnType<typeof useAudioPlayerStatus>;
    });
    await renderWithServices(
      <PlayerProvider>
        <LikedScreen />
      </PlayerProvider>,
      createFakeServices({ library }),
    );

    await fireEvent.press(await screen.findByRole("button", { name: "Play playlist" }));
    await waitFor(() => expect(store().currentId).toBe("s2"));
    await waitFor(() => expect(store().paused).toBe(true));
    status.mockImplementation(original);
  });

  it("is not interrupted by the Explore deck behind another tab", async () => {
    mockFocused = false;
    const songs = [makeSong("x1", "Card", "Gamma")];
    const queue = { id: "list:liked", songs: [liked[0]!.song!], autoAdvance: true };
    const services = createFakeServices({
      discovery: { recommend: jest.fn(async () => ({ level: "explore" as const, songs })) },
    });
    await renderWithServices(
      <PlayerProvider>
        <ExploreScreen />
      </PlayerProvider>,
      services,
    );
    expect(await screen.findByText("Card")).toBeTruthy();
    expect(store().queue).toBeNull();

    store().play(queue, "s1");
    await waitFor(() => expect(services.media.getPreview).toHaveBeenCalledWith("s1"));
    expect(store().queue?.id).toBe("list:liked");
  });
});
