import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from './screen';
import { palette } from '../../theme/palette';

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
  return (
    <Screen contentContainerStyle={styles.container} scrollEnabled={false}>
      <View style={styles.rings}>
        <View style={styles.ringOuter}>
          <View style={styles.ringMiddle}>
            <View style={styles.ringInner}>
              <ActivityIndicator color={palette.white} />
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      {secondaryLabel ? <Text style={styles.secondaryLabel}>{secondaryLabel}</Text> : null}
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
    borderColor: palette.info,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 2,
    height: 132,
    justifyContent: 'center',
    width: 132,
  },
  ringMiddle: {
    alignItems: 'center',
    borderColor: palette.info,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 2,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  ringInner: {
    alignItems: 'center',
    backgroundColor: palette.info,
    borderCurve: 'continuous',
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  label: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryLabel: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
});
