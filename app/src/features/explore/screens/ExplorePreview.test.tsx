import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

import { MiniPlayer } from "@/features/player/components/MiniPlayer";
import { PlayerProvider } from "@/features/player/PlayerProvider";
import { createFakeServices, renderWithServices } from "@/test/fakes";
import { makeSong } from "@/test/fixtures";
import { ExploreScreen } from "./ExploreScreen";

let mockFocused = true;
jest.mock("expo-router", () => ({
  useIsFocused: () => mockFocused,
  router: { push: jest.fn(), navigate: jest.fn() },
}));

const songs = [makeSong("s1", "One", "Alpha"), makeSong("s2", "Two", "Beta")];
const discovery = { recommend: jest.fn(async () => ({ level: "explore" as const, songs })) };

interface FakePlayer {
  source: string | null;
  loop: boolean;
  play: jest.Mock;
  pause: jest.Mock;
  seekTo: jest.Mock;
}

/** The player the app is using now. */
function player(): FakePlayer {
  return jest.mocked(useAudioPlayer).mock.results.at(-1)!.value as unknown as FakePlayer;
}

const url = (id: string) => `https://preview.test/${id}.mp3`;

function renderApp(services = createFakeServices({ discovery }), withMiniPlayer = false) {
  return renderWithServices(
    <PlayerProvider>
      <ExploreScreen />
      {withMiniPlayer ? <MiniPlayer /> : null}
    </PlayerProvider>,
    services,
  );
}

const disabled = (name: string) =>
  screen.getByRole("button", { name }).props.accessibilityState.disabled;

describe("Preview playback", () => {
  beforeEach(() => jest.mocked(useAudioPlayer).mockClear());

  it("plays the current card on repeat, then the next one after a skip", async () => {
    await renderApp();

    await waitFor(() => expect(player().source).toBe(url("s1")));
    expect(player().play).toHaveBeenCalled();
    expect(player().loop).toBe(true);

    await fireEvent.press(screen.getByRole("button", { name: "Skip" }));
    await waitFor(() => expect(player().source).toBe(url("s2")));
    expect(player().play).toHaveBeenCalled();
  });

  it("stays paused on the next card until Play is pressed", async () => {
    await renderApp();
    await waitFor(() => expect(player().source).toBe(url("s1")));

    await fireEvent.press(screen.getByRole("button", { name: "Pause preview" }));
    expect(player().pause).toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("button", { name: "Skip" }));
    await waitFor(() => expect(player().source).toBe(url("s2")));
    expect(player().play).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("button", { name: "Play preview" }));
    expect(player().play).toHaveBeenCalled();
  });

  it("seeks by ten seconds within the clip, and replays from the start", async () => {
    await renderApp();
    await waitFor(() => expect(player().source).toBe(url("s1")));

    await fireEvent.press(screen.getByRole("button", { name: "Forward 10 seconds" }));
    expect(player().seekTo).toHaveBeenLastCalledWith(10);
    await fireEvent.press(screen.getByRole("button", { name: "Rewind 10 seconds" }));
    expect(player().seekTo).toHaveBeenLastCalledWith(0);

    await fireEvent.press(screen.getByRole("button", { name: "Pause preview" }));
    await fireEvent.press(screen.getByRole("button", { name: "Replay from the start" }));
    expect(screen.getByRole("button", { name: "Pause preview" })).toBeTruthy();
  });

  it("drives the same queue from the mini player and the card", async () => {
    await renderApp(createFakeServices({ discovery }), true);
    await waitFor(() => expect(player().source).toBe(url("s1")));
    expect(disabled("Previous song")).toBe(true);

    await fireEvent.press(screen.getByRole("button", { name: "Next song" }));
    await waitFor(() => expect(player().source).toBe(url("s2")));
    expect(screen.getByRole("button", { name: "Open Two in Explore" })).toBeTruthy();
    expect(disabled("Next song")).toBe(true);

    await fireEvent.press(screen.getByRole("button", { name: "Previous song" }));
    await waitFor(() => expect(player().source).toBe(url("s1")));
    expect(screen.getByRole("button", { name: "Open One in Explore" })).toBeTruthy();
  });

  it("stops when switching to a feed that has nothing to play", async () => {
    await renderApp(createFakeServices({ discovery }), true);
    await waitFor(() => expect(player().source).toBe(url("s1")));

    await fireEvent.press(screen.getByRole("tab", { name: "My Friends" }));
    expect(await screen.findByText("No friends yet")).toBeTruthy();
    expect(player().source).toBeNull();
    expect(screen.queryByRole("button", { name: "Next song" })).toBeNull();
  });

  it("offers Retry when the link cannot be fetched, and Skip still works", async () => {
    const getPreview = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ url: url("again"), expiresAt: "2026-11-26" });
    await renderApp(createFakeServices({ discovery, media: { getPreview } }));

    expect(await screen.findByText("Couldn’t play this song.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Skip" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(player().source).toBe(url("again")));
  });

  it("says so when a song has no preview", async () => {
    const media = { getPreview: jest.fn(async () => null) };
    await renderApp(createFakeServices({ discovery, media }));

    expect(await screen.findByText("No preview for this song.")).toBeTruthy();
  });

  it("reports a clip that cannot be played", async () => {
    jest
      .mocked(useAudioPlayerStatus)
      .mockImplementation(
        (current) =>
          ({ id: current.id, isLoaded: false, error: "decode failed" }) as ReturnType<
            typeof useAudioPlayerStatus
          >,
      );
    await renderApp();

    expect(await screen.findByText("Couldn’t play this song.")).toBeTruthy();
  });
});
