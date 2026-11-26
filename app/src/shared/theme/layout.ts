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
  /** Footer call-to-action buttons (large Continue). */
  cta: 16,
  /** Swipe verdict badge. */
  badge: 12,
  /** Selected segment inside a segmented control. */
  segment: 11,
  /** The discovery level sheet. */
  sheetLarge: 28,
  /** Fully rounded chips, pills and circular buttons. */
  pill: 999,
} as const;

/** Fixed sizes shared across components. */
export const sizes = {
  /** Horizontal page padding on most screens. */
  pagePadding: 24,
  inputHeight: 52,
  buttonHeight: 50,
  ctaHeight: 52,
  actionButtonHeight: 48,
  /** Minimum interactive area (accessibility). */
  touchTarget: 48,
  bottomNavHeight: 64,
  miniPlayerHeight: 64,
  iconDefault: 24,
  iconSmall: 20,
  borderWidth: 1,
  /** Explore card and mini player side margin. */
  cardInset: 20,
  seekTouchHeight: 24,
  seekTrack: 3,
  seekThumb: 8,
  timeRow: 20,
  controlsWidth: 274,
  iconSeek: 19,
  iconMiniToggle: 22,
  miniArtwork: 40,
  exploreTabs: 46,
  levelPill: 40,
  genreBadge: 26,
  attribution: 38,
  verdictWidth: 124,
  radio: 20,
  levelOption: 66,
  sheetClose: 36,
  savedToast: 36,
  cardInfo: 106,
  headerButton: 44,
  likedCover: 108,
  detailCover: 104,
  rowCover: 72,
  trackCover: 46,
  playlistRow: 80,
  trackRow: 56,
  personAvatar: 44,
  profileAvatar: 80,
  searchField: 48,
  browseTile: 124,
  browseArt: 82,
  filterPill: 38,
  sheetOption: 52,
} as const;
