import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { palette } from '../../theme/palette';

type FieldProps = TextInputProps & {
  error?: string;
  label: string;
};

export function Field({ error, label, ...props }: FieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={palette.textSoft}
        style={[styles.input, error ? styles.inputError : null]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    color: palette.text,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: palette.danger,
  },
  error: {
    color: palette.danger,
    fontSize: 12,
    fontWeight: '600',
  },
});
