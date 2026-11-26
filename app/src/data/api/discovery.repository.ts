import type { DiscoveryLevel, DiscoveryRepository, Recommendations } from "@/domain/discovery";
import type { ApiClient } from "./client";

export class ApiDiscoveryRepository implements DiscoveryRepository {
  constructor(private readonly api: ApiClient) {}

  async recommend(level?: DiscoveryLevel): Promise<Recommendations> {
    const query = level ? `&level=${level}` : "";
    const { level: applied, songs } = await this.api.get<Recommendations>(
      `/recommendations?limit=50${query}`,
    );
    return { level: applied, songs };
  }
}
