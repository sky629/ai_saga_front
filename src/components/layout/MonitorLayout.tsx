import React from 'react';
import { cn } from '../../utils/cn';

interface MonitorLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function MonitorLayout({ children, className }: MonitorLayoutProps) {
    return (
        <div className="relative min-h-screen w-full bg-black font-pixel selection:bg-green-500 selection:text-black overflow-hidden flex items-center justify-center">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2a2a2a_0%,_#000000_100%)]" />

            {/* Monitor Frame */}
            <div className={cn(
                "relative w-full max-w-7xl h-[90vh] bg-black border-8 border-gray-800 rounded-lg shadow-2xl overflow-hidden flex flex-col",
                "before:absolute before:inset-0 before:pointer-events-none before:rounded-lg before:shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] before:z-50",
                className
            )}>
                {/* Screen Content */}
                <div className="relative z-10 h-full w-full overflow-auto p-6 text-green-500 monitor-glow scrollbar-hide">
                    {children}
                </div>

                {/* Scanlines Overlay */}
                <div className="scanlines pointer-events-none absolute inset-0 z-40 rounded-lg opacity-50" />

                {/* Screen Glare/Reflection */}
                <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(120deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_100%)] rounded-lg" />
            </div>
        </div>
    );
}
