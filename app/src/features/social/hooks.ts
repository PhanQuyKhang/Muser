import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useServices } from "@/application/services";
import type { RequestAction } from "@/domain/social";

export const socialKeys = {
  all: ["social"] as const,
  friends: ["social", "friends"] as const,
  requests: ["social", "requests"] as const,
  sharing: ["social", "sharing"] as const,
  discoveries: ["social", "discoveries"] as const,
  activity: ["social", "activity"] as const,
};

// Friendship and privacy change on someone else's phone, and tab screens stay mounted,
// so these are re-read on a timer.
const REFRESH_MS = 15_000;

export function useFriends() {
  const { social } = useServices();
  return useQuery({
    queryKey: socialKeys.friends,
    queryFn: () => social.listFriends(),
    refetchInterval: REFRESH_MS,
  });
}

export function useFriendRequests() {
  const { social } = useServices();
  return useQuery({
    queryKey: socialKeys.requests,
    queryFn: () => social.listRequests(),
    refetchInterval: REFRESH_MS,
  });
}

export function useDiscoveries() {
  const { social } = useServices();
  return useQuery({
    queryKey: socialKeys.discoveries,
    queryFn: () => social.listDiscoveries(),
    refetchInterval: REFRESH_MS,
  });
}

export function useActivity() {
  const { social } = useServices();
  return useQuery({
    queryKey: socialKeys.activity,
    queryFn: () => social.listActivity(),
    refetchInterval: REFRESH_MS,
  });
}

export function useSharing() {
  const { social } = useServices();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: socialKeys.sharing, queryFn: () => social.getSharing() });
  const update = useMutation({
    mutationFn: (enabled: boolean) => social.setSharing(enabled),
    onSettled: () => queryClient.invalidateQueries({ queryKey: socialKeys.sharing }),
  });
  return { query, update };
}

export function useFriendActions() {
  const { social } = useServices();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: socialKeys.all });

  return {
    send: useMutation({
      mutationFn: (username: string) => social.sendRequest(username),
      onSettled: refresh,
    }),
    respond: useMutation({
      mutationFn: (input: { pairId: string; action: RequestAction }) =>
        social.respond(input.pairId, input.action),
      onSettled: refresh,
    }),
    remove: useMutation({
      mutationFn: (pairId: string) => social.removeFriend(pairId),
      onSuccess: refresh,
    }),
  };
}
