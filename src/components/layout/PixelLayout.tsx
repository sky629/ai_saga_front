import React from 'react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { User } from 'lucide-react';
interface PixelLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function PixelLayout({ children, className }: PixelLayoutProps) {
    const { user } = useAuth();
    return (
        <div className="min-h-screen bg-sanabi-bg text-gray-200 font-pixel relative overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(#00F0FF 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />
            {/* Subtle radial glow */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(ellipse at 50% 20%, rgba(0,240,255,0.06) 0%, transparent 60%)'
                }}
            />

            {/* Main Container */}
            <div className={cn(
                "relative z-10 w-full max-w-7xl h-[90vh] flex flex-col",
                "bg-sanabi-panel/80 backdrop-blur-sm",
                "border border-sanabi-cyan/30",
                "shadow-[0_0_30px_rgba(0,240,255,0.1)]",
                "rounded-sm",
                className
            )}>
                {/* Header Bar - Cyberpunk Terminal Style */}
                <div className="h-8 bg-black/60 w-full flex items-center justify-between px-4 border-b border-sanabi-cyan/20">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-sanabi-pink border border-sanabi-pink/50 shadow-[0_0_5px_rgba(255,0,85,0.6)]" />
                        <div className="w-3 h-3 rounded-full bg-sanabi-gold border border-sanabi-gold/50 shadow-[0_0_5px_rgba(255,215,0,0.6)]" />
                        <div className="w-3 h-3 rounded-full bg-sanabi-green border border-sanabi-green/50 shadow-[0_0_5px_rgba(0,255,157,0.6)]" />
                    </div>
                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex items-center gap-3 text-[10px] font-mono tracking-widest border-r border-sanabi-cyan/20 pr-4">
                                <div className="flex items-center gap-1 text-sanabi-gold">
                                    <span className="opacity-50">SYNC_LV.</span>
                                    <span className="font-bold">{user.game_level}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sanabi-cyan">
                                    <User size={12} className="opacity-70" />
                                    <span className="font-bold uppercase opacity-80 truncate max-w-[100px]">{user.name}</span>
                                </div>
                            </div>
                        )}
                        <span className="text-[10px] text-sanabi-cyan/50 font-mono tracking-widest hidden sm:inline">AI_SAGA::TERMINAL v1.0</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4 scrollbar-hide">
                    {children}
                </div>
            </div>
        </div>
    );
}
