import { useState } from "react";

import { useServices } from "@/application/services";
import { AuthError } from "@/domain/auth";
import { validateEmail, validateExistingPassword } from "@/domain/auth-validation";
import { authErrorMessage, fieldErrorMessage } from "../auth-messages";

interface Errors {
  email?: string;
  password?: string;
  form?: string;
}

export function useLoginForm(onSuccess: () => void) {
  const { auth } = useServices();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;

    const emailError = validateEmail(email);
    const passwordError = validateExistingPassword(password);
    if (emailError || passwordError) {
      setErrors({
        ...(emailError ? { email: fieldErrorMessage("email", emailError) } : {}),
        ...(passwordError ? { password: fieldErrorMessage("password", passwordError) } : {}),
      });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await auth.signIn(email, password);
      onSuccess();
    } catch (error) {
      const code = error instanceof AuthError ? error.code : "unknown";
      const message = authErrorMessage(code);
      // Credential failures are shown on the password field, as in the Figma error frame.
      setErrors(code === "invalid-credentials" ? { password: message } : { form: message });
      setSubmitting(false);
    }
  }

  return { email, setEmail, password, setPassword, errors, submitting, submit };
}
