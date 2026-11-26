import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer,
} from "expo-audio";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

import { useCurrentSong, usePlayerStore } from "@/application/player";
import { useServices } from "@/application/services";

/** Well inside the lifetime of a preview link, so a cached one still works. */
const LINK_REUSE_MS = 5 * 60_000;
/** Previews are 30 seconds; used until the player reports the real length. */
const PREVIEW_SECONDS = 30;

export type PreviewState = "idle" | "loading" | "ready" | "missing" | "failed";

interface PlayerControls {
  state: PreviewState;
  seekTo: (seconds: number) => void;
  seekBy: (seconds: number) => void;
  /** Back to the start, and playing. */
  replay: () => void;
  /** Asks for a fresh link and a fresh player. */
  retry: () => void;
}

interface Progress {
  position: number;
  duration: number;
}

// Two contexts: the position changes twice a second and must not re-render the whole deck.
const ControlsContext = createContext<PlayerControls | null>(null);
const ProgressContext = createContext<Progress | null>(null);

export function usePlayerControls(): PlayerControls {
  const controls = useContext(ControlsContext);
  if (!controls) throw new Error("usePlayerControls must be used inside <PlayerProvider>.");
  return controls;
}

export function usePlayerProgress(): Progress {
  const progress = useContext(ProgressContext);
  if (!progress) throw new Error("usePlayerProgress must be used inside <PlayerProvider>.");
  return progress;
}

/** `loop` is a setting on the native player object, not React state. */
function start(player: AudioPlayer, repeat: boolean) {
  player.loop = repeat;
  player.play();
}

function seek(player: AudioPlayer, seconds: number) {
  const end = player.duration || PREVIEW_SECONDS;
  player.seekTo(Math.min(Math.max(seconds, 0), end)).catch(() => {});
}

/**
 * The app's only audio player. It sits above the tabs, so the current preview keeps playing
 * while the listener moves between them. A new song replaces it, which stops the last clip.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const { media } = useServices();
  const queryClient = useQueryClient();
  const songId = useCurrentSong()?.id ?? null;
  const paused = usePlayerStore((state) => state.paused);
  const repeat = usePlayerStore((state) => !state.queue?.autoAdvance);

  const link = useQuery({
    queryKey: ["preview", songId],
    queryFn: () => media.getPreview(songId ?? ""),
    enabled: songId !== null,
    staleTime: LINK_REUSE_MS,
    gcTime: LINK_REUSE_MS,
    retry: false,
  });
  const url = link.data?.url ?? null;
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const audible = !paused && url !== null;

  useEffect(() => {
    // A music app should be heard with the iPhone's silent switch on.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    if (audible) start(player, repeat);
    else player.pause();
  }, [player, audible, repeat]);

  // The status can briefly describe the previous player, so match it by id.
  const current = status.id === player.id ? status : undefined;
  const finished = !repeat && Boolean(current?.didJustFinish);

  // A list moves on by itself, and stops after its last song.
  useEffect(() => {
    if (!finished) return;
    const { queue, currentId, advance, setPaused } = usePlayerStore.getState();
    const last = queue?.songs.at(-1)?.id === currentId;
    if (!last) advance();
    else {
      seek(player, 0);
      setPaused(true);
    }
  }, [finished, player]);

  let state: PreviewState = "loading";
  if (songId === null) state = "idle";
  else if (link.data === null) state = "missing";
  else if (link.isError || current?.error) state = "failed";
  else if (url !== null && current?.isLoaded) state = "ready";

  const controls = useMemo<PlayerControls>(
    () => ({
      state,
      seekTo: (seconds) => seek(player, seconds),
      seekBy: (seconds) => seek(player, player.currentTime + seconds),
      replay: () => {
        seek(player, 0);
        usePlayerStore.getState().setPaused(false);
        start(player, repeat);
      },
      retry: () => void queryClient.resetQueries({ queryKey: ["preview", songId] }),
    }),
    [state, player, repeat, queryClient, songId],
  );

  const position = current?.currentTime || 0;
  const duration = current?.duration || PREVIEW_SECONDS;
  const progress = useMemo(() => ({ position, duration }), [position, duration]);

  return (
    <ControlsContext.Provider value={controls}>
      <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>
    </ControlsContext.Provider>
  );
}
