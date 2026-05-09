import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { isModelApiConfigured } from '../config/env';
import {
  clearRemoteClassificationHistory,
  createRemoteClassificationRun,
  listRemoteClassificationHistory,
  upsertRemoteClassificationHistory,
} from '../features/classification/repository';
import {
  analyzeAsset,
  createClassificationRecordId,
  isUuid,
} from '../features/classification/service';
import {
  clearClassificationHistory,
  loadClassificationHistory,
  saveClassificationHistory,
} from '../features/classification/storage';
import {
  ClassificationRecord,
  PendingAsset,
} from '../features/classification/types';
import { useSession } from './session-provider';

type AnalyzeResult =
  | { ok: true; record: ClassificationRecord }
  | { message: string; ok: false };
type HistoryActionResult = { ok: true } | { message: string; ok: false };

type ClassificationContextValue = {
  analyzePendingAsset: () => Promise<AnalyzeResult>;
  backendMode: 'mock' | 'remote';
  clearHistory: () => Promise<HistoryActionResult>;
  getRecordById: (id?: string) => ClassificationRecord | undefined;
  history: ClassificationRecord[];
  historyError: string | null;
  historyStorageMode: 'device' | 'supabase';
  isSyncingHistory: boolean;
  pendingAsset: PendingAsset | null;
  queuePendingAsset: (asset: PendingAsset) => void;
  refreshHistory: () => Promise<void>;
};

const ClassificationContext = createContext<ClassificationContextValue | null>(
  null,
);

export function ClassificationProvider({ children }: PropsWithChildren) {
  const { authState, user } = useSession();
  const [history, setHistory] = useState<ClassificationRecord[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyStorageMode, setHistoryStorageMode] = useState<
    'device' | 'supabase'
  >('device');
  const [isSyncingHistory, setIsSyncingHistory] = useState(false);
  const [pendingAsset, setPendingAsset] = useState<PendingAsset | null>(null);

  const refreshHistory = async () => {
    setIsSyncingHistory(true);

    try {
      if (authState === 'authenticated' && user.id) {
        const guestHistory = normalizeHistoryRecords(
          await loadClassificationHistory(),
        );
        const cachedUserHistory = normalizeHistoryRecords(
          await loadClassificationHistory(user.id),
        );
        const deviceHistory = dedupeHistory([
          ...cachedUserHistory,
          ...guestHistory,
        ]);

        if (deviceHistory.length > 0) {
          setHistory(deviceHistory);
          await saveClassificationHistory(deviceHistory, user.id);
          await upsertRemoteClassificationHistory(user.id, deviceHistory);
        }

        const remoteHistory = dedupeHistory(
          normalizeHistoryRecords(
            await listRemoteClassificationHistory(user.id),
          ),
        );

        await saveClassificationHistory(remoteHistory, user.id);

        if (guestHistory.length > 0) {
          await clearClassificationHistory();
        }

        setHistory(remoteHistory);
        setHistoryError(null);
        setHistoryStorageMode('supabase');
        return;
      }

      const localHistory = normalizeHistoryRecords(
        await loadClassificationHistory(),
      );

      await saveClassificationHistory(localHistory);
      setHistory(localHistory);
      setHistoryError(null);
      setHistoryStorageMode('device');
    } catch (error) {
      const fallbackHistory =
        authState === 'authenticated' && user.id
          ? normalizeHistoryRecords(await loadClassificationHistory(user.id))
          : normalizeHistoryRecords(await loadClassificationHistory());

      setHistory(fallbackHistory);
      setHistoryError(
        error instanceof Error
          ? `${error.message} Showing on-device history instead.`
          : 'History sync failed. Showing on-device history instead.',
      );
      setHistoryStorageMode('device');
    } finally {
      setIsSyncingHistory(false);
    }
  };

  useEffect(() => {
    refreshHistory().catch(() => {
      setHistory([]);
      setHistoryError('History sync failed. Showing on-device history instead.');
      setHistoryStorageMode('device');
      setIsSyncingHistory(false);
    });
  }, [authState, user.id]);

  const value = useMemo<ClassificationContextValue>(
    () => ({
      analyzePendingAsset: async () => {
        if (!pendingAsset) {
          return {
            message: 'No image is queued for analysis.',
            ok: false,
          };
        }

        const record = await analyzeAsset(pendingAsset);
        const updated = dedupeHistory([record, ...history]);

        if (authState === 'authenticated' && user.id) {
          await saveClassificationHistory(updated, user.id);

          try {
            await createRemoteClassificationRun(user.id, record);
            setHistoryError(null);
            setHistoryStorageMode('supabase');
          } catch (error) {
            setHistoryError(
              error instanceof Error
                ? `${error.message} Saved on this device and will retry sync later.`
                : 'Supabase sync failed. Saved on this device and will retry later.',
            );
            setHistoryStorageMode('device');
          }
        } else {
          await saveClassificationHistory(updated);
          setHistoryError(null);
          setHistoryStorageMode('device');
        }

        setHistory(updated);
        setPendingAsset(null);

        return {
          ok: true,
          record,
        };
      },
      backendMode: isModelApiConfigured ? 'remote' : 'mock',
      clearHistory: async () => {
        try {
          if (authState === 'authenticated' && user.id) {
            await clearRemoteClassificationHistory(user.id);
            await clearClassificationHistory(user.id);
          } else {
            await clearClassificationHistory();
          }

          setHistory([]);
          setHistoryError(null);
          setHistoryStorageMode(
            authState === 'authenticated' && user.id ? 'supabase' : 'device',
          );

          return { ok: true };
        } catch (error) {
          return {
            message:
              error instanceof Error
                ? error.message
                : 'Unable to clear history.',
            ok: false,
          };
        }
      },
      getRecordById: (id) => history.find((record) => record.id === id),
      history,
      historyError,
      historyStorageMode,
      isSyncingHistory,
      pendingAsset,
      queuePendingAsset: (asset) => setPendingAsset(asset),
      refreshHistory,
    }),
    [
      authState,
      history,
      historyError,
      historyStorageMode,
      isSyncingHistory,
      pendingAsset,
      user.id,
    ],
  );

  return (
    <ClassificationContext.Provider value={value}>
      {children}
    </ClassificationContext.Provider>
  );
}

export function useClassification() {
  const context = useContext(ClassificationContext);

  if (!context) {
    throw new Error(
      'useClassification must be used within ClassificationProvider',
    );
  }

  return context;
}

function dedupeHistory(records: ClassificationRecord[]) {
  const seen = new Set<string>();

  return records.filter((record) => {
    if (seen.has(record.id)) {
      return false;
    }

    seen.add(record.id);
    return true;
  });
}

function normalizeHistoryRecords(records: ClassificationRecord[]) {
  return records.map((record) =>
    isUuid(record.id)
      ? record
      : {
          ...record,
          id: createClassificationRecordId(),
        },
  );
}
