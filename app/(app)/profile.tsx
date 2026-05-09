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

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
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

    // Sync local state with the permanent URL from the server
    if (user.avatarUrl) {
      setAvatarUri(user.avatarUrl);
    }
  };

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

            {/* Avatar row — photo + pick button side by side */}
            <View style={styles.avatarRow}>
              {avatarUri ? (
                <View style={styles.avatarWrap}>
                  <Image
                    contentFit="cover"
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    transition={200}
                  />
                </View>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>No photo</Text>
                </View>
              )}
              <AppButton
                label={avatarUri ? 'Change photo' : 'Choose photo'}
                onPress={pickPhoto}
                tone="surface"
              />
            </View>

            <AppButton
              label="Save profile"
              loading={isSaving}
              onPress={saveProfile}
            />
            {profileError ? (
              <Text style={styles.errorText}>{profileError}</Text>
            ) : null}
            {profileMessage ? (
              <Text style={styles.successText}>{profileMessage}</Text>
            ) : null}
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
    gap: 10,
    padding: 20,
  },
  title: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
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
  avatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  avatarWrap: {
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 40,
    borderWidth: 2,
    height: 80,
    overflow: 'hidden',
    width: 80,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 40,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  avatarPlaceholderText: {
    color: palette.textSoft,
    fontSize: 11,
    fontWeight: '600',
  },
});
