import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/ui/app-button';
import { Screen } from '../../../src/components/ui/screen';
import { useClassification } from '../../../src/providers/classification-provider';
import { palette } from '../../../src/theme/palette';

export default function ResultScreen() {
  const params = useLocalSearchParams<{ recordId: string }>();
  const { getRecordById } = useClassification();
  const record = getRecordById(params.recordId);

  if (!record) {
    return (
      <Screen contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Result not found</Text>
          <Text style={styles.body}>
            The selected record is unavailable. Open history and run a new
            analysis if needed.
          </Text>
          <Link href="/(app)/history" asChild>
            <AppButton label="Open history" />
          </Link>
        </View>
      </Screen>
    );
  }

  const progressWidth = `${Math.round(record.confidence)}%` as const;

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Image
          contentFit="cover"
          source={{ uri: record.imageUri }}
          style={styles.image}
          transition={200}
        />
        <View style={styles.resultHeader}>
          <Text
            style={[
              styles.status,
              record.isPositive ? styles.statusPositive : styles.statusNeutral,
            ]}
          >
            {record.label}
          </Text>
          <Text style={styles.confidence}>Confidence: {record.confidence}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recommendation</Text>
        <Text style={styles.body}>{record.recommendation}</Text>
        <Text style={styles.meta}>Model version: {record.modelVersion}</Text>
      </View>

      <View style={styles.actions}>
        <Link href="/(app)/capture" asChild>
          <AppButton label="Scan another image" />
        </Link>
        <Link href="/(app)/history" asChild>
          <AppButton label="Open history" tone="surface" />
        </Link>
        <Link href="/(app)/learn" asChild>
          <AppButton label="About the plant" tone="ghost" />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  image: {
    borderCurve: 'continuous',
    borderRadius: 22,
    height: 220,
    width: '100%',
  },
  resultHeader: {
    gap: 6,
  },
  status: {
    fontSize: 24,
    fontWeight: '800',
  },
  statusPositive: {
    color: palette.danger,
  },
  statusNeutral: {
    color: palette.brandDeep,
  },
  confidence: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    backgroundColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 99,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: palette.danger,
    height: '100%',
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
  },
  body: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  meta: {
    color: palette.textSoft,
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    gap: 8,
  },
});
