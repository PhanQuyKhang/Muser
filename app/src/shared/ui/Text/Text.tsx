import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { colors, typography, type ColorToken, type TypographyVariant } from "@/shared/theme";

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
}

/** The only text primitive: every string in the app goes through a typography token. */
export function Text({ variant = "body", color = "textPrimary", style, ...rest }: TextProps) {
  return <RNText {...rest} style={[typography[variant], { color: colors[color] }, style]} />;
}
