import React, { useCallback, useEffect, useState } from 'react';
import { captureException, setSentryUser } from '../sentry';
import { authService, setAuthFailureHandler } from '../services/gameService';
import { AuthContext } from './auth-context';
import type { UserResponse } from '../types/api';

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [token, setTokenState] = useState<string | null>(
        localStorage.getItem('access_token')
    );
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const setToken = useCallback((newToken: string | null) => {
        if (newToken) {
            localStorage.setItem('access_token', newToken);
        } else {
            localStorage.removeItem('access_token');
        }
        setTokenState(newToken);
    }, []);

    const login = useCallback(() => {
        window.location.href = `${API_BASE_URL}/auth/google/login/`;
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        setSentryUser(null);
        window.location.href = '/login';
    }, [setToken]);

    const refreshUser = useCallback(async () => {
        if (!token) {
            setUser(null);
            setSentryUser(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const currentUser = await authService.getSelf();
            setUser(currentUser);
            setSentryUser({
                id: currentUser.id,
                email: currentUser.email,
                username: currentUser.name,
            });
        } catch (error) {
            captureException(error, {
                feature: 'auth_refresh_user',
            });
            setToken(null);
            setUser(null);
            setSentryUser(null);
        } finally {
            setIsLoading(false);
        }
    }, [token, setToken]);

    useEffect(() => {
        void refreshUser();
    }, [refreshUser]);

    useEffect(() => {
        setAuthFailureHandler(() => {
            setToken(null);
            setUser(null);
            setSentryUser(null);
            window.location.href = '/login';
        });

        return () => {
            setAuthFailureHandler(null);
        };
    }, [setToken]);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                login,
                logout,
                setToken,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
