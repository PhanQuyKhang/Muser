import { colors } from "./colors";
import { radii, sizes, spacing } from "./layout";
import { fontFamily, typography } from "./typography";

export { colors, fontFamily, radii, sizes, spacing, typography };
export type { ColorToken } from "./colors";
export type { TypographyVariant } from "./typography";

/** The app is dark-only, so a single static theme object is enough (no provider). */
export const theme = { colors, fontFamily, radii, sizes, spacing, typography } as const;
export type Theme = typeof theme;
