import { Link, Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { palette } from '../../src/theme/palette';

function HeaderHomeLink() {
  return (
    <Link href="/(app)/home" asChild>
      <Pressable style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
        <Text
          style={{
            color: palette.brandDeep,
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
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: palette.background },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: palette.background },
        headerTitleStyle: { color: palette.text, fontWeight: '700' },
      }}
    >
      <Stack.Screen name="home" options={{ title: 'Dashboard' }} />
      <Stack.Screen
        name="capture"
        options={{ headerRight: HeaderHomeLink, title: 'Capture image' }}
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
