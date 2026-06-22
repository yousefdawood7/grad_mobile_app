export type AssetSource = 'camera' | 'gallery' | 'file';

export type BoundingBox = {
  confidence: number;
  height: number;
  width: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PendingAsset = {
  mimeType: string;
  name: string;
  source: AssetSource;
  uri: string;
  uploadUri?: string;
};

export type ClassificationRecord = {
  boxes: BoundingBox[];
  classificationConfidence?: number;
  confidence: number;
  coveragePercent?: number;
  createdAt: string;
  detectionConfidence?: number;
  detectedRegions?: number;
  id: string;
  imageHeight?: number;
  imageUri: string;
  imageWidth?: number;
  isPositive: boolean;
  label: 'Water Hyacinth' | 'Needs Review' | 'No Water Hyacinth';
  modelVersion: string;
  recommendation: string;
  riskLevel?: RiskLevel;
  source: AssetSource;
};
