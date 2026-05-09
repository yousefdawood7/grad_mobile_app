import Constants, { ExecutionEnvironment } from 'expo-constants';

type ExpoExtra = {
  modelApiTimeoutMs?: number | string;
  modelApiUrl?: string;
  supabasePublishableKey?: string;
  supabaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
const modelApiTimeoutMs = Number(extra.modelApiTimeoutMs ?? 15000);

export const env = {
  modelApiTimeoutMs: Number.isFinite(modelApiTimeoutMs)
    ? modelApiTimeoutMs
    : 15000,
  modelApiUrl: extra.modelApiUrl ?? '',
  supabasePublishableKey: extra.supabasePublishableKey ?? '',
  supabaseUrl: extra.supabaseUrl ?? '',
};

export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const isSupabaseConfigured =
  env.supabaseUrl.length > 0 && env.supabasePublishableKey.length > 0;

export const isModelApiConfigured = env.modelApiUrl.length > 0;
