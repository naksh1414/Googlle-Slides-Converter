'use client';

import React from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { GoogleOAuthProvider } from '@/components/GoogleOAuthProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <GoogleOAuthProvider>
        {children}
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}