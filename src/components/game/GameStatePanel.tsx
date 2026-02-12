import { Package, MapPin, Users, Sparkles, Clock } from 'lucide-react';
import type { GameState } from '../../types/api';

interface GameStatePanelProps {
    gameState: GameState;
    currentLocation: string;
    turnCount: number;
    maxTurns: number;
}

export function GameStatePanel({ gameState, currentLocation, turnCount, maxTurns }: GameStatePanelProps) {
    const isNearingEnd = turnCount >= maxTurns * 0.8;

    return (
        <div className="w-full border-t-2 border-green-800 bg-black/90 p-4 flex flex-col gap-4 text-xs">
            <div className="flex items-center gap-2 text-green-400 font-bold text-sm uppercase tracking-wider border-b border-green-900 pb-2">
                <Sparkles size={14} className="animate-pulse" />
                <span>Game State</span>
            </div>

            {/* 턴 카운터 */}
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-600 uppercase tracking-wide">
                    <Clock size={12} />
                    <span>Turn</span>
                </div>
                <div className="ml-5">
                    <div className="text-green-400 font-pixel text-base font-bold">
                        {turnCount} / {maxTurns}
                    </div>
                    {isNearingEnd && (
                        <div className="text-yellow-400 text-[10px] mt-1 animate-pulse">
                            ⚠️ Game ending soon
                        </div>
                    )}
                </div>
            </div>

            {/* 현재 위치 */}
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-600 uppercase tracking-wide">
                    <MapPin size={12} />
                    <span>Location</span>
                </div>
                <div className="text-green-400 ml-5 font-pixel text-xs">
                    {currentLocation || 'Unknown'}
                </div>
            </div>

            {/* 인벤토리 */}
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-600 uppercase tracking-wide">
                    <Package size={12} />
                    <span>Inventory</span>
                </div>
                <div className="ml-5 min-h-[60px] border border-green-800 bg-green-900/10 p-2">
                    {gameState.items && gameState.items.length > 0 ? (
                        <ul className="text-green-500 space-y-1">
                            {gameState.items.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-1">
                                    <span className="text-green-700">{'>'}</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-green-700/50 italic text-center">Empty</div>
                    )}
                </div>
            </div>

            {/* 만난 NPC */}
            {gameState.met_npcs && gameState.met_npcs.length > 0 && (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-green-600 uppercase tracking-wide">
                        <Users size={12} />
                        <span>Met NPCs</span>
                    </div>
                    <div className="ml-5 border border-green-800 bg-green-900/10 p-2">
                        <ul className="text-green-500 space-y-1">
                            {gameState.met_npcs.map((npc, idx) => (
                                <li key={idx} className="flex items-center gap-1">
                                    <span className="text-green-700">{'>'}</span>
                                    <span>{npc}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* 발견한 것 */}
            {gameState.discoveries && gameState.discoveries.length > 0 && (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-green-600 uppercase tracking-wide">
                        <Sparkles size={12} />
                        <span>Discoveries</span>
                    </div>
                    <div className="ml-5 border border-green-800 bg-green-900/10 p-2">
                        <ul className="text-green-500 space-y-1">
                            {gameState.discoveries.map((discovery, idx) => (
                                <li key={idx} className="flex items-center gap-1">
                                    <span className="text-green-700">{'>'}</span>
                                    <span>{discovery}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* 방문한 장소 (최근 5개 표시) */}
            {gameState.visited_locations && gameState.visited_locations.length > 0 && (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-green-600 uppercase tracking-wide">
                        <MapPin size={12} />
                        <span>Recent Path</span>
                    </div>
                    <div className="ml-5 text-green-700/70 text-[10px] border border-green-800 bg-green-900/10 p-2">
                        {gameState.visited_locations.slice(-5).join(' → ')}
                    </div>
                </div>
            )}
        </div>
    );
}
