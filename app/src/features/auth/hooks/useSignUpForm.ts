import { useState } from "react";

import { useServices } from "@/application/services";
import { AuthError } from "@/domain/auth";
import {
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
} from "@/domain/auth-validation";
import { authErrorMessage, fieldErrorMessage } from "../auth-messages";

interface Errors {
  email?: string;
  password?: string;
  confirm?: string;
  form?: string;
}

export function useSignUpForm(onSuccess: () => void) {
  const { auth } = useServices();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;

    const emailError = validateEmail(email);
    const passwordError = validateNewPassword(password);
    const confirmError = validatePasswordConfirmation(password, confirm);
    if (emailError || passwordError || confirmError) {
      setErrors({
        ...(emailError ? { email: fieldErrorMessage("email", emailError) } : {}),
        ...(passwordError ? { password: fieldErrorMessage("password", passwordError) } : {}),
        ...(confirmError ? { confirm: fieldErrorMessage("confirm", confirmError) } : {}),
      });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await auth.signUp(email, password);
      onSuccess();
    } catch (error) {
      const code = error instanceof AuthError ? error.code : "unknown";
      const message = authErrorMessage(code);
      setErrors(
        code === "email-in-use" || code === "invalid-email"
          ? { email: message }
          : code === "weak-password"
            ? { password: message }
            : { form: message },
      );
      setSubmitting(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirm,
    setConfirm,
    errors,
    submitting,
    submit,
  };
}
