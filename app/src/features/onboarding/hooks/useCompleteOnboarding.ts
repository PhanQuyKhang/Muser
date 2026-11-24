import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { patchMe } from "@/application/me-cache";
import { useServices } from "@/application/services";
import { useSessionStore } from "@/application/session";
import { strings } from "@/shared/strings";
import { useOnboardingDraft } from "../onboarding.store";

/** S09: sends every choice from steps 2-5 in one request and finishes setup. */
export function useCompleteOnboarding(onDone: () => void) {
  const { onboarding } = useServices();
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const [submitting, setSubmitting] = useState<"enable" | "skip" | null>(null);
  const [error, setError] = useState<string | undefined>();

  async function complete(sharingEnabled: boolean) {
    if (submitting || !user) return;
    const { tagIds, songIds, artistIds, reset } = useOnboardingDraft.getState();
    setSubmitting(sharingEnabled ? "enable" : "skip");
    setError(undefined);
    try {
      await onboarding.complete({
        seedTagIds: tagIds,
        seedSongIds: songIds,
        seedArtistIds: artistIds,
        sharingEnabled,
      });
      patchMe(queryClient, user.uid, user.email, { hasProfile: true, onboardingCompleted: true });
      reset();
      onDone();
    } catch {
      setError(strings.onboarding.sharing.failed);
      setSubmitting(null);
    }
  }

  return { submitting, error, complete };
}
