import type { CharacterResponse } from '../../types/api';
import { Shield } from 'lucide-react';

interface StatusPanelProps {
    character: CharacterResponse;
}

export function StatusPanel({ character }: StatusPanelProps) {
    return (
        <div className="flex flex-col gap-2 text-xs p-3 bg-sanabi-bg h-full">
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 shrink-0 bg-black rounded-md border border-sanabi-cyan flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.4)] relative overflow-hidden">
                    <span className="text-xl font-pixel text-sanabi-cyan leading-none mt-0.5 z-10">{character.name[0]}</span>
                    <div className="absolute inset-0 bg-sanabi-cyan/10 animate-pulse" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                        <h2 className="text-base font-bold text-sanabi-cyan truncate tracking-wider">{character.name}</h2>
                        <span className="text-sanabi-gold font-bold text-[10px] bg-sanabi-gold/10 px-1.5 py-0.5 rounded-sm border border-sanabi-gold/30">
                            LVL {character.stats.level}
                        </span>
                    </div>

                    {/* HP Bar */}
                    <div className="w-full">
                        <div className="flex justify-between text-sanabi-pink/80 text-[10px] font-bold mb-0.5 uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Shield size={10} /> Integrity</span>
                            <span>{character.stats.hp}/{character.stats.max_hp}</span>
                        </div>
                        <div className="h-2.5 w-full bg-black/50 rounded-sm overflow-hidden border border-sanabi-pink/30">
                            <div
                                className="h-full bg-sanabi-pink relative shadow-[0_0_10px_rgba(255,0,85,0.6)]"
                                style={{ width: `${Math.min(100, (character.stats.hp / character.stats.max_hp) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-[10px] text-gray-500 font-mono text-center pt-1 border-t border-sanabi-cyan/10 tracking-widest">
                ID: {character.id.substring(0, 8)}
            </div>
        </div>
    );
}
