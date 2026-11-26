import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DISCOVERY_LEVELS, type DiscoveryLevel } from "@/domain/discovery";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing, type ColorToken } from "@/shared/theme";
import { Button, Icon, Text } from "@/shared/ui";

const t = strings.explore;

/** Level accents (docs/MUSER_DESIGN.md "Familiar Bar"). */
const ACCENT: Record<DiscoveryLevel, ColorToken> = {
  familiar: "primary",
  explore: "secondary",
  surprise: "surprise",
};

interface DiscoveryLevelSheetProps {
  current: DiscoveryLevel;
  onApply: (level: DiscoveryLevel) => void;
  /** Closing without Apply keeps the current level. */
  onClose: () => void;
}

/** O01: choose how far from the usual My Explore should go. */
export function DiscoveryLevelSheet({ current, onApply, onClose }: DiscoveryLevelSheetProps) {
  const insets = useSafeAreaInsets();
  const [choice, setChoice] = useState(current);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.common.close}
          style={styles.backdrop}
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          style={[styles.panel, { paddingBottom: insets.bottom + spacing.xl }]}
        >
          <View style={styles.handle} />
          <View style={styles.heading}>
            <Text variant="sheetTitle" accessibilityRole="header" style={styles.title}>
              {t.sheetTitle}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={strings.common.close}
              hitSlop={spacing.sm}
              onPress={onClose}
              style={styles.close}
            >
              <Icon name="close" size={sizes.iconSmall} color="textPrimary" />
            </Pressable>
          </View>
          <Text variant="body" color="textSecondary">
            {t.sheetQuestion}
          </Text>
          {DISCOVERY_LEVELS.map((level) => {
            const selected = level === choice;
            return (
              <Pressable
                key={level}
                accessibilityRole="radio"
                accessibilityLabel={t.levels[level].name}
                accessibilityState={{ checked: selected }}
                onPress={() => setChoice(level)}
                style={[
                  styles.option,
                  selected && styles.selected,
                  selected && { borderColor: colors[ACCENT[level]] },
                ]}
              >
                <View
                  style={[styles.radio, selected && { backgroundColor: colors[ACCENT[level]] }]}
                >
                  {selected ? <View style={styles.dot} /> : null}
                </View>
                <View style={styles.optionText}>
                  <Text variant="optionTitle" color={ACCENT[level]}>
                    {t.levels[level].name}
                  </Text>
                  <Text variant="optionHint" color="textSecondary">
                    {t.levels[level].hint}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <Button label={t.apply} size="sm" onPress={() => onApply(choice)} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: colors.background, opacity: 0.75 },
  panel: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheetLarge,
    borderTopRightRadius: radii.sheetLarge,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.disabled },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: sizes.touchTarget,
  },
  title: { flex: 1 },
  close: {
    width: sizes.sheetClose,
    height: sizes.sheetClose,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: sizes.sheetClose / 2,
    backgroundColor: colors.surfaceElevated,
  },
  option: {
    height: sizes.levelOption,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.control,
    borderWidth: sizes.borderWidth,
    borderColor: "transparent",
  },
  selected: { backgroundColor: colors.surfaceElevated },
  radio: {
    width: sizes.radio,
    height: sizes.radio,
    borderRadius: sizes.radio / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.background },
  optionText: { flex: 1 },
});
