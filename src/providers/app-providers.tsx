import { PropsWithChildren } from 'react';

import { ClassificationProvider } from './classification-provider';
import { SessionProvider } from './session-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <ClassificationProvider>{children}</ClassificationProvider>
    </SessionProvider>
  );
}
