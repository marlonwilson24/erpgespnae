/**
 * AuthContext
 * -----------
 * Responsável exclusivamente por autenticação e sessão Supabase.
 * Extraído de PNAEContext para separar domínios e facilitar testes unitários.
 *
 * Expõe:
 *  - currentUser, isAuthenticated, authChecking
 *  - login(), logout()
 *  - useAuth() hook
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { entrarComSenha, carregarPerfil, encerrarSessao } from '../lib/auth';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  authChecking: boolean;
  currentRole: UserRole;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Restaura sessão existente e escuta mudanças de autenticação
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        if (sessionUser) {
          const perfil = await carregarPerfil(sessionUser.id, sessionUser.email ?? '');
          if (mounted && perfil) setCurrentUser(perfil);
        }
      } catch {
        /* ignore — sem sessão ativa */
      } finally {
        if (mounted) setAuthChecking(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setAuthChecking(false);
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        const perfil = await carregarPerfil(session.user.id, session.user.email ?? '');
        if (mounted && perfil) setCurrentUser(perfil);
        setAuthChecking(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (
    email: string,
    senha: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const resultado = await entrarComSenha(email.trim(), senha);
    if (!resultado.success) {
      return resultado;
    }

    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user;
    const perfil = sessionUser
      ? await carregarPerfil(sessionUser.id, sessionUser.email ?? email)
      : null;

    setCurrentUser(perfil);
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    await encerrarSessao();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        authChecking,
        currentRole: currentUser?.role ?? 'ADMIN',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
