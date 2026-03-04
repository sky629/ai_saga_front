import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserResponse } from '../types/api';
import { captureException, setSentryUser } from '../sentry';
import { authService, setAuthFailureHandler } from '../services/gameService';

interface AuthContextType {
    user: UserResponse | null;
    token: string | null;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
    setToken: (token: string | null) => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [token, setTokenState] = useState<string | null>(
        localStorage.getItem('access_token')
    );
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const setToken = (newToken: string | null) => {
        if (newToken) {
            localStorage.setItem('access_token', newToken);
        } else {
            localStorage.removeItem('access_token');
        }
        setTokenState(newToken);
    };

    const login = () => {
        window.location.href = `${API_BASE_URL}/auth/google/login/`;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setSentryUser(null);
        window.location.href = '/login';
    };

    const refreshUser = async () => {
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
    };

    useEffect(() => {
        void refreshUser();
    }, [token]);

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
    }, []);

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

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
