import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Field } from '../../src/components/ui/field';
import { Screen } from '../../src/components/ui/screen';
import { getProfile } from '../../src/features/profile/repository';
import { useClassification } from '../../src/providers/classification-provider';
import { useSession } from '../../src/providers/session-provider';
import { palette } from '../../src/theme/palette';

export default function ProfileScreen() {
  const {
    authState,
    isSupabaseConfigured,
    signOut,
    updateProfile,
    user,
    userLabel,
  } = useSession();
  const { backendMode, historyError, historyStorageMode } = useClassification();
  const [fullName, setFullName] = useState(user.fullName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (authState !== 'authenticated' || !user.id) {
        return;
      }

      try {
        const profile = await getProfile(user.id);

        if (!mounted || !profile) {
          return;
        }

        setFullName(profile.fullName ?? user.fullName ?? '');
        setAvatarUrl(profile.avatarUrl ?? user.avatarUrl ?? '');
      } catch {
        if (mounted) {
          setFullName(user.fullName ?? '');
          setAvatarUrl(user.avatarUrl ?? '');
        }
      }
    };

    loadProfile().catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [authState, user.avatarUrl, user.fullName, user.id]);

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.itemTitle}>Current mode</Text>
        <Text style={styles.itemBody}>
          {authState === 'authenticated' ? 'Signed in' : 'Guest mode'}
        </Text>
        <Text style={styles.itemTitle}>Identity</Text>
        <Text style={styles.itemBody}>{userLabel}</Text>
        <Text style={styles.itemTitle}>Email</Text>
        <Text style={styles.itemBody}>{user.email ?? 'No email available'}</Text>
        <Text style={styles.itemTitle}>User ID</Text>
        <Text style={styles.itemBody}>{user.id ?? 'No authenticated user'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Profile details</Text>
        {authState === 'authenticated' ? (
          <>
            <Field
              label="Full name"
              onChangeText={setFullName}
              placeholder="Your full name"
              value={fullName}
            />
            <Field
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              label="Avatar URL"
              onChangeText={setAvatarUrl}
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
            />
            {profileError ? (
              <Text style={styles.errorText}>{profileError}</Text>
            ) : null}
            {profileMessage ? (
              <Text style={styles.successText}>{profileMessage}</Text>
            ) : null}
            <AppButton
              label="Save profile"
              loading={isSaving}
              onPress={async () => {
                setIsSaving(true);
                setProfileError(null);
                setProfileMessage(null);

                const result = await updateProfile({
                  avatarUrl: avatarUrl.trim() || null,
                  fullName: fullName.trim() || null,
                });

                setIsSaving(false);

                if (!result.ok) {
                  setProfileError(result.message);
                  return;
                }

                setProfileMessage('Profile updated successfully.');
              }}
            />
          </>
        ) : (
          <Text style={styles.itemBody}>
            Sign in to edit your Supabase profile details.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Sync status</Text>
        <Text style={styles.itemTitle}>Supabase configuration</Text>
        <Text style={styles.itemBody}>
          {isSupabaseConfigured
            ? 'Configured. Google, email, OTP, and saved history are available.'
            : 'Missing. Add the Supabase URL and publishable key in Expo config.'}
        </Text>
        <Text style={styles.itemTitle}>History storage</Text>
        <Text style={styles.itemBody}>
          {historyStorageMode === 'supabase'
            ? 'Primary history is synced with Supabase.'
            : 'History is currently using the on-device backup.'}
        </Text>
        {historyError ? (
          <>
            <Text style={styles.itemTitle}>Recent sync message</Text>
            <Text style={styles.warningText}>{historyError}</Text>
          </>
        ) : null}
        <Text style={styles.itemTitle}>Analysis mode</Text>
        <Text style={styles.itemBody}>
          {backendMode === 'remote'
            ? 'Images are being sent to the configured analysis service.'
            : 'Local fallback mode is active until a remote analysis URL is configured.'}
        </Text>
      </View>

      <AppButton label="Log out" onPress={signOut} tone="danger" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  title: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  itemTitle: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemBody: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 22,
  },
  warningText: {
    color: palette.warning,
    fontSize: 14,
    lineHeight: 21,
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  successText: {
    color: palette.success,
    fontSize: 13,
    fontWeight: '600',
  },
});
