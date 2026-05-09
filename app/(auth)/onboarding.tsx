import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Screen } from '../../src/components/ui/screen';
import { useSession } from '../../src/providers/session-provider';
import { palette } from '../../src/theme/palette';

export default function OnboardingScreen() {
  const { completeOnboarding } = useSession();

  const handleContinue = async () => {
    await completeOnboarding();
    router.replace('/(auth)/sign-in');
  };

  return (
    <Screen scrollEnabled={false} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.iconBadge}>
          <Text style={styles.iconGlyph}>WH</Text>
        </View>
        <Text style={styles.title}>Water Hyacinth</Text>
        <Text style={styles.subtitle}>Field Classification</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Fast identification for field teams</Text>
        <Text style={styles.description}>
          Capture or upload plant photos, review confidence scores, and keep a
          history of observations tied to your account.
        </Text>
        <AppButton label="Get started" onPress={handleContinue} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.brandDeep,
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingTop: 40,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 96,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderCurve: 'continuous',
    borderRadius: 28,
    height: 86,
    justifyContent: 'center',
    width: 86,
  },
  iconGlyph: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    color: palette.white,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.whiteMuted,
    fontSize: 18,
    fontWeight: '500',
  },
  footer: {
    gap: 18,
    paddingHorizontal: 24,
  },
  footerTitle: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: palette.whiteMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
