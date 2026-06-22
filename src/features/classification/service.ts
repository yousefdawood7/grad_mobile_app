import { Platform } from 'react-native';

import { env } from '../../config/env';
import { BoundingBox, ClassificationRecord, PendingAsset, RiskLevel } from './types';

type RemoteBoundingBox = {
  confidence?: number;
  height?: number;
  width?: number;
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
};

type RemoteClassificationResponse = {
  boxes?: RemoteBoundingBox[];
  classification?: 'non_water_hyacinth' | 'water_hyacinth';
  classification_confidence?: number;
  coverage_percent?: number;
  detection_confidence?: number;
  detected_regions?: number;
  image_height?: number;
  image_width?: number;
  risk_level?: RiskLevel;
};

export type LiveDetectionMessage = RemoteClassificationResponse & {
  detail?: string;
  frame_id?: string;
  status_code?: number;
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

export function createLiveDetectionSocket() {
  if (!env.modelApiWsUrl) {
    throw new Error('Live detection socket URL is not configured.');
  }

  return new WebSocket(env.modelApiWsUrl);
}

export function normalizeBoxes(boxes?: RemoteBoundingBox[]): BoundingBox[] {
  if (!boxes?.length) {
    return [];
  }

  return boxes.map((box) => ({
    confidence: box.confidence ?? 0,
    height: box.height ?? Math.max(0, (box.y2 ?? 0) - (box.y1 ?? 0)),
    width: box.width ?? Math.max(0, (box.x2 ?? 0) - (box.x1 ?? 0)),
    x1: box.x1 ?? 0,
    x2: box.x2 ?? 0,
    y1: box.y1 ?? 0,
    y2: box.y2 ?? 0,
  }));
}

async function runRemoteClassification(
  asset: PendingAsset,
): Promise<ClassificationRecord> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.modelApiTimeoutMs);

  try {
    const formData = new FormData();
    const fileUri = asset.uploadUri ?? asset.uri;

    if (Platform.OS === 'web') {
      const blob = await fetch(fileUri).then((r) => r.blob());
      const file = new File([blob], asset.name, { type: asset.mimeType });
      formData.append('file', file);
    } else {
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
    } catch {
      throw new Error(
        'Unable to reach the analysis service. Check that the EC2 backend is reachable from this device.',
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Analysis service returned an error (${response.status}). ${errorText}`.trim(),
      );
    }

    const responseText = await response.text();
    let payload: RemoteClassificationResponse | null = null;

    try {
      payload = JSON.parse(responseText) as RemoteClassificationResponse;
    } catch {
      throw new Error(
        'The analysis service returned an unexpected response. Please try again.',
      );
    }

    const classification = payload?.classification ?? 'non_water_hyacinth';
    const isPositive = classification === 'water_hyacinth';
    const label = mapClassificationToLabel(classification);
    const confidence = normalizeConfidence(payload?.classification_confidence);
    const boxes = normalizeBoxes(payload?.boxes);
    const coveragePercent = normalizePercentage(payload?.coverage_percent);
    const riskLevel = payload?.risk_level ?? 'NONE';

    return {
      boxes,
      classificationConfidence: normalizeOptionalNumber(
        payload?.classification_confidence,
      ),
      confidence,
      coveragePercent,
      createdAt: new Date().toISOString(),
      detectionConfidence: normalizeOptionalNumber(payload?.detection_confidence),
      detectedRegions: payload?.detected_regions ?? boxes.length,
      id: createId(),
      imageHeight: payload?.image_height,
      imageUri: asset.uri,
      imageWidth: payload?.image_width,
      isPositive,
      label,
      modelVersion: 'EfficientNetV2 + YOLO',
      recommendation: buildRecommendation(label, confidence, riskLevel),
      riskLevel,
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

  const pct = value > 0 && value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function normalizeOptionalNumber(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }

  return Math.round(value * 100) / 100;
}

function normalizePercentage(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }

  return Math.round(value * 10) / 10;
}

function mapClassificationToLabel(
  classification: string,
): ClassificationRecord['label'] {
  if (classification === 'water_hyacinth') return 'Water Hyacinth';
  if (classification === 'non_water_hyacinth') return 'No Water Hyacinth';
  return 'Needs Review';
}

function buildRecommendation(
  label: ClassificationRecord['label'],
  confidence: number,
  riskLevel: RiskLevel,
): string {
  if (label === 'Water Hyacinth') {
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      return 'Dense water hyacinth coverage is likely present. Escalate this sighting for urgent field verification and containment planning.';
    }

    if (confidence >= 90) {
      return 'Water hyacinth is very likely present. Report this sighting and schedule a manual field review.';
    }

    return 'Water hyacinth appears to be present. Capture another angle if possible and report the sighting for review.';
  }

  if (label === 'No Water Hyacinth') {
    if (confidence >= 90) {
      return 'This sample does not resemble water hyacinth. Keep monitoring the area and upload more images if growth patterns change.';
    }

    return 'This sample is unlikely to be water hyacinth, but continue monitoring and rescan if conditions change.';
  }

  return 'The analysis is uncertain. Capture another image with clearer focus and more of the plant structure visible for a more reliable result.';
}

function createId() {
  return createClassificationRecordId();
}
