/** Pure config parsing (no process.env access), so it is unit-testable. */
export interface AppConfig {
  /** Base URL of the /v1 API, without a trailing slash. */
  apiUrl: string;
  useEmulators: boolean;
  /** Firebase Auth emulator URL, used only when useEmulators is true. */
  authEmulatorUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
  };
}

export interface RawEnv {
  apiUrl: string | undefined;
  firebaseApiKey: string | undefined;
  firebaseAuthDomain: string | undefined;
  firebaseProjectId: string | undefined;
  firebaseAppId: string | undefined;
  useEmulators: string | undefined;
  authEmulatorUrl: string | undefined;
}

export function parseConfig(source: RawEnv): AppConfig {
  if (!source.apiUrl) {
    throw new Error("Missing EXPO_PUBLIC_API_URL. Copy app/.env.example to app/.env.local.");
  }
  return {
    apiUrl: source.apiUrl.replace(/\/+$/, ""),
    useEmulators: source.useEmulators === "true",
    authEmulatorUrl: source.authEmulatorUrl ?? "http://localhost:9099",
    firebase: {
      apiKey: source.firebaseApiKey ?? "",
      authDomain: source.firebaseAuthDomain ?? "",
      projectId: source.firebaseProjectId ?? "",
      appId: source.firebaseAppId ?? "",
    },
  };
}
