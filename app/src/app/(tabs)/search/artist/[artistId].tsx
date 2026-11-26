import { useLocalSearchParams } from "expo-router";

import { ArtistScreen } from "@/features/search/screens/ArtistScreen";

export default function Artist() {
  const { artistId } = useLocalSearchParams<{ artistId: string }>();
  return <ArtistScreen artistId={artistId} />;
}
