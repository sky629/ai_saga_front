import React from 'react';
import { cn } from '../../utils/cn';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export function PixelButton({
    children,
    className,
    variant = 'primary',
    size = 'md',
    disabled,
    ...props
}: PixelButtonProps) {

    const variants = {
        primary: "bg-sanabi-cyan text-black border-sanabi-cyan hover:bg-cyan-200 hover:shadow-[0_0_15px_rgba(0,240,255,0.6)]",
        secondary: "bg-transparent text-sanabi-cyan border-sanabi-cyan hover:bg-sanabi-cyan/20",
        danger: "bg-sanabi-pink text-white border-sanabi-pink hover:bg-pink-600 hover:shadow-[0_0_15px_rgba(255,0,85,0.6)]",
    };

    const sizes = {
        sm: "px-3 py-1 text-xs",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base",
    };

    return (
        <button
            className={cn(
                "relative font-bold uppercase tracking-wider transition-all",
                "border-[3px]",
                "shadow-[0_4px_0_0_rgba(0,0,0,0.3)]", // Bottom '3D' shadow
                "active:translate-y-[4px] active:shadow-none", // Press effect
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_rgba(0,0,0,0.3)]",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}
