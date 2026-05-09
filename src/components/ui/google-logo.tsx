import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

type GoogleLogoProps = {
  size?: number;
};

const googleLogo = require('../../../assets/google.svg');

export function GoogleLogo({ size = 18 }: GoogleLogoProps) {
  return (
    <Image
      contentFit="contain"
      source={googleLogo}
      style={[styles.image, { height: size, width: size }]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
  },
});
