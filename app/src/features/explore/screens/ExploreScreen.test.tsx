import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { createFakeServices, renderWithServices } from "@/test/fakes";
import { makeSong } from "@/test/fixtures";
import { ExploreScreen } from "./ExploreScreen";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const songs = [makeSong("s1", "One", "Alpha"), makeSong("s2", "Two", "Beta")];
const profile = { uid: "u2", username: "jamie", displayName: "Jamie", avatarPath: null };

describe("ExploreScreen (S10, S11)", () => {
  it("skips without liking, then likes the next card", async () => {
    const services = createFakeServices({
      discovery: { recommend: jest.fn(async () => ({ level: "explore" as const, songs })) },
    });
    await renderWithServices(<ExploreScreen />, services);

    expect(await screen.findByText("One")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Skip" }));
    expect(await screen.findByText("Two")).toBeTruthy();
    expect(services.library.like).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("button", { name: "Like" }));
    await waitFor(() =>
      expect(services.library.like).toHaveBeenCalledWith("s2", "my_explore", undefined),
    );
    expect(await screen.findByText("That’s all for now")).toBeTruthy();
  });

  it("applies a discovery level", async () => {
    const services = createFakeServices();
    await renderWithServices(<ExploreScreen />, services);

    await fireEvent.press(await screen.findByRole("button", { name: "Level: Explore" }));
    await fireEvent.press(screen.getByRole("button", { name: "Surprise" }));
    await fireEvent.press(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(services.discovery.recommend).toHaveBeenCalledWith("surprise"));
  });

  it("sends a heart on a friend's song without liking it", async () => {
    const consoleError = jest.spyOn(console, "error");
    const services = createFakeServices({
      social: {
        listFriends: jest.fn(async () => [{ pairId: "p", profile }]),
        listDiscoveries: jest.fn(async () => [
          {
            song: songs[0]!,
            sharers: [{ ...profile, shareId: "sh1", sharedAt: "2026-11-01", heartSent: false }],
          },
        ]),
      },
    });
    await renderWithServices(<ExploreScreen />, services);
    await fireEvent.press(screen.getByRole("button", { name: "My Friends" }));

    await fireEvent.press(await screen.findByRole("button", { name: "Send heart to Jamie" }));
    await waitFor(() =>
      expect(services.social.sendHeart).toHaveBeenCalledWith("sh1", expect.any(String)),
    );
    expect(await screen.findByRole("button", { name: "Heart sent" })).toBeTruthy();
    expect(services.library.like).not.toHaveBeenCalled();
    // The card and the sharer line are siblings, so React reports it if their keys collide.
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("same key");
    consoleError.mockRestore();
  });
});
