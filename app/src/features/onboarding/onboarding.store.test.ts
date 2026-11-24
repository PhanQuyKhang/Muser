import { toggleWithLimit, useOnboardingDraft } from "./onboarding.store";

describe("toggleWithLimit", () => {
  it("adds and removes", () => {
    expect(toggleWithLimit([], "a", 2)).toEqual(["a"]);
    expect(toggleWithLimit(["a", "b"], "a", 2)).toEqual(["b"]);
  });
  it("ignores additions beyond the cap but still allows removal", () => {
    expect(toggleWithLimit(["a", "b"], "c", 2)).toEqual(["a", "b"]);
    expect(toggleWithLimit(["a", "b"], "b", 2)).toEqual(["a"]);
  });
});

describe("useOnboardingDraft", () => {
  beforeEach(() => useOnboardingDraft.getState().reset());

  it("caps songs at five", () => {
    const { toggleSong } = useOnboardingDraft.getState();
    for (const id of ["1", "2", "3", "4", "5", "6"]) toggleSong(id);
    expect(useOnboardingDraft.getState().songIds).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("keeps the draft for the same user and clears it for another", () => {
    const store = useOnboardingDraft.getState();
    store.claim("u1");
    store.toggleTag("genre_pop");
    useOnboardingDraft.getState().claim("u1");
    expect(useOnboardingDraft.getState().tagIds).toEqual(["genre_pop"]);

    useOnboardingDraft.getState().claim("u2");
    expect(useOnboardingDraft.getState().tagIds).toEqual([]);
    expect(useOnboardingDraft.getState().ownerUid).toBe("u2");
  });

  it("clears one step without touching the others", () => {
    const store = useOnboardingDraft.getState();
    store.toggleTag("t");
    store.toggleSong("s");
    useOnboardingDraft.getState().clearSongs();
    expect(useOnboardingDraft.getState().songIds).toEqual([]);
    expect(useOnboardingDraft.getState().tagIds).toEqual(["t"]);
  });
});
