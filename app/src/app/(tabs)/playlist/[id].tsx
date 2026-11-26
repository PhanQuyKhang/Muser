import { useLocalSearchParams } from "expo-router";

import { PlaylistDetailScreen } from "@/features/library/screens/PlaylistDetailScreen";

export default function Playlist() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlaylistDetailScreen playlistId={id} />;
}
