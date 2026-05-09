import { Platform } from 'react-native';

import { env } from '../../config/env';
import { ClassificationRecord, PendingAsset } from './types';

/**
 * Response shape from the real ML model API at /predict.
 *
 * prediction: "water_hyacinth" | "not_water_hyacinth"
 * probability: raw probability score (0–1)
 * confidence:  confidence score   (0–1)
 * inference_time: seconds
 */
type RemoteClassificationResponse = {
  confidence?: number;
  inference_time?: number;
  prediction?: 'water_hyacinth' | 'not_water_hyacinth';
  probability?: number;
};

export async function analyzeAsset(
  asset: PendingAsset,
): Promise<ClassificationRecord> {
  return runRemoteClassification(asset);
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
    const fileUri = asset.uploadUri ?? asset.uri;

    if (Platform.OS === 'web') {
      // On web, convert the URI (blob: or data:) to a real File object
      const blob = await fetch(fileUri).then((r) => r.blob());
      const file = new File([blob], asset.name, { type: asset.mimeType });
      formData.append('file', file);
    } else {
      // React Native runtime handles { uri, name, type } objects natively
      formData.append('file', {
        name: asset.name,
        type: asset.mimeType,
        uri: fileUri,
      } as never);
    }

    let response: Response;

    try {
      response = await fetch(env.modelApiUrl, {
        body: formData,
        method: 'POST',
        signal: controller.signal,
      });
    } catch (networkError) {
      // CORS or network failure — fetch itself throws
      throw new Error(
        'Unable to reach the analysis service. This may be a network or CORS issue. Please try again from the mobile app.',
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Analysis service returned an error (${response.status}). ${errorText}`.trim(),
      );
    }

    // Safely parse JSON — guard against non-JSON responses
    const responseText = await response.text();
    let payload: RemoteClassificationResponse | null = null;

    try {
      payload = JSON.parse(responseText) as RemoteClassificationResponse;
    } catch {
      throw new Error(
        'The analysis service returned an unexpected response. Please try again.',
      );
    }

    const prediction = payload?.prediction ?? 'not_water_hyacinth';
    const isPositive = prediction === 'water_hyacinth';
    const label = mapPredictionToLabel(prediction);
    const confidence = normalizeConfidence(
      payload?.confidence ?? payload?.probability,
    );

    return {
      confidence,
      createdAt: new Date().toISOString(),
      id: createId(),
      imageUri: asset.uri,
      isPositive,
      label,
      modelVersion: 'EfficientNetV2',
      recommendation: buildRecommendation(label, confidence),
      source: asset.source,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * The API returns confidence as a 0–1 decimal. Convert to 0–100 percentage.
 */
function normalizeConfidence(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  // Values in 0–1 range → multiply to percentage
  const pct = value > 0 && value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * Map the API's prediction string to the app's label system.
 */
function mapPredictionToLabel(
  prediction: string,
): ClassificationRecord['label'] {
  if (prediction === 'water_hyacinth') return 'Water Hyacinth';
  if (prediction === 'not_water_hyacinth') return 'No Water Hyacinth';
  return 'Needs Review';
}

/**
 * Generate a human-readable recommendation based on the classification.
 */
function buildRecommendation(
  label: ClassificationRecord['label'],
  confidence: number,
): string {
  if (label === 'Water Hyacinth') {
    if (confidence >= 90) {
      return 'Water hyacinth is very likely present. Report this sighting to local environmental authorities and schedule a manual field review.';
    }
    return 'Water hyacinth appears to be present in this image. Consider reporting the sighting to local environmental authorities and scheduling a manual field review.';
  }

  if (label === 'No Water Hyacinth') {
    if (confidence >= 90) {
      return 'This sample does not resemble water hyacinth. Keep monitoring the area and upload more images if growth patterns change.';
    }
    return 'This sample is unlikely to be water hyacinth, but continue monitoring. Upload additional images if conditions change.';
  }

  return 'The analysis is uncertain. Capture another image with clearer focus and more of the plant structure visible for a more reliable result.';
}

function createId() {
  return createClassificationRecordId();
}
