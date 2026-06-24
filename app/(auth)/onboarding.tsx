import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../src/components/ui/app-button';
import { Screen } from '../../src/components/ui/screen';
import { useSession } from '../../src/providers/session-provider';
import { useTheme } from '../../src/providers/theme-provider';

export default function OnboardingScreen() {
  const { completeOnboarding } = useSession();
  const { colors } = useTheme();

  const handleContinue = async () => {
    await completeOnboarding();
    router.replace('/(auth)/sign-in');
  };

  return (
    <Screen scrollEnabled={false} contentContainerStyle={[styles.container, { backgroundColor: colors.brandDeep }]}>
      <View style={styles.hero}>
        <View style={styles.iconBadge}>
          <Text style={[styles.iconGlyph, { color: colors.white }]}>WH</Text>
        </View>
        <Text style={[styles.title, { color: colors.white }]}>Water Hyacinth</Text>
        <Text style={[styles.subtitle, { color: colors.whiteMuted }]}>Field Classification</Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerTitle, { color: colors.white }]}>Fast identification for field teams</Text>
        <Text style={[styles.description, { color: colors.whiteMuted }]}>
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
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  footer: {
    gap: 18,
    paddingHorizontal: 24,
  },
  footerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
});
