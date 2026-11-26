import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useExploreFeed } from "@/application/explore-feed";
import { usePlayerStore } from "@/application/player";
import { useRecentSearches } from "@/application/recent-searches";
import { ServicesProvider, type Services } from "@/application/services";
import { makePlaylist } from "./fixtures";
import type { AuthRepository } from "@/domain/auth";
import type { CatalogRepository } from "@/domain/catalog";
import type { DiscoveryRepository } from "@/domain/discovery";
import type { LibraryRepository } from "@/domain/library";
import type { MediaRepository } from "@/domain/media";
import type { MeRepository } from "@/domain/me";
import type { OnboardingRepository } from "@/domain/onboarding";
import type { SocialRepository } from "@/domain/social";

export function createFakeServices(
  overrides: {
    auth?: Partial<AuthRepository>;
    me?: Partial<MeRepository>;
    catalog?: Partial<CatalogRepository>;
    onboarding?: Partial<OnboardingRepository>;
    library?: Partial<LibraryRepository>;
    social?: Partial<SocialRepository>;
    discovery?: Partial<DiscoveryRepository>;
    media?: Partial<MediaRepository>;
  } = {},
): Services {
  const auth: AuthRepository = {
    subscribe: jest.fn(() => () => {}),
    signIn: jest.fn(async () => ({ uid: "u1", email: "a@b.co" })),
    signUp: jest.fn(async () => ({ uid: "u1", email: "a@b.co" })),
    sendPasswordReset: jest.fn(async () => {}),
    signOut: jest.fn(async () => {}),
    getIdToken: jest.fn(async () => "token"),
    ...overrides.auth,
  };
  const me: MeRepository = {
    getMe: jest.fn(async () => ({
      uid: "u1",
      email: "a@b.co",
      hasProfile: true,
      onboardingCompleted: true,
    })),
    ...overrides.me,
  };
  const catalog: CatalogRepository = {
    listTags: jest.fn(async () => []),
    listSongs: jest.fn(async () => ({ items: [], nextCursor: null })),
    listArtists: jest.fn(async () => ({ items: [], nextCursor: null })),
    search: jest.fn(async () => ({ songs: [], artists: [] })),
    ...overrides.catalog,
  };
  const onboarding: OnboardingRepository = {
    createProfile: jest.fn(async () => {}),
    isUsernameAvailable: jest.fn(async () => true),
    complete: jest.fn(async () => {}),
    ...overrides.onboarding,
  };
  const library: LibraryRepository = {
    listLikes: jest.fn(async () => []),
    like: jest.fn(async () => {}),
    unlike: jest.fn(async () => {}),
    listPlaylists: jest.fn(async () => []),
    createPlaylist: jest.fn(async (name: string) => makePlaylist("p1", name)),
    renamePlaylist: jest.fn(async () => {}),
    deletePlaylist: jest.fn(async () => {}),
    listPlaylistSongs: jest.fn(async () => []),
    addToPlaylist: jest.fn(async () => {}),
    removeFromPlaylist: jest.fn(async () => {}),
    ...overrides.library,
  };
  const social: SocialRepository = {
    findUser: jest.fn(async () => null),
    listFriends: jest.fn(async () => []),
    listRequests: jest.fn(async () => ({ incoming: [], outgoing: [] })),
    sendRequest: jest.fn(async () => {}),
    respond: jest.fn(async () => {}),
    removeFriend: jest.fn(async () => {}),
    getSharing: jest.fn(async () => false),
    setSharing: jest.fn(async () => {}),
    listDiscoveries: jest.fn(async () => []),
    sendHeart: jest.fn(async () => {}),
    listActivity: jest.fn(async () => []),
    ...overrides.social,
  };
  const discovery: DiscoveryRepository = {
    recommend: jest.fn(async () => ({ level: "explore" as const, songs: [] })),
    ...overrides.discovery,
  };
  const media: MediaRepository = {
    getPreview: jest.fn(async (songId: string) => ({
      url: `https://preview.test/${songId}.mp3`,
      expiresAt: "2026-11-26T12:15:00.000Z",
    })),
    ...overrides.media,
  };
  return { auth, me, catalog, onboarding, library, social, discovery, media };
}

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** Renders a screen with fake services and a fresh query cache. */
export async function renderWithServices(ui: ReactElement, services = createFakeServices()) {
  useExploreFeed.getState().setFeed("mine");
  useRecentSearches.getState().clear();
  usePlayerStore.getState().reset();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = await render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <QueryClientProvider client={queryClient}>
        <ServicesProvider services={services}>{ui}</ServicesProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  return { ...result, services };
}
