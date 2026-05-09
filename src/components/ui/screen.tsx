import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, ScrollViewProps, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '../../theme/palette';

type ScreenProps = PropsWithChildren<{
  contentContainerStyle?: ViewStyle;
  scrollEnabled?: boolean;
}> &
  Omit<ScrollViewProps, 'contentContainerStyle'>;

export function Screen({
  children,
  contentContainerStyle,
  scrollEnabled = true,
  ...props
}: ScreenProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoiding} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.content, contentContainerStyle]}
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={false}
          {...props}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
