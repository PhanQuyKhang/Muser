import type { TextStyle } from "react-native";

/** Keys match the exports of @expo-google-fonts/onest (see shared/ui/fonts). */
export const fontFamily = {
  regular: "Onest_400Regular",
  medium: "Onest_500Medium",
  semibold: "Onest_600SemiBold",
  bold: "Onest_700Bold",
} as const;

type TypeStyle = Pick<TextStyle, "fontFamily" | "fontSize" | "lineHeight" | "letterSpacing">;

/** Type scale measured from the Figma frames (size / line height, Onest). */
export const typography = {
  hero: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 45 },
  display: { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 42 },
  titleLarge: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 39 },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 25 },
  songTitle: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  bodySmall: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  bodySmallStrong: { fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  fieldLabel: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 17 },
  navigation: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  navigationActive: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16 },
  micro: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 15 },
  microMedium: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 15 },
  caption: { fontFamily: fontFamily.regular, fontSize: 10, lineHeight: 14 },
  captionMedium: { fontFamily: fontFamily.medium, fontSize: 10, lineHeight: 14 },
  eyebrow: { fontFamily: fontFamily.semibold, fontSize: 9, lineHeight: 13, letterSpacing: 0.8 },
  /** Discovery card title. */
  cardTitle: { fontFamily: fontFamily.semibold, fontSize: 23, lineHeight: 32 },
  /** The card's overflow dots. */
  cardMore: { fontFamily: fontFamily.medium, fontSize: 18, lineHeight: 25 },
  sheetTitle: { fontFamily: fontFamily.semibold, fontSize: 22, lineHeight: 31 },
  optionTitle: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 21 },
  optionHint: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 17 },
  /** Swipe verdict badge. */
  verdict: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28 },
  miniTitle: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 17 },
  /** The 10 under the seek buttons. */
  tick: { fontFamily: fontFamily.medium, fontSize: 9, lineHeight: 13 },
  badge: { fontFamily: fontFamily.semibold, fontSize: 8, lineHeight: 11 },
  /** Letter on the placeholder artwork. */
  artLetter: { fontFamily: fontFamily.bold, fontSize: 96, lineHeight: 120 },
  /** The Liked card and large page headlines. */
  headline: { fontFamily: fontFamily.bold, fontSize: 25, lineHeight: 35 },
  /** Playlist and artist names on detail screens. */
  detailTitle: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 34 },
  /** Titles in a bottom sheet and on browse tiles. */
  tileTitle: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 28 },
  subheading: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 22 },
  chevron: { fontFamily: fontFamily.regular, fontSize: 24, lineHeight: 34 },
} as const satisfies Record<string, TypeStyle>;

export type TypographyVariant = keyof typeof typography;
