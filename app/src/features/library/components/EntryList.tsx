import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { LibraryEntry, SortOrder } from "@/domain/library";
import { strings } from "@/shared/strings";
import { sizes, spacing } from "@/shared/theme";
import { Chip, EmptyState, SearchField } from "@/shared/ui";
import { filterEntries } from "../filter";
import { SongList } from "./SongList";

const t = strings.library;

interface EntryListProps {
  entries: LibraryEntry[];
  emptyTitle: string;
  emptyMessage: string;
  playlistId?: string;
  confirmUnlike?: boolean;
}

/** Search-within-playlist, sort control and the song rows shared by S13 and S14. */
export function EntryList({
  entries,
  emptyTitle,
  emptyMessage,
  playlistId,
  confirmUnlike = false,
}: EntryListProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const shown = useMemo(() => filterEntries(entries, query, sort), [entries, query, sort]);

  return (
    <View style={styles.root}>
      <View style={styles.controls}>
        <SearchField value={query} onChangeText={setQuery} placeholder={t.searchPlaylist} />
        <View style={styles.sort}>
          <Chip
            label={t.sortNewest}
            selected={sort === "newest"}
            onPress={() => setSort("newest")}
          />
          <Chip
            label={t.sortOldest}
            selected={sort === "oldest"}
            onPress={() => setSort("oldest")}
          />
        </View>
      </View>
      <SongList
        items={shown}
        source="playlist"
        confirmUnlike={confirmUnlike}
        {...(playlistId ? { playlistId } : {})}
        empty={
          entries.length === 0 ? (
            <EmptyState title={emptyTitle} message={emptyMessage} />
          ) : (
            <EmptyState title={t.noMatches} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  controls: { paddingHorizontal: sizes.pagePadding, gap: spacing.md, marginBottom: spacing.md },
  sort: { flexDirection: "row", gap: spacing.sm },
});
