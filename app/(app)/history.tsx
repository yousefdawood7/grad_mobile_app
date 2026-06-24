import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../../src/components/ui/app-button';
import {
  exportHistoryAsCSV,
  exportHistoryAsPDF,
} from '../../src/features/classification/export';
import { ClassificationRecord } from '../../src/features/classification/types';
import { useClassification } from '../../src/providers/classification-provider';
import { useTheme } from '../../src/providers/theme-provider';
import { displayConfidence } from '../../src/utils/confidence';
import { formatDateTime } from '../../src/utils/date';

function HistoryItem({ item }: { item: ClassificationRecord }) {
  const { colors } = useTheme();
  return (
    <Link href={`/(app)/result/${item.id}`} asChild>
      <Pressable style={[styles.recordCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Image
          contentFit="cover"
          source={{ uri: item.imageUri }}
          style={styles.thumbnail}
          transition={150}
        />
        <View style={styles.recordBody}>
          <Text style={[styles.recordTitle, { color: colors.text }]}>{item.label}</Text>
          <Text style={[styles.recordMeta, { color: colors.textMuted }]}>
            {`${displayConfidence(item.confidence)}% confidence | ${formatDateTime(item.createdAt)}`}
          </Text>
          <Text style={[styles.recordText, { color: colors.textMuted }]} numberOfLines={2}>
            {item.recommendation}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

function EmptyState({ isSyncing }: { isSyncing: boolean }) {
  const { colors } = useTheme();

  if (isSyncing) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Loading history</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Syncing your recent classification results.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>No analyses yet</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        Capture or upload an image to create the first classification result.
      </Text>
      <Link href="/(app)/upload" asChild>
        <AppButton label="Upload image" />
      </Link>
    </View>
  );
}

function keyExtractor(item: ClassificationRecord) {
  return item.id;
}

export default function HistoryScreen() {
  const {
    clearHistory,
    history,
    historyError,
    isSyncingHistory,
    refreshHistory,
  } = useClassification();
  const { colors } = useTheme();
  const [clearError, setClearError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const renderItem = useCallback(
    ({ item }: { item: ClassificationRecord }) => <HistoryItem item={item} />,
    [],
  );

  const listEmptyComponent = useCallback(
    () => <EmptyState isSyncing={isSyncingHistory} />,
    [isSyncingHistory],
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={listEmptyComponent}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            {historyError ? (
              <View style={[styles.noticeCard, { backgroundColor: colors.warningSoft, borderColor: colors.border }]}>
                <Text style={[styles.noticeTitle, { color: colors.warning }]}>Sync issue</Text>
                <Text style={[styles.noticeBody, { color: colors.text }]}>{historyError}</Text>
              </View>
            ) : null}
            {history.length > 0 ? (
              <View style={[styles.toolsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.toolsTitle, { color: colors.text }]}>
                  {`${history.length} saved ${history.length === 1 ? 'record' : 'records'}`}
                </Text>

                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Export</Text>
                <View style={styles.exportRow}>
                  <AppButton
                    disabled={isExporting}
                    label="CSV"
                    onPress={async () => {
                      setIsExporting(true);
                      setExportError(null);
                      try {
                        await exportHistoryAsCSV(history);
                      } catch (e) {
                        setExportError(
                          e instanceof Error ? e.message : 'Export failed.',
                        );
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                    style={styles.exportButton}
                    tone="surface"
                  />
                  <AppButton
                    disabled={isExporting}
                    label="PDF Report"
                    loading={isExporting}
                    onPress={async () => {
                      setIsExporting(true);
                      setExportError(null);
                      try {
                        await exportHistoryAsPDF(history);
                      } catch (e) {
                        setExportError(
                          e instanceof Error ? e.message : 'Export failed.',
                        );
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                    style={styles.exportButton}
                    tone="secondary"
                  />
                </View>
                {exportError ? (
                  <Text style={[styles.clearErrorText, { color: colors.danger }]}>{exportError}</Text>
                ) : null}

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {clearError ? (
                  <Text style={[styles.clearErrorText, { color: colors.danger }]}>{clearError}</Text>
                ) : null}
                {isConfirmingClear ? (
                  <View style={styles.confirmActions}>
                    <AppButton
                      disabled={isClearing}
                      label="Cancel"
                      onPress={() => {
                        setClearError(null);
                        setIsConfirmingClear(false);
                      }}
                      tone="ghost"
                    />
                    <AppButton
                      label="Confirm clear"
                      loading={isClearing}
                      onPress={async () => {
                        setIsClearing(true);
                        setClearError(null);
                        const result = await clearHistory();
                        setIsClearing(false);
                        if (!result.ok) {
                          setClearError(result.message);
                          return;
                        }
                        setIsConfirmingClear(false);
                      }}
                      tone="danger"
                    />
                  </View>
                ) : (
                  <AppButton
                    label="Clear history"
                    onPress={() => setIsConfirmingClear(true)}
                    tone="surface"
                  />
                )}
              </View>
            ) : null}
          </View>
        }
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isSyncingHistory}
            tintColor={colors.brand}
            onRefresh={() => {
              refreshHistory().catch(() => undefined);
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    gap: 14,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerStack: {
    gap: 14,
  },
  emptyCard: {
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 22,
  },
  noticeCard: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  toolsCard: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  toolsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportButton: {
    flex: 1,
    minHeight: 46,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  confirmActions: {
    gap: 8,
  },
  clearErrorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
  },
  recordCard: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    overflow: 'hidden',
    padding: 12,
  },
  thumbnail: {
    borderCurve: 'continuous',
    borderRadius: 18,
    height: 86,
    width: 86,
  },
  recordBody: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  recordTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  recordMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  recordText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
