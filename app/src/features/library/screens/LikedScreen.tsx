import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { useExploreFeed } from "@/application/explore-feed";
import { strings } from "@/shared/strings";
import { colors, sizes } from "@/shared/theme";
import { DetailHeader, ErrorState, Icon, ListSkeleton } from "@/shared/ui";
import { Collection } from "../components/Collection";
import { LikedCover } from "../components/Covers";
import { useLikes } from "../hooks";

const t = strings.library;

/** S13: Liked. Cannot be renamed or deleted; unliking asks first (O08). */
export function LikedScreen() {
  const likes = useLikes();

  return (
    <View style={styles.root}>
      <DetailHeader
        title={t.likedHeader}
        eyebrow
        onBack={() => router.back()}
        right={<Icon name="likedBadge" size={sizes.iconSmall} color="secondary" />}
      />
      {likes.isError ? (
        <ErrorState onRetry={() => void likes.refetch()} />
      ) : !likes.data ? (
        <ListSkeleton />
      ) : (
        <Collection
          eyebrow={t.likedFrom}
          name={t.liked}
          cover={<LikedCover size={sizes.detailCover} />}
          entries={likes.data}
          queueId="list:liked"
          action={{
            label: t.discoverMore,
            onPress: () => {
              useExploreFeed.getState().setFeed("mine");
              router.navigate("/explore");
            },
          }}
          emptyTitle={t.likedEmpty}
          emptyMessage={t.likedHint}
          confirmUnlike
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background } });
