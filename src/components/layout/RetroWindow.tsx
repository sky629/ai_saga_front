import { X, Minus, Square } from 'lucide-react';
import { cn } from '../../utils/cn';

interface RetroWindowProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    variant?: 'blue' | 'red';
    onClose?: () => void;
}

export function RetroWindow({ title, children, className, variant = 'blue', onClose }: RetroWindowProps) {
    const borderColor = variant === 'blue' ? 'border-cyber-primary' : 'border-cyber-secondary';
    const titleBg = variant === 'blue' ? 'bg-cyber-primary' : 'bg-cyber-secondary';
    const titleColor = variant === 'blue' ? 'text-black' : 'text-white';

    return (
        <div className={cn("flex flex-col bg-cyber-window-bg border-2 shadow-lg font-pixel", borderColor, className)}>
            {/* Title Bar */}
            <div className={cn("flex items-center justify-between px-2 py-1 select-none", titleBg, titleColor)}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-current opacity-50" />
                    <span className="text-xs font-bold tracking-widest uppercase">{title}</span>
                </div>
                <div className="flex gap-1" role="button" onClick={onClose}>
                    <div className="hover:bg-black/20 p-0.5 rounded cursor-pointer"><Minus size={12} /></div>
                    <div className="hover:bg-black/20 p-0.5 rounded cursor-pointer"><Square size={10} /></div>
                    <div className="hover:bg-black/20 p-0.5 rounded cursor-pointer"><X size={12} /></div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 text-cyber-text custom-scrollbar">
                {children}
            </div>
        </div>
    );
}
