// hooks/useUser.ts
import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

interface User {
  username: string;
  email?: string;
  // Add other user properties as needed
}

interface UseUserReturn {
  user: User | null;
  username: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

export const useUser = (): UseUserReturn => {
  // SSR-safe: check if we're on the client side
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchUser = async () => {
    // Don't fetch on server side
    if (!isClient) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const currentUser = await getCurrentUser();
      
      const userData: User = {
        username: currentUser.username,
        email: currentUser.signInDetails?.loginId || undefined,
      };
      
      setUser(userData);
    } catch (err) {
      setError('User not authenticated');
      setUser(null);
      console.log('User not authenticated:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchUser();
    }
  }, [isClient]);

  return {
    user,
    username: user?.username || null,
    isLoading: !isClient || isLoading, // Keep loading until client-side
    isAuthenticated: !!user && isClient,
    error,
    refreshUser: fetchUser,
  };
};