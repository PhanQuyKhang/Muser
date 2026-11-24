import type { QueryClient } from "@tanstack/react-query";

import type { Me } from "@/domain/me";

export const meQueryKey = (uid: string | undefined) => ["me", uid] as const;

/**
 * Updates the cached /me result after setup progresses, so routing sees the new state immediately
 * (a plain invalidate would still hand the stale value to the Opening screen while it refetches).
 */
export function patchMe(
  queryClient: QueryClient,
  uid: string,
  email: string | null,
  patch: Partial<Pick<Me, "hasProfile" | "onboardingCompleted">>,
): void {
  queryClient.setQueryData<Me>(meQueryKey(uid), (current) => ({
    uid,
    email,
    hasProfile: false,
    onboardingCompleted: false,
    ...current,
    ...patch,
  }));
}
