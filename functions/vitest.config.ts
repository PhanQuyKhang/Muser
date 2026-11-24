import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The emulator test files share one Firestore emulator and each wipes/seeds it in
    // beforeEach, so files must run one at a time or they overwrite each other's data.
    fileParallelism: false,
  },
});
