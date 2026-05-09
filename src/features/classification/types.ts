export type AssetSource = 'camera' | 'gallery' | 'file';

export type PendingAsset = {
  mimeType: string;
  name: string;
  source: AssetSource;
  uri: string;
  uploadUri?: string;
};

export type ClassificationRecord = {
  confidence: number;
  createdAt: string;
  id: string;
  imageUri: string;
  isPositive: boolean;
  label: 'Water Hyacinth' | 'Needs Review' | 'No Water Hyacinth';
  modelVersion: string;
  recommendation: string;
  source: AssetSource;
};
