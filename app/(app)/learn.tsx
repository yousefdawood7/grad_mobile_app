import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../src/components/ui/screen';
import { useTheme } from '../../src/providers/theme-provider';

const impactItems = [
  'Blocks waterways and slows irrigation and navigation.',
  'Reduces oxygen levels and blocks sunlight, harming aquatic life.',
  'Can double in size quickly under favorable conditions.',
];

export default function LearnScreen() {
  const { colors } = useTheme();

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Why this plant matters</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Water hyacinth spreads rapidly across canals, rivers, and lakes. Fast
          identification helps teams respond before dense mats disrupt water
          flow, fisheries, and biodiversity.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About Water Hyacinth</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Water hyacinth is a floating aquatic plant native to South America.
          It spreads aggressively and is widely recognized as one of the most
          problematic invasive plant species in freshwater systems.
        </Text>
        <View style={[styles.highlightBox, { backgroundColor: colors.dangerSoft }]}>
          <Text style={[styles.highlightText, { color: colors.danger }]}>
            Early detection gives removal teams a much better chance of limiting
            spread.
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Environmental Impact</Text>
        {impactItems.map((item) => (
          <View key={item} style={[styles.impactItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.impactText, { color: colors.text }]}>{item}</Text>
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
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  card: {
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
  highlightBox: {
    borderCurve: 'continuous',
    borderRadius: 18,
    padding: 14,
  },
  highlightText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  impactItem: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  impactText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
