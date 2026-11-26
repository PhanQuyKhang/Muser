import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { colors } from "@/shared/theme";
import { ErrorState, Header, ListSkeleton } from "@/shared/ui";
import { EntryList } from "../components/EntryList";
import { useLikes } from "../hooks";

const t = strings.library;

/** S13: Liked. Cannot be renamed or deleted; unliking asks first (O08). */
export function LikedScreen() {
  const likes = useLikes();

  return (
    <View style={styles.root}>
      <Header
        title={t.liked}
        {...(likes.data ? { subtitle: t.songCount(likes.data.length) } : {})}
        onBack={() => router.back()}
      />
      {likes.isError ? (
        <ErrorState onRetry={() => void likes.refetch()} />
      ) : !likes.data ? (
        <ListSkeleton />
      ) : (
        <EntryList
          entries={likes.data}
          emptyTitle={t.likedEmpty}
          emptyMessage={t.likedHint}
          confirmUnlike
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background } });
