import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Screen } from '../../src/components/ui/screen';
import { createPersistentAssetUri } from '../../src/features/classification/asset-uri';
import { TipsCard } from '../../src/features/classification/components/tips-card';
import { ensureCameraPermission } from '../../src/features/permissions/media';
import { useClassification } from '../../src/providers/classification-provider';
import { useTheme } from '../../src/providers/theme-provider';

export default function CaptureScreen() {
  const { pendingAsset, queuePendingAsset } = useClassification();
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const { colors } = useTheme();

  const handleTakePhoto = async () => {
    setPermissionMessage(null);
    const permission = await ensureCameraPermission();

    if (!permission.granted) {
      setPermissionMessage(permission.message);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const persistentUri = await createPersistentAssetUri(result.assets[0].uri);

    queuePendingAsset({
      mimeType: result.assets[0].mimeType ?? 'image/jpeg',
      name: result.assets[0].fileName ?? 'captured-image.jpg',
      source: 'camera',
      uploadUri: result.assets[0].uri,
      uri: persistentUri,
    });

    router.push('/(app)/analyzing');
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {pendingAsset ? (
          <Image
            contentFit="cover"
            source={{ uri: pendingAsset.uri }}
            style={styles.previewImage}
            transition={200}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Choose detection mode</Text>
            <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
              Take a still photo for a saved result, or open live detection to
              stream frames and see borders update in real time.
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppButton label="Take photo" onPress={handleTakePhoto} />
        <Link href="/(app)/live-detect" asChild>
          <AppButton label="Open live detection" tone="secondary" />
        </Link>
        {permissionMessage ? (
          <Text style={[styles.permissionText, { color: colors.warning }]}>{permissionMessage}</Text>
        ) : null}
      </View>

      <TipsCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  previewCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 28,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 320,
    overflow: 'hidden',
    padding: 18,
  },
  previewImage: {
    borderCurve: 'continuous',
    borderRadius: 24,
    height: 280,
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  actionCard: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  permissionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
