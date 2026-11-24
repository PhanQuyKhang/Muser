import { parseConfig } from "./parse";

const base = {
  apiUrl: "http://localhost:5001/api/v1/",
  firebaseApiKey: "key",
  firebaseAuthDomain: "demo.firebaseapp.com",
  firebaseProjectId: "demo-muser",
  firebaseAppId: "app",
  useEmulators: "true",
  authEmulatorUrl: undefined,
};

describe("parseConfig", () => {
  it("strips the trailing slash and reads the emulator flag", () => {
    const parsed = parseConfig(base);
    expect(parsed.apiUrl).toBe("http://localhost:5001/api/v1");
    expect(parsed.useEmulators).toBe(true);
    expect(parsed.authEmulatorUrl).toBe("http://localhost:9099");
    expect(parsed.firebase.projectId).toBe("demo-muser");
  });

  it("fails loudly when the API url is missing", () => {
    expect(() => parseConfig({ ...base, apiUrl: undefined })).toThrow(/EXPO_PUBLIC_API_URL/);
  });
});
