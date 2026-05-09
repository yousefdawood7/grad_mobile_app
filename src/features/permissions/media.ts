import * as ImagePicker from 'expo-image-picker';

type PermissionResult = { granted: true } | { granted: false; message: string };

export async function ensureCameraPermission(): Promise<PermissionResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (permission.granted) {
    return { granted: true };
  }

  return {
    granted: false,
    message:
      'Camera permission is required to take a photo for classification.',
  };
}

export async function ensureMediaLibraryPermission(): Promise<PermissionResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (permission.granted) {
    return { granted: true };
  }

  return {
    granted: false,
    message:
      'Photo library permission is required to upload an image from your gallery.',
  };
}
