/** Spacing scale (docs/MUSER_DESIGN.md §7). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Corner radii measured from Figma. */
export const radii = {
  /** Inputs, buttons, mini player. */
  control: 14,
  /** Playlist rows and covers. */
  row: 16,
  /** Cards (discovery card, Liked card). */
  card: 22,
  /** Bottom sheets (top corners). */
  sheet: 24,
  /** Fully rounded chips, pills and circular buttons. */
  pill: 999,
} as const;

/** Fixed sizes shared across components. */
export const sizes = {
  /** Horizontal page padding on most screens. */
  pagePadding: 24,
  inputHeight: 52,
  buttonHeight: 50,
  actionButtonHeight: 48,
  /** Minimum interactive area (accessibility). */
  touchTarget: 48,
  bottomNavHeight: 64,
  miniPlayerHeight: 64,
  iconDefault: 24,
  iconSmall: 20,
  borderWidth: 1,
} as const;
