/** Color tokens. Values come from the Figma file (MUSER) and docs/MUSER_DESIGN.md §3. */
export const colors = {
  background: "#101014",
  surface: "#1B1B23",
  surfaceElevated: "#272732",
  primary: "#B9A3FF",
  secondary: "#79DFC3",
  textPrimary: "#F4F2FA",
  textSecondary: "#ABA7BA",
  border: "#353440",
  disabled: "#656171",
  error: "#FF8A94",
  surprise: "#F2A7D5",
  /** Text and icons on lavender, mint or pink fills. */
  onAccent: "#101014",
} as const;

export type ColorToken = keyof typeof colors;
