import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { createFakeServices, renderWithServices } from "@/test/fakes";
import { FindFriendsScreen } from "./FindFriendsScreen";
import { FriendRequestsScreen } from "./FriendRequestsScreen";
import { FriendsScreen } from "./FriendsScreen";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn() },
}));

const profile = { uid: "u2", username: "jamie", displayName: "Jamie", avatarPath: null };

describe("FindFriendsScreen (S18)", () => {
  it("finds an exact username and sends a request", async () => {
    const services = createFakeServices({
      social: {
        findUser: jest.fn(async () => ({ profile, relationship: "none" as const, pairId: "p" })),
      },
    });
    await renderWithServices(<FindFriendsScreen />, services);
    await fireEvent.changeText(screen.getByLabelText("Username"), " Jamie ");
    await fireEvent.press(screen.getByRole("button", { name: "Find user" }));

    await fireEvent.press(await screen.findByRole("button", { name: "Add friend" }));
    expect(services.social.findUser).toHaveBeenCalledWith("jamie");
    await waitFor(() => expect(services.social.sendRequest).toHaveBeenCalledWith("jamie"));
  });
});

describe("FriendsScreen (S17)", () => {
  it("removes a friend only after confirming", async () => {
    const services = createFakeServices({
      social: { listFriends: jest.fn(async () => [{ pairId: "p", profile }]) },
    });
    await renderWithServices(<FriendsScreen />, services);

    await fireEvent.press(await screen.findByRole("button", { name: "Options for Jamie" }));
    await fireEvent.press(screen.getByRole("button", { name: "Remove friend" }));
    expect(services.social.removeFriend).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Remove friend" }));
    await waitFor(() => expect(services.social.removeFriend).toHaveBeenCalledWith("p"));
  });
});

describe("FriendRequestsScreen (S19)", () => {
  it("accepts an incoming request", async () => {
    const services = createFakeServices({
      social: {
        listRequests: jest.fn(async () => ({
          incoming: [{ pairId: "p", profile }],
          outgoing: [],
        })),
      },
    });
    await renderWithServices(<FriendRequestsScreen />, services);
    await fireEvent.press(await screen.findByRole("button", { name: "Accept Jamie" }));
    await waitFor(() => expect(services.social.respond).toHaveBeenCalledWith("p", "accept"));
  });
});
