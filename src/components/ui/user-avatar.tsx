import { Image } from 'expo-image';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { palette } from '../../theme/palette';

type UserAvatarProps = {
  avatarUrl: string | null;
  fullName: string | null;
  size?: number;
  style?: ViewStyle;
};

function getInitials(name: string | null): string {
  if (!name || name.trim().length === 0) {
    return '?';
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const PALETTE_COLORS = [
  '#0F9F77', // brand green
  '#0B83C8', // brand blue
  '#E24A4A', // red
  '#A25B00', // amber
  '#7C3AED', // purple
  '#D946EF', // pink
  '#059669', // emerald
  '#2563EB', // blue
] as const;

function getColorFromName(name: string | null): string {
  if (!name) {
    return PALETTE_COLORS[0];
  }

  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return PALETTE_COLORS[Math.abs(hash) % PALETTE_COLORS.length];
}

export function UserAvatar({
  avatarUrl,
  fullName,
  size = 56,
  style,
}: UserAvatarProps) {
  const borderRadius = size * 0.36;

  if (avatarUrl) {
    return (
      <View
        style={[
          {
            borderCurve: 'continuous',
            borderRadius,
            height: size,
            overflow: 'hidden',
            width: size,
          },
          style,
        ]}
      >
        <Image
          contentFit="cover"
          source={{ uri: avatarUrl }}
          style={{ height: size, width: size }}
          transition={200}
        />
      </View>
    );
  }

  const initials = getInitials(fullName);
  const backgroundColor = getColorFromName(fullName);

  return (
    <View
      style={[
        styles.initialsContainer,
        {
          backgroundColor,
          borderRadius,
          height: size,
          width: size,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initialsText,
          { fontSize: size * 0.38 },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  initialsContainer: {
    alignItems: 'center',
    borderCurve: 'continuous',
    justifyContent: 'center',
  },
  initialsText: {
    color: palette.white,
    fontWeight: '800',
  },
});
