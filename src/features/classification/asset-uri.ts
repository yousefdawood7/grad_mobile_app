import { Platform } from 'react-native';

export async function createPersistentAssetUri(uri: string) {
  if (Platform.OS !== 'web' || !uri.startsWith('blob:')) {
    return uri;
  }

  const response = await fetch(uri);
  const blob = await response.blob();

  return blobToDataUrl(blob);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Unable to persist selected image.'));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read selected image.'));
    };

    reader.readAsDataURL(blob);
  });
}
