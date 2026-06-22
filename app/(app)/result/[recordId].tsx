import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/ui/app-button';
import { Screen } from '../../../src/components/ui/screen';
import { DetectionOverlay } from '../../../src/features/classification/components/detection-overlay';
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
  const hasDimensions = Boolean(record.imageWidth && record.imageHeight);
  const [showBorders, setShowBorders] = useState(true);

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <DetectionOverlay
          boxes={showBorders ? (record.boxes ?? []) : []}
          imageHeight={record.imageHeight}
          imageWidth={record.imageWidth}
          style={[
            styles.imageFrame,
            hasDimensions && record.imageWidth && record.imageHeight
              ? { aspectRatio: record.imageWidth / record.imageHeight }
              : null,
          ]}
        >
          <Image
            contentFit="contain"
            source={{ uri: record.imageUri }}
            style={styles.image}
            transition={200}
          />
        </DetectionOverlay>
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
        <View style={styles.metricRow}>
          <MetricCard label="Coverage" value={record.coveragePercent != null ? `${record.coveragePercent.toFixed(1)}%` : '--'} />
          <MetricCard label="Regions" value={`${record.detectedRegions ?? record.boxes?.length ?? 0}`} />
          <MetricCard label="Risk" value={record.riskLevel ?? '--'} />
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Pressable
          onPress={() => setShowBorders((prev) => !prev)}
          style={[styles.bordersToggle, showBorders && styles.bordersToggleActive]}
        >
          <Text style={[styles.bordersToggleText, showBorders && styles.bordersToggleTextActive]}>
            {showBorders ? 'Hide borders' : 'Show borders'}
          </Text>
        </Pressable>
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
        <Link href="/(app)/live-detect" asChild>
          <AppButton label="Open live detection" tone="secondary" />
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
  imageFrame: {
    backgroundColor: '#E9F2EF',
    borderCurve: 'continuous',
    borderRadius: 22,
    minHeight: 220,
  },
  image: {
    borderCurve: 'continuous',
    borderRadius: 22,
    height: '100%',
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
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 12,
  },
  metricValue: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
  },
  metricLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  bordersToggle: {
    alignItems: 'center',
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 6,
  },
  bordersToggleActive: {
    backgroundColor: palette.successSoft,
    borderColor: palette.brand,
  },
  bordersToggleText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  bordersToggleTextActive: {
    color: palette.brand,
  },
});
