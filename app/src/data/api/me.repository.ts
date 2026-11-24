import type { Me, MeRepository } from "@/domain/me";
import type { ApiClient } from "./client";

interface MeResponseDto {
  uid: string;
  email: string | null;
  hasProfile: boolean;
  onboardingCompleted: boolean;
}

export class ApiMeRepository implements MeRepository {
  constructor(private readonly api: ApiClient) {}

  async getMe(): Promise<Me> {
    const dto = await this.api.get<MeResponseDto>("/me");
    return {
      uid: dto.uid,
      email: dto.email,
      hasProfile: dto.hasProfile,
      onboardingCompleted: dto.onboardingCompleted,
    };
  }
}
