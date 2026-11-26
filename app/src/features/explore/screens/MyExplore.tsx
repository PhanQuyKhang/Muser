import { useQueryClient } from "@tanstack/react-query";

import type { DiscoveryLevel } from "@/domain/discovery";
import { strings } from "@/shared/strings";
import { ErrorState, ListSkeleton } from "@/shared/ui";
import { Deck } from "../components/Deck";
import { RECOMMENDATIONS_KEY, useRecommendations, useReleasePlayerWhen } from "../hooks";

/** S10: personal recommendations at the chosen discovery level. */
export function MyExplore({ level }: { level: DiscoveryLevel | undefined }) {
  const queryClient = useQueryClient();
  const query = useRecommendations(level);
  useReleasePlayerWhen(query.isError || !query.data);

  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  if (!query.data) return <ListSkeleton />;

  return (
    <Deck
      key={query.data.level}
      deckId={`mine:${query.data.level}`}
      cards={query.data.songs.map((song) => ({ song }))}
      source="my_explore"
      context={strings.explore.levelContext[query.data.level]}
      onRestart={() => void queryClient.resetQueries({ queryKey: RECOMMENDATIONS_KEY })}
    />
  );
}
