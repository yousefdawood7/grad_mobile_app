import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Screen } from '../../src/components/ui/screen';
import { createPersistentAssetUri } from '../../src/features/classification/asset-uri';
import { TipsCard } from '../../src/features/classification/components/tips-card';
import { ensureMediaLibraryPermission } from '../../src/features/permissions/media';
import { useClassification } from '../../src/providers/classification-provider';
import { useTheme } from '../../src/providers/theme-provider';

export default function UploadScreen() {
  const { pendingAsset, queuePendingAsset } = useClassification();
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const { colors } = useTheme();

  const navigateToAnalysis = () => {
    router.push('/(app)/analyzing');
  };

  const handleGallery = async () => {
    setPermissionMessage(null);
    const permission = await ensureMediaLibraryPermission();

    if (!permission.granted) {
      setPermissionMessage(permission.message);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
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
      name: result.assets[0].fileName ?? 'gallery-image.jpg',
      source: 'gallery',
      uploadUri: result.assets[0].uri,
      uri: persistentUri,
    });

    navigateToAnalysis();
  };

  const handleFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ['image/*'],
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const persistentUri = await createPersistentAssetUri(result.assets[0].uri);

    queuePendingAsset({
      mimeType: result.assets[0].mimeType ?? 'image/jpeg',
      name: result.assets[0].name,
      source: 'file',
      uploadUri: result.assets[0].uri,
      uri: persistentUri,
    });

    navigateToAnalysis();
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
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Choose a photo</Text>
            <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
              Import an image from your gallery or files to analyze it.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.dualActions}>
        <AppButton label="Open gallery" onPress={handleGallery} tone="secondary" />
        <AppButton label="Browse files" onPress={handleFile} tone="surface" />
      </View>
      {permissionMessage ? (
        <Text style={[styles.permissionText, { color: colors.warning }]}>{permissionMessage}</Text>
      ) : null}

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
    minHeight: 280,
    overflow: 'hidden',
    padding: 18,
  },
  previewImage: {
    borderCurve: 'continuous',
    borderRadius: 24,
    height: 240,
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
    lineHeight: 20,
    textAlign: 'center',
  },
  dualActions: {
    flexDirection: 'row',
    gap: 12,
  },
  permissionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
