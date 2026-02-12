import { useAuth } from '../context/AuthContext';
import { CyberpunkLayout } from '../components/layout/CyberpunkLayout';
import { RetroWindow } from '../components/layout/RetroWindow';

export default function Login() {
    const { login } = useAuth();

    return (
        <CyberpunkLayout>
            <div className="flex h-full items-center justify-center">
                <RetroWindow title="SYSTEM ACCESS" className="w-[400px] h-auto p-0" variant="blue">
                    <div className="flex flex-col gap-6 p-6 text-center">
                        <div className="space-y-2">
                            <h1 className="text-2xl text-cyber-primary text-glow drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">AI SAGA</h1>
                            <p className="text-xs text-cyber-muted tracking-widest">NEURAL LINK INTERFACE v2.0</p>
                        </div>

                        <div className="border border-cyber-primary/30 p-4 bg-cyber-dark/50 text-xs text-left font-mono space-y-2">
                            <p>{'>'} DETECTING USER...</p>
                            <p>{'>'} ENCRYPTING CONNECTION...</p>
                            <p className="animate-pulse">{'>'} AWAITING AUTHENTICATION_</p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={login}
                                className="group w-full bg-white text-black font-bold py-3 hover:bg-gray-100 hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 48 48">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                    <path fill="none" d="M0 0h48v48H0z" />
                                </svg>
                                <span>Login with Google</span>
                            </button>
                            <p className="text-[10px] text-cyber-muted mt-4">By proceeding, you agree to the Neural Handshake Protocol.</p>
                        </div>
                    </div>
                </RetroWindow>
            </div>
        </CyberpunkLayout>
    );
}
