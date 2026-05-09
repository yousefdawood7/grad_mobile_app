import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { isSupabaseConfigured } from '../config/env';
import { SignInInput, SignUpInput } from '../features/auth/validation';
import { uploadAvatar, upsertProfile } from '../features/profile/repository';
import { STORAGE_KEYS } from '../lib/storage-keys';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthState = 'anonymous' | 'authenticated' | 'guest';
type ActionResult = { didRedirect?: boolean; ok: true } | { message: string; ok: false };
type SessionUser = {
  avatarUrl: string | null;
  email: string | null;
  fullName: string | null;
  id: string | null;
};

type SessionContextValue = {
  authState: AuthState;
  completeOnboarding: () => Promise<void>;
  continueAsGuest: () => void;
  hasSeenOnboarding: boolean;
  isReady: boolean;
  isSupabaseConfigured: boolean;
  sendOtp: (email: string) => Promise<ActionResult>;
  signIn: (values: SignInInput) => Promise<ActionResult>;
  signInWithGoogle: () => Promise<ActionResult>;
  signOut: () => Promise<void>;
  signUp: (values: SignUpInput) => Promise<ActionResult>;
  updateProfile: (values: {
    avatarUrl: string | null;
    fullName: string | null;
  }) => Promise<ActionResult>;
  verifyOtp: (email: string, token: string) => Promise<ActionResult>;
  user: SessionUser;
  userLabel: string;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthState>('anonymous');
  const [profile, setProfile] = useState<{
    avatarUrl: string | null;
    fullName: string | null;
  } | null>(null);

  /** Load the user's profile from the profiles table. */
  const loadProfile = async (userId: string) => {
    try {
      const { getProfile } = await import('../features/profile/repository');
      const data = await getProfile(userId);
      if (data) {
        setProfile({ avatarUrl: data.avatarUrl, fullName: data.fullName });
      }
    } catch {
      // Profile load failed — non-critical, we fall back to user_metadata
    }
  };

  const syncSession = async () => {
    if (!supabase) {
      return;
    }

    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setAuthState(data.session ? 'authenticated' : 'anonymous');

    if (data.session?.user.id) {
      await loadProfile(data.session.user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const seen = await AsyncStorage.getItem(STORAGE_KEYS.onboardingComplete);

      if (mounted) {
        setHasSeenOnboarding(seen === 'true');
      }

      if (!supabase) {
        if (mounted) {
          setIsReady(true);
        }

        return;
      }

      const { data } = await supabase.auth.getSession();

      if (mounted) {
        setSession(data.session);
        setAuthState(data.session ? 'authenticated' : 'anonymous');
        setIsReady(true);

        if (data.session?.user.id) {
          loadProfile(data.session.user.id);
        }
      }
    };

    bootstrap().catch(() => setIsReady(true));

    const authListener = supabase?.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setAuthState(nextSession ? 'authenticated' : 'anonymous');

        if (nextSession?.user.id) {
          loadProfile(nextSession.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => {
      mounted = false;
      authListener?.data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      authState,
      completeOnboarding: async () => {
        await AsyncStorage.setItem(STORAGE_KEYS.onboardingComplete, 'true');
        setHasSeenOnboarding(true);
      },
      continueAsGuest: () => {
        setAuthState('guest');
        router.replace('/(app)/home');
      },
      hasSeenOnboarding,
      isReady,
      isSupabaseConfigured,
      sendOtp: async (email: string) => {
        if (!supabase) {
          return {
            message: 'Authentication service is not available.',
            ok: false,
          };
        }

        const { error } = await supabase.auth.signInWithOtp({ email });

        if (error) {
          return {
            message: error.message,
            ok: false,
          };
        }

        return { ok: true };
      },
      signIn: async ({ email, password }) => {
        if (!supabase) {
          return {
            message: 'Authentication service is not available.',
            ok: false,
          };
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return {
            message: error.message,
            ok: false,
          };
        }

        return { ok: true };
      },
      signInWithGoogle: async () => {
        if (!supabase) {
          return {
            message: 'Authentication service is not available.',
            ok: false,
          };
        }

        if (Platform.OS === 'web') {
          const redirectTo = new URL(
            '/auth/callback',
            window.location.origin,
          ).toString();
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
              redirectTo,
            },
          });

          if (error) {
            return {
              message: error.message,
              ok: false,
            };
          }

          return {
            didRedirect: true,
            ok: true,
          };
        }

        const redirectTo = Linking.createURL('auth/callback', {
          scheme: 'waterhyacinth',
        });
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            redirectTo,
            skipBrowserRedirect: true,
          },
        });

        if (error || !data?.url) {
          return {
            message: error?.message ?? 'Unable to start Google sign-in.',
            ok: false,
          };
        }

        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
        );

        if (result.type !== 'success') {
          return {
            message: 'Google sign-in was cancelled.',
            ok: false,
          };
        }

        const callbackUrl = new URL(result.url);
        const callbackError =
          callbackUrl.searchParams.get('error_description') ??
          callbackUrl.searchParams.get('error');

        if (callbackError) {
          return {
            message: callbackError,
            ok: false,
          };
        }

        const authCode = callbackUrl.searchParams.get('code');

        if (!authCode) {
          return {
            message: 'Google sign-in did not return an authorization code.',
            ok: false,
          };
        }

        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(authCode);

        if (exchangeError) {
          return {
            message: exchangeError.message,
            ok: false,
          };
        }

        return { ok: true };
      },
      signOut: async () => {
        if (supabase && session) {
          await supabase.auth.signOut();
        }

        setSession(null);
        setAuthState('anonymous');
        router.replace('/(auth)/sign-in');
      },
      signUp: async ({ email, fullName, password }) => {
        if (!supabase) {
          return {
            message: 'Authentication service is not available.',
            ok: false,
          };
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          return {
            message: error.message,
            ok: false,
          };
        }

        return { ok: true };
      },
      updateProfile: async ({ avatarUrl, fullName }) => {
        if (!supabase || !session?.user.id) {
          return {
            message: 'You must be signed in to update your profile.',
            ok: false,
          };
        }

        try {
          // Upload avatar to Supabase Storage if it's a local file
          let permanentAvatarUrl = avatarUrl;

          if (avatarUrl) {
            permanentAvatarUrl = await uploadAvatar(
              session.user.id,
              avatarUrl,
            );
          }

          await upsertProfile(session.user.id, {
            avatarUrl: permanentAvatarUrl,
            fullName,
          });

          const { error } = await supabase.auth.updateUser({
            data: {
              avatar_url: permanentAvatarUrl,
              full_name: fullName,
            },
          });

          if (error) {
            return {
              message: error.message,
              ok: false,
            };
          }

          await syncSession();

          return { ok: true };
        } catch (error) {
          return {
            message:
              error instanceof Error
                ? error.message
                : 'Unable to update profile.',
            ok: false,
          };
        }
      },
      verifyOtp: async (email: string, token: string) => {
        if (!supabase) {
          return {
            message: 'Authentication service is not available.',
            ok: false,
          };
        }

        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        });

        if (error) {
          return {
            message: error.message,
            ok: false,
          };
        }

        return { ok: true };
      },
      user: {
        avatarUrl:
          profile?.avatarUrl ??
          (typeof session?.user.user_metadata?.avatar_url === 'string'
            ? session.user.user_metadata.avatar_url
            : typeof session?.user.user_metadata?.picture === 'string'
              ? session.user.user_metadata.picture
              : null),
        email: session?.user.email ?? null,
        fullName:
          profile?.fullName ??
          (typeof session?.user.user_metadata?.full_name === 'string'
            ? session.user.user_metadata.full_name
            : typeof session?.user.user_metadata?.name === 'string'
              ? session.user.user_metadata.name
              : null),
        id: session?.user.id ?? null,
      },
      userLabel:
        authState === 'authenticated'
          ? profile?.fullName ??
            session?.user.user_metadata?.full_name ??
            session?.user.user_metadata?.name ??
            session?.user.email ??
            'Signed-in user'
          : authState === 'guest'
            ? 'Guest session'
            : 'No active session',
    }),
    [authState, hasSeenOnboarding, isReady, profile, session],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
}
