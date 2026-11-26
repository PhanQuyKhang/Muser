import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useExploreFeed, type ExploreFeed } from "@/application/explore-feed";
import type { DiscoveryLevel } from "@/domain/discovery";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import { Icon, Text } from "@/shared/ui";
import { DiscoveryLevelSheet } from "../components/DiscoveryLevelSheet";
import { useRecommendations } from "../hooks";
import { MyExplore } from "./MyExplore";
import { MyFriends } from "./MyFriends";

const t = strings.explore;
const FEEDS: { id: ExploreFeed; label: string }[] = [
  { id: "mine", label: t.myExplore },
  { id: "friends", label: t.myFriends },
];

/** The Explore tab with its two feeds: My Explore (S10) and My Friends (S11). */
export function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const feed = useExploreFeed((state) => state.feed);
  const show = useExploreFeed((state) => state.setFeed);
  const [level, setLevel] = useState<DiscoveryLevel | undefined>(undefined);
  const [picking, setPicking] = useState(false);
  const recommendations = useRecommendations(level);
  const applied = level ?? recommendations.data?.level;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { marginTop: insets.top + spacing.sm }]}>
        <Text variant="titleLarge" accessibilityRole="header">
          {t.title}
        </Text>
        {feed === "friends" ? (
          <Text variant="captionMedium" color="secondary">
            {t.friendsLabel}
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={applied ? t.levelButton(t.levels[applied].name) : t.levelTitle}
            hitSlop={spacing.xs}
            onPress={() => setPicking(true)}
            style={styles.level}
          >
            <Icon name="fire" size={sizes.iconSmall} color="primary" />
            <Text variant="bodySmallStrong" color="primary">
              {applied ? t.levels[applied].name : t.levelTitle}
            </Text>
          </Pressable>
        )}
      </View>
      <View style={styles.tabs} accessibilityRole="tablist">
        {FEEDS.map(({ id, label }) => {
          const selected = feed === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              hitSlop={{ top: spacing.xs, bottom: spacing.xs }}
              onPress={() => show(id)}
              style={[styles.tab, selected && styles.tabSelected]}
            >
              <Text variant="label" color={selected ? "textPrimary" : "textSecondary"}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {feed === "mine" ? <MyExplore level={level} /> : <MyFriends />}
      {picking ? (
        <DiscoveryLevelSheet
          current={applied ?? "explore"}
          onApply={(choice) => {
            setLevel(choice);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: sizes.touchTarget,
    marginHorizontal: sizes.cardInset,
  },
  level: {
    minWidth: 112,
    height: sizes.levelPill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.xs,
    height: sizes.exploreTabs,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: sizes.cardInset,
    padding: spacing.xs,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: radii.segment },
  tabSelected: { backgroundColor: colors.surfaceElevated },
});
