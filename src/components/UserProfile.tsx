'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import { useGoogleOAuth } from './GoogleOAuthProvider';
import Image from 'next/image';
export function UserProfile() {
  const { userInfo, logout, isAuthenticated } = useGoogleOAuth();

  if (!isAuthenticated || !userInfo) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
    >
      <div className="flex items-center gap-3">
        {userInfo.picture ? (
          <Image
            src={userInfo.picture}
            alt={userInfo.name}
            className="w-8 h-8 rounded-full"
            width={32}
            height={32}
          />
        ) : (
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            {userInfo.name || userInfo.email}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Connected to Google
          </p>
        </div>
      </div>
      
      <button
        onClick={logout}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <LogOut className="w-3 h-3" />
        Disconnect
      </button>
    </motion.div>
  );
}