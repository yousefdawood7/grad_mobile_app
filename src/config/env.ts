import Constants, { ExecutionEnvironment } from 'expo-constants';

type ExpoExtra = {
  modelApiTimeoutMs?: number | string;
  modelApiUrl?: string;
  modelApiWsUrl?: string;
  supabasePublishableKey?: string;
  supabaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
const modelApiTimeoutMs = Number(extra.modelApiTimeoutMs ?? 15000);
const modelApiUrl =
  extra.modelApiUrl ??
  'http://13.60.162.222:3000/api/v1/water-hyacinth/predict';
const modelApiWsUrl = extra.modelApiWsUrl ?? deriveWebSocketUrl(modelApiUrl);

export const env = {
  modelApiTimeoutMs: Number.isFinite(modelApiTimeoutMs)
    ? modelApiTimeoutMs
    : 15000,
  modelApiUrl,
  modelApiWsUrl,
  supabasePublishableKey: extra.supabasePublishableKey ?? '',
  supabaseUrl: extra.supabaseUrl ?? '',
};

export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const isSupabaseConfigured =
  env.supabaseUrl.length > 0 && env.supabasePublishableKey.length > 0;

export const isModelApiConfigured = env.modelApiUrl.length > 0;

function deriveWebSocketUrl(httpUrl: string) {
  try {
    const url = new URL(httpUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = url.pathname.replace(/\/predict$/, '/ws/live-detect');
    return url.toString();
  } catch {
    return '';
  }
}
