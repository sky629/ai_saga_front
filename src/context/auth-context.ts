import { createContext } from 'react';
import type { UserResponse } from '../types/api';

export interface AuthContextType {
    user: UserResponse | null;
    token: string | null;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
    setToken: (token: string | null) => void;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);
