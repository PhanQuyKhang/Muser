import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { colors, radii, sizes, spacing, typography } from "@/shared/theme";
import { Icon } from "../Icon";

export interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  /** Accessible name; defaults to the placeholder. */
  label?: string;
}

/** Search input with a leading magnifier and a clear action (Figma: Song search / Artist search). */
export function SearchField({ value, onChangeText, placeholder, label }: SearchFieldProps) {
  return (
    <View style={styles.field}>
      <Icon name="search" size={sizes.iconSmall} />
      <TextInput
        accessibilityLabel={label ?? placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.primary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={12}
          onPress={() => onChangeText("")}
        >
          <Icon name="close" size={sizes.iconSmall} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: 15,
    borderRadius: radii.control,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: { ...typography.body, flex: 1, color: colors.textPrimary, paddingVertical: 0 },
});
