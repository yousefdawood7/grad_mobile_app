type GoogleLogoProps = {
  size?: number;
};

const googleLogoModule = require('../../../assets/google.svg');
const googleLogoSrc =
  typeof googleLogoModule === 'string'
    ? googleLogoModule
    : googleLogoModule?.default ?? googleLogoModule?.uri ?? '';

export function GoogleLogo({ size = 18 }: GoogleLogoProps) {
  return (
    <img
      alt="Google"
      draggable={false}
      src={googleLogoSrc}
      style={{
        display: 'block',
        flexShrink: 0,
        height: size,
        width: size,
      }}
    />
  );
}
