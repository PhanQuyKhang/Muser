import { ApiError, createApiClient } from "./client";

const json = (status: number, body: unknown) =>
  ({ status, ok: status >= 200 && status < 300, json: async () => body }) as Response;

function setup(responses: Response[], token: string | null = "tok") {
  const fetchImpl = jest.fn(async () => responses.shift()!) as unknown as typeof fetch;
  const getToken = jest.fn(async () => token);
  const client = createApiClient({ baseUrl: "http://api/v1", getToken, fetchImpl });
  return { client, fetchImpl: fetchImpl as unknown as jest.Mock, getToken };
}

describe("createApiClient", () => {
  it("attaches the bearer token and returns the JSON body", async () => {
    const { client, fetchImpl } = setup([json(200, { ok: true })]);
    await expect(client.get("/me")).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://api/v1/me",
      expect.objectContaining({ method: "GET", headers: { Authorization: "Bearer tok" } }),
    );
  });

  it("sends JSON bodies with a content type", async () => {
    const { client, fetchImpl } = setup([json(200, {})]);
    await client.post("/x", { a: 1 });
    expect(fetchImpl.mock.calls[0]![1]).toMatchObject({
      body: '{"a":1}',
      headers: { "Content-Type": "application/json" },
    });
  });

  it("refreshes the token once after a 401 and retries", async () => {
    const { client, getToken, fetchImpl } = setup([json(401, {}), json(200, { n: 1 })]);
    await expect(client.get("/me")).resolves.toEqual({ n: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(getToken).toHaveBeenNthCalledWith(2, true);
  });

  it("surfaces the API error code and request id", async () => {
    const { client } = setup([
      json(403, { error: { code: "FORBIDDEN", message: "No." }, requestId: "r1" }),
    ]);
    await expect(client.get("/x")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
      message: "No.",
      requestId: "r1",
    });
  });

  it("does not call the network without a token", async () => {
    const { client, fetchImpl } = setup([], null);
    await expect(client.get("/me")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reports network failures as NETWORK", async () => {
    const fetchImpl = jest.fn(async () => {
      throw new TypeError("Network request failed");
    }) as unknown as typeof fetch;
    const client = createApiClient({ baseUrl: "http://api", getToken: async () => "t", fetchImpl });
    const error = await client.get("/me").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: "NETWORK" });
  });
});
