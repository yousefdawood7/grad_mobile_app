import { Platform } from 'react-native';

import { supabase } from '../../lib/supabase';

export type ProfileRecord = {
  avatarUrl: string | null;
  fullName: string | null;
  id: string;
};

type ProfileRow = {
  avatar_url: string | null;
  full_name: string | null;
  id: string;
};

const AVATARS_BUCKET = 'avatars';

export async function getProfile(userId: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapProfile(data);
}

/**
 * Upload an avatar image to Supabase Storage and return the public URL.
 *
 * Handles both web (blob:/data: URIs → File) and native (file:// URIs → fetch → blob).
 */
export async function uploadAvatar(
  userId: string,
  localUri: string,
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  // If the URI is already a remote URL (https://), no need to upload
  if (localUri.startsWith('https://') || localUri.startsWith('http://')) {
    return localUri;
  }

  const fileExt = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  let fileBody: Blob | ArrayBuffer;

  if (Platform.OS === 'web') {
    // On web, fetch the blob: or data: URI and get the blob
    const response = await fetch(localUri);
    fileBody = await response.blob();
  } else {
    // On native, fetch the file:// URI
    const response = await fetch(localUri);
    fileBody = await response.arrayBuffer();
  }

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(filePath, fileBody, {
      contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function upsertProfile(
  userId: string,
  values: { avatarUrl: string | null; fullName: string | null },
) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const payload = {
    avatar_url: values.avatarUrl,
    full_name: values.fullName,
    id: userId,
  };

  const { error } = await supabase.from('profiles').upsert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

function mapProfile(row: ProfileRow): ProfileRecord {
  return {
    avatarUrl: row.avatar_url,
    fullName: row.full_name,
    id: row.id,
  };
}

