import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../src/components/ui/app-button';
import { Screen } from '../../../src/components/ui/screen';
import { DetectionOverlay } from '../../../src/features/classification/components/detection-overlay';
import { useClassification } from '../../../src/providers/classification-provider';
import { useTheme } from '../../../src/providers/theme-provider';

export default function ResultScreen() {
  const params = useLocalSearchParams<{ recordId: string }>();
  const { getRecordById } = useClassification();
  const record = getRecordById(params.recordId);
  const { colors } = useTheme();

  if (!record) {
    return (
      <Screen contentContainerStyle={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Result not found</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
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
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <DetectionOverlay
          boxes={showBorders && record.isPositive ? (record.boxes ?? []) : []}
          imageHeight={record.imageHeight}
          imageWidth={record.imageWidth}
          style={[
            styles.imageFrame,
            { backgroundColor: colors.background },
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
              { color: record.isPositive ? colors.danger : colors.brandDeep },
            ]}
          >
            {record.label}
          </Text>
          <Text style={[styles.confidence, { color: colors.textMuted }]}>Confidence: {record.confidence}%</Text>
        </View>
        <View style={styles.metricRow}>
          <MetricCard label="Coverage" value={record.coveragePercent != null ? `${record.coveragePercent.toFixed(1)}%` : '--'} />
          <MetricCard label="Regions" value={`${record.detectedRegions ?? record.boxes?.length ?? 0}`} />
          <MetricCard label="Risk" value={record.riskLevel ?? '--'} />
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.danger }]} />
        </View>
        <Pressable
          onPress={() => setShowBorders((prev) => !prev)}
          style={[
            styles.bordersToggle,
            { backgroundColor: colors.background, borderColor: colors.border },
            showBorders && { backgroundColor: colors.successSoft, borderColor: colors.brand },
          ]}
        >
          <Text
            style={[
              styles.bordersToggleText,
              { color: colors.textMuted },
              showBorders && { color: colors.brand },
            ]}
          >
            {showBorders ? 'Hide borders' : 'Show borders'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommendation</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>{record.recommendation}</Text>
        <Text style={[styles.meta, { color: colors.textSoft }]}>Model version: {record.modelVersion}</Text>
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
  const { colors } = useTheme();
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  imageFrame: {
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
  confidence: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 12,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressTrack: {
    borderCurve: 'continuous',
    borderRadius: 99,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    gap: 8,
  },
  bordersToggle: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 6,
  },
  bordersToggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
