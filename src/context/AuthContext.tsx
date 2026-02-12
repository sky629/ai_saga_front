import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserResponse } from '../types/api';
import axios from 'axios';


interface AuthContextType {
    user: UserResponse | null;
    token: string | null;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
    setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// TODO: Move to configuration/env
const API_BASE_URL = 'http://localhost:8000/api/v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [token, setTokenState] = useState<string | null>(localStorage.getItem('access_token'));
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Set token and update localStorage
    const setToken = (newToken: string | null) => {
        if (newToken) {
            localStorage.setItem('access_token', newToken);
        } else {
            localStorage.removeItem('access_token');
        }
        setTokenState(newToken);
    };

    const login = () => {
        // Direct redirect to backend to initiate Google OAuth flow
        window.location.href = 'http://localhost:8000/api/v1/auth/google/login/';
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        window.location.href = '/login';
    };

    // Fetch user profile when token changes
    useEffect(() => {
        const fetchUser = async () => {
            if (!token) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                console.log("AuthContext: Fetching user with token", token);
                const response = await axios.get<UserResponse>(`${API_BASE_URL}/auth/self/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("AuthContext: User fetched", response.data);
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user:', error);
                setToken(null);
            } finally {
                setIsLoading(false);
                console.log("AuthContext: Loading finished");
            }
        };

        fetchUser();
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, setToken }}>
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
