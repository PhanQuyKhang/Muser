import { StyleSheet, View } from "react-native";

import { sizes, spacing } from "@/shared/theme";
import { Skeleton } from "../Skeleton";

/** Loading placeholder for a list of rows. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }, (_, row) => (
        <Skeleton key={row} height={58} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: sizes.pagePadding, gap: spacing.sm },
});
