import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Field } from '../../src/components/ui/field';
import { Screen } from '../../src/components/ui/screen';
import { useSession } from '../../src/providers/session-provider';
import { shadows } from '../../src/theme/palette';
import { useTheme } from '../../src/providers/theme-provider';

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyOtp } = useSession();
  const { colors } = useTheme();
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
        <View style={[styles.logoBadge, { backgroundColor: colors.brand }]}>
          <Text style={[styles.logoText, { color: colors.white }]}>WH</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Verify OTP</Text>
        <Text style={[styles.cardBody, { color: colors.textMuted }]}>
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
    borderCurve: 'continuous',
    borderRadius: 22,
    ...shadows.strong,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  card: {
    borderCurve: 'continuous',
    borderRadius: 30,
    borderWidth: 1,
    ...shadows.soft,
    gap: 14,
    padding: 22,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});
