import "@testing-library/react-native";

// No native audio in Jest. Each source gets its own fake player, as in expo-audio.
jest.mock("expo-audio", () => {
  const { useMemo } = jest.requireActual<typeof import("react")>("react");
  let created = 0;
  return {
    setAudioModeAsync: jest.fn(async () => {}),
    useAudioPlayer: jest.fn((source: string | null) =>
      useMemo(
        () => ({
          id: `player-${++created}`,
          source,
          loop: false,
          currentTime: 0,
          duration: 30,
          play: jest.fn(),
          pause: jest.fn(),
          seekTo: jest.fn(async () => {}),
        }),
        [source],
      ),
    ),
    useAudioPlayerStatus: jest.fn((player: { id: string }) => ({
      id: player.id,
      isLoaded: true,
      error: null,
      currentTime: 0,
      duration: 30,
    })),
  };
});
