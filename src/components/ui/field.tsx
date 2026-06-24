import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { useTheme } from '../../providers/theme-provider';

type FieldProps = TextInputProps & {
  error?: string;
  label: string;
};

export function Field({ error, label, ...props }: FieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSoft}
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: error ? colors.danger : colors.border,
            color: colors.text,
          },
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
  },
});
