import { makeSong } from "@/test/fixtures";
import { usePlayerStore } from "./player";

const songs = [
  makeSong("s1", "One", "A"),
  makeSong("s2", "Two", "B"),
  makeSong("s3", "Three", "C"),
];
const store = () => usePlayerStore.getState();

describe("player store", () => {
  beforeEach(() => store().reset());

  it("moves forward and back through the queue", () => {
    store().activate({ id: "mine", songs });
    expect(store().currentId).toBe("s1");

    store().advance();
    store().advance();
    expect(store().currentId).toBe("s3");

    store().back();
    expect(store().currentId).toBe("s2");
    store().advance();
    store().advance();
    expect(store().currentId).toBeNull();
  });

  it("keeps the current song when the list is refreshed with new songs", () => {
    store().activate({ id: "friends", songs });
    store().advance();
    store().activate({ id: "friends", songs: [makeSong("s0", "New", "D"), ...songs] });
    expect(store().currentId).toBe("s2");
  });

  it("moves on when the current song disappears from the list", () => {
    store().activate({ id: "friends", songs });
    store().activate({ id: "friends", songs: songs.slice(1) });
    expect(store().currentId).toBe("s2");
  });

  it("resumes each queue where it was left", () => {
    store().activate({ id: "mine", songs });
    store().advance();
    store().release();
    expect(store().queue).toBeNull();

    store().activate({ id: "friends", songs });
    expect(store().currentId).toBe("s1");
    store().activate({ id: "mine", songs });
    expect(store().currentId).toBe("s2");
  });

  it("plays a list from the chosen song, unpaused", () => {
    store().setPaused(true);
    store().play({ id: "list:liked", songs, autoAdvance: true }, "s2");
    expect(store()).toMatchObject({ currentId: "s2", paused: false });

    store().back();
    expect(store().currentId).toBe("s1");
  });

  it("starts a finished queue over, and reset forgets everything", () => {
    store().activate({ id: "mine", songs: songs.slice(0, 1) });
    store().advance();
    store().restart("mine");
    expect(store().currentId).toBe("s1");

    store().setPaused(true);
    store().reset();
    expect(store()).toMatchObject({ queue: null, passed: {}, paused: false });
  });
});
