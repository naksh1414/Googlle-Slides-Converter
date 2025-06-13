'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GoogleSignInButton } from './GoogleSignInButton';
import { UserProfile } from './UserProfile';
import { useGoogleOAuth } from './GoogleOAuthProvider';

interface AuthenticationStepProps {
  stepNumber: number;
  onAuthenticated?: () => void;
}

export function AuthenticationStep({ stepNumber, onAuthenticated }: AuthenticationStepProps) {
  const { isAuthenticated, isLoading } = useGoogleOAuth();

  React.useEffect(() => {
    if (isAuthenticated && onAuthenticated) {
      onAuthenticated();
    }
  }, [isAuthenticated, onAuthenticated]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <span className="text-blue-600 dark:text-blue-400 font-semibold">{stepNumber}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Connect Google Account
        </h3>
      </div>

      {!isAuthenticated ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
        >
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Google Account Required
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Connect your Google account to export presentations to Google Slides
              </p>
            </div>
            <GoogleSignInButton />
          </div>
        </motion.div>
      ) : (
        <UserProfile />
      )}

      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Connecting to Google...
          </div>
        </div>
      )}
    </div>
  );
}