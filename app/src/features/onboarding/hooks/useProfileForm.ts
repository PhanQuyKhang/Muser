import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { patchMe } from "@/application/me-cache";
import { useServices } from "@/application/services";
import { useSessionStore } from "@/application/session";
import { OnboardingError } from "@/domain/onboarding";
import {
  normalizeUsername,
  validateDisplayName,
  validateUsername,
  type DisplayNameError,
  type UsernameError,
} from "@/domain/profile-validation";
import { strings } from "@/shared/strings";
import { useDebouncedValue } from "@/shared/utils/useDebouncedValue";

const t = strings.onboarding.profile;

export type UsernameStatus = "idle" | "checking" | "available" | "taken" | "unknown";

const usernameMessages: Record<UsernameError, string> = {
  required: "",
  "too-short": t.usernameShort,
  "too-long": t.usernameLong,
  "invalid-chars": t.usernameChars,
};

const displayNameMessages: Record<DisplayNameError, string> = {
  required: t.displayNameRequired,
  "too-long": t.displayNameLong,
};

/** The last availability verdict, keyed by the username it was for so stale answers are ignored. */
interface Verdict {
  username: string;
  result: "available" | "taken" | "unknown";
}

/** S05: display name + username, with a debounced availability check while typing. */
export function useProfileForm(onSuccess: () => void) {
  const { onboarding } = useServices();
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [touched, setTouched] = useState({ name: false, username: false });

  const normalized = normalizeUsername(username);
  const usernameError = validateUsername(username);
  const displayNameError = validateDisplayName(displayName);
  const debounced = useDebouncedValue(normalized, 400);

  // Advisory availability check; the create call below remains the authority.
  useEffect(() => {
    if (validateUsername(debounced) !== null) return;
    let cancelled = false;
    onboarding
      .isUsernameAvailable(debounced)
      .then((available) => {
        if (!cancelled)
          setVerdict({ username: debounced, result: available ? "available" : "taken" });
      })
      .catch(() => {
        if (!cancelled) setVerdict({ username: debounced, result: "unknown" });
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, onboarding]);

  const status: UsernameStatus =
    usernameError !== null
      ? "idle"
      : verdict?.username === normalized
        ? verdict.result
        : "checking";

  const canContinue =
    !displayNameError && usernameError === null && status !== "taken" && status !== "checking";

  async function submit() {
    if (!canContinue || submitting || !user) return;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await onboarding.createProfile({ username: normalized, displayName: displayName.trim() });
      patchMe(queryClient, user.uid, user.email, { hasProfile: true });
      onSuccess();
    } catch (error) {
      const code = error instanceof OnboardingError ? error.code : "unknown";
      if (code === "username-taken") setVerdict({ username: normalized, result: "taken" });
      else setSubmitError(code === "invalid" ? t.invalid : strings.common.connectionError);
      setSubmitting(false);
    }
  }

  const usernameFeedback = (() => {
    if (status === "taken") return { text: t.usernameTaken, tone: "error" as const };
    if (touched.username && usernameError && usernameError !== "required") {
      return { text: usernameMessages[usernameError], tone: "error" as const };
    }
    if (status === "checking") return { text: t.usernameChecking, tone: "muted" as const };
    if (status === "available") return { text: t.usernameAvailable, tone: "success" as const };
    return { text: t.usernameHelper, tone: "muted" as const };
  })();

  return {
    displayName,
    setDisplayName: (value: string) => {
      setDisplayName(value);
      setTouched((current) => ({ ...current, name: true }));
    },
    username,
    setUsername: (value: string) => {
      setUsername(value);
      setSubmitError(undefined);
      setTouched((current) => ({ ...current, username: true }));
    },
    displayNameError:
      touched.name && displayNameError ? displayNameMessages[displayNameError] : undefined,
    usernameFeedback,
    submitError,
    submitting,
    canContinue,
    submit,
  };
}
