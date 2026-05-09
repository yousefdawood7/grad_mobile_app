const { expo } = require('./app.json');

const googleIosClientId =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? expo.extra.googleIosClientId ?? '';
const googleIosUrlScheme =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ?? expo.extra.googleIosUrlScheme ?? '';
const googleWebClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? expo.extra.googleWebClientId ?? '';

const plugins = [
  'expo-router',
  [
    'expo-web-browser',
    {
      experimentalLauncherActivity: false,
    },
  ],
];

if (googleIosUrlScheme) {
  plugins.push([
    '@react-native-google-signin/google-signin',
    {
      iosUrlScheme: googleIosUrlScheme,
    },
  ]);
}

module.exports = {
  expo: {
    ...expo,
    extra: {
      ...expo.extra,
      googleIosClientId,
      googleIosUrlScheme,
      googleWebClientId,
    },
    plugins,
  },
};
