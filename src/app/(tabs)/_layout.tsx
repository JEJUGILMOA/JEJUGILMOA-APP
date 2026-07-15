import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0BA360',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '홈', tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: '지도', tabBarIcon: () => <TabIcon emoji="🗺️" /> }}
      />
      <Tabs.Screen
        name="saved"
        options={{ title: '저장', tabBarIcon: () => <TabIcon emoji="🔖" /> }}
      />
      <Tabs.Screen
        name="my"
        options={{ title: '마이', tabBarIcon: () => <TabIcon emoji="👤" /> }}
      />
    </Tabs>
  );
}
