import { Link, Redirect, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';

import { AppButton } from '../../src/components/ui/app-button';
import { Field } from '../../src/components/ui/field';
import { GoogleLogo } from '../../src/components/ui/google-logo';
import { Screen } from '../../src/components/ui/screen';
import { AuthNotice } from '../../src/features/auth/components/auth-notice';
import { signInSchema } from '../../src/features/auth/validation';
import { useSession } from '../../src/providers/session-provider';
import { palette, shadows } from '../../src/theme/palette';

export default function SignInScreen() {
  const {
    authState,
    continueAsGuest,
    isSupabaseConfigured,
    sendOtp,
    signIn,
    signInWithGoogle,
  } = useSession();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    control,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (authState !== 'anonymous') {
    return <Redirect href="/(app)/home" />;
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await signIn(values);

    if (!result.ok) {
      setError('root', { message: result.message });
      return;
    }

    router.replace('/(app)/home');
  });

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>WH</Text>
        </View>
        <Text style={styles.title}>Water Hyacinth Classification</Text>
        <Text style={styles.subtitle}>
          Sign in to save scan history across devices and keep your field records
          organized.
        </Text>
      </View>

      <View style={styles.card}>
        <AuthNotice />

        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="name@example.com"
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field
              autoCapitalize="none"
              autoComplete="password"
              label="Password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="At least 8 characters"
              secureTextEntry
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        {errors.root?.message ? (
          <Text style={styles.errorText}>{errors.root.message}</Text>
        ) : null}

        <View style={styles.actionGroup}>
          <AppButton
            disabled={!isSupabaseConfigured || isGoogleLoading}
            label={isSupabaseConfigured ? 'Sign in' : 'Configure Supabase first'}
            loading={isSubmitting}
            onPress={onSubmit}
          />
          <AppButton
            disabled={!isSupabaseConfigured || isSubmitting || isGoogleLoading}
            label="Email me a login code"
            onPress={async () => {
              const email = getValues('email');

              if (!email) {
                setError('email', { message: 'Please enter your email first.' });
                return;
              }

              const result = await sendOtp(email);

              if (!result.ok) {
                setError('root', { message: result.message });
                return;
              }

              router.replace(
                `/(auth)/verify-otp?email=${encodeURIComponent(email)}`,
              );
            }}
            tone="surface"
          />
          <Pressable
            accessibilityRole="button"
            disabled={!isSupabaseConfigured || isSubmitting || isGoogleLoading}
            onPress={async () => {
              setIsGoogleLoading(true);
              const result = await signInWithGoogle();
              setIsGoogleLoading(false);

              if (!result.ok) {
                setError('root', { message: result.message });
                return;
              }

              if (!result.didRedirect) {
                router.replace('/(app)/home');
              }
            }}
            style={({ pressed }) => [
              styles.googleButton,
              (!isSupabaseConfigured || isSubmitting || isGoogleLoading) &&
                styles.googleButtonDisabled,
              pressed ? styles.googleButtonPressed : null,
            ]}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={palette.text} />
            ) : (
              <View style={styles.googleContent}>
                <GoogleLogo size={18} />
                <Text style={styles.googleLabel}>Continue with Google</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <Link href="/(auth)/sign-up" style={styles.link}>
          Create an account
        </Link>
        <AppButton
          label="Continue without signing in"
          onPress={continueAsGuest}
          tone="ghost"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logoBadge: {
    alignItems: 'center',
    backgroundColor: palette.brand,
    borderCurve: 'continuous',
    borderRadius: 22,
    ...shadows.strong,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  logoText: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '800',
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 520,
    textAlign: 'center',
  },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 30,
    borderWidth: 1,
    ...shadows.soft,
    gap: 16,
    padding: 22,
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  actionGroup: {
    gap: 12,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  googleContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  googleLabel: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  link: {
    color: palette.brandDeep,
    fontSize: 15,
    fontWeight: '700',
  },
});
