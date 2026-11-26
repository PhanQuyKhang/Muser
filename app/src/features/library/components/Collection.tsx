import { useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { LibraryEntry, SortOrder } from "@/domain/library";
import { strings } from "@/shared/strings";
import { colors, sizes, spacing } from "@/shared/theme";
import { EmptyState, Icon, SearchField, Sheet, SheetOption, Text } from "@/shared/ui";
import { filterEntries } from "../filter";
import { SongList, playFrom } from "./SongList";

const t = strings.library;
const SORTS: { id: SortOrder; label: string }[] = [
  { id: "newest", label: t.sortNewest },
  { id: "oldest", label: t.sortOldest },
];

interface CollectionProps {
  /** Small line above the name, for example "MADE BY YOU". */
  eyebrow: string;
  name: string;
  cover: ReactNode;
  entries: LibraryEntry[];
  queueId: string;
  /** Link beside the sort control ("+ Add songs", "Discover more"). */
  action: { label: string; onPress: () => void };
  emptyTitle: string;
  emptyMessage: string;
  playlistId?: string;
  confirmUnlike?: boolean;
}

/** Cover and summary, search, sort and songs: shared by Liked (S13) and a playlist (S14). */
export function Collection({
  eyebrow,
  name,
  cover,
  entries,
  queueId,
  action,
  emptyTitle,
  emptyMessage,
  playlistId,
  confirmUnlike = false,
}: CollectionProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [sorting, setSorting] = useState(false);
  const shown = useMemo(() => filterEntries(entries, query, sort), [entries, query, sort]);
  const first = shown.find((entry) => entry.song);

  const header = (
    <View style={styles.header}>
      <View style={styles.summary}>
        {cover}
        <View style={styles.text}>
          <Text variant="eyebrow" color="secondary">
            {eyebrow}
          </Text>
          <Text variant="detailTitle" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="optionHint" color="textSecondary">
            {t.songCount(entries.length)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.play}
            accessibilityState={{ disabled: !first }}
            disabled={!first}
            onPress={() => first && playFrom(queueId, shown, first.songId)}
            style={[styles.play, !first && styles.unavailable]}
          >
            <View style={styles.playCircle}>
              <Icon name="playCircle" size={sizes.iconSmall} color="onAccent" />
            </View>
            <Text variant="miniTitle" color="primary">
              {t.play}
            </Text>
          </Pressable>
        </View>
      </View>
      <SearchField value={query} onChangeText={setQuery} placeholder={t.searchPlaylist} />
      <View style={styles.tools}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.sortTitle}
          onPress={() => setSorting(true)}
          style={styles.tool}
        >
          <Icon name="sort" size={16} />
          <Text variant="microMedium" color="textSecondary">
            {SORTS.find((option) => option.id === sort)?.label}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={styles.tool}
        >
          <Text variant="microMedium" color="primary">
            {action.label}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <SongList
        items={shown}
        source="playlist"
        queueId={queueId}
        confirmUnlike={confirmUnlike}
        {...(playlistId ? { playlistId } : {})}
        header={header}
        empty={
          entries.length === 0 ? (
            <EmptyState title={emptyTitle} message={emptyMessage} />
          ) : (
            <EmptyState title={t.noMatches} />
          )
        }
      />
      {sorting ? (
        <Sheet title={t.sortTitle} onClose={() => setSorting(false)}>
          {SORTS.map((option) => (
            <SheetOption
              key={option.id}
              label={option.label}
              selected={option.id === sort}
              onPress={() => {
                setSort(option.id);
                setSorting(false);
              }}
            />
          ))}
        </Sheet>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.md, marginBottom: spacing.xs },
  summary: { flexDirection: "row", gap: spacing.xl - 4, marginBottom: spacing.sm },
  text: { flex: 1, gap: 2 },
  play: {
    minHeight: sizes.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.sm,
  },
  unavailable: { opacity: 0.4 },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  tools: { flexDirection: "row", justifyContent: "space-between" },
  tool: {
    minHeight: sizes.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
