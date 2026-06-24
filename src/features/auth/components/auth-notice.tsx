import { StyleSheet, Text, View } from 'react-native';

import { useSession } from '../../../providers/session-provider';
import { useTheme } from '../../../providers/theme-provider';

export function AuthNotice() {
  const { isSupabaseConfigured } = useSession();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isSupabaseConfigured
            ? colors.successSoft
            : colors.warningSoft,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: isSupabaseConfigured
              ? colors.success
              : colors.warning,
          },
        ]}
      >
        {isSupabaseConfigured ? 'Secure sync is available' : 'Sign-in unavailable'}
      </Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        {isSupabaseConfigured
          ? 'Google, email, and saved history are ready to use.'
          : 'Authentication is not configured on this build. Contact your administrator.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderCurve: 'continuous',
    borderRadius: 18,
    gap: 6,
    padding: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
});
