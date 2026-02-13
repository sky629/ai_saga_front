import React from 'react';
import { cn } from '../../utils/cn';

interface PixelCardProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
    variant?: 'paper' | 'wood' | 'cyber';
}

export function PixelCard({ children, title, className, variant = 'cyber' }: PixelCardProps) {
    let bgClass = '';
    let borderClass = '';
    let shadowClass = '';

    if (variant === 'wood') {
        bgClass = 'bg-pixel-brown text-pixel-cream';
        borderClass = 'border-pixel-gold';
        shadowClass = 'shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]';
    } else if (variant === 'cyber') {
        bgClass = 'bg-sanabi-panel text-gray-200';
        borderClass = 'border-sanabi-cyan shadow-[0_0_10px_rgba(0,240,255,0.3)]';
        shadowClass = 'shadow-none';
    } else {
        // paper (default) -> mapped to dark card now
        bgClass = 'bg-pixel-card text-gray-300';
        borderClass = 'border-pixel-brown';
        shadowClass = 'shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]';
    }

    return (
        <div className={cn(
            "relative p-4 border-2 md:border-[3px]",
            bgClass,
            borderClass,
            shadowClass,
            variant === 'cyber' && "backdrop-blur-sm bg-opacity-90",
            className
        )}>
            {/* Corner Decorations */}
            {variant === 'cyber' ? (
                <>
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white z-20 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white z-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white z-20 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white z-20 pointer-events-none" />
                    {/* Scanline overlay for cyber cards */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sanabi-cyan/5 to-transparent opacity-20 pointer-events-none bg-[length:100%_4px]" />
                </>
            ) : (
                <>
                    <div className="absolute top-0 left-0 w-2 h-2 bg-pixel-gold z-20 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-2 h-2 bg-pixel-gold z-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 bg-pixel-gold z-20 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-pixel-gold z-20 pointer-events-none" />
                </>
            )}

            {title && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pixel-brown text-pixel-gold px-4 py-1 border-2 border-pixel-gold shadow-sm">
                    <h3 className="text-sm font-bold tracking-widest uppercase">{title}</h3>
                </div>
            )}

            <div className={cn("h-full", title && "pt-4")}>
                {children}
            </div>
        </div>
    );
}
