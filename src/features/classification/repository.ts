import { supabase } from '../../lib/supabase';
import { ClassificationRecord } from './types';

type ClassificationRunRow = {
  confidence: number;
  created_at: string;
  id: string;
  image_source: ClassificationRecord['source'];
  image_uri: string;
  is_positive: boolean;
  model_version: string;
  recommendation: string;
  result_label: ClassificationRecord['label'];
};

export async function listRemoteClassificationHistory(userId: string) {
  if (!supabase) {
    return [] as ClassificationRecord[];
  }

  const { data, error } = await supabase
    .from('classification_runs')
    .select(
      'id, image_uri, image_source, result_label, confidence, is_positive, recommendation, model_version, created_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    throw new Error(error?.message ?? 'Unable to load remote history.');
  }

  return data.map(mapClassificationRun);
}

export async function createRemoteClassificationRun(
  userId: string,
  record: ClassificationRecord,
) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from('classification_runs').insert({
    confidence: record.confidence,
    created_at: record.createdAt,
    id: record.id,
    image_source: record.source,
    image_uri: record.imageUri,
    is_positive: record.isPositive,
    model_version: record.modelVersion,
    recommendation: record.recommendation,
    result_label: record.label,
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertRemoteClassificationHistory(
  userId: string,
  records: ClassificationRecord[],
) {
  if (!supabase || records.length === 0) {
    return;
  }

  const payload = records.map((record) => ({
    confidence: record.confidence,
    created_at: record.createdAt,
    id: record.id,
    image_source: record.source,
    image_uri: record.imageUri,
    is_positive: record.isPositive,
    model_version: record.modelVersion,
    recommendation: record.recommendation,
    result_label: record.label,
    user_id: userId,
  }));

  const { error } = await supabase
    .from('classification_runs')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearRemoteClassificationHistory(userId: string) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from('classification_runs')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

function mapClassificationRun(row: ClassificationRunRow): ClassificationRecord {
  return {
    boxes: [],
    confidence: row.confidence,
    createdAt: row.created_at,
    id: row.id,
    imageUri: row.image_uri,
    isPositive: row.is_positive,
    label: row.result_label,
    modelVersion: row.model_version,
    recommendation: row.recommendation,
    source: row.image_source,
  };
}
