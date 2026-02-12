import { useRef, useEffect } from 'react';
import type { GameMessageResponse, MessageHistoryResponse, ParsedGameResponse, StateChanges } from '../../types/api';
import { cn } from '../../utils/cn';

interface MessageHistoryProps {
    // Combine both types as they are similar enough for display, or create a union
    messages: (GameMessageResponse | MessageHistoryResponse)[];
    isLoading?: boolean;
}

// Utility to parse potentially JSON-encoded content
function parseGameContent(content: string): ParsedGameResponse | null {
    try {
        // 1. Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;

        // 2. Try parsing as JSON
        const parsed = JSON.parse(jsonString);

        // 3. Validate if it has our expected structure
        if (typeof parsed === 'object' && parsed !== null && 'narrative' in parsed) {
            return {
                narrative: parsed.narrative,
                options: parsed.options,
                state_changes: parsed.state_changes
            };
        }

        // If parsed but no narrative, treat as regular text (shouldn't happen with our API but fallback)
        return { narrative: content, options: [] };
    } catch {
        // Fallback: It's just plain text (or failed to parse)
        return null;
    }
}

// StateChangeIndicator 컴포넌트: 상태 변경사항을 시각적으로 표시
function StateChangeIndicator({ changes }: { changes: StateChanges }) {
    const hasChanges =
        (changes.items_gained && changes.items_gained.length > 0) ||
        (changes.items_lost && changes.items_lost.length > 0) ||
        changes.location ||
        (changes.npcs_met && changes.npcs_met.length > 0) ||
        (changes.discoveries && changes.discoveries.length > 0) ||
        (changes.hp_change !== undefined && changes.hp_change !== 0);

    if (!hasChanges) return null;

    return (
        <div className="mt-2 pt-2 border-l-2 border-green-700/50 pl-3 space-y-1 text-[10px] bg-black/30 p-2 rounded">
            <div className="text-green-600 uppercase tracking-wider mb-1">{'>'} State Changes:</div>

            {changes.items_gained && changes.items_gained.length > 0 && (
                <div className="text-green-400 flex items-center gap-1">
                    <span className="text-green-500">+</span>
                    <span>Gained: {changes.items_gained.join(', ')}</span>
                </div>
            )}

            {changes.items_lost && changes.items_lost.length > 0 && (
                <div className="text-red-400 flex items-center gap-1">
                    <span className="text-red-500">-</span>
                    <span>Lost: {changes.items_lost.join(', ')}</span>
                </div>
            )}

            {changes.location && (
                <div className="text-blue-400 flex items-center gap-1">
                    <span className="text-blue-500">→</span>
                    <span>Moved to: {changes.location}</span>
                </div>
            )}

            {changes.npcs_met && changes.npcs_met.length > 0 && (
                <div className="text-purple-400 flex items-center gap-1">
                    <span className="text-purple-500">👤</span>
                    <span>Met: {changes.npcs_met.join(', ')}</span>
                </div>
            )}

            {changes.discoveries && changes.discoveries.length > 0 && (
                <div className="text-yellow-400 flex items-center gap-1">
                    <span className="text-yellow-500">✨</span>
                    <span>Discovered: {changes.discoveries.join(', ')}</span>
                </div>
            )}

            {changes.hp_change !== undefined && changes.hp_change !== 0 && (
                <div className={cn(
                    "flex items-center gap-1",
                    changes.hp_change > 0 ? "text-green-400" : "text-red-400"
                )}>
                    <span>{changes.hp_change > 0 ? '+' : ''}{changes.hp_change}</span>
                    <span>HP</span>
                </div>
            )}
        </div>
    );
}

export function MessageHistory({ messages, isLoading }: MessageHistoryProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-pixel text-sm scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-black">
            {messages.length === 0 && !isLoading && (
                <div className="flex h-full items-center justify-center text-cyber-muted text-xs font-mono opacity-50">
                    NO DATALOGS FOUND. INITIALIZE SIMULATION.
                </div>
            )}

            {messages.map((msg) => {
                const isSystem = msg.role !== 'user';
                // Only parse if system message to avoid over-processing user input
                const parsed = isSystem ? parseGameContent(msg.content) : null;
                const narrative = parsed?.narrative || msg.content;
                const options = parsed?.options;
                const stateChanges = parsed?.state_changes;

                return (
                    <div
                        key={msg.id}
                        className={cn(
                            "p-3 rounded border border-transparent animate-in fade-in slide-in-from-bottom-2 duration-300",
                            !isSystem
                                ? "bg-green-900/20 border-green-800/50 text-green-300 ml-8"
                                : "bg-black/50 text-green-400 mr-8"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase">
                            <span>{!isSystem ? '>> YOU' : '>> SYSTEM'}</span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className="leading-relaxed whitespace-pre-wrap">
                            {narrative}
                        </div>

                        {/* 상태 변경사항 표시 */}
                        {stateChanges && <StateChangeIndicator changes={stateChanges} />}

                        {/* Display options if they exist in the history log (optional context) */}
                        {options && options.length > 0 && (
                            <div className="mt-2 pl-2 border-l-2 border-green-800/50 opacity-70">
                                <span className="text-[10px] text-green-600 mb-1 block">AVAILABLE ACTIONS:</span>
                                <ul className="list-disc list-inside text-xs text-green-500/80">
                                    {options.map((opt, idx) => (
                                        <li key={idx}>{opt}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            })}

            {isLoading && (
                <div className="p-3 text-green-600 animate-pulse text-xs">
                    {'>'} PROCESSING RESPONSE...
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
}
