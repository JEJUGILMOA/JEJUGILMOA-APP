import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { emitTabRepress } from '@/bridge/tabRepress';
import {
  CalendarDaysIcon,
  HomeIcon,
  MapIcon,
  NotebookPenIcon,
  UserIcon,
} from '@/components/TabBarIcons';
import { TabBarTokens } from '@/constants/tabs';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 0);

  return (
    <Tabs
      screenListeners={({ navigation, route }) => ({
        tabPress: () => {
          if (!navigation.isFocused()) return;
          emitTabRepress(route.name);
        },
      })}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TabBarTokens.active,
        tabBarInactiveTintColor: TabBarTokens.inactive,
        tabBarStyle: {
          backgroundColor: TabBarTokens.background,
          borderTopColor: TabBarTokens.border,
          borderTopWidth: 1,
          height: TabBarTokens.height + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarLabelStyle: {
          fontSize: TabBarTokens.labelSize,
          fontWeight: TabBarTokens.labelWeight,
          lineHeight: TabBarTokens.labelSize,
          marginTop: TabBarTokens.iconLabelGap,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: '지도',
          tabBarIcon: ({ color }) => <MapIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: '계획',
          tabBarIcon: ({ color }) => <CalendarDaysIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: '기록',
          tabBarIcon: ({ color }) => <NotebookPenIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: '마이',
          tabBarIcon: ({ color }) => <UserIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
