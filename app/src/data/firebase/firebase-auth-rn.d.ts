import type { Persistence } from "firebase/auth";

// Firebase ships getReactNativePersistence in its React Native bundle (the "react-native" export
// condition) but TypeScript resolves the web typings, which omit it. Declare it here.
declare module "firebase/auth" {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
