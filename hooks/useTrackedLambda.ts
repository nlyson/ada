// hooks/useTrackedLambda.ts
import { useUser } from './useUser';
import { invokeLambdaIam } from '@/utils/invokeLambdaIam';

type TrackedLambdaOptions = Omit<Parameters<typeof invokeLambdaIam>[0], 'username'> & {
  username?: string; // Allow username override
};

export const useTrackedLambda = () => {
  const { username: hookUsername, isAuthenticated, isLoading } = useUser();

  const invoke = async (options: TrackedLambdaOptions) => {
    console.log('🔍 useTrackedLambda invoke called with:', {
      url: options.url,
      hookUsername,
      overrideUsername: options.username,
      isAuthenticated,
      isLoading
    });
    
    return invokeLambdaIam({
      ...options,
      // Use provided username or fall back to hook username
      username: options.username || hookUsername || undefined,
    });
  };

  return {
    invoke,
    username: hookUsername,
    isReady: isAuthenticated && !isLoading,
    isAuthenticated,
    isLoading, // Export this so components can use it
  };
};