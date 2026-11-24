import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ServicesProvider, type Services } from "@/application/services";
import type { AuthRepository } from "@/domain/auth";
import type { MeRepository } from "@/domain/me";

export function createFakeServices(
  overrides: {
    auth?: Partial<AuthRepository>;
    me?: Partial<MeRepository>;
  } = {},
): Services {
  const auth: AuthRepository = {
    subscribe: jest.fn(() => () => {}),
    signIn: jest.fn(async () => ({ uid: "u1", email: "a@b.co" })),
    signUp: jest.fn(async () => ({ uid: "u1", email: "a@b.co" })),
    sendPasswordReset: jest.fn(async () => {}),
    signOut: jest.fn(async () => {}),
    getIdToken: jest.fn(async () => "token"),
    ...overrides.auth,
  };
  const me: MeRepository = {
    getMe: jest.fn(async () => ({
      uid: "u1",
      email: "a@b.co",
      hasProfile: true,
      onboardingCompleted: true,
    })),
    ...overrides.me,
  };
  return { auth, me };
}

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** Renders a screen with fake services and a fresh query cache. */
export async function renderWithServices(ui: ReactElement, services = createFakeServices()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = await render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <QueryClientProvider client={queryClient}>
        <ServicesProvider services={services}>{ui}</ServicesProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  return { ...result, services };
}
