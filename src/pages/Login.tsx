import { useAuth } from '../context/AuthContext';
import { PixelLayout } from '../components/layout/PixelLayout';
import { PixelCard } from '../components/layout/PixelCard';
import { PixelButton } from '../components/layout/PixelButton';
import { Info, Zap } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();

    return (
        <PixelLayout>
            <div className="flex h-full items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <PixelCard variant="cyber" className="p-0 overflow-hidden shadow-[0_0_40px_rgba(0,240,255,0.15)]">
                        {/* Header */}
                        <div className="bg-black/80 p-6 border-b border-sanabi-cyan/30 text-center relative overflow-hidden">
                            {/* Scanline effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sanabi-cyan/5 to-transparent opacity-30 pointer-events-none bg-[length:100%_4px]" />

                            <h1 className="text-3xl text-sanabi-cyan font-bold uppercase tracking-[0.3em] drop-shadow-[0_0_15px_rgba(0,240,255,0.8)] flex items-center justify-center gap-3 relative z-10">
                                <Zap size={24} className="text-sanabi-cyan animate-pulse" />
                                AI SAGA
                                <Zap size={24} className="text-sanabi-cyan animate-pulse scale-x-[-1]" />
                            </h1>
                            <p className="text-xs text-sanabi-pink/80 mt-2 font-bold tracking-[0.2em] relative z-10">NEURAL LINK PROTOCOL</p>
                        </div>

                        {/* Body */}
                        <div className="p-8 bg-sanabi-panel space-y-8 text-center">
                            <div className="space-y-4">
                                <div className="text-gray-400 text-sm font-bold leading-relaxed border border-sanabi-cyan/20 bg-black/40 p-4 rounded-sm relative">
                                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-sanabi-cyan/50" />
                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-sanabi-cyan/50" />
                                    <p className="mb-2 text-sanabi-cyan/90">ATTENTION, OPERATOR.</p>
                                    <p className="text-gray-500">Neural gateway requires identity verification. Authenticate via external provider to initialize your session.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <PixelButton
                                    onClick={login}
                                    className="w-full py-4 text-base flex items-center justify-center gap-3 group"
                                    variant="primary"
                                >
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                        <path fill="none" d="M0 0h48v48H0z" />
                                    </svg>
                                    <span>AUTHENTICATE VIA GOOGLE</span>
                                </PixelButton>

                                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-wide">
                                    <Info size={12} />
                                    <span>External authentication required</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-black/60 p-2 text-center border-t border-sanabi-cyan/20">
                            <p className="text-[10px] text-sanabi-cyan/50 font-mono tracking-widest">v1.0.0_ALPHA // BUILD.2026</p>
                        </div>
                    </PixelCard>
                </div>
            </div>
        </PixelLayout>
    );
}
