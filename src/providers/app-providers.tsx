import { PropsWithChildren } from 'react';

import { ClassificationProvider } from './classification-provider';
import { SessionProvider } from './session-provider';
import { ThemeProvider } from './theme-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ClassificationProvider>{children}</ClassificationProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
