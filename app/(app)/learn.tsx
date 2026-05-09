import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../src/components/ui/screen';
import { palette } from '../../src/theme/palette';

const impactItems = [
  'Blocks waterways and slows irrigation and navigation.',
  'Reduces oxygen levels and blocks sunlight, harming aquatic life.',
  'Can double in size quickly under favorable conditions.',
];

export default function LearnScreen() {
  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Why this plant matters</Text>
        <Text style={styles.body}>
          Water hyacinth spreads rapidly across canals, rivers, and lakes. Fast
          identification helps teams respond before dense mats disrupt water
          flow, fisheries, and biodiversity.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About Water Hyacinth</Text>
        <Text style={styles.body}>
          Water hyacinth is a floating aquatic plant native to South America.
          It spreads aggressively and is widely recognized as one of the most
          problematic invasive plant species in freshwater systems.
        </Text>
        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            Early detection gives removal teams a much better chance of limiting
            spread.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Environmental Impact</Text>
        {impactItems.map((item) => (
          <View key={item} style={styles.impactItem}>
            <Text style={styles.impactText}>{item}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 20,
  },
  heroTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '700',
  },
  body: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  highlightBox: {
    backgroundColor: palette.dangerSoft,
    borderCurve: 'continuous',
    borderRadius: 18,
    padding: 14,
  },
  highlightText: {
    color: palette.danger,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  impactItem: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  impactText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
