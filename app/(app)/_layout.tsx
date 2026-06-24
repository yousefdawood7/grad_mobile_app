import { Link, Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { useTheme } from '../../src/providers/theme-provider';

function HeaderHomeLink() {
  const { colors } = useTheme();
  return (
    <Link href="/(app)/home" asChild>
      <Pressable style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
        <Text
          style={{
            color: colors.brandDeep,
            fontSize: 14,
            fontWeight: '700',
          }}
        >
          Home
        </Text>
      </Pressable>
    </Link>
  );
}

export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
      }}
    >
      <Stack.Screen name="home" options={{ title: 'Dashboard' }} />
      <Stack.Screen
        name="capture"
        options={{ headerRight: HeaderHomeLink, title: 'Take photo' }}
      />
      <Stack.Screen
        name="live-detect"
        options={{ headerRight: HeaderHomeLink, title: 'Live detection' }}
      />
      <Stack.Screen
        name="upload"
        options={{ headerRight: HeaderHomeLink, title: 'Upload image' }}
      />
      <Stack.Screen name="analyzing" options={{ headerShown: false }} />
      <Stack.Screen
        name="result/[recordId]"
        options={{ headerRight: HeaderHomeLink, title: 'Analysis result' }}
      />
      <Stack.Screen
        name="history"
        options={{ headerRight: HeaderHomeLink, title: 'History' }}
      />
      <Stack.Screen
        name="learn"
        options={{ headerRight: HeaderHomeLink, title: 'About the plant' }}
      />
      <Stack.Screen
        name="profile"
        options={{ headerRight: HeaderHomeLink, title: 'Account and sync' }}
      />
    </Stack>
  );
}
