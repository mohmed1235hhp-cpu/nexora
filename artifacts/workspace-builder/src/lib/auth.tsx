import { createContext, useContext, type ReactNode } from "react";
import {
  useGetMe,
  useLogin,
  useRegister,
  useLogout,
  type User,
} from "@workspace/api-client-react";
import type { ApiError } from "@workspace/api-client-react";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loginError: string | null;
  registerError: string | null;
  isLoginPending: boolean;
  isRegisterPending: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function errorMessage(error: unknown): string | null {
  if (!error) return null;
  const apiError = error as ApiError;
  return apiError?.message ?? "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // 401 is the expected "not logged in" response — react-query will still
  // resolve `error` for it, we just treat a missing user as logged-out
  // rather than surfacing it as an app-level failure.
  const { data: user, isLoading } = useGetMe({
    query: { retry: false, throwOnError: false } as object,
  });
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const value: AuthContextValue = {
    user: user ?? null,
    isLoading,
    isAuthenticated: Boolean(user),
    login: async (data) => {
      await loginMutation.mutateAsync(data);
    },
    register: async (data) => {
      await registerMutation.mutateAsync(data);
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    loginError: errorMessage(loginMutation.error),
    registerError: errorMessage(registerMutation.error),
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
