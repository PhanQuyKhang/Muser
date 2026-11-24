import { useQuery } from "@tanstack/react-query";

import { meQueryKey } from "@/application/me-cache";
import { useServices } from "@/application/services";
import { useSessionStore } from "@/application/session";
import { resolveStartRoute } from "@/domain/me";

export type StartRouteState =
  | { status: "loading" }
  | { status: "ready"; href: "/login" | "/profile" | "/music-types" | "/explore" }
  | { status: "error"; retry: () => void };

/** Restores the session and decides the first screen: Log in, unfinished setup, or Explore. */
export function useStartRoute(): StartRouteState {
  const { me } = useServices();
  const session = useSessionStore((state) => state.status);
  const uid = useSessionStore((state) => state.user?.uid);

  const query = useQuery({
    queryKey: meQueryKey(uid),
    queryFn: () => me.getMe(),
    enabled: session === "signedIn",
    retry: false,
  });

  if (session === "initializing") return { status: "loading" };
  if (session === "signedOut") return { status: "ready", href: "/login" };
  if (query.isError) return { status: "error", retry: () => void query.refetch() };
  if (query.data) return { status: "ready", href: resolveStartRoute(query.data) };
  return { status: "loading" };
}
