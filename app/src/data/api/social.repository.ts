import type {
  ActivityItem,
  Discovery,
  FoundUser,
  FriendEntry,
  FriendRequests,
  RequestAction,
  SocialRepository,
} from "@/domain/social";
import type { ApiClient } from "./client";

const id = encodeURIComponent;

export class ApiSocialRepository implements SocialRepository {
  constructor(private readonly api: ApiClient) {}

  async findUser(username: string): Promise<FoundUser | null> {
    const { user } = await this.api.get<{ user: FoundUser | null }>(
      `/users/search?username=${id(username)}`,
    );
    return user;
  }

  async listFriends(): Promise<FriendEntry[]> {
    const { items } = await this.api.get<{ items: FriendEntry[] }>("/friends");
    return items;
  }

  listRequests(): Promise<FriendRequests> {
    return this.api.get<FriendRequests>("/friend-requests");
  }

  async sendRequest(username: string): Promise<void> {
    await this.api.post("/friend-requests", { username });
  }

  async respond(pairId: string, action: RequestAction): Promise<void> {
    await this.api.post(`/friend-requests/${id(pairId)}/respond`, { action });
  }

  async removeFriend(pairId: string): Promise<void> {
    await this.api.delete(`/friendships/${id(pairId)}`);
  }

  async getSharing(): Promise<boolean> {
    const { enabled } = await this.api.get<{ enabled: boolean }>("/me/sharing");
    return enabled;
  }

  async setSharing(enabled: boolean): Promise<void> {
    await this.api.patch("/me/sharing", { enabled });
  }

  async listDiscoveries(): Promise<Discovery[]> {
    const { items } = await this.api.get<{ items: Discovery[] }>("/friends/discoveries?limit=50");
    return items;
  }

  async sendHeart(shareId: string, requestId: string): Promise<void> {
    await this.api.post(`/shares/${id(shareId)}/hearts`, { requestId });
  }

  async listActivity(): Promise<ActivityItem[]> {
    const { items } = await this.api.get<{ items: ActivityItem[] }>("/me/activity");
    return items;
  }
}
