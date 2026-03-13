import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameService } from '../services/gameService';
import { useAuth } from '../hooks/useAuth';
import { PixelLayout } from '../components/layout/PixelLayout';
import { PixelCard } from '../components/layout/PixelCard';
import { PixelButton } from '../components/layout/PixelButton';
import { MessageHistory } from '../components/game/MessageHistory';
import { ActionInput } from '../components/game/ActionInput';
import { StatusPanel } from '../components/game/StatusPanel';
import { GameStatePanel } from '../components/game/GameStatePanel';
import { ScenarioSelectionModal } from '../components/game/ScenarioSelectionModal';
import { DiceResultPanel } from '../components/game/DiceResultPanel';
import type {
    CharacterResponse,
    GameMessageResponse,
    MessageHistoryResponse,
    ScenarioResponse,
    DiceResult,
    GameActionOption,
    GameActionType,
    GameActionResponse,
    GameTurnResponse,
} from '../types/api';

function isGameActionResponse(data: GameTurnResponse): data is GameActionResponse {
    return 'message' in data;
}

interface PendingNarrativeState {
    systemMsg: GameMessageResponse;
    xpMsg: GameMessageResponse | null;
    lvMsg: GameMessageResponse | null;
    hpChange: number;
    shouldRefresh: boolean;
    shouldInvalidateSession: boolean;
}

function getHttpStatus(error: unknown): number | undefined {
    if (axios.isAxiosError(error)) {
        return error.response?.status;
    }
    return undefined;
}

function extractHpChange(data: GameActionResponse): number {
    if (data.state_changes && typeof data.state_changes.hp_change === 'number') {
        return data.state_changes.hp_change;
    }

    const parsedResponse = data.message.parsed_response;
    if (
        typeof parsedResponse !== 'object' ||
        parsedResponse === null ||
        !('state_changes' in parsedResponse)
    ) {
        return 0;
    }

    const stateChanges = parsedResponse.state_changes;
    if (
        typeof stateChanges !== 'object' ||
        stateChanges === null ||
        !('hp_change' in stateChanges) ||
        typeof stateChanges.hp_change !== 'number'
    ) {
        return 0;
    }

    return stateChanges.hp_change;
}

function applyHpChange(
    character: CharacterResponse,
    hpChange: number
): CharacterResponse {
    if (hpChange === 0) {
        return character;
    }

    const nextHp = Math.max(
        0,
        Math.min(character.stats.max_hp, character.stats.hp + hpChange)
    );

    return {
        ...character,
        stats: {
            ...character.stats,
            hp: nextHp,
        },
    };
}

export default function GameSession() {
    const { characterId } = useParams<{ characterId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { refreshUser } = useAuth();

    // State
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [localMessages, setLocalMessages] = useState<(GameMessageResponse | MessageHistoryResponse)[]>([]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [actionInput, setActionInput] = useState('');
    const [selectedActionType, setSelectedActionType] = useState<GameActionType | null>(null);
    const [diceResult, setDiceResult] = useState<DiceResult | null>(null);
    const [dicePanelHpChange, setDicePanelHpChange] = useState(0);
    const [pendingNarrative, setPendingNarrative] =
        useState<PendingNarrativeState | null>(null);
    const [diceSequence, setDiceSequence] = useState(0);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isSessionEnded, setIsSessionEnded] = useState(false);

    const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
    const [showScenarioSelect, setShowScenarioSelect] = useState(false);

    // 1. Fetch Character Info
    const { data: characters, isLoading: isLoadingChar } = useQuery({
        queryKey: ['characters'],
        queryFn: gameService.getCharacters
    });
    const character = characters?.find(c => c.id === characterId);
    const [localCharacter, setLocalCharacter] =
        useState<CharacterResponse | null>(null);

    useEffect(() => {
        if (character) {
            setLocalCharacter(character);
        }
    }, [character]);

    // 1.5. Fetch Session Info (for game_state)
    const { data: sessionData } = useQuery({
        queryKey: ['session', sessionId],
        queryFn: async () => {
            if (!sessionId) return null;
            return await gameService.getSession(sessionId);
        },
        enabled: !!sessionId,
        retry: false
    });

    useEffect(() => {
        if (sessionData?.status === 'completed') {
            setIsSessionEnded(true);
        }
    }, [sessionData?.status]);

    // 2. Fetch or Initialize Session
    useEffect(() => {
        const checkSession = async () => {
            if (!characterId || sessionId) {
                setIsCheckingSession(false);
                return;
            }

            try {
                // Check for existing sessions for this character
                const sessions = await gameService.getSessions(100);
                const existingSession = sessions.items.find((s) =>
                    s.character.id === characterId
                );

                if (existingSession) {
                    setSessionId(existingSession.id);
                } else {
                    // No session found, load scenarios and prompt user (New Game)
                    const loadedScenarios = await gameService.getScenarios();
                    setScenarios(loadedScenarios);
                    setShowScenarioSelect(true);
                }
            } catch (error) {
                console.error("Failed to check sessions", error);
            } finally {
                setIsCheckingSession(false);
            }
        };

        if (character) {
            checkSession();
        }
    }, [characterId, sessionId, character]);

    // Handle Scenario Selection
    const handleScenarioSelect = async (scenarioId: string) => {
        if (!characterId) return;
        try {
            const newSession = await gameService.startGame(characterId, scenarioId);
            setSessionId(newSession.id);
            setIsSessionEnded(false);
            if (newSession.image_url) {
                setImageUrl(newSession.image_url);
            }
            setShowScenarioSelect(false);
        } catch (e) {
            console.error("Failed to start session", e);
        }
    };

    // 3. Fetch Messages once we have Session ID
    const { data: messageHistory } = useQuery({
        queryKey: ['session_messages', sessionId],
        queryFn: async () => {
            if (!sessionId) return null;
            try {
                return await gameService.getSessionMessages(sessionId);
            } catch (error: unknown) {
                if (getHttpStatus(error) === 404) {
                    return { items: [], has_more: false, next_cursor: null };
                }
                throw error;
            }
        },
        enabled: !!sessionId,
        retry: (failureCount, error: unknown) => {
            if (getHttpStatus(error) === 404) return false;
            return failureCount < 3;
        }
    });

    // Sync initial messages
    useEffect(() => {
        if (messageHistory?.items) {
            setLocalMessages([...messageHistory.items].reverse());
        }
    }, [messageHistory]);

    // 4. Action Mutation
    const sendActionMutation = useMutation({
        mutationFn: ({
            action,
            actionType,
        }: {
            action: string;
            actionType?: GameActionType | null;
        }) => {
            if (!sessionId) throw new Error("No active session");
            return gameService.sendAction(sessionId, action, actionType);
        },
        onSuccess: (data) => {
            // New Action start: Clear previous dice result immediately
            setDiceResult(null);
            setDicePanelHpChange(0);
            setPendingNarrative(null);

            if (!isGameActionResponse(data)) {
                setIsSessionEnded(true);

                const endingMessage: GameMessageResponse = {
                    id: `ending-${Date.now()}`,
                    role: 'system',
                    content: `${data.narrative}\n\n[ENDING] ${data.ending_type.toUpperCase()}`,
                    created_at: new Date().toISOString()
                };
                const endingUpdates: GameMessageResponse[] = [endingMessage];
                if (data.xp_gained > 0) {
                    endingUpdates.push({
                        id: `xp-end-${Date.now()}`,
                        role: 'system',
                        content: `[SYSTEM] SYNC_DATA: +${data.xp_gained} XP RECEIVED`,
                        created_at: new Date().toISOString()
                    });
                }
                if (data.leveled_up) {
                    endingUpdates.push({
                        id: `lv-end-${Date.now()}`,
                        role: 'system',
                        content: `[SYSTEM] NEURAL_SYNC_LEVEL_UP: REACHED LEVEL ${data.new_game_level}`,
                        created_at: new Date().toISOString()
                    });
                }
                setLocalMessages(prev => [...prev, ...endingUpdates]);
                if (data.xp_gained > 0) {
                    refreshUser();
                }
                queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
                queryClient.invalidateQueries({ queryKey: ['characters'] });
                return;
            }

            const systemMsg: GameMessageResponse = {
                ...data.message,
                role: 'system',
            };
            const hpChange = extractHpChange(data);

            if (hpChange !== 0) {
                setLocalCharacter((current) =>
                    current ? applyHpChange(current, hpChange) : current
                );
            }

            const xpMsg = data.xp_gained && data.xp_gained > 0 ? {
                id: `xp-${Date.now()}`,
                role: 'system',
                content: `[SYSTEM] SYNC_DATA: +${data.xp_gained} XP RECEIVED`,
                created_at: new Date().toISOString()
            } : null;

            const lvMsg = data.leveled_up ? {
                id: `lv-${Date.now()}`,
                role: 'system',
                content: `[SYSTEM] NEURAL_SYNC_LEVEL_UP: REACHED LEVEL ${data.new_game_level}`,
                created_at: new Date().toISOString()
            } : null;

            // Handle delayed reveal if dice is involved
            if (data.dice_result) {
                // Show before_roll_narrative immediately (pre-dice tension)
                if (data.before_roll_narrative) {
                    const beforeMsg: GameMessageResponse = {
                        id: `before-${Date.now()}`,
                        role: 'system',
                        content: data.before_roll_narrative,
                        created_at: new Date().toISOString()
                    };
                    setLocalMessages(prev => [...prev, beforeMsg]);
                }
                setDiceResult(data.dice_result);
                setDicePanelHpChange(hpChange);
                setDiceSequence(prev => prev + 1);
                setPendingNarrative({
                    systemMsg,
                    xpMsg,
                    lvMsg,
                    hpChange,
                    shouldRefresh: !!data.xp_gained,
                    shouldInvalidateSession: true,
                });
            } else {
                // No dice: reveal everything immediately
                const updates: GameMessageResponse[] = [systemMsg];
                if (xpMsg) updates.push(xpMsg);
                if (lvMsg) updates.push(lvMsg);
                setLocalMessages(prev => [...prev, ...updates]);
                if (data.xp_gained) refreshUser();
                queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
                queryClient.invalidateQueries({ queryKey: ['characters'] });
            }
            
            if (data.image_url) {
                setImageUrl(data.image_url);
            }
        }
    });

    const handleSendAction = async (content: string) => {
        // Clear previous results immediately for UI responsiveness
        setDiceResult(null);
        setDicePanelHpChange(0);
        setPendingNarrative(null);
        const actionType = selectedActionType;
        setSelectedActionType(null);

        const tempMsg: GameMessageResponse = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content,
            created_at: new Date().toISOString()
        };
        setLocalMessages(prev => [...prev, tempMsg]);

        try {
            setActionError(null);
            await sendActionMutation.mutateAsync({
                action: content,
                actionType,
            });
        } catch (error: unknown) {
            console.error("Action failed", error);
            if (getHttpStatus(error) === 429) {
                setActionError("System_Overload: Request limit exceeded. Please wait a moment.");
            } else {
                setActionError("System_Error: Neural link interrupted. Please try again.");
            }
        }
    };

    const handleDiceComplete = () => {
        if (pendingNarrative) {
            const { systemMsg, xpMsg, lvMsg, shouldRefresh, shouldInvalidateSession } = pendingNarrative;
            const updates: GameMessageResponse[] = [systemMsg];
            if (xpMsg) updates.push(xpMsg);
            if (lvMsg) updates.push(lvMsg);
            
            setLocalMessages(prev => [...prev, ...updates]);
            if (shouldRefresh) refreshUser();
            if (shouldInvalidateSession) {
                queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
                queryClient.invalidateQueries({ queryKey: ['characters'] });
            }
            setPendingNarrative(null);
        }
    };

    if (isLoadingChar || !character || !localCharacter) {
        return (
            <PixelLayout>
                <div className="flex h-full items-center justify-center text-pixel-brown animate-pulse text-lg font-bold">
                    {isLoadingChar ? 'Looking for Adventurer...' : 'Adventurer Not Found'}
                </div>
            </PixelLayout>
        );
    }

    return (
        <PixelLayout>
            {showScenarioSelect ? (
                <ScenarioSelectionModal
                    scenarios={scenarios}
                    onSelect={handleScenarioSelect}
                />
            ) : (
                <div className="flex flex-col md:flex-row h-full gap-4 overflow-hidden p-4">
                    {/* Main Game Window */}
                    <div className="flex-1 flex flex-col h-full min-h-0">
                        <PixelCard
                            variant="cyber"
                            className="flex-1 flex flex-col p-0 overflow-hidden border-sanabi-cyan/50"
                        >
                            <div className="flex flex-col h-full min-h-0 relative">
                                {/* Inner Header for Title Visibility */}
                                <div className="bg-sanabi-panel text-sanabi-cyan px-4 py-2 font-bold text-center border-b border-sanabi-cyan/30 shrink-0 z-20 flex justify-between items-center shadow-[0_4px_20px_rgba(0,240,255,0.1)]">
                                    <span className="text-xs uppercase tracking-widest text-sanabi-cyan/70">System.Log</span>
                                    <span className="tracking-widest animate-pulse">
                                        {sessionId ? `// ${(sessionData?.scenario_id || 'Adventure').substring(0, 12)}` : 'Connecting...'}
                                    </span>
                                    <span className="w-16"></span>
                                </div>

                                {isCheckingSession ? (
                                    <div className="flex-1 flex items-center justify-center text-sanabi-cyan animate-pulse font-bold tracking-widest">
                                        _INITIALIZING_NEURAL_LINK...
                                    </div>
                                ) : !sessionId ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-sanabi-pink font-bold gap-4">
                                        <p className="animate-pulse">_CONNECTION_LOST</p>
                                        <PixelButton onClick={() => window.location.reload()} size="sm" variant="danger">
                                            RECONNECT
                                        </PixelButton>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 flex flex-col relative overflow-hidden bg-sanabi-bg/80 min-h-0">
                                            {imageUrl && (
                                                <div className="w-full h-32 md:h-64 shrink-0 bg-black border-b border-sanabi-cyan/30 flex items-center justify-center overflow-hidden hidden md:flex relative group">
                                                    <img
                                                        src={imageUrl}
                                                        alt="Current Scene"
                                                        className="w-full h-full object-cover pixelated opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                                                        style={{ imageRendering: 'pixelated' }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-sanabi-bg via-transparent to-transparent pointer-events-none" />
                                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                                                </div>
                                            )}

                                            {/* Mobile-only Image (Smaller) */}
                                            {imageUrl && (
                                                <div className="w-full h-24 shrink-0 bg-black border-b border-sanabi-cyan/30 flex items-center justify-center overflow-hidden md:hidden relative">
                                                    <img
                                                        src={imageUrl}
                                                        alt="Current Scene"
                                                        className="w-full h-full object-cover pixelated opacity-80"
                                                        style={{ imageRendering: 'pixelated' }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-sanabi-bg via-transparent to-transparent pointer-events-none" />
                                                </div>
                                            )}

                                            <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                                            <div className="p-4 pb-0">
                                                    <DiceResultPanel 
                                                        key={diceResult ? `dice-${diceSequence}` : 'no-dice'}
                                                        diceResult={diceResult}
                                                        hpChange={dicePanelHpChange}
                                                        onComplete={handleDiceComplete}
                                                    />
                                                </div>
                                                    <MessageHistory
                                                    messages={localMessages}
                                                    isLoading={!!sendActionMutation.isPending}
                                                    onActionSelect={(option: GameActionOption) => {
                                                        setActionInput(option.label);
                                                        setSelectedActionType(option.action_type);
                                                        if (actionError) setActionError(null);
                                                    }}
                                                    sessionId={sessionId}
                                                />
                                            </div>
                                        </div>

                                        <div className="p-0 border-t border-sanabi-cyan/30 z-10 bg-sanabi-panel shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
                                            <ActionInput
                                                error={actionError}
                                                onSend={(content) => {
                                                    handleSendAction(content);
                                                    setActionInput('');
                                                }}
                                                disabled={
                                                    !!sendActionMutation.isPending
                                                    || !sessionId
                                                    || isSessionEnded
                                                    || sessionData?.status === 'completed'
                                                    
                                                    || (!!diceResult && !!pendingNarrative) // Disable input while dice is visible and narrative is pending
                                                }
                                                value={actionInput}
                                                onChange={(val) => {
                                                    setActionInput(val);
                                                    setSelectedActionType(null);
                                                    if (actionError) setActionError(null);
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </PixelCard>
                    </div>

                    {/* Status Sidebar Window */}
                    <div className="w-full md:w-80 flex flex-col gap-4 h-auto md:h-full overflow-y-auto md:overflow-hidden shrink-0 scrollbar-hide">
                        {/* Character Status */}
                        <PixelCard variant="cyber" className="p-0 overflow-hidden shrink-0 border-sanabi-pink/50">
                            <div className="flex flex-col">
                                <div className="bg-sanabi-panel text-sanabi-pink px-3 py-1.5 font-bold text-center border-b border-sanabi-pink/30 shrink-0 uppercase tracking-widest text-[10px] flex justify-between">
                                    <span>내 정보</span>
                                    <span className="animate-pulse">_LIVE</span>
                                </div>
                                <StatusPanel character={localCharacter} />
                            </div>
                        </PixelCard>

                        {/* Game State Panel */}
                        {sessionData && sessionData.game_state && (
                            <PixelCard variant="cyber" className="flex-1 min-h-[200px] flex flex-col p-0 border-sanabi-gold/50">
                                <div className="flex flex-col h-full min-h-0">
                                    <div className="bg-sanabi-panel text-sanabi-gold px-4 py-2 font-bold text-center border-b border-sanabi-gold/30 shrink-0 uppercase tracking-widest text-xs flex justify-between">
                                        <span>현재 상황</span>
                                        <span>_SYNCED</span>
                                    </div>
                                    <div className="p-4 flex-1 overflow-y-auto min-h-0">
                                        <GameStatePanel
                                            gameState={sessionData.game_state}
                                            currentLocation={sessionData.current_location}
                                            turnCount={sessionData.turn_count}
                                            maxTurns={sessionData.max_turns}
                                            status={sessionData.status}
                                        />
                                    </div>
                                </div>
                            </PixelCard>
                        )}

                        <div className="mt-auto shrink-0 pb-1">
                            <PixelButton
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                onClick={() => navigate('/stories')}
                            >
                                BACK TO STORIES
                            </PixelButton>
                        </div>
                    </div>
                </div>
            )}
        </PixelLayout>
    );
}
