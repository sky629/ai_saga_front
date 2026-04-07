import {
    Clock,
    MapPin,
    Package,
    ScrollText,
    Skull,
    Sparkles,
    Swords,
    Users,
} from 'lucide-react';
import type {
    GameState,
    ProgressionAchievementBoard,
    ProgressionStatusPanel,
    ScenarioGameType,
} from '../../types/api';
import { getManualCategoryLabel } from '../../utils/gameType';

interface GameStatePanelProps {
    gameState: GameState;
    currentLocation: string;
    turnCount: number;
    maxTurns: number;
    status?: string;
    gameType?: ScenarioGameType;
    progressionStatus?: ProgressionStatusPanel | null;
    achievementBoard?: ProgressionAchievementBoard | null;
    achievementImageUrl?: string | null;
}

function ProgressionPanel({
    gameState,
    currentLocation,
    turnCount,
    maxTurns,
    status,
    progressionStatus,
    achievementBoard,
    achievementImageUrl,
}: {
    gameState: GameState;
    currentLocation: string;
    turnCount: number;
    maxTurns: number;
    status?: string;
    progressionStatus?: ProgressionStatusPanel | null;
    achievementBoard?: ProgressionAchievementBoard | null;
    achievementImageUrl?: string | null;
}) {
    const statusPanel = progressionStatus;
    const monthsLeft = statusPanel?.remaining_turns ?? Math.max(0, maxTurns - turnCount);
    const isCompleted = status === 'completed' || turnCount >= maxTurns;
    const manuals =
        statusPanel?.manuals && statusPanel.manuals.length > 0
            ? statusPanel.manuals
            : gameState.manuals ?? [];

    return (
        <div className="flex h-full w-full flex-col gap-5 overflow-y-auto bg-sanabi-bg/50 p-4 text-sm">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sanabi-gold/80">
                    <Clock size={12} />
                    <span>Month Cycle</span>
                </div>
                <div className="ml-5">
                    <div className="font-pixel text-lg font-bold text-sanabi-gold drop-shadow-[0_0_5px_rgba(255,203,92,0.4)]">
                        {turnCount}개월 차
                        <span className="ml-2 text-sm text-gray-500">/ {maxTurns}개월</span>
                    </div>
                    <div className="mt-1 text-xs font-bold text-gray-400">
                        남은 시간 {monthsLeft}개월
                    </div>
                    {statusPanel?.escape_status && (
                        <div className="mt-1 text-xs text-sanabi-cyan/80">
                            {statusPanel.escape_status}
                        </div>
                    )}
                    {isCompleted && (
                        <div className="mt-1 flex items-center gap-1 text-xs font-bold text-sanabi-pink">
                            <Skull size={12} /> 수련 종료
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sanabi-cyan/70">
                    <MapPin size={12} />
                    <span>Cultivation Ground</span>
                </div>
                <div className="border-l-2 border-sanabi-gold pl-2 text-sm font-bold text-gray-300 ml-5">
                    {currentLocation || '수련 장소 미확정'}
                </div>
            </div>

            {statusPanel && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-sm border border-sanabi-cyan/20 bg-black/40 p-3">
                        <div className="flex items-center gap-2 uppercase tracking-wide text-sanabi-cyan/70">
                            <Sparkles size={12} />
                            내공
                        </div>
                        <div className="mt-2 text-xl font-bold text-sanabi-cyan">
                            {statusPanel.internal_power}
                        </div>
                    </div>
                    <div className="rounded-sm border border-sanabi-gold/20 bg-black/40 p-3">
                        <div className="flex items-center gap-2 uppercase tracking-wide text-sanabi-gold/70">
                            <Swords size={12} />
                            외공
                        </div>
                        <div className="mt-2 text-xl font-bold text-sanabi-gold">
                            {statusPanel.external_power}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sanabi-cyan/70">
                    <ScrollText size={12} />
                    <span>연마 중인 비급</span>
                </div>
                <div className="ml-5 min-h-[80px] rounded-sm border border-sanabi-cyan/20 bg-black/40 p-3">
                    {manuals.length > 0 ? (
                        <ul className="space-y-2 text-xs text-gray-300">
                            {manuals.map((manual) => (
                                <li
                                    key={manual.name}
                                    className="rounded-sm border border-white/5 bg-black/30 p-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-sanabi-gold">
                                            {manual.name}
                                        </span>
                                        <span className="text-[10px] uppercase text-gray-500">
                                            {getManualCategoryLabel(
                                                manual.category
                                            )}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-gray-400">
                                        숙련도 {manual.mastery}%
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="py-3 text-center text-xs italic text-gray-600">
                            아직 손에 들어온 비급이 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {achievementBoard && (
                <div className="space-y-3 rounded-sm border border-sanabi-pink/30 bg-black/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sanabi-pink">
                        <Sparkles size={12} />
                        업적 보드
                    </div>
                    {achievementImageUrl && (
                        <img
                            src={achievementImageUrl}
                            alt="최종 업적 보드"
                            className="w-full rounded-sm border border-sanabi-pink/20 object-cover"
                        />
                    )}
                    <div className="text-lg font-bold text-white">
                        {achievementBoard.title}
                    </div>
                    <div className="text-xs leading-6 text-gray-300">
                        {achievementBoard.summary}
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">
                        총 전력 {achievementBoard.total_score}
                    </div>
                </div>
            )}
        </div>
    );
}

export function GameStatePanel({
    gameState,
    currentLocation,
    turnCount,
    maxTurns,
    status,
    gameType,
    progressionStatus,
    achievementBoard,
    achievementImageUrl,
}: GameStatePanelProps) {
    if (gameType === 'progression') {
        return (
            <ProgressionPanel
                gameState={gameState}
                currentLocation={currentLocation}
                turnCount={turnCount}
                maxTurns={maxTurns}
                status={status}
                progressionStatus={progressionStatus}
                achievementBoard={achievementBoard}
                achievementImageUrl={achievementImageUrl}
            />
        );
    }

    const isNearingEnd = turnCount >= maxTurns * 0.8;
    const isLastAction = turnCount === maxTurns - 1 && status !== 'completed';
    const isCompleted = status === 'completed' || turnCount >= maxTurns;

    return (
        <div className="w-full h-full bg-sanabi-bg/50 p-4 flex flex-col gap-5 text-sm overflow-y-auto">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-sanabi-cyan/70 font-bold text-xs uppercase tracking-wide">
                    <Clock size={12} />
                    <span>Turn</span>
                </div>
                <div className="ml-5">
                    <div className="text-sanabi-cyan font-pixel text-lg font-bold drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
                        TURN {turnCount}{' '}
                        <span className="text-gray-500 text-sm">/ {maxTurns}</span>
                    </div>
                    {isCompleted && (
                        <div className="text-sanabi-pink text-xs mt-1 font-bold flex items-center gap-1">
                            <Skull size={12} /> SESSION COMPLETED
                        </div>
                    )}
                    {!isCompleted && isLastAction && (
                        <div className="text-sanabi-gold text-xs mt-1 animate-pulse font-bold flex items-center gap-1">
                            <Skull size={12} /> FINAL TURN READY
                        </div>
                    )}
                    {!isCompleted && !isLastAction && isNearingEnd && (
                        <div className="text-sanabi-pink text-xs mt-1 animate-pulse font-bold flex items-center gap-1">
                            <Skull size={12} /> TURN LIMIT APPROACHING
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex items-center gap-2 text-sanabi-cyan/70 font-bold text-xs uppercase tracking-wide">
                    <MapPin size={12} />
                    <span>Coordinates</span>
                </div>
                <div className="text-gray-300 ml-5 font-bold text-sm border-l-2 border-sanabi-gold pl-2">
                    {currentLocation || 'Unknown Sector'}
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex items-center gap-2 text-sanabi-cyan/70 font-bold text-xs uppercase tracking-wide">
                    <Package size={12} />
                    <span>Inventory Database</span>
                </div>
                <div className="ml-5 min-h-[60px] border border-sanabi-cyan/20 bg-black/40 p-2 rounded-sm relative">
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-sanabi-cyan/50" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-sanabi-cyan/50" />
                    {gameState.items && gameState.items.length > 0 ? (
                        <ul className="text-gray-300 space-y-1">
                            {gameState.items.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs">
                                    <span className="text-sanabi-gold font-bold">{'>'}</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-gray-600 italic text-center text-xs py-2">No Data Found</div>
                    )}
                </div>
            </div>

            {gameState.met_npcs && gameState.met_npcs.length > 0 && (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sanabi-cyan/70 font-bold text-xs uppercase tracking-wide">
                        <Users size={12} />
                        <span>Entities Contacted</span>
                    </div>
                    <div className="ml-5 border border-sanabi-pink/20 bg-black/40 p-2 rounded-sm">
                        <ul className="text-gray-300 space-y-1">
                            {gameState.met_npcs.map((npc, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs">
                                    <span className="text-sanabi-pink font-bold">{'>'}</span>
                                    <span>{npc}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {gameState.discoveries && gameState.discoveries.length > 0 && (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sanabi-cyan/70 font-bold text-xs uppercase tracking-wide">
                        <Sparkles size={12} />
                        <span>Intel Gathered</span>
                    </div>
                    <div className="ml-5 border border-sanabi-gold/20 bg-black/40 p-2 rounded-sm">
                        <ul className="text-gray-300 space-y-1">
                            {gameState.discoveries.map((discovery, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs">
                                    <span className="text-sanabi-gold font-bold">{'>'}</span>
                                    <span>{discovery}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {gameState.visited_locations && gameState.visited_locations.length > 0 && (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sanabi-cyan/70 font-bold text-xs uppercase tracking-wide">
                        <MapPin size={12} />
                        <span>Traversal Log</span>
                    </div>
                    <div className="ml-5 text-gray-500 text-[10px] border border-sanabi-cyan/10 bg-black/20 p-2 rounded-sm font-mono">
                        {gameState.visited_locations.slice(-5).join(' >> ')}
                    </div>
                </div>
            )}
        </div>
    );
}
