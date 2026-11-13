import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize } from '@/constants';
import { TABS } from '@/navigation';

/** Bottom tab bar: Home, Create, History, Profile. */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? tab.activeIcon : tab.inactiveIcon}
                size={iconSize.lg}
                color={focused ? colors.primary : colors.textSecondary}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
