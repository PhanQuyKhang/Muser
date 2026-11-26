import { strings } from "@/shared/strings";
import type { ColorToken } from "@/shared/theme";

export interface Category {
  tagId: string;
  name: string;
  color: ColorToken;
}

/** The four tiles of the Figma browse grid; the tag ids come from the seeded catalog. */
export const CATEGORIES: readonly Category[] = [
  { tagId: "genre_pop", name: "Pop", color: "primary" },
  { tagId: "genre_alternative", name: "Alternative", color: "secondary" },
  { tagId: "genre_rnb", name: "R&B", color: "secondary" },
  { tagId: "mood_chill", name: "Chill", color: "primary" },
];

export const categoryName = (tagId: string) =>
  CATEGORIES.find((category) => category.tagId === tagId)?.name ?? strings.search.title;
