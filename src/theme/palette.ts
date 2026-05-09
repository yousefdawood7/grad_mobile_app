export const palette = {
  background: '#F6FBFA',
  border: '#D8E5E2',
  brand: '#0F9F77',
  brandDeep: '#0B83C8',
  danger: '#E24A4A',
  dangerSoft: '#FFE9E7',
  info: '#1C9EE9',
  success: '#177A61',
  successSoft: '#ECF8F4',
  surface: '#FFFFFF',
  text: '#152626',
  textMuted: '#54706D',
  textSoft: '#87A09C',
  warning: '#A25B00',
  warningSoft: '#FFF2DF',
  white: '#FFFFFF',
  whiteMuted: 'rgba(255,255,255,0.78)',
} as const;

/**
 * Platform-aware shadow presets.
 * Spread these into StyleSheet styles: `...shadows.soft`
 */
export const shadows = {
  soft: {
    shadowColor: '#104940',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  strong: {
    shadowColor: '#0C6654',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
