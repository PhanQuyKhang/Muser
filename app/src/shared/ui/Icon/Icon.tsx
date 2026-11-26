import Svg, { Path } from "react-native-svg";

import { colors, sizes, type ColorToken } from "@/shared/theme";
import { icons, type IconDefinition, type IconName } from "./icons";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorToken;
}

/** Decorative by default: put the accessible name on the pressable that wraps the icon. */
export function Icon({ name, size = sizes.iconDefault, color = "textSecondary" }: IconProps) {
  const definition: IconDefinition = icons[name];
  const { viewBox, strokeWidth, paths, filled = false } = definition;
  return (
    <Svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {paths.map((d) => (
        <Path
          key={d}
          d={d}
          fill={filled ? colors[color] : "none"}
          stroke={colors[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
