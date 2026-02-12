import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import GoogleCallback from './pages/GoogleCallback';
import Dashboard from './pages/Dashboard';
import GameSession from './pages/GameSession';
import { MonitorLayout } from './components/layout/MonitorLayout';

function PrivateRoute({ children }: { children: React.ReactElement }) {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <MonitorLayout>
                <div className="flex h-full items-center justify-center text-green-500 animate-pulse">
                    LOADING SYSTEM...
                </div>
            </MonitorLayout>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/login/success" element={<GoogleCallback />} />

            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/game/:characterId"
                element={
                    <PrivateRoute>
                        <GameSession />
                    </PrivateRoute>
                }
            />
        </Routes>
    );
}
