import { Stack } from "expo-router";
import { useEffect } from "react";

import { useSessionStore } from "@/application/session";
import { useOnboardingDraft } from "@/features/onboarding/onboarding.store";

/** Setup flow. Each user gets their own empty draft, so one account's choices never reach another. */
export default function OnboardingLayout() {
  const uid = useSessionStore((state) => state.user?.uid);
  const claim = useOnboardingDraft((state) => state.claim);

  useEffect(() => {
    if (uid) claim(uid);
  }, [uid, claim]);

  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
