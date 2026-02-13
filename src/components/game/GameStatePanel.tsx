import { Package, MapPin, Users, Sparkles, Clock, Skull } from 'lucide-react';
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
        <div className="w-full h-full bg-sanabi-bg/50 p-4 flex flex-col gap-5 text-sm overflow-y-auto">
            {/* 턴 카운터 */}
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-sanabi-cyan/70 font-bold text-xs uppercase tracking-wide">
                    <Clock size={12} />
                    <span>System Time</span>
                </div>
                <div className="ml-5">
                    <div className="text-sanabi-cyan font-pixel text-lg font-bold drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
                        CYCLE {turnCount} <span className="text-gray-500 text-sm">/ {maxTurns}</span>
                    </div>
                    {isNearingEnd && (
                        <div className="text-sanabi-pink text-xs mt-1 animate-pulse font-bold flex items-center gap-1">
                            <Skull size={12} /> CRITICAL FAILURE IMMINENT...
                        </div>
                    )}
                </div>
            </div>

            {/* 현재 위치 */}
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-sanabi-cyan/70 font-bold text-xs uppercase tracking-wide">
                    <MapPin size={12} />
                    <span>Coordinates</span>
                </div>
                <div className="text-gray-300 ml-5 font-bold text-sm border-l-2 border-sanabi-gold pl-2">
                    {currentLocation || 'Unknown Sector'}
                </div>
            </div>

            {/* 인벤토리 */}
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

            {/* 만난 NPC */}
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

            {/* 발견한 것 */}
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

            {/* 방문한 장소 (최근 5개 표시) */}
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
