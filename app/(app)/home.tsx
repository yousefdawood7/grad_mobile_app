import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Screen } from '../../src/components/ui/screen';
import { UserAvatar } from '../../src/components/ui/user-avatar';
import { useClassification } from '../../src/providers/classification-provider';
import { useSession } from '../../src/providers/session-provider';
import { useTheme } from '../../src/providers/theme-provider';

export default function HomeScreen() {
  const { signOut, user, userLabel } = useSession();
  const { history } = useClassification();
  const { colors } = useTheme();

  const positiveCount = history.filter((item) => item.isPositive).length;
  const averageConfidence =
    history.length > 0
      ? Math.round(
          history.reduce((sum, item) => sum + item.confidence, 0) / history.length,
        )
      : 0;

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={[styles.hero, { backgroundColor: colors.brand }]}>
        <View style={styles.heroTop}>
          <UserAvatar
            avatarUrl={user.avatarUrl}
            fullName={user.fullName ?? userLabel}
            size={56}
          />
          <View style={styles.heroText}>
            <Text style={[styles.heroTitle, { color: colors.white }]}>Field Dashboard</Text>
            <Text style={[styles.heroSubtitle, { color: colors.whiteMuted }]}>{userLabel}</Text>
          </View>
        </View>
        <Text style={[styles.heroBody, { color: colors.white }]}>
          Capture new observations, review previous scans, and keep your water
          hyacinth records organized in one place.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{history.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total scans</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{positiveCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Likely detections</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{averageConfidence}%</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Avg. confidence</Text>
        </View>
      </View>

      <View style={[styles.actions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Start a scan</Text>
        <Link href="/(app)/live-detect" asChild>
          <AppButton label="Live detection" />
        </Link>
        <Link href="/(app)/capture" asChild>
          <AppButton label="Take photo" tone="secondary" />
        </Link>
        <Link href="/(app)/upload" asChild>
          <AppButton label="Upload image" tone="surface" />
        </Link>
        <Link href="/(app)/history" asChild>
          <AppButton label="Open history" tone="ghost" />
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
  heroText: {
    gap: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 16,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  actions: {
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryActions: {
    gap: 8,
  },
});
