import { OnboardingError } from "@/domain/onboarding";
import { ApiError, type ApiClient } from "./client";
import { ApiOnboardingRepository, mapOnboardingError } from "./onboarding.repository";

function fakeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    get: jest.fn(async () => ({ available: true })),
    post: jest.fn(async () => ({})),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  } as unknown as ApiClient;
}

describe("mapOnboardingError", () => {
  it.each([
    [new ApiError(409, "USERNAME_TAKEN", "x"), "username-taken"],
    [new ApiError(400, "VALIDATION_ERROR", "x"), "invalid"],
    [new ApiError(0, "NETWORK", "x"), "network"],
    [new ApiError(500, "INTERNAL", "x"), "unknown"],
    [new Error("boom"), "unknown"],
  ])("maps %#", (error, code) => {
    expect(mapOnboardingError(error).code).toBe(code);
  });
});

describe("ApiOnboardingRepository", () => {
  it("posts the profile and the onboarding choices", async () => {
    const api = fakeApi();
    const repo = new ApiOnboardingRepository(api);
    await repo.createProfile({ username: "alex", displayName: "Alex" });
    await repo.complete({
      seedTagIds: ["t"],
      seedSongIds: [],
      seedArtistIds: [],
      sharingEnabled: false,
    });
    expect(api.post).toHaveBeenNthCalledWith(1, "/me/profile", {
      username: "alex",
      displayName: "Alex",
    });
    expect(api.post).toHaveBeenNthCalledWith(2, "/onboarding", {
      seedTagIds: ["t"],
      seedSongIds: [],
      seedArtistIds: [],
      sharingEnabled: false,
    });
  });

  it("checks availability on the encoded username", async () => {
    const api = fakeApi();
    await expect(new ApiOnboardingRepository(api).isUsernameAvailable("a.b")).resolves.toBe(true);
    expect(api.get).toHaveBeenCalledWith("/usernames/a.b/available");
  });

  it("raises a domain error when the username is taken", async () => {
    const api = fakeApi({
      post: jest.fn(async () => {
        throw new ApiError(409, "USERNAME_TAKEN", "taken");
      }),
    });
    await expect(
      new ApiOnboardingRepository(api).createProfile({ username: "x", displayName: "X" }),
    ).rejects.toBeInstanceOf(OnboardingError);
  });
});
