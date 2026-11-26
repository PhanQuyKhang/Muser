import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { colors, sizes, spacing } from "@/shared/theme";
import { Chip, Header } from "@/shared/ui";
import { MyExplore } from "./MyExplore";
import { MyFriends } from "./MyFriends";

const t = strings.explore;

/** The Explore tab with its two feeds: My Explore (S10) and My Friends (S11). */
export function ExploreScreen() {
  const [feed, setFeed] = useState<"mine" | "friends">("mine");

  return (
    <View style={styles.root}>
      <Header title={t.title} />
      <View style={styles.tabs}>
        <Chip label={t.myExplore} selected={feed === "mine"} onPress={() => setFeed("mine")} />
        <Chip
          label={t.myFriends}
          selected={feed === "friends"}
          onPress={() => setFeed("friends")}
        />
      </View>
      {feed === "mine" ? <MyExplore /> : <MyFriends />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: sizes.pagePadding,
    marginBottom: spacing.md,
  },
});
