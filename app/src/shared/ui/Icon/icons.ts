/**
 * Stroke icon definitions. Paths for `eye` and `mail` are exported from the Figma file (MUSER);
 * `eyeOff` and `chevronLeft` follow the same stroke style (1.8 on a 24 grid).
 */
export interface IconDefinition {
  viewBox: string;
  strokeWidth: number;
  paths: readonly string[];
}

const eyePaths = [
  "M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z",
  "M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z",
] as const;

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
  chevronLeft: { viewBox: "0 0 24 24", strokeWidth: 1.8, paths: ["M15 5L8 12L15 19"] },
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof icons;
