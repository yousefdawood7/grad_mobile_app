import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FullScreenLoader } from '../../src/components/ui/full-screen-loader';
import { Screen } from '../../src/components/ui/screen';
import { useClassification } from '../../src/providers/classification-provider';
import { useTheme } from '../../src/providers/theme-provider';

export default function AnalyzingScreen() {
  const { analyzePendingAsset, pendingAsset } = useClassification();
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const { colors } = useTheme();
  const steps = [
    'Preparing image',
    'Sending image to the analysis service',
    'Building result summary',
  ];

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    const run = async () => {
      if (!pendingAsset) {
        router.replace('/(app)/upload');
        return;
      }

      const result = await analyzePendingAsset();

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.replace(`/(app)/result/${result.record.id}`);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <Screen contentContainerStyle={styles.container}>
        <View style={[styles.errorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.errorTitle, { color: colors.danger }]}>Analysis failed</Text>
          <Text style={[styles.errorBody, { color: colors.textMuted }]}>{error}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <FullScreenLoader
      label="Analyzing image..."
      secondaryLabel="Please wait while we process the image and generate a result."
    >
      <View style={styles.steps}>
        {steps.map((step) => (
          <View key={step} style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: colors.brand }]} />
            <Text style={[styles.stepText, { color: colors.textMuted }]}>{step}</Text>
          </View>
        ))}
      </View>
    </FullScreenLoader>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  steps: {
    gap: 14,
    marginTop: 28,
  },
  stepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  stepDot: {
    borderCurve: 'continuous',
    borderRadius: 99,
    height: 10,
    width: 10,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorCard: {
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    gap: 10,
    padding: 22,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  errorBody: {
    fontSize: 14,
    lineHeight: 21,
  },
});
