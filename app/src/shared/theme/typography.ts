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
  micro: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 15 },
  microMedium: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 15 },
  caption: { fontFamily: fontFamily.regular, fontSize: 10, lineHeight: 14 },
  captionMedium: { fontFamily: fontFamily.medium, fontSize: 10, lineHeight: 14 },
  eyebrow: { fontFamily: fontFamily.semibold, fontSize: 9, lineHeight: 13, letterSpacing: 0.8 },
} as const satisfies Record<string, TypeStyle>;

export type TypographyVariant = keyof typeof typography;
