import { useLocalSearchParams } from "expo-router";

import { BrowseScreen } from "@/features/search/screens/BrowseScreen";

export default function Browse() {
  const { tagId } = useLocalSearchParams<{ tagId: string }>();
  return <BrowseScreen tagId={tagId} />;
}
