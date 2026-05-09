import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Screen } from '../../src/components/ui/screen';
import { useClassification } from '../../src/providers/classification-provider';
import { useSession } from '../../src/providers/session-provider';
import { palette } from '../../src/theme/palette';

export default function HomeScreen() {
  const { authState, signOut, userLabel } = useSession();
  const { history, historyStorageMode } = useClassification();

  const positiveCount = history.filter((item) => item.isPositive).length;
  const averageConfidence =
    history.length > 0
      ? Math.round(
          history.reduce((sum, item) => sum + item.confidence, 0) / history.length,
        )
      : 0;

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>WH</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Field Dashboard</Text>
            <Text style={styles.heroSubtitle}>{userLabel}</Text>
          </View>
        </View>
        <Text style={styles.heroBody}>
          Capture new observations, review previous scans, and keep your water
          hyacinth records organized in one place.
        </Text>
        <Text style={styles.heroMeta}>
          {authState === 'authenticated'
            ? `History sync: ${historyStorageMode === 'supabase' ? 'Supabase connected' : 'Using device backup'}`
            : 'Guest mode: history is stored on this device'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{history.length}</Text>
          <Text style={styles.statLabel}>Total scans</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{positiveCount}</Text>
          <Text style={styles.statLabel}>Likely detections</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{averageConfidence}%</Text>
          <Text style={styles.statLabel}>Avg. confidence</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Text style={styles.sectionTitle}>Start a scan</Text>
        <Link href="/(app)/capture" asChild>
          <AppButton label="Capture image" />
        </Link>
        <Link href="/(app)/upload" asChild>
          <AppButton label="Upload image" tone="secondary" />
        </Link>
        <Link href="/(app)/history" asChild>
          <AppButton label="Open history" tone="surface" />
        </Link>
      </View>

      <View style={styles.secondaryActions}>
        <Link href="/(app)/learn" asChild>
          <AppButton label="About water hyacinth" tone="ghost" />
        </Link>
        <Link href="/(app)/profile" asChild>
          <AppButton label="Account and sync" tone="ghost" />
        </Link>
      </View>

      <AppButton label="Log out" onPress={signOut} tone="danger" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: palette.brand,
    borderCurve: 'continuous',
    borderRadius: 32,
    gap: 14,
    padding: 22,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  heroBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderCurve: 'continuous',
    borderRadius: 20,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  heroBadgeText: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '800',
  },
  heroText: {
    gap: 2,
  },
  heroTitle: {
    color: palette.white,
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: palette.whiteMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  heroBody: {
    color: palette.white,
    fontSize: 15,
    lineHeight: 22,
  },
  heroMeta: {
    color: palette.whiteMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 16,
  },
  statValue: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  actions: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryActions: {
    gap: 8,
  },
});
