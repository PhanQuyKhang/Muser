import { createContext, useContext, type ReactNode } from "react";

import type { AuthRepository } from "@/domain/auth";
import type { CatalogRepository } from "@/domain/catalog";
import type { DiscoveryRepository } from "@/domain/discovery";
import type { LibraryRepository } from "@/domain/library";
import type { MeRepository } from "@/domain/me";
import type { OnboardingRepository } from "@/domain/onboarding";
import type { SocialRepository } from "@/domain/social";

/** Every port the UI can reach. Real implementations are built in data/container.ts; tests pass fakes. */
export interface Services {
  auth: AuthRepository;
  me: MeRepository;
  catalog: CatalogRepository;
  onboarding: OnboardingRepository;
  library: LibraryRepository;
  social: SocialRepository;
  discovery: DiscoveryRepository;
}

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({
  services,
  children,
}: {
  services: Services;
  children: ReactNode;
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error("useServices must be used inside <ServicesProvider>.");
  return services;
}
