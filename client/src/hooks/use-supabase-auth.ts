import { useState, useEffect, useCallback } from 'react';
import { auth, supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

interface SupabaseAuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<SupabaseAuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });
  
  const { setUser } = useAuth();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { session, error } = await auth.getSession();
        
        if (mounted) {
          if (error) {
            setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
          } else {
            setAuthState(prev => ({
              ...prev,
              session,
              user: session?.user || null,
              loading: false
            }));
          }
        }
      } catch (error) {
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            error: 'Failed to get session',
            loading: false
          }));
        }
      }
    }

    getInitialSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen to auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = auth.onAuthStateChange(async (event, session) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user || null,
        loading: false,
        error: null
      }));

      // Sync with existing auth system
      if (session?.user) {
        try {
          // Fetch user data from your database
          const response = await fetch('/api/supabase/user', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        } catch (error) {
          console.error('Failed to sync user data:', error);
        }
      } else {
        setUser(null as any);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = 'Sign in failed';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await auth.signOut();
      
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }
      
      setUser(null);
      return { success: true };
    } catch (error) {
      const errorMessage = 'Sign out failed';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  }, [setUser]);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!authState.session && !!authState.user;
  }, [authState.session, authState.user]);

  // Get access token
  const getAccessToken = useCallback(() => {
    return authState.session?.access_token || null;
  }, [authState.session]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message }));
        return { success: false, error: error.message };
      }
      
      setAuthState(prev => ({
        ...prev,
        session: data.session,
        user: data.user
      }));
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = 'Failed to refresh session';
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signOut,
    isAuthenticated,
    getAccessToken,
    refreshSession
  };
}