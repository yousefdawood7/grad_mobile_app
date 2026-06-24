import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../providers/theme-provider';

const tips = [
  'Use bright, even lighting whenever possible.',
  'Keep the plant centered and in clear focus.',
  'Include leaves, stems, and flowers when they are visible.',
];

export function TipsCard() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.successSoft }]}>
      <Text style={[styles.title, { color: colors.success }]}>Tips for better scans</Text>
      {tips.map((tip) => (
        <View key={tip} style={styles.tipRow}>
          <View style={[styles.tipDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.tip, { color: colors.text }]}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: 24,
    gap: 10,
    padding: 18,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  tipRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  tipDot: {
    borderCurve: 'continuous',
    borderRadius: 99,
    height: 7,
    marginTop: 6,
    width: 7,
  },
  tip: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
