import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { create } from "zustand";

import type { AuthUser } from "@/domain/auth";
import { useServices } from "./services";

export type SessionStatus = "initializing" | "signedOut" | "signedIn";

interface SessionState {
  status: SessionStatus;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: "initializing",
  user: null,
  setUser: (user) => set({ user, status: user ? "signedIn" : "signedOut" }),
}));

/**
 * Mirrors the auth provider into the session store. Mount once at the root.
 * On sign-out the query cache is cleared so one user's data never shows for the next.
 */
export function useSessionSync(): void {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  const setUser = useSessionStore((state) => state.setUser);

  useEffect(() => {
    let previousUid: string | null = null;
    return auth.subscribe((user) => {
      const uid = user?.uid ?? null;
      if (previousUid !== uid) void queryClient.cancelQueries();
      if (previousUid !== null && previousUid !== uid) queryClient.clear();
      previousUid = uid;
      setUser(user);
    });
  }, [auth, queryClient, setUser]);
}
