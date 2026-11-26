import { Redirect } from "expo-router";
import { BottomTabBar, Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSessionStore } from "@/application/session";
import { PlayerProvider } from "@/features/player/PlayerProvider";
import { MiniPlayer } from "@/features/player/components/MiniPlayer";
import { strings } from "@/shared/strings";
import { colors, sizes } from "@/shared/theme";
import { Icon, Text } from "@/shared/ui";
import type { IconName } from "@/shared/ui/Icon";

// Order from docs/MUSER_DESIGN.md §9.1; Explore is the landing tab.
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: "playlist", title: strings.tabs.playlist, icon: "navPlaylist" },
  { name: "search", title: strings.tabs.search, icon: "navSearch" },
  { name: "explore", title: strings.tabs.explore, icon: "navExplore" },
  { name: "friends", title: strings.tabs.friends, icon: "navFriends" },
  { name: "account", title: strings.tabs.account, icon: "navAccount" },
];

export const unstable_settings = { initialRouteName: "explore" };

/** The tab bar, with the mini player above it everywhere but Explore (which has the card). */
function TabBar(props: BottomTabBarProps) {
  const onExplore = props.state.routes[props.state.index]?.name === "explore";
  return (
    <View style={styles.bar}>
      {onExplore ? null : <MiniPlayer />}
      <BottomTabBar {...props} />
    </View>
  );
}

export default function TabsLayout() {
  const signedOut = useSessionStore((state) => state.status === "signedOut");
  const insets = useSafeAreaInsets();
  if (signedOut) return <Redirect href="/login" />;

  return (
    <PlayerProvider>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 0,
            height: sizes.bottomNavHeight + insets.bottom,
          },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        {TABS.map(({ name, title, icon }) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title,
              tabBarIcon: ({ focused }) => (
                <Icon name={icon} color={focused ? "primary" : "textSecondary"} />
              ),
              tabBarLabel: ({ focused }) => (
                <Text
                  variant={focused ? "navigationActive" : "navigation"}
                  color={focused ? "primary" : "textSecondary"}
                >
                  {title}
                </Text>
              ),
            }}
          />
        ))}
      </Tabs>
    </PlayerProvider>
  );
}

const styles = StyleSheet.create({ bar: { backgroundColor: colors.background } });
