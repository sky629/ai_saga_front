import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck } from 'lucide-react';
import { PixelCard } from '../components/layout/PixelCard';
import { PixelLayout } from '../components/layout/PixelLayout';

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
        <PixelLayout className="max-w-3xl">
            <div className="flex h-full items-center justify-center p-4">
                <PixelCard
                    variant="cyber"
                    className="w-full max-w-xl overflow-hidden border-sanabi-cyan/40 p-0"
                >
                    <div className="border-b border-sanabi-cyan/20 bg-black/70 px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-sanabi-cyan/70">
                            <ShieldCheck size={14} />
                            Identity Sync
                        </div>
                        <h2 className="mt-3 text-2xl font-bold tracking-[0.2em] text-sanabi-cyan animate-pulse">
                            AUTHENTICATING...
                        </h2>
                    </div>

                    <div className="space-y-6 p-8 text-center">
                        <div className="h-3 w-full overflow-hidden rounded-sm border border-sanabi-cyan/20 bg-black/70">
                            <div className="h-full w-full animate-pulse bg-gradient-to-r from-sanabi-cyan/20 via-sanabi-cyan to-sanabi-pink/40" />
                        </div>

                        <div className="space-y-2 text-sm text-gray-400">
                            <p className="font-bold tracking-[0.2em] text-sanabi-cyan/90">
                                ESTABLISHING SECURE CONNECTION
                            </p>
                            <p className="font-mono text-xs opacity-70">
                                verifying_credentials_v4.2.1
                            </p>
                        </div>
                    </div>
                </PixelCard>
            </div>
        </PixelLayout>
    );
}
