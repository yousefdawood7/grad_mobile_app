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
