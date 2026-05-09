import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../../../theme/palette';

const tips = [
  'Use bright, even lighting whenever possible.',
  'Keep the plant centered and in clear focus.',
  'Include leaves, stems, and flowers when they are visible.',
];

export function TipsCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tips for better scans</Text>
      {tips.map((tip) => (
        <View key={tip} style={styles.tipRow}>
          <View style={styles.tipDot} />
          <Text style={styles.tip}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.successSoft,
    borderCurve: 'continuous',
    borderRadius: 24,
    gap: 10,
    padding: 18,
  },
  title: {
    color: palette.success,
    fontSize: 14,
    fontWeight: '800',
  },
  tipRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  tipDot: {
    backgroundColor: palette.success,
    borderCurve: 'continuous',
    borderRadius: 99,
    height: 7,
    marginTop: 6,
    width: 7,
  },
  tip: {
    color: palette.text,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
