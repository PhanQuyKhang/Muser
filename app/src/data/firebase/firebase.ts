import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";

import type { AppConfig } from "@/shared/config";

let cached: Auth | undefined;

/** Firebase Auth singleton with React Native persistence (sessions survive app restarts). */
export function getFirebaseAuth(config: AppConfig): Auth {
  if (cached) return cached;

  const app = getApps().length > 0 ? getApp() : initializeApp(config.firebase);
  cached = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  if (config.useEmulators) {
    connectAuthEmulator(cached, config.authEmulatorUrl, { disableWarnings: true });
  }
  return cached;
}
