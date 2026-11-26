import { Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";

import { useSessionStore } from "@/application/session";
import { strings } from "@/shared/strings";
import { colors, typography } from "@/shared/theme";
import { Icon } from "@/shared/ui";
import type { IconName } from "@/shared/ui/Icon";

// Order from docs/MUSER_DESIGN.md §9.1; Explore is the landing tab.
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: "playlist", title: strings.tabs.playlist, icon: "playlist" },
  { name: "search", title: strings.tabs.search, icon: "search" },
  { name: "explore", title: strings.tabs.explore, icon: "compass" },
  { name: "friends", title: strings.tabs.friends, icon: "people" },
  { name: "account", title: strings.tabs.account, icon: "user" },
];

export const unstable_settings = { initialRouteName: "explore" };

export default function TabsLayout() {
  const signedOut = useSessionStore((state) => state.status === "signedOut");
  if (signedOut) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: typography.navigation,
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
          }}
        />
      ))}
    </Tabs>
  );
}
