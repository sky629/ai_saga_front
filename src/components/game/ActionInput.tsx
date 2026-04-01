import { useRef, useEffect, type FormEvent } from 'react';
import { Send, Terminal } from 'lucide-react';

interface ActionInputProps {
    onSend: (content: string) => void;
    disabled?: boolean;
    value: string;
    onChange: (value: string) => void;
    error?: string | null;
    modeHint?: string | null;
    placeholder?: string;
}

export function ActionInput({
    onSend,
    disabled,
    value,
    onChange,
    error,
    modeHint,
    placeholder,
}: ActionInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Keep focus on input unless user explicitly clicks away
    useEffect(() => {
        if (!disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [disabled, value]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!value.trim() || disabled) return;
        onSend(value);
    };

    return (
        <div className="flex flex-col w-full">
            {error && (
                <div className="px-4 py-1.5 bg-black/40 border-t border-sanabi-pink/30 text-sanabi-pink text-[10px] font-bold animate-pulse uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-sanabi-pink rounded-full shadow-[0_0_5px_rgba(255,0,170,0.5)]"></span>
                    System_Error: {error}
                </div>
            )}
            {modeHint && !error && (
                <div className="px-4 py-1.5 bg-black/30 border-t border-sanabi-cyan/20 text-[10px] tracking-[0.12em] text-sanabi-cyan/80 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-sanabi-cyan rounded-full shadow-[0_0_5px_rgba(0,240,255,0.4)]"></span>
                    {modeHint}
                </div>
            )}
        <form
            onSubmit={handleSubmit}
            className="flex gap-3 items-center p-3 bg-sanabi-panel border-t border-sanabi-cyan/20"
        >
            <div className="w-8 h-8 flex items-center justify-center bg-sanabi-cyan/10 rounded border border-sanabi-cyan/30 text-sanabi-cyan">
                <Terminal size={16} />
            </div>

            <div className="flex-1 relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-full bg-black/50 border border-sanabi-cyan/30 rounded-sm px-3 py-2 text-gray-200 placeholder:text-gray-600 outline-none focus:border-sanabi-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all font-pixel text-base"
                    placeholder={
                        disabled
                            ? 'AWAITING_SYSTEM_RESPONSE...'
                            : placeholder || 'Enter command...'
                    }
                    autoFocus
                    autoComplete="off"
                />
            </div>

            <button
                type="submit"
                disabled={disabled || !value.trim()}
                className="bg-sanabi-cyan text-black border border-sanabi-cyan p-2 rounded-sm hover:bg-cyan-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] active:translate-y-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-sanabi-cyan shadow-sm"
            >
                <Send size={18} />
            </button>
        </form>
        </div>
    );
}
