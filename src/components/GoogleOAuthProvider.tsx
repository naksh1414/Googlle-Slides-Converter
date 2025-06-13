/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

interface GoogleOAuthContextType {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  error: string | null;
  userInfo: any | null;
}

const GoogleOAuthContext = createContext<GoogleOAuthContextType | undefined>(
  undefined
);

export function useGoogleOAuth() {
  const context = useContext(GoogleOAuthContext);
  if (context === undefined) {
    throw new Error("useGoogleOAuth must be used within a GoogleOAuthProvider");
  }
  return context;
}

interface GoogleOAuthProviderProps {
  children: React.ReactNode;
}

export function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any | null>(null);

  const isAuthenticated = !!accessToken;

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("google_access_token");
    const storedUserInfo = localStorage.getItem("google_user_info");
    console.log("Stored Token:", storedToken);
    console.log("Stored User Info:", storedUserInfo);
    if (storedToken) {
      setAccessToken(storedToken);
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      }
    }

    // Check URL for token (from OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      setAccessToken(tokenFromUrl);
      localStorage.setItem("google_access_token", tokenFromUrl);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Fetch user info
      fetchUserInfo(tokenFromUrl);
    }
  }, []);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const userInfo = await response.json();
        setUserInfo(userInfo);
        localStorage.setItem("google_user_info", JSON.stringify(userInfo));
      }
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    }
  };

  const login = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      console.log("All environment variables:", {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        // Add other NEXT_PUBLIC_ vars if you have them
      });

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      console.log("Google Client ID:", clientId);
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;

      if (!clientId) {
        throw new Error(
          "Google Client ID not configured. Please check your environment variables."
        );
      }

      // Define required scopes
      const scopes = [
        "email",
        "profile",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/presentations",
      ].join(" ");

      // Create OAuth URL
      const oauthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;

      // Redirect to Google OAuth
      window.location.href = oauthUrl;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
      console.error("Google OAuth error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUserInfo(null);
    setError(null);
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_user_info");
  }, []);

  const value: GoogleOAuthContextType = {
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    error,
    userInfo,
  };

  return (
    <GoogleOAuthContext.Provider value={value}>
      {children}
    </GoogleOAuthContext.Provider>
  );
}
