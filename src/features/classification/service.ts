import { env, isModelApiConfigured } from '../../config/env';
import { ClassificationRecord, PendingAsset } from './types';
import { runMockClassification } from './mock-classifier';

type RemoteClassificationResponse = {
  confidence?: number;
  isPositive?: boolean;
  label?: ClassificationRecord['label'];
  modelVersion?: string;
  recommendation?: string;
};

export async function analyzeAsset(
  asset: PendingAsset,
): Promise<ClassificationRecord> {
  if (!isModelApiConfigured) {
    return runMockClassification(asset);
  }

  try {
    return await runRemoteClassification(asset);
  } catch {
    return runMockClassification(asset);
  }
}

export function createClassificationRecordId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === 'x' ? random : (random & 0x3) | 0x8;

      return value.toString(16);
    },
  );
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function runRemoteClassification(
  asset: PendingAsset,
): Promise<ClassificationRecord> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    env.modelApiTimeoutMs,
  );

  try {
    const formData = new FormData();

    formData.append('image', {
      name: asset.name,
      type: asset.mimeType,
      uri: asset.uploadUri ?? asset.uri,
    } as never);
    formData.append('source', asset.source);

    const response = await fetch(env.modelApiUrl, {
      body: formData,
      method: 'POST',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Model API returned ${response.status}`);
    }

    const payload =
      (await response.json()) as RemoteClassificationResponse | null;

    return {
      confidence: normalizeConfidence(payload?.confidence),
      createdAt: new Date().toISOString(),
      id: createId(),
      imageUri: asset.uri,
      isPositive: Boolean(payload?.isPositive),
      label: normalizeLabel(payload?.label),
      modelVersion: payload?.modelVersion?.trim() || 'remote-v1',
      recommendation:
        payload?.recommendation?.trim() ||
        'Classification completed successfully.',
      source: asset.source,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeConfidence(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeLabel(label?: ClassificationRecord['label']) {
  if (
    label === 'Water Hyacinth' ||
    label === 'Needs Review' ||
    label === 'No Water Hyacinth'
  ) {
    return label;
  }

  return 'Needs Review';
}

function createId() {
  return createClassificationRecordId();
}
