import { Switch as RNSwitch } from "react-native";

import { colors } from "@/shared/theme";

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Accessible name; the visible label usually sits next to the switch. */
  label: string;
  disabled?: boolean;
}

export function Switch({ value, onValueChange, label, disabled = false }: SwitchProps) {
  return (
    <RNSwitch
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      value={value}
      disabled={disabled}
      onValueChange={onValueChange}
      thumbColor={colors.textPrimary}
      trackColor={{ false: colors.border, true: colors.primary }}
      ios_backgroundColor={colors.border}
    />
  );
}
