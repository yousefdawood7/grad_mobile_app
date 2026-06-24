import { forwardRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useTheme } from '../../providers/theme-provider';

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
  const { colors } = useTheme();
  const toneStyle = getToneStyle(tone, colors);
  const textStyle = getTextStyle(tone, colors);

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

const getToneStyle = (tone: ButtonTone, colors: any): ViewStyle => {
  switch (tone) {
    case 'primary':
      return { backgroundColor: colors.brand };
    case 'secondary':
      return { backgroundColor: colors.brandDeep };
    case 'surface':
      return {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
      };
    case 'ghost':
      return { backgroundColor: 'transparent' };
    case 'danger':
      return { backgroundColor: colors.danger };
  }
};

const getTextStyle = (tone: ButtonTone, colors: any) => {
  switch (tone) {
    case 'primary':
    case 'secondary':
    case 'danger':
      return { color: colors.white };
    case 'surface':
      return { color: colors.text };
    case 'ghost':
      return { color: colors.brandDeep };
  }
};
