import type { CharacterResponse } from '../../types/api';
import { Shield } from 'lucide-react';

interface StatusPanelProps {
    character: CharacterResponse;
}

export function StatusPanel({ character }: StatusPanelProps) {
    return (
        <div className="w-full md:w-64 border-l-2 border-green-800 bg-black/90 p-4 flex flex-col gap-6 text-xs overflow-y-auto">
            <div className="text-center pb-4 border-b border-green-900">
                <div className="w-16 h-16 mx-auto bg-green-900/20 rounded-full border border-green-600 mb-2 flex items-center justify-center">
                    <span className="text-2xl font-pixel">{character.name[0]}</span>
                </div>
                <h2 className="text-lg font-bold text-green-400">{character.name}</h2>
                <span className="text-green-700">LVL {character.stats.level}</span>
            </div>

            <div className="space-y-4">
                {/* HP Status */}
                <div className="space-y-1">
                    <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1"><Shield size={12} /> INTEGRITY</span>
                        <span>{character.stats.hp}/{character.stats.max_hp}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-900 rounded overflow-hidden border border-green-900">
                        <div className="h-full bg-green-600 transition-all duration-500" style={{ width: `${(character.stats.hp / character.stats.max_hp) * 100}%` }} />
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-green-900 text-center text-[10px] text-green-800">
                SYSTEM ID: {character.id.substring(0, 8)}...
            </div>
        </div>
    );
}
