import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../src/components/ui/app-button';
import { Screen } from '../src/components/ui/screen';
import { useTheme } from '../src/providers/theme-provider';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Page not found</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
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
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
});
