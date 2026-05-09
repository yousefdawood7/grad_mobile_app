import { Redirect } from 'expo-router';

import { FullScreenLoader } from '../src/components/ui/full-screen-loader';
import { useSession } from '../src/providers/session-provider';

export default function IndexRoute() {
  const { isReady, hasSeenOnboarding, authState } = useSession();

  if (!isReady) {
    return <FullScreenLoader label="Preparing your workspace..." />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (authState === 'anonymous') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Redirect href="/(app)/home" />;
}
