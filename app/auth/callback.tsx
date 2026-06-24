import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { FullScreenLoader } from '../../src/components/ui/full-screen-loader';
import { Screen } from '../../src/components/ui/screen';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/providers/theme-provider';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolvedParams = useMemo(() => {
    const values = {
      code: typeof params.code === 'string' ? params.code : undefined,
      error: typeof params.error === 'string' ? params.error : undefined,
      error_description:
        typeof params.error_description === 'string'
          ? params.error_description
          : undefined,
    };

    if (Platform.OS !== 'web') {
      return values;
    }

    const currentUrl = new URL(window.location.href);

    return {
      code: values.code ?? currentUrl.searchParams.get('code') ?? undefined,
      error: values.error ?? currentUrl.searchParams.get('error') ?? undefined,
      error_description:
        values.error_description ??
        currentUrl.searchParams.get('error_description') ??
        undefined,
    };
  }, [params.code, params.error, params.error_description]);

  useEffect(() => {
    let mounted = true;

    const completeAuth = async () => {
      if (!supabase) {
        if (mounted) {
          setErrorMessage('Authentication service is not available.');
        }
        return;
      }

      if (resolvedParams.error_description) {
        if (mounted) {
          setErrorMessage(resolvedParams.error_description);
        }
        return;
      }

      if (resolvedParams.error) {
        if (mounted) {
          setErrorMessage(resolvedParams.error);
        }
        return;
      }

      if (!resolvedParams.code) {
        if (mounted) {
          setErrorMessage('Google sign-in did not return an authorization code.');
        }
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(
        resolvedParams.code,
      );

      if (error) {
        // If the code was already exchanged by the session provider, we might already have a session.
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          if (Platform.OS === 'web') {
            window.location.replace('/');
          } else {
            router.replace('/(app)/home');
          }
          return;
        }

        if (mounted) {
          setErrorMessage(error.message);
        }
        return;
      }

      if (Platform.OS === 'web') {
        window.location.replace('/');
        return;
      }

      router.replace('/(app)/home');
    };

    completeAuth().catch((error) => {
      if (mounted) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to complete sign-in.',
        );
      }
    });

    return () => {
      mounted = false;
    };
  }, [resolvedParams.code, resolvedParams.error, resolvedParams.error_description]);

  const { colors } = useTheme();

  if (!errorMessage) {
    return (
      <FullScreenLoader
        label="Completing sign-in"
        secondaryLabel="Please wait while we finish your Google session."
      />
    );
  }

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Sign-in could not be completed</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>{errorMessage}</Text>
        <AppButton
          label="Back to sign in"
          onPress={() => router.replace('/(auth)/sign-in')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 22,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
});
