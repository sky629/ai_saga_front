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
    DiceResult,
    GameActionOption,
    GameActionType,
    GameActionResponse,
    GameTurnResponse,
    ProgressionManual,
    ProgressionAchievementBoard,
    ProgressionStatusPanel,
    StateChanges,
} from '../types/api';
import { getScenarioTimeLabel } from '../utils/gameType';

function isGameActionResponse(data: GameTurnResponse): data is GameActionResponse {
    return 'message' in data;
}

interface PendingNarrativeState {
    systemMsg: GameMessageResponse;
    xpMsg: GameMessageResponse | null;
    lvMsg: GameMessageResponse | null;
    beforeMessageId?: string;
    diceResult?: DiceResult | null;
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

function getRetryAfterSeconds(error: unknown): number | undefined {
    if (!axios.isAxiosError(error)) {
        return undefined;
    }

    const retryAfter = error.response?.data?.retry_after_seconds;
    if (typeof retryAfter === 'number' && Number.isFinite(retryAfter)) {
        return retryAfter;
    }

    const retryAfterHeader = error.response?.headers?.['retry-after'];
    if (typeof retryAfterHeader === 'string') {
        const parsed = Number.parseInt(retryAfterHeader, 10);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return undefined;
}

function extractApiErrorMessage(error: unknown): string | null {
    if (!axios.isAxiosError(error)) {
        return null;
    }

    const payload = error.response?.data;
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    if (
        'detail' in payload &&
        typeof payload.detail === 'string' &&
        payload.detail.trim()
    ) {
        return payload.detail.trim();
    }

    if (
        'message' in payload &&
        typeof payload.message === 'string' &&
        payload.message.trim()
    ) {
        return payload.message.trim();
    }

    return null;
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

function extractProgressionStateChanges(
    data: GameActionResponse
): StateChanges | null {
    if (data.state_changes) {
        return data.state_changes;
    }

    const parsedResponse = data.message.parsed_response;
    if (
        typeof parsedResponse !== 'object' ||
        parsedResponse === null ||
        !('state_changes' in parsedResponse)
    ) {
        return null;
    }

    const stateChanges = parsedResponse.state_changes;
    if (typeof stateChanges !== 'object' || stateChanges === null) {
        return null;
    }

    return stateChanges as StateChanges;
}

function mergeProgressionManuals(
    manuals: ProgressionManual[],
    changes: StateChanges | null
): ProgressionManual[] {
    const byName = new Map(
        manuals
            .filter((manual) => manual.name.trim())
            .map((manual) => [manual.name, { ...manual }])
    );

    for (const manual of changes?.manuals_gained || []) {
        if (!manual.name.trim()) continue;
        byName.set(manual.name, {
            ...manual,
            mastery: typeof manual.mastery === 'number' ? manual.mastery : 0,
        });
    }

    for (const update of changes?.manual_mastery_updates || []) {
        if (
            typeof update.mastery_delta !== 'number' ||
            update.mastery_delta <= 0
        ) {
            continue;
        }
        const existing = byName.get(update.name);
        if (!existing) continue;
        byName.set(update.name, {
            ...existing,
            mastery: Math.max(
                0,
                Math.min(
                    100,
                    existing.mastery +
                        update.mastery_delta
                )
            ),
        });
    }

    return [...byName.values()];
}

function buildLocalProgressionStatus(
    current: ProgressionStatusPanel | null,
    data: GameActionResponse,
    changes: StateChanges | null
): ProgressionStatusPanel | null {
    const base =
        (data.status_panel &&
        (data.status_panel.manuals.length > 0 || !current)
            ? data.status_panel
            : current || data.status_panel);
    if (!base) {
        return null;
    }

    const manuals = mergeProgressionManuals(base.manuals || [], changes);
    return {
        ...base,
        manuals,
        elapsed_turns: data.turn_count,
        remaining_turns:
            typeof base.remaining_turns === 'number'
                ? base.remaining_turns
                : Math.max(0, data.max_turns - data.turn_count),
    };
}

function buildProgressionStatusFromSession(
    sessionData: {
        game_state: {
            hp?: number;
            max_hp?: number;
            internal_power?: number;
            external_power?: number;
            manuals?: ProgressionManual[];
            remaining_turns?: number;
        };
        turn_count: number;
        max_turns: number;
    },
    fallbackEscapeStatus?: string
): ProgressionStatusPanel | null {
    if (
        typeof sessionData.game_state.internal_power !== 'number' ||
        typeof sessionData.game_state.external_power !== 'number' ||
        typeof sessionData.game_state.hp !== 'number' ||
        typeof sessionData.game_state.max_hp !== 'number'
    ) {
        return null;
    }

    return {
        hp: sessionData.game_state.hp,
        max_hp: sessionData.game_state.max_hp,
        internal_power: sessionData.game_state.internal_power,
        external_power: sessionData.game_state.external_power,
        manuals: sessionData.game_state.manuals || [],
        remaining_turns:
            sessionData.game_state.remaining_turns ??
            Math.max(0, sessionData.max_turns - sessionData.turn_count),
        elapsed_turns: sessionData.turn_count,
        escape_status:
            fallbackEscapeStatus || '현재 수련 경지를 가늠하는 중입니다.',
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
    const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
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
    const [progressionStatus, setProgressionStatus] =
        useState<ProgressionStatusPanel | null>(null);
    const [achievementBoard, setAchievementBoard] =
        useState<ProgressionAchievementBoard | null>(null);

    const [showScenarioSelect, setShowScenarioSelect] = useState(false);
    const [scenarioStartError, setScenarioStartError] = useState<string | null>(null);
    const [shouldAnimateInitialSystemMessage, setShouldAnimateInitialSystemMessage] = useState(false);

    // 1. Fetch Character Info
    const { data: characters, isLoading: isLoadingChar } = useQuery({
        queryKey: ['characters'],
        queryFn: gameService.getCharacters
    });
    const character = characters?.find(c => c.id === characterId);
    const { data: scenarios = [] } = useQuery({
        queryKey: ['scenarios'],
        queryFn: gameService.getScenarios,
        enabled: !!character,
    });
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

    useEffect(() => {
        if (sessionData?.game_state) {
            setProgressionStatus((current) => {
                return (
                    buildProgressionStatusFromSession(
                        sessionData,
                        current?.escape_status
                    ) || current
                );
            });
        }
    }, [sessionData]);

    const currentScenario =
        scenarios.find((scenario) => scenario.id === sessionData?.scenario_id) ||
        scenarios.find((scenario) => scenario.id === character?.scenario_id) ||
        null;
    const currentGameType = currentScenario?.game_type || 'trpg';
    const actionInputPlaceholder =
        currentGameType === 'progression'
            ? '질문을 입력하거나, 한 달 동안의 수련/탐색 방향을 적어보세요'
            : '행동이나 명령을 입력하세요';
    const actionModeHint =
        currentGameType === 'progression'
            ? '질문은 시간을 소모하지 않습니다. 수련·탐색·섭취 같은 월간 행동만 1개월이 흐릅니다.'
            : '행동을 입력하면 턴이 진행되고, 상황에 따라 주사위 판정이 적용됩니다.';

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
            setScenarioStartError(null);
            const newSession = await gameService.startGame(characterId, scenarioId);
            setSessionId(newSession.id);
            setIsSessionEnded(false);
            setAchievementBoard(null);
            setProgressionStatus(null);
            setShouldAnimateInitialSystemMessage(true);
            setShowScenarioSelect(false);
        } catch (error: unknown) {
            console.error("Failed to start session", error);
            if (getHttpStatus(error) === 429) {
                const retryAfterSeconds = getRetryAfterSeconds(error);
                if (retryAfterSeconds) {
                    setScenarioStartError(
                        `시나리오를 지금 시작할 수 없습니다. ${retryAfterSeconds}초 뒤에 다시 시도해주세요.`
                    );
                } else {
                    setScenarioStartError(
                        '시나리오를 지금 시작할 수 없습니다. 잠시 후 다시 시도해주세요.'
                    );
                }
                return;
            }

            setScenarioStartError(
                '시나리오 시작에 실패했습니다. 잠시 후 다시 시도해주세요.'
            );
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
            const nextMessages = [...messageHistory.items].reverse();
            setLocalMessages(nextMessages);

            if (shouldAnimateInitialSystemMessage && nextMessages.length > 0) {
                const latestSystemMessage = [...nextMessages]
                    .reverse()
                    .find((message) => message.role !== 'user');
                setTypingMessageId(latestSystemMessage?.id ?? null);
                setShouldAnimateInitialSystemMessage(false);
            }
        }
    }, [messageHistory, shouldAnimateInitialSystemMessage]);

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
                if (data.achievement_board) {
                    setAchievementBoard(data.achievement_board);
                    setProgressionStatus({
                        hp: data.achievement_board.hp,
                        max_hp: data.achievement_board.max_hp,
                        internal_power: data.achievement_board.internal_power,
                        external_power: data.achievement_board.external_power,
                        manuals: data.achievement_board.manuals,
                        remaining_turns: data.achievement_board.remaining_turns,
                        elapsed_turns: data.total_turns,
                        escape_status: data.achievement_board.escaped
                            ? '동굴을 돌파할 자격을 증명했습니다.'
                            : '윤회의 문턱에서 다시 수련을 돌아봐야 합니다.',
                    });
                }

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
                setTypingMessageId(endingMessage.id);
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
            const progressionChanges = extractProgressionStateChanges(data);

            if (hpChange !== 0) {
                setLocalCharacter((current) =>
                    current ? applyHpChange(current, hpChange) : current
                );
            }
            setProgressionStatus((current) =>
                buildLocalProgressionStatus(current, data, progressionChanges)
            );

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
                // Type before-roll narrative first, then reveal the dice panel.
                let beforeMessageId: string | undefined;
                if (data.before_roll_narrative) {
                    beforeMessageId = `before-${Date.now()}`;
                    const beforeMsg: GameMessageResponse = {
                        id: beforeMessageId,
                        role: 'system',
                        content: data.before_roll_narrative,
                        created_at: new Date().toISOString()
                    };
                    setLocalMessages(prev => [...prev, beforeMsg]);
                    setTypingMessageId(beforeMessageId);
                } else {
                    setDiceResult(data.dice_result);
                    setDicePanelHpChange(hpChange);
                    setDiceSequence(prev => prev + 1);
                }
                setPendingNarrative({
                    systemMsg,
                    xpMsg,
                    lvMsg,
                    beforeMessageId,
                    diceResult: data.dice_result,
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
                setTypingMessageId(systemMsg.id);
                if (data.xp_gained) refreshUser();
                queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
                queryClient.invalidateQueries({ queryKey: ['characters'] });
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
                const retryAfterSeconds = getRetryAfterSeconds(error);
                if (retryAfterSeconds) {
                    setActionError(
                        `System_Overload: ${retryAfterSeconds}초 뒤에 다시 시도해주세요.`
                    );
                } else {
                    setActionError(
                        "System_Overload: Request limit exceeded. Please wait a moment."
                    );
                }
            } else {
                const serverMessage = extractApiErrorMessage(error);
                setActionError(
                    serverMessage ||
                        "System_Error: Neural link interrupted. Please try again."
                );
            }
        }
    };

    const handleDiceComplete = () => {
        if (pendingNarrative) {
            const {
                systemMsg,
                xpMsg,
                lvMsg,
                shouldRefresh,
                shouldInvalidateSession,
            } = pendingNarrative;
            const updates: GameMessageResponse[] = [systemMsg];
            if (xpMsg) updates.push(xpMsg);
            if (lvMsg) updates.push(lvMsg);
            
            setLocalMessages(prev => [...prev, ...updates]);
            setTypingMessageId(systemMsg.id);
            if (shouldRefresh) refreshUser();
            if (shouldInvalidateSession) {
                queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
                queryClient.invalidateQueries({ queryKey: ['characters'] });
            }
            setPendingNarrative(null);
        }
    };

    const handleTypingComplete = (messageId: string) => {
        if (
            pendingNarrative?.beforeMessageId === messageId &&
            pendingNarrative.diceResult
        ) {
            setTypingMessageId(null);
            setDiceResult(pendingNarrative.diceResult);
            setDicePanelHpChange(pendingNarrative.hpChange);
            setDiceSequence(prev => prev + 1);
            return;
        }

        if (typingMessageId === messageId) {
            setTypingMessageId(null);
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
                    errorMessage={scenarioStartError}
                    onDismissError={() => setScenarioStartError(null)}
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
                                        {sessionId
                                            ? `// ${
                                                  currentScenario?.name ||
                                                  (sessionData?.scenario_id || 'Adventure').substring(0, 12)
                                              }`
                                            : 'Connecting...'}
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
                                                    typingMessageId={typingMessageId}
                                                    onTypingComplete={handleTypingComplete}
                                                    canSelectActions={
                                                        !isSessionEnded &&
                                                        sessionData?.status !== 'completed'
                                                    }
                                                    onActionSelect={(option: GameActionOption) => {
                                                        setActionInput(option.label);
                                                        setSelectedActionType(option.action_type);
                                                        if (actionError) setActionError(null);
                                                    }}
                                                    sessionId={sessionId}
                                                    autoScrollBehavior={
                                                        diceResult && pendingNarrative
                                                            ? 'auto'
                                                            : 'smooth'
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="p-0 border-t border-sanabi-cyan/30 z-10 bg-sanabi-panel shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
                                            <ActionInput
                                                error={actionError}
                                                modeHint={actionModeHint}
                                                placeholder={
                                                    actionInputPlaceholder
                                                }
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
                                        <span>
                                            {currentGameType === 'progression'
                                                ? `${getScenarioTimeLabel(currentGameType)}_SYNC`
                                                : '_SYNCED'}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto min-h-0">
                                        <GameStatePanel
                                            gameState={sessionData.game_state}
                                            currentLocation={sessionData.current_location}
                                            turnCount={sessionData.turn_count}
                                            maxTurns={sessionData.max_turns}
                                            status={sessionData.status}
                                            gameType={currentGameType}
                                            progressionStatus={progressionStatus}
                                            achievementBoard={achievementBoard}
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
