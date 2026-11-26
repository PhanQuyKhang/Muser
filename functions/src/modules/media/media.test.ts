import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../bootstrap/app";
import { AppError } from "../../shared/errors";
import type { Song } from "../catalog/domain/catalog";
import type { TokenVerifier } from "../identity/application/ports/token-verifier";
import { MediaService } from "./application/media.service";
import { pickPreview } from "./domain/preview";
import { DeezerPreviewProvider } from "./infrastructure/deezer-preview-provider";

const NOW = new Date("2026-11-26T12:00:00.000Z");
const wanted = { title: "HUMBLE.", artistName: "Kendrick Lamar" };
const track = (title: string, artistName = "Kendrick Lamar", previewUrl = `https://x/${title}.mp3`) => ({
  title,
  artistName,
  previewUrl,
});

describe("pickPreview", () => {
  it("prefers the exact title by the same artist", () => {
    const found = pickPreview([track("Humble (Remastered)"), track("HUMBLE.")], wanted);
    expect(found?.title).toBe("HUMBLE.");
  });

  it("accepts a suffixed title but not another recording", () => {
    expect(pickPreview([track("Humble (Remastered)")], wanted)?.title).toBe("Humble (Remastered)");
    expect(pickPreview([track("Humble (Skrillex Remix)")], wanted)).toBeNull();
  });

  it("ignores other artists, longer words and tracks without a clip", () => {
    const candidates = [
      track("HUMBLE.", "A Cover Band"),
      track("Humbled"),
      track("HUMBLE.", "Kendrick Lamar", ""),
    ];
    expect(pickPreview(candidates, wanted)).toBeNull();
  });
});

function providerReturning(body: unknown, status = 200) {
  const fetchImpl = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  return { fetchImpl, provider: new DeezerPreviewProvider({ now: () => NOW }, fetchImpl) };
}

describe("DeezerPreviewProvider", () => {
  const result = (preview: string) => ({
    data: [{ title: "HUMBLE.", preview, artist: { name: "Kendrick Lamar" } }],
  });

  it("returns the link with the expiry it carries", async () => {
    const exp = Math.floor(NOW.getTime() / 1000) + 900;
    const url = `https://cdn.test/a.mp3?hdnea=exp=${exp}~acl=/a.mp3*~hmac=abc`;
    const { provider, fetchImpl } = providerReturning(result(url));

    await expect(provider.findPreview(wanted)).resolves.toEqual({ url, expiresAt: new Date(exp * 1000) });
    expect(String(fetchImpl.mock.calls[0])).toContain("q=Kendrick%20Lamar%20HUMBLE.");
  });

  it("assumes a short lifetime when the link has no expiry", async () => {
    const { provider } = providerReturning(result("https://cdn.test/a.mp3"));
    const preview = await provider.findPreview(wanted);
    expect(preview?.expiresAt).toEqual(new Date(NOW.getTime() + 600_000));
  });

  it("returns null without a match and throws when Deezer cannot answer", async () => {
    await expect(providerReturning({ data: [] }).provider.findPreview(wanted)).resolves.toBeNull();
    await expect(providerReturning({}, 500).provider.findPreview(wanted)).rejects.toThrow("500");
    await expect(providerReturning({ error: { code: 4 } }).provider.findPreview(wanted)).rejects.toThrow();
  });
});

const verifier: TokenVerifier = {
  async verify(token) {
    if (token === "good-token") return { uid: "alice" };
    throw new Error("bad token");
  },
};

function setup() {
  let now = NOW;
  const findPreview = vi.fn(async () => ({
    url: "https://cdn.test/a.mp3",
    expiresAt: new Date(now.getTime() + 15 * 60_000),
  }));
  const media = new MediaService({
    songs: {
      async getSong(id) {
        if (id !== "song_humble") throw new AppError("NOT_FOUND", "Song not found");
        return { id, title: "HUMBLE.", artistNames: ["Kendrick Lamar"] } as Song;
      },
    },
    previews: { findPreview },
    clock: { now: () => now },
  });
  const app = createApp({
    verifier,
    media,
    identity: { getMe: {}, completeOnboarding: {}, createProfile: {}, checkUsername: {} } as never,
    catalog: {} as never,
    library: {} as never,
    social: {} as never,
    recommendations: {} as never,
  });
  const play = (songId: string, token = "good-token") =>
    request(app).post(`/v1/media/${songId}/playback`).set("Authorization", `Bearer ${token}`);
  const advance = (ms: number) => (now = new Date(now.getTime() + ms));
  return { play, advance, findPreview };
}

describe("POST /v1/media/:songId/playback", () => {
  it("requires a signed-in caller", async () => {
    const { play, findPreview } = setup();
    expect((await play("song_humble", "nope")).status).toBe(401);
    expect(findPreview).not.toHaveBeenCalled();
  });

  it("returns a preview link for the song", async () => {
    const res = await setup().play("song_humble");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      url: "https://cdn.test/a.mp3",
      expiresAt: "2026-11-26T12:15:00.000Z",
      source: "deezer",
    });
  });

  it("reuses a link until it is close to expiring", async () => {
    const { play, advance, findPreview } = setup();
    await play("song_humble");
    advance(9 * 60_000);
    await play("song_humble");
    expect(findPreview).toHaveBeenCalledTimes(1);

    advance(2 * 60_000);
    await play("song_humble");
    expect(findPreview).toHaveBeenCalledTimes(2);
  });

  it("answers 404 for an unknown song or a song without a preview", async () => {
    const { play, findPreview } = setup();
    expect((await play("song_unknown")).status).toBe(404);
    expect(findPreview).not.toHaveBeenCalled();

    findPreview.mockResolvedValueOnce(null as never);
    const res = await play("song_humble");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("answers 503 when the provider fails", async () => {
    const { play, findPreview } = setup();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    findPreview.mockRejectedValueOnce(new Error("offline"));
    const res = await play("song_humble");
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("UNAVAILABLE");
    log.mockRestore();
  });
});
