import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Field } from '../../src/components/ui/field';
import { Screen } from '../../src/components/ui/screen';
import { getProfile } from '../../src/features/profile/repository';
import { useSession } from '../../src/providers/session-provider';
import { useTheme } from '../../src/providers/theme-provider';

export default function ProfileScreen() {
  const {
    authState,
    signOut,
    updateProfile,
    user,
    userLabel,
  } = useSession();
  const { colors, themeMode, setThemeMode } = useTheme();
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
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Account</Text>
        
        <Text style={[styles.itemTitle, { color: colors.textMuted }]}>Current mode</Text>
        <Text style={[styles.itemBody, { color: colors.text }]}>
          {authState === 'authenticated' ? 'Signed in' : 'Guest mode'}
        </Text>
        
        <Text style={[styles.itemTitle, { color: colors.textMuted }]}>Identity</Text>
        <Text style={[styles.itemBody, { color: colors.text }]}>{userLabel}</Text>
        
        <Text style={[styles.itemTitle, { color: colors.textMuted }]}>Email</Text>
        <Text style={[styles.itemBody, { color: colors.text }]}>{user.email ?? 'No email available'}</Text>
        
        <Text style={[styles.itemTitle, { color: colors.textMuted }]}>User ID</Text>
        <Text style={[styles.itemBody, { color: colors.text }]}>{user.id ?? 'No authenticated user'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>App Theme</Text>
        <Text style={[styles.itemBody, { color: colors.textMuted, marginBottom: 8 }]}>
          Choose how the application colors look on your device.
        </Text>
        <View style={styles.themeGroup}>
          <AppButton
            label="System"
            onPress={() => setThemeMode('system')}
            tone={themeMode === 'system' ? 'primary' : 'surface'}
            style={styles.themeBtn}
          />
          <AppButton
            label="Light"
            onPress={() => setThemeMode('light')}
            tone={themeMode === 'light' ? 'primary' : 'surface'}
            style={styles.themeBtn}
          />
          <AppButton
            label="Dark"
            onPress={() => setThemeMode('dark')}
            tone={themeMode === 'dark' ? 'primary' : 'surface'}
            style={styles.themeBtn}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile details</Text>
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
                <View style={[styles.avatarWrap, { borderColor: colors.border }]}>
                  <Image
                    contentFit="cover"
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    transition={200}
                  />
                </View>
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.avatarPlaceholderText, { color: colors.textSoft }]}>No photo</Text>
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
              <Text style={[styles.errorText, { color: colors.danger }]}>{profileError}</Text>
            ) : null}
            {profileMessage ? (
              <Text style={[styles.successText, { color: colors.success }]}>{profileMessage}</Text>
            ) : null}
          </>
        ) : (
          <Text style={[styles.itemBody, { color: colors.text }]}>
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
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 10,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
  },
  avatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  avatarWrap: {
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
    borderCurve: 'continuous',
    borderRadius: 40,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  avatarPlaceholderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  themeGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  themeBtn: {
    flex: 1,
    minHeight: 46,
  },
});
