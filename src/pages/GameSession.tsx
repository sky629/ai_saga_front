import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameService } from '../services/gameService';
import { CyberpunkLayout } from '../components/layout/CyberpunkLayout';
import { RetroWindow } from '../components/layout/RetroWindow';
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
        console.log("GameSession: Effect triggered", { characterId, sessionId, character });
        const checkSession = async () => {
            console.log("GameSession: checkSession started");
            if (!characterId || sessionId) {
                console.log("GameSession: skipping check", { characterId, sessionId });
                setIsCheckingSession(false);
                return;
            }

            try {
                // Check for existing active sessions
                console.log("GameSession: Fetching sessions...");
                const sessions = await gameService.getSessions(100);
                console.log("GameSession: Sessions fetched", sessions);
                const activeSession = sessions.items.find((s: any) =>
                    s.status === 'active' && s.character_name === character?.name
                );
                console.log("GameSession: Active session found?", activeSession);

                if (activeSession) {
                    setSessionId(activeSession.id);
                    // If the list endpoint returns image_url (it might not in SessionListResponse, but let's check or handle it in specific getSession if needed)
                    // The LIST endpoint returns SessionListResponse which usually doesn't have the image. 
                    // However, we can't get the image from list unless we add it to SessionListResponse in backend or fetch session details.
                    // For now, if we don't have it, it's null. 
                    // Wait, the API spec says SessionListResponse does NOT have image_url. 
                    // So we might need to fetch session details if we want the initial image on reload.
                    // But GameSessionResponse DOES. 
                    // Let's rely on the fact that if we continue, we might not see an image until an action is taken OR we should fetch session details.
                    // Ideally `getSessions` returns basic info. 
                    // Let's blindly try to see if activeSession has it, if not, we leave it null.
                    if ((activeSession as any).image_url) {
                        setImageUrl((activeSession as any).image_url);
                    }
                } else {
                    // No active session, load scenarios and prompt user
                    console.log("GameSession: No active session, fetching scenarios...");
                    const loadedScenarios = await gameService.getScenarios();
                    console.log("GameSession: Scenarios loaded", loadedScenarios);
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
        } else {
            console.log("GameSession: Character not loaded yet");
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
                // If 404, it means no messages yet (new session), so return empty structure
                if (error.response?.status === 404) {
                    console.warn("GameSession: 404 fetching messages, assuming new session.");
                    return { items: [], has_more: false, next_cursor: null };
                }
                throw error;
            }
        },
        enabled: !!sessionId,
        retry: (failureCount, error: any) => {
            if (error.response?.status === 404) return false; // Do not retry on 404
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
            // Force scenario selection to reappear by re-triggering the check logic or just showing it
            // Actually, we should probably invalidate logic, but setting state is faster for instant feedback
            // We need to re-fetch scenarios if they aren't loaded, but we likely have them from before or can fetch again.
            // Let's just set showScenarioSelect(true) and let the effect trigger if needed, 
            // BUT wait, the effect `checkSession` depends on [sessionId]. 
            // If we setSessionId(null), the effect runs.
            // In the effect: if !sessionId, it calls `getSessions`. 
            // If it finds NO active session (which we just deleted), it loads scenarios and sets showScenarioSelect(true).
            // So simply setting sessionId(null) might be enough, but to be safe and fast:
            setShowScenarioSelect(true);

            // Also refresh characters to update status if needed
            queryClient.invalidateQueries({ queryKey: ['characters'] });
        }
    });

    if (isLoadingChar || !character) {
        return (
            <CyberpunkLayout>
                <div className="flex h-full items-center justify-center text-cyber-secondary animate-pulse">
                    {isLoadingChar ? 'SEARCHING DATABASE...' : 'CRITICAL ERROR: IDENTITY NOT FOUND'}
                </div>
            </CyberpunkLayout>
        );
    }

    return (
        <CyberpunkLayout>
            {showScenarioSelect ? (
                <ScenarioSelectionModal
                    scenarios={scenarios}
                    onSelect={handleScenarioSelect}
                />
            ) : (
                <div className="flex h-full gap-4">
                    {/* Main Terminal Window */}
                    <RetroWindow
                        title={sessionId ? `SESSION: ${sessionId.substring(0, 8)}` : isCheckingSession ? 'CONNECTING...' : 'SYSTEM ERROR'}
                        className="flex-1 flex flex-col"
                        variant="blue"
                    >
                        {isCheckingSession ? (
                            <div className="flex-1 flex items-center justify-center text-cyber-primary animate-pulse font-mono">
                                ESTABLISHING SECURE CONNECTION...
                            </div>
                        ) : !sessionId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-red-500 font-mono gap-4">
                                <p>CONNECTION FAILED</p>
                                <button onClick={() => window.location.reload()} className="border border-red-500 px-4 py-2 hover:bg-red-500 hover:text-black transition-colors">
                                    RETRY CONNECTION
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 flex flex-col relative overflow-hidden">
                                    {imageUrl && (
                                        <div className="w-full h-48 md:h-64 shrink-0 bg-black border-b border-cyber-window-border overflow-hidden relative group">
                                            <div className="absolute inset-0 bg-cyber-primary/10 animate-pulse group-hover:bg-transparent transition-colors duration-500" />
                                            <img
                                                src={imageUrl}
                                                alt="Current Scene"
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyber-primary to-transparent opacity-50" />
                                        </div>
                                    )}
                                    <MessageHistory
                                        messages={localMessages}
                                        isLoading={sendActionMutation.isPending}
                                    />
                                </div>
                                <div className="pt-2 mt-2 border-t border-cyber-window-border">
                                    <ActionInput
                                        onSend={handleSendAction}
                                        disabled={
                                            sendActionMutation.isPending
                                            || !sessionId
                                            || sessionData?.status === 'completed'
                                            || (sessionData && sessionData.turn_count >= sessionData.max_turns)
                                        }
                                    />
                                </div>
                            </>
                        )}
                    </RetroWindow>

                    {/* Status Sidebar Window */}
                    <RetroWindow title="STATUS" className="w-80 hidden md:flex flex-col" variant="red">
                        <StatusPanel character={character} />

                        {/* Game State Panel */}
                        {sessionData && sessionData.game_state && (
                            <GameStatePanel
                                gameState={sessionData.game_state}
                                currentLocation={sessionData.current_location}
                                turnCount={sessionData.turn_count}
                                maxTurns={sessionData.max_turns}
                            />
                        )}

                        <div className="p-4 mt-auto border-t border-cyber-window-border">
                            <button
                                onClick={() => {
                                    if (window.confirm("WARNING: TERMINATING NEURAL LINK WILL ERASE CURRENT SESSION PROGRESS. CONFIRM?")) {
                                        deleteSessionMutation.mutate();
                                    }
                                }}
                                disabled={deleteSessionMutation.isPending}
                                className="w-full py-2 bg-red-950/30 border border-red-800 text-red-600 hover:bg-red-600 hover:text-black transition-colors text-xs font-bold tracking-widest flex items-center justify-center gap-2"
                            >
                                {deleteSessionMutation.isPending ? 'TERMINATING...' : 'ABORT SESSION'}
                            </button>
                        </div>
                    </RetroWindow>
                </div>
            )}
        </CyberpunkLayout>
    );
}
