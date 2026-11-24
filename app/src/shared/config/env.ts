/**
 * Typed, validated app configuration. The only module allowed to read process.env.
 *
 * Expo inlines EXPO_PUBLIC_* values at build time, which only works with static
 * property access, so each variable is read explicitly below. Public values only:
 * never put secrets in the app bundle.
 */
import { parseConfig, type AppConfig } from "./parse";

const raw = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  useEmulators: process.env.EXPO_PUBLIC_USE_EMULATORS,
  authEmulatorUrl: process.env.EXPO_PUBLIC_AUTH_EMULATOR_URL,
};

export const config: AppConfig = parseConfig(raw);
