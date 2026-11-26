import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { SongList } from "@/features/library/components/SongList";
import { strings } from "@/shared/strings";
import { colors, sizes, spacing } from "@/shared/theme";
import { EmptyState, ErrorState, Header, ListSkeleton, SearchField } from "@/shared/ui";
import { useSongSearch } from "../hooks";

const t = strings.search;

/** S15: search the whole catalog by title or artist; like a result or add it to a playlist. */
export function SearchScreen() {
  const [query, setQuery] = useState("");
  const search = useSongSearch(query);

  return (
    <View style={styles.root}>
      <Header title={t.title} />
      <View style={styles.field}>
        <SearchField value={query} onChangeText={setQuery} placeholder={t.placeholder} />
      </View>
      {search.error ? (
        <ErrorState onRetry={search.refetch} />
      ) : !search.typed ? (
        <EmptyState title={t.idleTitle} message={t.idleMessage} />
      ) : search.loading ? (
        <ListSkeleton />
      ) : (
        <SongList
          items={search.results.map((song) => ({ songId: song.id, song }))}
          source="search"
          empty={<EmptyState title={t.noResults} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  field: { paddingHorizontal: sizes.pagePadding, marginBottom: spacing.md },
});
