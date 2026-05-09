import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Field } from '../../src/components/ui/field';
import { Screen } from '../../src/components/ui/screen';
import { useSession } from '../../src/providers/session-provider';
import { palette, shadows } from '../../src/theme/palette';

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyOtp } = useSession();
  const [otpToken, setOtpToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email) return;

    if (otpToken.trim().length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    const result = await verifyOtp(email, otpToken.trim());
    
    setIsSubmitting(false);
    
    if (!result.ok) {
      setError(result.message || 'Failed to verify OTP');
      return;
    }

    router.replace('/(app)/home');
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>WH</Text>
        </View>
        <Text style={styles.title}>Check your email</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Verify OTP</Text>
        <Text style={styles.cardBody}>
          We sent a 6-digit verification code to {email}. Please enter it below.
        </Text>

        <Field
          label="OTP Code"
          placeholder="Enter 6 digit code"
          value={otpToken}
          onChangeText={setOtpToken}
          keyboardType="number-pad"
          error={error || undefined}
        />

        <AppButton
          label="Verify OTP"
          loading={isSubmitting}
          onPress={onSubmit}
        />
        
        <AppButton
          label="Back to Sign In"
          onPress={() => router.replace('/(auth)/sign-in')}
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
  },
  header: {
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
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
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
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
  cardTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardBody: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});
