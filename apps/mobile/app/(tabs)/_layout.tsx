import { tokens } from '@apex/ui';
import { Tabs } from 'expo-router';

import { CalendarIcon, HomeIcon, LibraryIcon, MoreIcon, SparkIcon } from '@/components/icons';
import { useI18n } from '@/i18n/provider';

/** Bottom navigation, matching the five slots defined in CLAUDE.md. */
export default function TabsLayout() {
  const { dictionary } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.color.accent,
        tabBarInactiveTintColor: tokens.color.textMuted,
        tabBarStyle: {
          backgroundColor: tokens.color.surface,
          borderTopColor: tokens.color.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11 },
        sceneStyle: { backgroundColor: tokens.color.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: dictionary.tabs.home,
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: dictionary.tabs.create,
          tabBarIcon: ({ color, size }) => <SparkIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: dictionary.tabs.calendar,
          tabBarIcon: ({ color, size }) => <CalendarIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: dictionary.tabs.library,
          tabBarIcon: ({ color, size }) => <LibraryIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: dictionary.tabs.more,
          tabBarIcon: ({ color, size }) => <MoreIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
