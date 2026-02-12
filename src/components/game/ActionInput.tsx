import { useState, type FormEvent, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

interface ActionInputProps {
    onSend: (content: string) => void;
    disabled?: boolean;
}

export function ActionInput({ onSend, disabled }: ActionInputProps) {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Keep focus on input unless user explicitly clicks away
    useEffect(() => {
        if (!disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [disabled, input]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || disabled) return;
        onSend(input);
        setInput('');
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex gap-2 items-center p-2 bg-black/20"
        >
            <span className="text-cyber-primary font-bold animate-pulse">{'>'}</span>
            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={disabled}
                className="flex-1 bg-transparent border-none outline-none text-cyber-text font-mono placeholder:text-cyber-muted/50 text-sm"
                placeholder={disabled ? "AWAITING NEURAL RESPONSE..." : "ENTER COMMAND..."}
                autoFocus
                autoComplete="off"
            />
            <button
                type="submit"
                disabled={disabled || !input.trim()}
                className="text-cyber-primary hover:text-white disabled:opacity-30 transition-colors"
            >
                <Send size={16} />
            </button>
        </form>
    );
}
