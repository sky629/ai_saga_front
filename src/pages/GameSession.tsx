import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameService } from '../services/gameService';
import { PixelLayout } from '../components/layout/PixelLayout';
import { PixelCard } from '../components/layout/PixelCard';
import { PixelButton } from '../components/layout/PixelButton';
import { MessageHistory } from '../components/game/MessageHistory';
import { ActionInput } from '../components/game/ActionInput';
import { StatusPanel } from '../components/game/StatusPanel';
import { GameStatePanel } from '../components/game/GameStatePanel';
import { ScenarioSelectionModal } from '../components/game/ScenarioSelectionModal';
import type {
    GameMessageResponse,
    MessageHistoryResponse,
    ScenarioResponse
} from '../types/api';

export default function GameSession() {
    const { characterId } = useParams<{ characterId: string }>();
    const queryClient = useQueryClient();

    // State
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [localMessages, setLocalMessages] = useState<(GameMessageResponse | MessageHistoryResponse)[]>([]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [actionInput, setActionInput] = useState('');

    // Scenario Selection State
    const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
    const [showScenarioSelect, setShowScenarioSelect] = useState(false);

    // 1. Fetch Character Info
    const { data: characters, isLoading: isLoadingChar } = useQuery({
        queryKey: ['characters'],
        queryFn: gameService.getCharacters
    });
    const character = characters?.find(c => c.id === characterId);

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
                const existingSession = sessions.items.find((s: any) =>
                    s.character.id === characterId
                );

                if (existingSession) {
                    setSessionId(existingSession.id);
                    if ((existingSession as any).image_url) {
                        setImageUrl((existingSession as any).image_url);
                    }
                } else {
                    // No session found, load scenarios and prompt user (New Game)
                    const loadedScenarios = await gameService.getScenarios();
                    setScenarios(loadedScenarios);
                    setShowScenarioSelect(true);
                }
            } catch (e) {
                console.error("Failed to check sessions", e);
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
            } catch (error: any) {
                if (error.response?.status === 404) {
                    return { items: [], has_more: false, next_cursor: null };
                }
                throw error;
            }
        },
        enabled: !!sessionId,
        retry: (failureCount, error: any) => {
            if (error.response?.status === 404) return false;
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
        mutationFn: (action: string) => {
            if (!sessionId) throw new Error("No active session");
            return gameService.sendAction(sessionId, action);
        },
        onSuccess: (data) => {
            const systemMsg: GameMessageResponse = {
                id: data.message.id || `sys-${Date.now()}`,
                role: 'system',
                content: `${data.narrative}\n\n${data.message.content}`,
                created_at: new Date().toISOString()
            };

            setLocalMessages(prev => [...prev, systemMsg]);
            if (data.image_url) {
                setImageUrl(data.image_url);
            }
            // Refresh session data to update game_state
            queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
            queryClient.invalidateQueries({ queryKey: ['characters'] });
        }
    });

    const handleSendAction = async (content: string) => {
        const tempMsg: GameMessageResponse = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content,
            created_at: new Date().toISOString()
        };
        setLocalMessages(prev => [...prev, tempMsg]);

        try {
            await sendActionMutation.mutateAsync(content);
        } catch (error) {
            console.error("Action failed", error);
        }
    };

    // 5. Delete Session Mutation
    const deleteSessionMutation = useMutation({
        mutationFn: async () => {
            if (!sessionId) throw new Error("No active session");
            return await gameService.deleteSession(sessionId);
        },
        onSuccess: () => {
            setSessionId(null);
            setLocalMessages([]);
            setShowScenarioSelect(true);
            queryClient.invalidateQueries({ queryKey: ['characters'] });
        }
    });

    if (isLoadingChar || !character) {
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

                                            {/* Messages Container */}
                                            <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                                                <MessageHistory
                                                    messages={localMessages}
                                                    isLoading={!!sendActionMutation.isPending}
                                                    onActionSelect={(action) => setActionInput(action)}
                                                />
                                            </div>
                                        </div>

                                        <div className="p-0 border-t border-sanabi-cyan/30 z-10 bg-sanabi-panel shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
                                            <ActionInput
                                                onSend={(content) => {
                                                    handleSendAction(content);
                                                    setActionInput('');
                                                }}
                                                disabled={
                                                    !!sendActionMutation.isPending
                                                    || !sessionId
                                                    || sessionData?.status === 'completed'
                                                    || (!!sessionData && sessionData.turn_count >= sessionData.max_turns)
                                                }
                                                value={actionInput}
                                                onChange={setActionInput}
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
                                    <span>Target.Status</span>
                                    <span className="animate-pulse">_LIVE</span>
                                </div>
                                <StatusPanel character={character} />
                            </div>
                        </PixelCard>

                        {/* Game State Panel */}
                        {sessionData && sessionData.game_state && (
                            <PixelCard variant="cyber" className="flex-1 min-h-[200px] flex flex-col p-0 border-sanabi-gold/50">
                                <div className="flex flex-col h-full min-h-0">
                                    <div className="bg-sanabi-panel text-sanabi-gold px-4 py-2 font-bold text-center border-b border-sanabi-gold/30 shrink-0 uppercase tracking-widest text-xs flex justify-between">
                                        <span>Mission.Log</span>
                                        <span>_SYNCED</span>
                                    </div>
                                    <div className="p-4 flex-1 overflow-y-auto min-h-0">
                                        <GameStatePanel
                                            gameState={sessionData.game_state}
                                            currentLocation={sessionData.current_location}
                                            turnCount={sessionData.turn_count}
                                            maxTurns={sessionData.max_turns}
                                        />
                                    </div>
                                </div>
                            </PixelCard>
                        )}

                        <div className="mt-auto shrink-0 pb-1">
                            <PixelButton
                                variant="danger"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to abandon this adventure? Progress will be lost.")) {
                                        deleteSessionMutation.mutate();
                                    }
                                }}
                                disabled={deleteSessionMutation.isPending}
                            >
                                {deleteSessionMutation.isPending ? 'Abandoning...' : 'Abandon Adventure'}
                            </PixelButton>
                        </div>
                    </div>
                </div>
            )}
        </PixelLayout>
    );
}
