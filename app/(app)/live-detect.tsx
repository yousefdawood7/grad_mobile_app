import { CameraRatio, CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Screen } from '../../src/components/ui/screen';
import { DetectionOverlay } from '../../src/features/classification/components/detection-overlay';
import {
  createLiveDetectionSocket,
  LiveDetectionMessage,
  normalizeBoxes,
} from '../../src/features/classification/service';
import { BoundingBox, RiskLevel } from '../../src/features/classification/types';
import { useTheme } from '../../src/providers/theme-provider';

/** Cooldown between frames — keeps results stable and avoids flooding the server */
const MIN_FRAME_GAP_MS = 350;

type QualityPreset = 'fast' | 'balanced' | 'best';

const QUALITY_PRESETS: Record<
  QualityPreset,
  { label: string; quality: number; pictureSize: string }
> = {
  fast:     { label: 'Fast',     quality: 0.1, pictureSize: '352x288' },
  balanced: { label: 'Balanced', quality: 0.3, pictureSize: '640x480' },
  best:     { label: 'Best',     quality: 0.6, pictureSize: '1280x720' },
};

type LivePrediction = {
  boxes: BoundingBox[];
  classification: string;
  classificationConfidence?: number;
  coveragePercent?: number;
  detectionConfidence?: number;
  detectedRegions?: number;
  imageHeight?: number;
  imageWidth?: number;
  riskLevel?: RiskLevel;
};

export default function LiveDetectScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isCapturingRef = useRef(false);
  const manuallyStoppedRef = useRef(false);
  const lastCaptureTimeRef = useRef(0);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [prediction, setPrediction] = useState<LivePrediction | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [quality, setQuality] = useState<QualityPreset>('balanced');
  const qualityRef = useRef<QualityPreset>(quality);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const { colors } = useTheme();

  // Keep the ref in sync so the capture closure always reads the latest value
  useEffect(() => {
    qualityRef.current = quality;
  }, [quality]);

  useEffect(() => {
    return () => {
      stopStreaming(false);
    };
  }, []);

  useEffect(() => {
    if (
      permission?.granted &&
      cameraReady &&
      !isStreaming &&
      !isConnecting &&
      !socketRef.current &&
      !manuallyStoppedRef.current
    ) {
      void handleStart();
    }
  }, [cameraReady, isConnecting, isStreaming, permission?.granted]);

  const statusText = useMemo(() => {
    if (error) {
      return error;
    }

    if (isConnecting) {
      return 'Connecting to live detection service...';
    }

    if (isStreaming) {
      if (prediction?.boxes?.length) {
        return `Live detection active. ${prediction.boxes.length} region(s) tracked on the camera preview.`;
      }

      if (lastUpdatedAt) {
        return 'Live detection active. Frames are reaching the backend, but no object is currently being detected.';
      }

      return 'Live detection active. Point the camera at the plant and wait for the first detection.';
    }

    return 'Grant camera access and the app will start live detection automatically.';
  }, [error, isConnecting, isStreaming, lastUpdatedAt, prediction?.boxes?.length]);

  /**
   * Schedule the next frame capture respecting a minimum gap.
   * Called after receiving a WS response (response-driven loop),
   * NOT on a fixed timer — this avoids stacking stale frames.
   */
  const scheduleNextCapture = useCallback(() => {
    if (manuallyStoppedRef.current || !socketRef.current) return;

    const elapsed = Date.now() - lastCaptureTimeRef.current;
    const delay = Math.max(0, MIN_FRAME_GAP_MS - elapsed);

    setTimeout(() => {
      void captureAndSendFrame();
    }, delay);
  }, []);

  const stopStreaming = (manual: boolean) => {
    manuallyStoppedRef.current = manual;
    isCapturingRef.current = false;
    setIsConnecting(false);
    setIsStreaming(false);

    if (socketRef.current) {
      const socket = socketRef.current;
      socketRef.current = null;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    }
  };

  const captureAndSendFrame = async () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    if (!cameraRef.current || isCapturingRef.current || manuallyStoppedRef.current) {
      return;
    }

    try {
      isCapturingRef.current = true;
      lastCaptureTimeRef.current = Date.now();

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        imageType: 'jpg',
        quality: QUALITY_PRESETS[qualityRef.current].quality,
        shutterSound: false,
      });

      if (!photo?.base64 || !socketRef.current || manuallyStoppedRef.current) {
        return;
      }

      const frameId = `${Date.now()}`;
      socketRef.current.send(
        JSON.stringify({
          frame_id: frameId,
          image_base64: `data:image/jpeg;base64,${photo.base64}`,
        }),
      );
    } catch (captureError) {
      setError(
        captureError instanceof Error
          ? captureError.message
          : 'Unable to capture a live frame.',
      );
      stopStreaming(false);
    } finally {
      isCapturingRef.current = false;
    }
  };

  const handleStart = async () => {
    setError(null);
    manuallyStoppedRef.current = false;

    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        setError('Camera permission is required for live detection.');
        return;
      }
    }

    if (!cameraReady) {
      return;
    }

    try {
      const socket = createLiveDetectionSocket();
      socketRef.current = socket;
      setIsConnecting(true);

      socket.onopen = () => {
        setIsConnecting(false);
        setIsStreaming(true);
        void captureAndSendFrame();
      };

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data) as LiveDetectionMessage;

        if (payload.detail) {
          setError(payload.detail);
          // Still try next frame on transient errors
          scheduleNextCapture();
          return;
        }

        setPrediction({
          boxes: normalizeBoxes(payload.boxes),
          classification: payload.classification ?? 'unknown',
          classificationConfidence: payload.classification_confidence,
          coveragePercent: payload.coverage_percent,
          detectionConfidence: payload.detection_confidence,
          detectedRegions: payload.detected_regions,
          imageHeight: payload.image_height,
          imageWidth: payload.image_width,
          riskLevel: payload.risk_level,
        });
        setLastUpdatedAt(Date.now());

        // Response-driven: capture next frame now that we got a result
        scheduleNextCapture();
      };

      socket.onerror = () => {
        setError(
          'Live detection socket failed. Check that the EC2 websocket endpoint is reachable from the phone.',
        );
        stopStreaming(false);
      };

      socket.onclose = () => {
        setIsConnecting(false);
        setIsStreaming(false);
        socketRef.current = null;
      };
    } catch (socketError) {
      setError(
        socketError instanceof Error
          ? socketError.message
          : 'Unable to start live detection.',
      );
      stopStreaming(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {permission?.granted ? (
          <DetectionOverlay
            boxes={
              prediction?.classification === 'water_hyacinth'
                ? (prediction?.boxes ?? [])
                : []
            }
            imageHeight={prediction?.imageHeight}
            imageWidth={prediction?.imageWidth}
            style={styles.previewFrame}
          >
            <CameraView
              active
              animateShutter={false}
              enableTorch={torchEnabled}
              facing="back"
              mode="picture"
              mirror={false}
              onCameraReady={() => setCameraReady(true)}
              onMountError={(mountError) => setError(mountError.message)}
              pictureSize={QUALITY_PRESETS[quality].pictureSize}
              ratio={(Platform.OS === 'android' ? ('4:3' as CameraRatio) : undefined)}
              ref={cameraRef}
              style={styles.camera}
            />
          </DetectionOverlay>
        ) : (
          <View style={styles.permissionCard}>
            <Text style={[styles.permissionTitle, { color: colors.text }]}>Camera access needed</Text>
            <Text style={[styles.permissionBody, { color: colors.textMuted }]}>
              Grant camera permission to start live detection and draw borders on the preview.
            </Text>
            <AppButton label="Allow camera" onPress={() => void requestPermission()} />
          </View>
        )}
      </View>

      <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Live detection</Text>
        <Text style={[styles.statusBody, { color: colors.textMuted }]}>{statusText}</Text>
        <View style={styles.metricRow}>
          <MetricCard
            label="Class"
            value={formatClassification(
              prediction?.classification,
              prediction?.classificationConfidence,
            )}
          />
          <MetricCard
            label="Coverage"
            value={
              prediction?.coveragePercent != null
                ? `${prediction.coveragePercent.toFixed(1)}%`
                : '--'
            }
          />
          <MetricCard label="Risk" value={prediction?.riskLevel ?? '--'} />
        </View>
        <View style={styles.metricRow}>
          <MetricCard
            label="Regions"
            value={`${prediction?.detectedRegions ?? prediction?.boxes.length ?? 0}`}
          />
          <MetricCard
            label="Det. conf."
            value={
              prediction?.detectionConfidence != null
                ? `${(prediction.detectionConfidence * 100).toFixed(0)}%`
                : '--'
            }
          />
        </View>

        <View style={styles.qualitySection}>
          <Text style={[styles.qualityLabel, { color: colors.textMuted }]}>Capture quality</Text>
          <View style={styles.qualityRow}>
            {(Object.keys(QUALITY_PRESETS) as QualityPreset[]).map((key) => (
              <Pressable
                key={key}
                onPress={() => setQuality(key)}
                style={[
                  styles.qualityPill,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  quality === key && { backgroundColor: colors.brand, borderColor: colors.brand },
                ]}
              >
                <Text
                  style={[
                    styles.qualityPillText,
                    { color: colors.textMuted },
                    quality === key && { color: colors.white },
                  ]}
                >
                  {QUALITY_PRESETS[key].label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.optionsSection}>
          <Text style={[styles.qualityLabel, { color: colors.textMuted }]}>Options</Text>

          <Pressable
            onPress={() => setTorchEnabled((prev) => !prev)}
            style={[
              styles.qualityPill,
              { backgroundColor: colors.background, borderColor: colors.border },
              torchEnabled && { backgroundColor: colors.brand, borderColor: colors.brand },
            ]}
          >
            <Text
              style={[
                styles.qualityPillText,
                { color: colors.textMuted },
                torchEnabled && { color: colors.white },
              ]}
            >
              {torchEnabled ? '💡 Flashlight on' : '💡 Flashlight off'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          {isStreaming || isConnecting ? (
            <AppButton
              label="Stop live detection"
              onPress={() => stopStreaming(true)}
              tone="danger"
            />
          ) : (
            <AppButton label="Restart live detection" onPress={() => void handleStart()} />
          )}
          {isStreaming || isConnecting ? (
            <ActivityIndicator color={colors.brandDeep} />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function formatClassification(value?: string, confidence?: number) {
  const conf =
    confidence != null ? ` ${(confidence * 100).toFixed(0)}%` : '';

  if (value === 'water_hyacinth') {
    return `Water Hyacinth${conf}`;
  }

  if (value === 'non_water_hyacinth') {
    return `Non Water Hyacinth${conf}`;
  }

  return '--';
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 16,
    paddingBottom: 24,
  },
  previewCard: {
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 14,
  },
  previewFrame: {
    aspectRatio: 3 / 4,
    backgroundColor: '#091514',
    borderCurve: 'continuous',
    borderRadius: 22,
  },
  camera: {
    height: '100%',
    width: '100%',
  },
  permissionCard: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    minHeight: 360,
    padding: 18,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  permissionBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  statusCard: {
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  statusBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 12,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  qualitySection: {
    gap: 8,
  },
  qualityLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityPill: {
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  qualityPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionsSection: {
    gap: 10,
  },
});



