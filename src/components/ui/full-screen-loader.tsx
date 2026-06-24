import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from './screen';
import { useTheme } from '../../providers/theme-provider';

type FullScreenLoaderProps = {
  children?: React.ReactNode;
  label: string;
  secondaryLabel?: string;
};

export function FullScreenLoader({
  children,
  label,
  secondaryLabel,
}: FullScreenLoaderProps) {
  const { colors } = useTheme();

  return (
    <Screen contentContainerStyle={styles.container} scrollEnabled={false}>
      <View style={styles.rings}>
        <View style={[styles.ringOuter, { borderColor: colors.info }]}>
          <View style={[styles.ringMiddle, { borderColor: colors.info }]}>
            <View style={[styles.ringInner, { backgroundColor: colors.info }]}>
              <ActivityIndicator color={colors.white} />
            </View>
          </View>
        </View>
      </View>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {secondaryLabel ? (
        <Text style={[styles.secondaryLabel, { color: colors.textMuted }]}>{secondaryLabel}</Text>
      ) : null}
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  rings: {
    marginBottom: 18,
  },
  ringOuter: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 2,
    height: 132,
    justifyContent: 'center',
    width: 132,
  },
  ringMiddle: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 2,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  ringInner: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  label: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryLabel: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
});
