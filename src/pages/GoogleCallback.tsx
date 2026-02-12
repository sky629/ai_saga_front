import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CyberpunkLayout } from '../components/layout/CyberpunkLayout';
import { RetroWindow } from '../components/layout/RetroWindow';

export default function GoogleCallback() {
    const [searchParams] = useSearchParams();
    const { setToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Strategy: Open Spot Style
        // Backend handles the OAuth exchange and redirects here with the token in query params.
        const token = searchParams.get('token') || searchParams.get('access_token');
        const newUser = searchParams.get('new_user');

        if (token) {
            console.log("Token received from backend.", { newUser });
            setToken(token);
            // Optional: Handle new user onboarding based on newUser flag if needed
            navigate('/', { replace: true });
        } else {
            console.warn("No token found in URL parameters. Redirecting to login...");
            const timer = setTimeout(() => navigate('/login'), 2000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, setToken, navigate]);

    return (
        <CyberpunkLayout>
            <div className="flex items-center justify-center h-full">
                <RetroWindow
                    title="SYSTEM_AUTH.exe"
                    className="w-full max-w-md"
                    variant="blue"
                >
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
                        <h2 className="text-xl font-bold text-cyber-neon animate-pulse tracking-widest">
                            AUTHENTICATING...
                        </h2>

                        <div className="w-full h-4 bg-gray-900 border border-cyber-dim rounded-sm overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-full bg-cyber-crimson animate-[width_1.5s_ease-in-out_infinite] opacity-80" style={{ width: '100%' }} />
                            <div className="absolute top-0 left-0 h-full w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2s_infinite]" />
                        </div>

                        <div className="space-y-1 text-sm text-cyber-text-secondary">
                            <p>ESTABLISHING SECURE CONNECTION</p>
                            <p className="text-xs font-mono opacity-70">verifying_credentials_v4.2.1</p>
                        </div>
                    </div>
                </RetroWindow>
            </div>
        </CyberpunkLayout>
    );
}
