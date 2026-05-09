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
import { ClassificationRecord } from '../../src/features/classification/types';
import { useClassification } from '../../src/providers/classification-provider';
import { palette } from '../../src/theme/palette';
import { formatDateTime } from '../../src/utils/date';

function HistoryItem({ item }: { item: ClassificationRecord }) {
  return (
    <Link href={`/(app)/result/${item.id}`} asChild>
      <Pressable style={styles.recordCard}>
        <Image
          contentFit="cover"
          source={{ uri: item.imageUri }}
          style={styles.thumbnail}
          transition={150}
        />
        <View style={styles.recordBody}>
          <Text style={styles.recordTitle}>{item.label}</Text>
          <Text style={styles.recordMeta}>
            {`${item.confidence}% confidence | ${formatDateTime(item.createdAt)}`}
          </Text>
          <Text style={styles.recordText} numberOfLines={2}>
            {item.recommendation}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

function EmptyState({ isSyncing }: { isSyncing: boolean }) {
  if (isSyncing) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.title}>Loading history</Text>
        <Text style={styles.body}>
          Syncing your recent classification results.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.emptyCard}>
      <Text style={styles.title}>No analyses yet</Text>
      <Text style={styles.body}>
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
  const [clearError, setClearError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const renderItem = useCallback(
    ({ item }: { item: ClassificationRecord }) => <HistoryItem item={item} />,
    [],
  );

  const listEmptyComponent = useCallback(
    () => <EmptyState isSyncing={isSyncingHistory} />,
    [isSyncingHistory],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={listEmptyComponent}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            {historyError ? (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>Sync issue</Text>
                <Text style={styles.noticeBody}>{historyError}</Text>
              </View>
            ) : null}
            {history.length > 0 ? (
              <View style={styles.toolsCard}>
                <Text style={styles.toolsTitle}>
                  {`${history.length} saved ${history.length === 1 ? 'record' : 'records'}`}
                </Text>
                {clearError ? (
                  <Text style={styles.clearErrorText}>{clearError}</Text>
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
            tintColor={palette.brand}
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
    backgroundColor: palette.background,
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
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 22,
  },
  noticeCard: {
    backgroundColor: palette.warningSoft,
    borderColor: '#F0D4A8',
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  noticeTitle: {
    color: palette.warning,
    fontSize: 14,
    fontWeight: '800',
  },
  noticeBody: {
    color: palette.text,
    fontSize: 13,
    lineHeight: 19,
  },
  syncCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    gap: 4,
    padding: 16,
  },
  syncTitle: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  syncBody: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  toolsCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  toolsTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  confirmActions: {
    gap: 8,
  },
  clearErrorText: {
    color: palette.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800',
  },
  body: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  recordCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
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
    color: palette.text,
    fontSize: 17,
    fontWeight: '700',
  },
  recordMeta: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  recordText: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
