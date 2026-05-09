import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../../lib/storage-keys';
import { ClassificationRecord } from './types';

function resolveClassificationHistoryKey(userId?: string) {
  if (userId) {
    return `${STORAGE_KEYS.classificationHistoryUserPrefix}${userId}`;
  }

  return STORAGE_KEYS.classificationHistory;
}

export async function clearClassificationHistory(userId?: string) {
  await AsyncStorage.removeItem(resolveClassificationHistoryKey(userId));
}

export async function loadClassificationHistory(userId?: string) {
  const raw = await AsyncStorage.getItem(resolveClassificationHistoryKey(userId));

  if (!raw) {
    return [] as ClassificationRecord[];
  }

  try {
    return JSON.parse(raw) as ClassificationRecord[];
  } catch {
    return [] as ClassificationRecord[];
  }
}

export async function saveClassificationHistory(
  records: ClassificationRecord[],
  userId?: string,
) {
  await AsyncStorage.setItem(
    resolveClassificationHistoryKey(userId),
    JSON.stringify(records),
  );
}
