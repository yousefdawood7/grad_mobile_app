import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../src/components/ui/app-button';
import { Screen } from '../src/components/ui/screen';
import { palette } from '../src/theme/palette';

export default function NotFoundScreen() {
  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.body}>
          This route does not exist in the current build.
        </Text>
        <Link href="/(app)/home" asChild>
          <AppButton label="Back to home" />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 24,
  },
  title: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
