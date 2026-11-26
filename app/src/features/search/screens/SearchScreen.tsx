import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useRecentSearches } from "@/application/recent-searches";
import { SongList, type SongListItem } from "@/features/library/components/SongList";
import { strings } from "@/shared/strings";
import { colors, radii, sizes, spacing } from "@/shared/theme";
import {
  EmptyState,
  ErrorState,
  Icon,
  ListSkeleton,
  SearchField,
  TabHeader,
  Text,
} from "@/shared/ui";
import { ArtistCard } from "../components/ArtistCard";
import { BrowseGrid } from "../components/BrowseGrid";
import { CATEGORIES } from "../categories";
import { useSongSearch, type ArtistSummary } from "../hooks";

const t = strings.search;
type Filter = "all" | "songs" | "artists";
const FILTERS: Filter[] = ["all", "songs", "artists"];
/** Songs shown before "See all". */
const PREVIEW = 3;

/** S15: browse the catalog, or search it by title or artist. */
export function SearchScreen() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const search = useSongSearch(query);
  const remember = useRecentSearches((state) => state.add);

  const openArtist = (artist: ArtistSummary) => {
    remember(query);
    router.push({ pathname: "/search/artist/[artistId]", params: { artistId: artist.id } });
  };
  const items: SongListItem[] = search.results.map((song) => ({ songId: song.id, song }));
  const nothing = items.length === 0 && search.artists.length === 0;
  const topArtist = search.artists[0];

  const filters = (
    <View style={styles.filters}>
      {FILTERS.map((option) => {
        const selected = option === filter;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityLabel={t.filters[option]}
            accessibilityState={{ selected }}
            hitSlop={{ top: spacing.sm, bottom: spacing.sm }}
            onPress={() => setFilter(option)}
            style={[styles.filter, selected && styles.filterSelected]}
          >
            <Text variant="bodySmallStrong" color={selected ? "onAccent" : "textSecondary"}>
              {t.filters[option]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  let body: ReactNode;
  if (search.error) {
    body = <ErrorState onRetry={search.refetch} />;
  } else if (!search.typed) {
    body = <Home onPick={setQuery} />;
  } else if (search.loading) {
    body = <ListSkeleton />;
  } else if (nothing) {
    body = <EmptyState title={t.noResults} />;
  } else if (filter === "artists") {
    body = (
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {filters}
        {search.artists.length === 0 ? <EmptyState title={t.noResults} /> : null}
        {search.artists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} onPress={() => openArtist(artist)} />
        ))}
      </ScrollView>
    );
  } else {
    const all = filter === "all";
    body = (
      <SongList
        items={all ? items.slice(0, PREVIEW) : items}
        source="search"
        queueId="list:search"
        onPlay={() => remember(query)}
        header={
          <View style={styles.header}>
            {filters}
            {all && topArtist ? (
              <>
                <Text variant="eyebrow" color="textSecondary">
                  {t.topResult}
                </Text>
                <ArtistCard artist={topArtist} onPress={() => openArtist(topArtist)} />
              </>
            ) : null}
            {all && items.length > 0 ? (
              <View style={styles.heading}>
                <Text variant="sectionTitle">{t.songs}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.seeAll}
                  onPress={() => setFilter("songs")}
                  style={styles.link}
                >
                  <Text variant="optionHint" color="primary">
                    {t.seeAll}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        {...(all
          ? {
              footer: (
                <View style={styles.footer}>
                  <Text variant="sectionTitle">{t.otherDirection}</Text>
                  <BrowseGrid categories={[CATEGORIES[0]!, CATEGORIES[2]!]} />
                </View>
              ),
            }
          : {})}
      />
    );
  }

  return (
    <View style={styles.root}>
      <TabHeader
        title={t.title}
        {...(search.typed ? {} : { subtitle: t.subtitle })}
        right={
          <Text variant="eyebrow" color="textSecondary">
            {t.eyebrow}
          </Text>
        }
      />
      <View style={styles.field}>
        <SearchField
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (!text) setFilter("all");
          }}
          onSubmit={() => remember(query)}
          placeholder={t.placeholder}
        />
      </View>
      {body}
    </View>
  );
}

/** Before typing: recent searches and the browse grid. */
function Home({ onPick }: { onPick: (query: string) => void }) {
  const recent = useRecentSearches((state) => state.items);
  const clear = useRecentSearches((state) => state.clear);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {recent.length > 0 ? (
        <>
          <View style={styles.heading}>
            <Text variant="subheading">{t.recent}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.clear}
              onPress={clear}
              style={styles.link}
            >
              <Text variant="optionHint" color="textSecondary">
                {t.clear}
              </Text>
            </Pressable>
          </View>
          <View style={styles.recent}>
            {recent.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={item}
                onPress={() => onPick(item)}
                style={styles.chip}
              >
                <Icon name="recent" size={16} />
                <Text variant="optionHint" numberOfLines={1} style={styles.chipText}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
      <Text variant="tileTitle" style={styles.browse}>
        {t.browse}
      </Text>
      <BrowseGrid categories={CATEGORIES} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  field: { paddingHorizontal: sizes.pagePadding, marginBottom: spacing.lg },
  content: { paddingHorizontal: sizes.pagePadding, paddingBottom: spacing.xl, gap: spacing.md },
  header: { gap: spacing.md },
  filters: { flexDirection: "row", gap: spacing.sm, justifyContent: "center" },
  filter: {
    minWidth: 90,
    height: sizes.filterPill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  filterSelected: { backgroundColor: colors.primary },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: {
    minWidth: sizes.touchTarget,
    minHeight: sizes.touchTarget,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  recent: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: sizes.headerButton,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  chipText: { flexShrink: 1 },
  browse: { marginTop: spacing.lg },
  footer: { gap: spacing.md, marginTop: spacing.lg },
});
