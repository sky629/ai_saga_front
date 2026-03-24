import axios from 'axios';
import { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import type {
    GameActionOption,
    GameActionType,
    GameMessageResponse,
    MessageHistoryResponse,
    ParsedGameResponse,
    StateChanges,
} from '../../types/api';
import { cn } from '../../utils/cn';
import { Sparkles, Skull, MapPin, Package, Users, Palette, Loader2, ImageOff } from 'lucide-react';
import { gameService } from '../../services/gameService';

interface MessageHistoryProps {
    messages: (GameMessageResponse | MessageHistoryResponse)[];
    isLoading?: boolean;
    onActionSelect?: (option: GameActionOption) => void;
    sessionId?: string | null;
    canSelectActions?: boolean;
    autoScrollBehavior?: ScrollBehavior;
}

const DICE_ACTION_TYPES: GameActionType[] = [
    'combat',
    'social',
    'skill',
    'exploration',
];

function inferActionType(label: string): GameActionType {
    const normalized = label.toLowerCase().trim();

    if (['공격', '베기', '찌르기', '전투', 'attack', 'fight', 'strike', 'hit'].some(keyword => normalized.includes(keyword))) {
        return 'combat';
    }
    if (['설득', '협상', '위협', 'persuade', 'negotiate', 'threaten'].some(keyword => normalized.includes(keyword))) {
        return 'social';
    }
    if (['대화', '말', 'talk', 'speak'].some(keyword => normalized.includes(keyword))) {
        return 'social';
    }
    if (['자물쇠', '함정', '해킹', '수리', 'unlock', 'disarm', 'hack', 'repair'].some(keyword => normalized.includes(keyword))) {
        return 'skill';
    }
    if (['휴식', '쉰', 'rest', 'wait', '대기'].some(keyword => normalized.includes(keyword))) {
        return 'rest';
    }
    if (['관찰', '살핀', '본다', 'look', 'observe', 'inspect'].some(keyword => normalized.includes(keyword))) {
        return 'observation';
    }
    if (['이동', '간다', '걷', 'move', 'walk', 'go'].some(keyword => normalized.includes(keyword))) {
        return 'movement';
    }
    if (['잠입', '탈출', '도망', '등반', '점프', '숨', 'escape', 'sneak', 'climb', 'jump'].some(keyword => normalized.includes(keyword))) {
        return 'exploration';
    }
    return 'observation';
}

function requiresDice(actionType: GameActionType): boolean {
    return DICE_ACTION_TYPES.includes(actionType);
}

function normalizeOption(option: unknown): GameActionOption | null {
    if (typeof option === 'string') {
        const actionType = inferActionType(option);
        return {
            label: option,
            action_type: actionType,
            requires_dice: requiresDice(actionType),
        };
    }

    if (
        typeof option === 'object' &&
        option !== null &&
        'label' in option &&
        typeof option.label === 'string'
    ) {
        const rawActionType =
            'action_type' in option && typeof option.action_type === 'string'
                ? (option.action_type as GameActionType)
                : inferActionType(option.label);
        return {
            label: option.label,
            action_type: rawActionType,
            requires_dice:
                'requires_dice' in option &&
                typeof option.requires_dice === 'boolean'
                    ? option.requires_dice
                    : requiresDice(rawActionType),
        };
    }

    return null;
}

function normalizeOptions(options: unknown): GameActionOption[] {
    if (!Array.isArray(options)) {
        return [];
    }

    return options
        .map(normalizeOption)
        .filter((option): option is GameActionOption => option !== null);
}

function decodeJsonString(value: string): string {
    return value
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
}

function normalizeNarrativeText(value: string): string {
    return value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?(b|strong)>/gi, '**')
        .replace(/<\/?(i|em)>/gi, '*')
        .replace(/&nbsp;/gi, ' ')
        .trim();
}

function normalizeParsedResponse(parsed: unknown): ParsedGameResponse | null {
    if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('narrative' in parsed) ||
        typeof parsed.narrative !== 'string'
    ) {
        return null;
    }

    const beforeNarrative =
        'before_narrative' in parsed && typeof parsed.before_narrative === 'string'
            ? normalizeNarrativeText(parsed.before_narrative)
            : undefined;
    const narrative = normalizeNarrativeText(parsed.narrative);

    return {
        before_narrative: beforeNarrative,
        narrative:
            beforeNarrative && beforeNarrative !== narrative
                ? `${beforeNarrative}\n\n${narrative}`
                : narrative,
        options: normalizeOptions(
            'options' in parsed ? parsed.options : []
        ),
        state_changes:
            'state_changes' in parsed &&
            typeof parsed.state_changes === 'object' &&
            parsed.state_changes !== null
                ? (parsed.state_changes as StateChanges)
                : undefined,
    };
}

function parseGameContent(content: string): ParsedGameResponse | null {
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
                return normalizeParsedResponse(parsed);
            }
        } catch {
            // Check for unescaped control characters
        }

        // Attempt 2: Regex Extraction (Fallback)
        // Robust regex for narrative extraction allowing generic string contents
        const narrativeMatch = jsonString.match(/"narrative"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        let narrative = null;

        if (narrativeMatch) {
            narrative = normalizeNarrativeText(
                narrativeMatch[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\')
            );
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

                narrative = normalizeNarrativeText(
                    rawNarrative
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\')
                );
            }
        }

        if (narrative) {
            const optionsMatch = jsonString.match(/"options"\s*:\s*\[([\s\S]*?)\]/);
            let options: GameActionOption[] = [];
            if (optionsMatch) {
                const optionsBody = optionsMatch[1];
                if (optionsBody.includes('"label"')) {
                    const objectOptions = Array.from(
                        optionsBody.matchAll(
                            /"label"\s*:\s*"((?:[^"\\]|\\.)*)"(?:[\s\S]*?"action_type"\s*:\s*"((?:[^"\\]|\\.)*)")?/g
                        )
                    );

                    options = objectOptions
                        .map((match) =>
                            normalizeOption({
                                label: decodeJsonString(match[1]),
                                action_type: match[2]
                                    ? decodeJsonString(match[2])
                                    : undefined,
                            })
                        )
                        .filter(
                            (option): option is GameActionOption =>
                                option !== null
                        );
                } else {
                    const matches = optionsBody.match(
                        /"((?:[^"\\]|\\.)*)"/g
                    );
                    if (matches) {
                        options = matches
                            .map((m) => decodeJsonString(m.slice(1, -1)))
                            .map(normalizeOption)
                            .filter(
                                (option): option is GameActionOption =>
                                    option !== null
                            );
                    }
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
                    <span>
                        {changes.hp_change > 0
                            ? `+${changes.hp_change} HEAL`
                            : `-${Math.abs(changes.hp_change)} DAMAGE`}
                    </span>
                </div>
            )}
        </div>
    );
}


function IllustrationSection({
    messageId,
    sessionId,
    initialImageUrl,
}: {
    messageId: string;
    sessionId: string;
    initialImageUrl?: string | null;
}) {
    const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl ?? null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await gameService.generateIllustration(sessionId, messageId);
            setImageUrl(result.image_url);
        } catch (error: unknown) {
            const msg = axios.isAxiosError(error)
                ? (error.response?.data as { message?: string } | undefined)
                    ?.message || 'ILLUST_ERROR: 일러스트 생성에 실패했습니다.'
                : 'ILLUST_ERROR: 일러스트 생성에 실패했습니다.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, messageId]);

    if (imageUrl) {
        return (
            <div className="mt-3 relative overflow-hidden rounded-sm border border-sanabi-pink/20 group">
                <img
                    src={imageUrl}
                    alt="Scene Illustration"
                    className="w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ imageRendering: 'pixelated', maxHeight: '320px' }}
                    onError={() => {
                        console.error("ILLUST_LOAD_FAILED:", imageUrl);
                        setError("IMAGE_LOAD_ERR: 이미지를 불러올 수 없습니다. URL 설정을 확인하세요.");
                        setImageUrl(null);
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
            </div>
        );
    }

    return (
        <div className="mt-3 pt-2 border-t border-dashed border-sanabi-pink/20">
            {error && (
                <div className="flex items-center gap-2 text-xs text-sanabi-pink mb-2">
                    <ImageOff size={12} />
                    <span className="font-mono">{error}</span>
                </div>
            )}
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all",
                    "border-sanabi-pink/40 text-sanabi-pink/70 rounded-sm",
                    isLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-sanabi-pink hover:text-sanabi-pink hover:shadow-[0_0_10px_rgba(255,0,85,0.3)] hover:bg-sanabi-pink/10 active:scale-95"
                )}
            >
                {isLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                ) : (
                    <Palette size={12} />
                )}
                <span>{isLoading ? 'GENERATING...' : 'GEN_ILLUST'}</span>
            </button>
        </div>
    );
}

export function MessageHistory({
    messages,
    isLoading,
    onActionSelect,
    sessionId,
    canSelectActions = true,
    autoScrollBehavior = 'auto',
}: MessageHistoryProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: autoScrollBehavior });
    }, [messages, autoScrollBehavior]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 font-pixel text-sm scrollbar-hide">
            {messages.length === 0 && !isLoading && (
                <div className="flex h-full items-center justify-center text-pixel-brown/50 text-xs font-bold opacity-70">
                    The pages are blank. Your story begins now.
                </div>
            )}

            {messages.map((msg, index) => {
                const isSystem = msg.role !== 'user';
                const isLatestMessage = index === messages.length - 1;
                const shouldShowOptions =
                    isSystem &&
                    isLatestMessage &&
                    canSelectActions;
                const parsed = isSystem
                    ? normalizeParsedResponse((msg as GameMessageResponse).parsed_response)
                        ?? parseGameContent(msg.content)
                    : null;
                const narrative = parsed?.narrative || msg.content;
                const options = parsed?.options;
                const stateChanges = parsed?.state_changes;
                const msgImageUrl = (msg as GameMessageResponse).image_url;

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

                        {/* Content - Enhanced Readability */}
                        <div
                            className="pt-2 prose prose-sm max-w-none break-keep tracking-wide"
                            style={{
                                wordBreak: 'keep-all',
                                overflowWrap: 'break-word',
                                lineHeight: '2.4rem',
                                color: '#EFEFEF'
                            }}
                        >
                            <ReactMarkdown
                                components={{
                                    p: ({ ...props }) => (
                                        <p
                                            style={{
                                                marginBottom: '1.5rem',
                                                lineHeight: '2.4rem',
                                                wordBreak: 'keep-all',
                                                fontSize: '16px',
                                                color: '#EFEFEF'
                                            }}
                                            {...props}
                                        />
                                    ),
                                    ul: ({ ...props }) => <ul className="list-disc pl-5 space-y-2 text-sanabi-cyan/80" style={{ marginBottom: '1.5rem' }} {...props} />,
                                    ol: ({ ...props }) => <ol className="list-decimal pl-5 space-y-2 text-sanabi-cyan/80" style={{ marginBottom: '1.5rem' }} {...props} />,
                                    li: ({ ...props }) => <li className="pl-1 text-gray-300" style={{ lineHeight: '2rem', fontSize: '15px' }} {...props} />,
                                    strong: ({ ...props }) => <strong className="font-bold text-sanabi-green bg-sanabi-green/10 px-1 rounded-sm shadow-[0_0_5px_rgba(0,255,157,0.3)] mx-1" {...props} />,
                                    em: ({ ...props }) => <em className="text-sanabi-pink not-italic font-medium mx-0.5" {...props} />,
                                    code: ({ ...props }) => <code className="font-mono text-xs bg-black/50 px-1.5 py-0.5 rounded border border-sanabi-cyan/30 text-sanabi-cyan mx-1" {...props} />,
                                }}
                            >
                                {narrative}
                            </ReactMarkdown>
                        </div>

                        {/* State & Options (System Only) */}
                        {isSystem && (
                            <>
                                {/* 일러스트 섹션 - 네러티브 바로 아래 표시 */}
                                {sessionId && (
                                    <IllustrationSection
                                        messageId={msg.id}
                                        sessionId={sessionId}
                                        initialImageUrl={msgImageUrl}
                                    />
                                )}

                                {stateChanges && <StateChangeIndicator changes={stateChanges} />}
                                {shouldShowOptions && options && options.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-sanabi-cyan/20">
                                        <span className="text-xs font-bold text-sanabi-cyan mb-2 block uppercase tracking-wide opacity-80 animate-pulse">Available Actions:</span>
                                        <div className="flex flex-col gap-2">
                                            {options.map((opt, idx) => {
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => onActionSelect?.(opt)}
                                                        className={cn(
                                                            "border px-3 py-3 text-sm rounded shadow-sm flex items-start gap-3 transition-all group relative overflow-hidden",
                                                            "bg-black/40 border-sanabi-cyan/40 text-gray-200 cursor-pointer hover:bg-sanabi-cyan/10 hover:border-sanabi-cyan hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-[0.99]"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "absolute left-0 top-0 bottom-0 w-[2px] transition-all group-hover:bg-sanabi-cyan",
                                                            "bg-sanabi-cyan/30"
                                                        )} />
                                                        <span className={cn(
                                                            "font-bold min-w-[20px] font-mono",
                                                            "text-sanabi-cyan group-hover:text-white"
                                                        )}>{`0${idx + 1}`}</span>
                                                        <span className="font-pixel relative z-10">{opt.label}</span>

                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sanabi-cyan">
                                                            &lt;&lt;
                                                        </div>
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
