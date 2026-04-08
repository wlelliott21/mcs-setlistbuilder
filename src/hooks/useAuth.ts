import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

function mapSupabaseUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username: user.user_metadata?.username || user.user_metadata?.full_name || user.email!.split('@')[0],
  };
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  setLoading: (loading) => set({ loading }),
}));

// Initialize auth listener
let initialized = false;

export function initAuth() {
  if (initialized) return;
  initialized = true;

  const { login, logout, setLoading } = useAuth.getState();

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) login(mapSupabaseUser(session.user));
    setLoading(false);
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      login(mapSupabaseUser(session.user));
      setLoading(false);
    } else if (event === 'SIGNED_OUT') {
      logout();
      setLoading(false);
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      login(mapSupabaseUser(session.user));
    }
  });
}

// Auth service functions
export async function sendOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyOtpAndSetPassword(email: string, token: string, password: string, username: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) throw error;

  const { data: updateData, error: updateError } = await supabase.auth.updateUser({
    password,
    data: { username },
  });
  if (updateError) throw updateError;
  return updateData.user;
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
