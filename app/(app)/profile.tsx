import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Field } from '../../src/components/ui/field';
import { Screen } from '../../src/components/ui/screen';
import { getProfile } from '../../src/features/profile/repository';
import { useSession } from '../../src/providers/session-provider';
import { palette } from '../../src/theme/palette';

export default function ProfileScreen() {
  const {
    authState,
    signOut,
    updateProfile,
    user,
    userLabel,
  } = useSession();
  const [fullName, setFullName] = useState(user.fullName ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user.avatarUrl ?? null);
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
        setAvatarUri(profile.avatarUrl ?? user.avatarUrl ?? null);
      } catch {
        if (mounted) {
          setFullName(user.fullName ?? '');
          setAvatarUri(user.avatarUrl ?? null);
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

            <Text style={styles.itemTitle}>Profile photo</Text>
            {avatarUri ? (
              <Image
                contentFit="cover"
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                transition={200}
              />
            ) : null}
            <AppButton
              label={avatarUri ? 'Change photo' : 'Choose a photo'}
              onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  allowsEditing: true,
                  aspect: [1, 1],
                  mediaTypes: ['images'],
                  quality: 0.85,
                });

                if (!result.canceled && result.assets[0]) {
                  setAvatarUri(result.assets[0].uri);
                }
              }}
              tone="surface"
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
                  avatarUrl: avatarUri ?? null,
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
            Sign in to edit your profile details.
          </Text>
        )}
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
  avatarImage: {
    alignSelf: 'flex-start',
    height: 90,
    width: 90,
    borderCurve: 'continuous',
    borderRadius: 20,
  },
});
