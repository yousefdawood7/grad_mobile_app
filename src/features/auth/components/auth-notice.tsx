import { StyleSheet, Text, View } from 'react-native';

import { useSession } from '../../../providers/session-provider';
import { palette } from '../../../theme/palette';

export function AuthNotice() {
  const { isSupabaseConfigured } = useSession();

  return (
    <View style={[styles.container, isSupabaseConfigured ? styles.ready : styles.pending]}>
      <Text style={[styles.title, isSupabaseConfigured ? styles.readyText : styles.pendingText]}>
        {isSupabaseConfigured ? 'Secure sync is available' : 'Sign-in unavailable'}
      </Text>
      <Text style={styles.body}>
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
  ready: {
    backgroundColor: palette.successSoft,
  },
  pending: {
    backgroundColor: palette.warningSoft,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  readyText: {
    color: palette.success,
  },
  pendingText: {
    color: palette.warning,
  },
  body: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
