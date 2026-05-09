import { createClassificationRecordId } from './service';
import { ClassificationRecord, PendingAsset } from './types';

function hashValue(seed: string) {
  return seed.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
}

export async function runMockClassification(
  asset: PendingAsset,
): Promise<ClassificationRecord> {
  await new Promise((resolve) => setTimeout(resolve, 2200));

  const hash = hashValue(`${asset.name}-${asset.uri}`);
  const variant = hash % 3;

  if (variant === 0) {
    return {
      confidence: 98,
      createdAt: new Date().toISOString(),
      id: createId(),
      imageUri: asset.uri,
      isPositive: true,
      label: 'Water Hyacinth',
      modelVersion: 'mock-v1',
      recommendation:
        'Water hyacinth appears to be present in this image. Consider reporting the sighting to local environmental authorities and scheduling a manual field review.',
      source: asset.source,
    };
  }

  if (variant === 1) {
    return {
      confidence: 76,
      createdAt: new Date().toISOString(),
      id: createId(),
      imageUri: asset.uri,
      isPositive: false,
      label: 'Needs Review',
      modelVersion: 'mock-v1',
      recommendation:
        'The current analysis is uncertain. Capture another image with clearer focus and more of the plant structure visible.',
      source: asset.source,
    };
  }

  return {
    confidence: 91,
    createdAt: new Date().toISOString(),
    id: createId(),
    imageUri: asset.uri,
    isPositive: false,
    label: 'No Water Hyacinth',
    modelVersion: 'mock-v1',
    recommendation:
      'This sample does not resemble water hyacinth strongly. Keep monitoring the area and upload more images if growth patterns change.',
    source: asset.source,
  };
}

function createId() {
  return createClassificationRecordId();
}
