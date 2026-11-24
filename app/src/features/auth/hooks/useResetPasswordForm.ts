import { useState } from "react";

import { useServices } from "@/application/services";
import { AuthError } from "@/domain/auth";
import { validateEmail } from "@/domain/auth-validation";
import { authErrorMessage, fieldErrorMessage } from "../auth-messages";

export function useResetPasswordForm() {
  const { auth } = useServices();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  /** The address the link was sent to; set once the request succeeds. */
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit() {
    if (submitting) return;

    const emailError = validateEmail(email);
    if (emailError) {
      setError(fieldErrorMessage("email", emailError));
      return;
    }

    setError(undefined);
    setSubmitting(true);
    try {
      await auth.sendPasswordReset(email);
      setSentTo(email.trim());
    } catch (caught) {
      setError(authErrorMessage(caught instanceof AuthError ? caught.code : "unknown"));
    } finally {
      setSubmitting(false);
    }
  }

  return { email, setEmail, error, submitting, sentTo, submit };
}
