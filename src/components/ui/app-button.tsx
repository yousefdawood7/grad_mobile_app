import { forwardRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { palette } from '../../theme/palette';

type ButtonTone = 'primary' | 'secondary' | 'surface' | 'ghost' | 'danger';

type AppButtonProps = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  tone?: ButtonTone;
};

export const AppButton = forwardRef<View, AppButtonProps>(function AppButton(
  {
    disabled,
    label,
    loading,
    onPress,
    style,
    tone = 'primary',
  },
  ref,
) {
  const toneStyle = toneStyles[tone];
  const textStyle = textStyles[tone];

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        toneStyle,
        disabled ? styles.disabled : null,
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textStyle.color} />
      ) : (
        <Text style={[styles.label, textStyle]}>{label}</Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});

const toneStyles = StyleSheet.create({
  primary: {
    backgroundColor: palette.brand,
  },
  secondary: {
    backgroundColor: palette.brandDeep,
  },
  surface: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: palette.danger,
  },
});

const textStyles = StyleSheet.create({
  primary: {
    color: palette.white,
  },
  secondary: {
    color: palette.white,
  },
  surface: {
    color: palette.text,
  },
  ghost: {
    color: palette.brandDeep,
  },
  danger: {
    color: palette.white,
  },
});
