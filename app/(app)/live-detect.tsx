import { CameraRatio, CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Screen } from '../../src/components/ui/screen';
import { DetectionOverlay } from '../../src/features/classification/components/detection-overlay';
import {
  createLiveDetectionSocket,
  LiveDetectionMessage,
  normalizeBoxes,
} from '../../src/features/classification/service';
import { BoundingBox, RiskLevel } from '../../src/features/classification/types';
import { palette } from '../../src/theme/palette';

const FRAME_INTERVAL_MS = 450;

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCapturingRef = useRef(false);
  const manuallyStoppedRef = useRef(false);
  const lastSentFrameIdRef = useRef<string | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [prediction, setPrediction] = useState<LivePrediction | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

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

  const clearLoop = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const queueNextFrame = () => {
    clearLoop();
    timerRef.current = setTimeout(() => {
      void captureAndSendFrame();
    }, FRAME_INTERVAL_MS);
  };

  const stopStreaming = (manual: boolean) => {
    manuallyStoppedRef.current = manual;
    clearLoop();
    isCapturingRef.current = false;
    lastSentFrameIdRef.current = null;
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
      queueNextFrame();
      return;
    }

    if (!cameraRef.current || isCapturingRef.current) {
      queueNextFrame();
      return;
    }

    try {
      isCapturingRef.current = true;
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        imageType: 'jpg',
        quality: 0.4,
      });

      if (!photo.base64) {
        queueNextFrame();
        return;
      }

      const frameId = `${Date.now()}`;
      lastSentFrameIdRef.current = frameId;
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
          queueNextFrame();
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
        if (!manuallyStoppedRef.current && payload.frame_id === lastSentFrameIdRef.current) {
          queueNextFrame();
        }
      };

      socket.onerror = () => {
        setError(
          'Live detection socket failed. Check that the EC2 websocket endpoint is reachable from the phone.',
        );
        stopStreaming(false);
      };

      socket.onclose = () => {
        clearLoop();
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
    <Screen contentContainerStyle={styles.container} scrollEnabled={false}>
      <View style={styles.previewCard}>
        {permission?.granted ? (
          <DetectionOverlay
            boxes={prediction?.boxes ?? []}
            imageHeight={prediction?.imageHeight}
            imageWidth={prediction?.imageWidth}
            style={styles.previewFrame}
          >
            <CameraView
              active
              facing="back"
              mode="picture"
              mirror={false}
              onCameraReady={() => setCameraReady(true)}
              onMountError={(mountError) => setError(mountError.message)}
              pictureSize="640x480"
              ratio={(Platform.OS === 'android' ? ('4:3' as CameraRatio) : undefined)}
              ref={cameraRef}
              style={styles.camera}
            />
          </DetectionOverlay>
        ) : (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionBody}>
              Grant camera permission to start live detection and draw borders on the preview.
            </Text>
            <AppButton label="Allow camera" onPress={() => void requestPermission()} />
          </View>
        )}
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Live detection</Text>
        <Text style={styles.statusBody}>{statusText}</Text>
        <View style={styles.metricRow}>
          <MetricCard
            label="Class"
            value={formatClassification(prediction?.classification)}
          />
          <MetricCard
            label="Coverage"
            value={
              prediction?.coveragePercent != null
                ? `${prediction.coveragePercent}%`
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
            label="Class conf."
            value={
              prediction?.classificationConfidence != null
                ? `${Math.round(prediction.classificationConfidence * 100)}%`
                : '--'
            }
          />
          <MetricCard
            label="Det. conf."
            value={
              prediction?.detectionConfidence != null
                ? `${Math.round(prediction.detectionConfidence * 100)}%`
                : '--'
            }
          />
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
            <ActivityIndicator color={palette.brandDeep} />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function formatClassification(value?: string) {
  if (value === 'water_hyacinth') {
    return 'Detected';
  }

  if (value === 'non_water_hyacinth') {
    return 'Clear';
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
    backgroundColor: palette.surface,
    borderColor: palette.border,
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
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  permissionBody: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  statusBody: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 12,
  },
  metricValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  metricLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
});



