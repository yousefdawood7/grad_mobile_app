import { Link, Redirect, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';

import { AppButton } from '../../src/components/ui/app-button';
import { Field } from '../../src/components/ui/field';
import { Screen } from '../../src/components/ui/screen';
import { AuthNotice } from '../../src/features/auth/components/auth-notice';
import { signUpSchema } from '../../src/features/auth/validation';
import { useSession } from '../../src/providers/session-provider';
import { palette, shadows } from '../../src/theme/palette';

export default function SignUpScreen() {
  const { authState, isSupabaseConfigured, signUp } = useSession();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
    },
  });

  if (authState !== 'anonymous') {
    return <Redirect href="/(app)/home" />;
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await signUp(values);

    if (!result.ok) {
      setError('root', { message: result.message });
      return;
    }

    router.replace(`/(auth)/verify-otp?email=${encodeURIComponent(values.email)}`);
  });

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.body}>
          Create an account with your name, email, and password. We will send a
          verification code to confirm your email address.
        </Text>

        <AuthNotice />

        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur, onChange, value } }) => (
            <Field
              autoCapitalize="words"
              autoComplete="name"
              label="Full name"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Your name"
              value={value}
              error={errors.fullName?.message}
            />
          )}
        />

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
              autoComplete="password-new"
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

        <AppButton
          disabled={!isSupabaseConfigured}
          label={isSupabaseConfigured ? 'Create account' : 'Configure Supabase first'}
          loading={isSubmitting}
          onPress={onSubmit}
        />

        <Link href="/(auth)/sign-in" style={styles.link}>
          Already have an account? Sign in
        </Link>
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
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 30,
    borderWidth: 1,
    ...shadows.soft,
    gap: 14,
    padding: 22,
  },
  title: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
  },
  body: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  link: {
    color: palette.brandDeep,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
