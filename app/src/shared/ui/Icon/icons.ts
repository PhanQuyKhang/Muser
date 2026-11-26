/**
 * Stroke icon definitions. Paths for `eye` and `mail` are exported from the Figma file (MUSER);
 * `eyeOff` and `chevronLeft` follow the same stroke style (1.8 on a 24 grid).
 */
export interface IconDefinition {
  viewBox: string;
  strokeWidth: number;
  paths: readonly string[];
  /** Fill the shape as well as stroking it. */
  filled?: boolean;
}

const eyePaths = [
  "M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z",
  "M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z",
] as const;

const heartPath =
  "M12 20C12 20 3.5 15 3.5 9C3.5 6.5 5.5 4.5 8 4.5C9.7 4.5 11.2 5.4 12 6.8C12.8 5.4 14.3 4.5 16 4.5C18.5 4.5 20.5 6.5 20.5 9C20.5 15 12 20 12 20Z";

export const icons = {
  eye: { viewBox: "0 0 24 24", strokeWidth: 1.8, paths: eyePaths },
  eyeOff: { viewBox: "0 0 24 24", strokeWidth: 1.8, paths: [...eyePaths, "M4 4L20 20"] },
  mail: {
    viewBox: "0 0 38 38",
    strokeWidth: 2.53333,
    paths: [
      "M9.5 7.91666H28.5C31.1234 7.91666 33.25 10.0433 33.25 12.6667V25.3333C33.25 27.9567 31.1234 30.0833 28.5 30.0833H9.5C6.87665 30.0833 4.75 27.9567 4.75 25.3333V12.6667C4.75 10.0433 6.87665 7.91666 9.5 7.91666Z",
      "M6.33325 11.0833L18.9999 20.5833L31.6666 11.0833",
    ],
  },
  search: {
    viewBox: "0 0 24 24",
    strokeWidth: 1.8,
    paths: [
      "M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z",
      "M21 21L16.65 16.65",
    ],
  },
  check: { viewBox: "0 0 24 24", strokeWidth: 2.4, paths: ["M5 12.5L9.5 17L19 7.5"] },
  close: { viewBox: "0 0 24 24", strokeWidth: 1.8, paths: ["M6 6L18 18", "M18 6L6 18"] },
  circle: {
    viewBox: "0 0 24 24",
    strokeWidth: 1.8,
    paths: [
      "M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z",
    ],
  },
  chevronLeft: { viewBox: "0 0 24 24", strokeWidth: 1.8, paths: ["M15 5L8 12L15 19"] },
  heart: { viewBox: "0 0 24 24", strokeWidth: 1.8, paths: [heartPath] },
  heartFilled: { viewBox: "0 0 24 24", strokeWidth: 1.8, filled: true, paths: [heartPath] },
  more: {
    viewBox: "0 0 24 24",
    strokeWidth: 3,
    paths: ["M5 12H5.01", "M12 12H12.01", "M19 12H19.01"],
  },
  playlist: {
    viewBox: "0 0 24 24",
    strokeWidth: 1.8,
    paths: [
      "M4 6H15",
      "M4 11H15",
      "M4 16H10",
      "M19 8V17",
      "M19 17C19 19 14 19.5 14 17C14 15 19 14.5 19 17",
    ],
  },
  compass: {
    viewBox: "0 0 24 24",
    strokeWidth: 1.8,
    paths: [
      "M5 20V11C5 7.134 8.13401 4 12 4C15.866 4 19 7.134 19 11V20L16.5 18L14 20L12 18L10 20L7.5 18L5 20Z",
      "M9.5 11H9.51",
      "M14.5 11H14.51",
    ],
  },
  people: {
    viewBox: "0 0 24 24",
    strokeWidth: 1.8,
    paths: [
      "M9 11C10.6569 11 12 9.65685 12 8C12 6.34315 10.6569 5 9 5C7.34315 5 6 6.34315 6 8C6 9.65685 7.34315 11 9 11Z",
      "M3.5 19C3.5 16 6 14 9 14C12 14 14.5 16 14.5 19",
      "M16 5.5C17.5 5.8 18.5 7 18.5 8.5C18.5 10 17.5 11.2 16 11.5",
      "M17.5 14.5C19.5 15.2 20.5 16.8 20.5 19",
    ],
  },
  user: {
    viewBox: "0 0 24 24",
    strokeWidth: 1.8,
    paths: [
      "M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z",
      "M5 20C5 17 8 15 12 15C16 15 19 17 19 20",
    ],
  },
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof icons;
