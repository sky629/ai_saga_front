import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { GameMessageResponse, MessageHistoryResponse, ParsedGameResponse, StateChanges } from '../../types/api';
import { cn } from '../../utils/cn';
import { Sparkles, Skull, MapPin, Package, Users } from 'lucide-react';

interface MessageHistoryProps {
    messages: (GameMessageResponse | MessageHistoryResponse)[];
    isLoading?: boolean;
    onActionSelect?: (action: string) => void;
}

// Utility to parse potentially JSON-encoded content
// Utility to parse potentially JSON-encoded content
function parseGameContent(content: string): ParsedGameResponse | null {
    console.log("[DEBUG] parseGameContent called with:", content.substring(0, 50) + "...");
    try {
        let jsonString = content;
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

        if (jsonMatch) {
            jsonString = jsonMatch[1];
        } else {
            // Try to find raw JSON object if no code blocks
            const firstBrace = content.indexOf('{');
            const lastBrace = content.lastIndexOf('}');

            // Only use brace extraction if it looks like the whole thing is wrapped
            // If the brace is very late in the string (e.g. part of state_changes at the end), don't strip the beginning!
            // Heuristic: If firstBrace is > 20 chars in, it's probably not wrapping the whole response.
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace && firstBrace < 20) {
                jsonString = content.substring(firstBrace, lastBrace + 1);
            }
        }

        // Attempt 1: Strict JSON Parse
        try {
            const parsed = JSON.parse(jsonString);
            if (typeof parsed === 'object' && parsed !== null && 'narrative' in parsed) {
                return parsed;
            }
        } catch (e) {
            // Check for unescaped control characters
        }

        // Attempt 2: Regex Extraction (Fallback)
        // Robust regex for narrative extraction allowing generic string contents
        const narrativeMatch = jsonString.match(/"narrative"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        let narrative = null;

        if (narrativeMatch) {
            narrative = narrativeMatch[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
        } else {
            // Attempt 3: Salvage Strategy (Missing JSON structure)
            // If we find "options": [ ... ], assume everything before it is the narrative
            const optionsIndex = jsonString.indexOf('"options":');
            if (optionsIndex !== -1) {
                // Take content up to the options key
                let rawNarrative = jsonString.substring(0, optionsIndex).trim();

                // Clean up trailing comma and quote if present
                if (rawNarrative.endsWith(',')) rawNarrative = rawNarrative.slice(0, -1).trim();
                if (rawNarrative.endsWith('"')) rawNarrative = rawNarrative.slice(0, -1);

                // Clean up leading quote and brace if present
                // But be careful not to remove real text if it starts with quote
                // A safe heuristic might be: check if it starts with {"narrative":
                // If not, it might be raw text.

                // If it looks like it was attempting to be JSON key "narrative": "..."
                const narrativeKeyMatch = rawNarrative.match(/"narrative"\s*:\s*"/);
                if (narrativeKeyMatch) {
                    rawNarrative = rawNarrative.substring(narrativeKeyMatch.index! + narrativeKeyMatch[0].length);
                } else if (rawNarrative.trim().startsWith('{')) {
                    // Maybe it started with { but failed to have "narrative" key properly?
                    // Just a fallback cleanup
                    rawNarrative = rawNarrative.replace(/^\{\s*/, '');
                }

                narrative = rawNarrative
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
            }
        }

        if (narrative) {
            // Extract options array
            const optionsMatch = jsonString.match(/"options"\s*:\s*\[([\s\S]*?)\]/);
            let options: string[] = [];
            if (optionsMatch) {
                const matches = optionsMatch[1].match(/"((?:[^"\\]|\\.)*)"/g);
                if (matches) {
                    options = matches.map(m => m.slice(1, -1).replace(/\\"/g, '"'));
                }
            }

            // Extract basic state changes if possible (optional)
            // ... skipping complex state changes regex for now as narrative is priority

            return {
                narrative,
                options,
                state_changes: {} // Regex parsing state changes is risky/complex
            };
        }

        return null;
    } catch {
        return null;
    }
}

// StateChangeIndicator: Visual feedback for state changes
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
        <div className="mt-3 pt-3 border-t border-dashed border-sanabi-cyan/20 space-y-2 text-xs bg-black/20 p-3 rounded-sm mx-2">
            <div className="text-sanabi-cyan font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles size={12} /> SYSTEM_UPDATE:
            </div>

            {changes.items_gained && changes.items_gained.length > 0 && (
                <div className="text-gray-300 flex items-center gap-2">
                    <Package size={12} className="text-sanabi-gold" />
                    <span className="font-bold text-sanabi-gold">+</span>
                    <span>ACQUIRED: {changes.items_gained.join(', ')}</span>
                </div>
            )}

            {changes.items_lost && changes.items_lost.length > 0 && (
                <div className="text-gray-300 flex items-center gap-2">
                    <Package size={12} className="text-sanabi-pink" />
                    <span className="font-bold text-sanabi-pink">-</span>
                    <span>LOST: {changes.items_lost.join(', ')}</span>
                </div>
            )}

            {changes.location && (
                <div className="text-gray-300 flex items-center gap-2">
                    <MapPin size={12} className="text-sanabi-cyan" />
                    <span className="font-bold text-sanabi-cyan">→</span>
                    <span>LOCATION: {changes.location}</span>
                </div>
            )}

            {changes.npcs_met && changes.npcs_met.length > 0 && (
                <div className="text-gray-300 flex items-center gap-2">
                    <Users size={12} className="text-purple-400" />
                    <span className="font-bold text-purple-400">?</span>
                    <span>CONTACT: {changes.npcs_met.join(', ')}</span>
                </div>
            )}

            {changes.discoveries && changes.discoveries.length > 0 && (
                <div className="text-gray-300 flex items-center gap-2">
                    <Sparkles size={12} className="text-sanabi-gold" />
                    <span className="font-bold text-sanabi-gold">!</span>
                    <span>DATA: {changes.discoveries.join(', ')}</span>
                </div>
            )}

            {changes.hp_change !== undefined && changes.hp_change !== 0 && (
                <div className={cn(
                    "flex items-center gap-2 font-bold",
                    changes.hp_change > 0 ? "text-sanabi-green" : "text-sanabi-pink"
                )}>
                    {changes.hp_change < 0 ? <Skull size={12} /> : <div className="w-3 h-3 rounded-full bg-sanabi-green shadow-[0_0_5px_rgba(0,255,157,0.8)]" />}
                    <span>{changes.hp_change > 0 ? '+' : ''}{changes.hp_change} INTEGRITY</span>
                </div>
            )}
        </div>
    );
}

export function MessageHistory({ messages, isLoading, onActionSelect }: MessageHistoryProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 font-pixel text-sm scrollbar-hide">
            {messages.length === 0 && !isLoading && (
                <div className="flex h-full items-center justify-center text-pixel-brown/50 text-xs font-bold opacity-70">
                    The pages are blank. Your story begins now.
                </div>
            )}

            {messages.map((msg, index) => {
                const isSystem = msg.role !== 'user';
                const parsed = isSystem ? parseGameContent(msg.content) : null;
                const narrative = parsed?.narrative || msg.content;
                const options = parsed?.options;
                const stateChanges = parsed?.state_changes;

                return (
                    <div
                        key={msg.id}
                        className={cn(
                            "relative p-4 text-base leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-lg backdrop-blur-sm",
                            !isSystem
                                ? "bg-sanabi-panel/90 border border-sanabi-cyan/50 text-sanabi-text ml-12 rounded-tr-xl rounded-bl-xl rounded-tl-xl shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                                : "bg-black/60 border border-sanabi-pink/30 text-gray-300 mr-8 rounded-tl-xl rounded-br-xl rounded-tr-xl"
                        )}
                    >
                        {/* Avatar / Name Tag */}
                        <div className={cn(
                            "absolute -top-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border shadow-sm flex items-center gap-2 backdrop-blur-md",
                            !isSystem
                                ? "right-4 bg-black/80 text-sanabi-cyan border-sanabi-cyan shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                                : "left-4 bg-black/80 text-sanabi-pink border-sanabi-pink shadow-[0_0_10px_rgba(255,0,85,0.4)]"
                        )}>
                            <span className={cn(isSystem && "animate-pulse")}>{!isSystem ? 'YOU' : 'SYSTEM.AI'}</span>
                            <span className="opacity-70 font-mono border-l border-current pl-2 text-[9px]">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="pt-2 prose prose-sm max-w-none text-gray-300 prose-p:leading-relaxed prose-p:mb-2 prose-headings:font-bold prose-headings:text-sanabi-cyan prose-strong:text-sanabi-gold prose-strong:font-bold prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4">
                            <ReactMarkdown
                                components={{
                                    p: ({ node, ...props }) => <p className="mb-2 leading-loose" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-sanabi-cyan/80" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-sanabi-cyan/80" {...props} />,
                                    li: ({ node, ...props }) => <li className="pl-1 text-gray-300" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-bold text-sanabi-green bg-sanabi-green/10 px-1 rounded-sm shadow-[0_0_5px_rgba(0,255,157,0.3)]" {...props} />,
                                }}
                            >
                                {narrative}
                            </ReactMarkdown>
                        </div>

                        {/* State & Options (System Only) */}
                        {isSystem && (
                            <>
                                {stateChanges && <StateChangeIndicator changes={stateChanges} />}

                                {options && options.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-sanabi-cyan/20">
                                        <span className="text-xs font-bold text-sanabi-cyan mb-2 block uppercase tracking-wide opacity-80 animate-pulse">Available Actions:</span>
                                        <div className="flex flex-col gap-2">
                                            {options.map((opt, idx) => {
                                                const isLatestMessage = index === messages.length - 1;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => isLatestMessage && onActionSelect?.(opt)}
                                                        className={cn(
                                                            "border px-3 py-3 text-sm rounded shadow-sm flex items-start gap-3 transition-all group relative overflow-hidden",
                                                            isLatestMessage
                                                                ? "bg-black/40 border-sanabi-cyan/40 text-gray-200 cursor-pointer hover:bg-sanabi-cyan/10 hover:border-sanabi-cyan hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-[0.99]"
                                                                : "bg-black/20 border-white/5 text-gray-600 cursor-not-allowed opacity-50"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "absolute left-0 top-0 bottom-0 w-[2px] transition-all group-hover:bg-sanabi-cyan",
                                                            isLatestMessage ? "bg-sanabi-cyan/30" : "bg-transparent"
                                                        )} />

                                                        <span className={cn(
                                                            "font-bold min-w-[20px] font-mono",
                                                            isLatestMessage ? "text-sanabi-cyan group-hover:text-white" : "text-gray-600"
                                                        )}>{`0${idx + 1}`}</span>
                                                        <span className="font-pixel relative z-10">{opt}</span>

                                                        {isLatestMessage && (
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sanabi-cyan">
                                                                &lt;&lt;
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            })}

            {isLoading && (
                <div className="p-4 text-sanabi-cyan animate-pulse text-xs font-bold flex items-center justify-center gap-2">
                    <Sparkles size={16} className="animate-spin" />
                    <span>PROCESSING_SCENARIO...</span>
                </div>
            )}
            <div ref={bottomRef} className="pb-2" />
        </div>
    );
}
