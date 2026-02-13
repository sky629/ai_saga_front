import React, { useState } from 'react';
import { PixelCard } from '../layout/PixelCard';
import { PixelButton } from '../layout/PixelButton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameService } from '../../services/gameService';
import type { ScenarioResponse } from '../../types/api';
import { User, FileText } from 'lucide-react';

interface CreateCharacterModalProps {
    onClose: () => void;
    onSuccess: (characterId: string) => void;
    scenario?: ScenarioResponse | null;
}

export function CreateCharacterModal({ onClose, onSuccess, scenario }: CreateCharacterModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const queryClient = useQueryClient();

    const { mutate, isPending, error } = useMutation({
        mutationFn: async () => {
            if (!scenario) throw new Error("Scenario not selected");
            return await gameService.createCharacter(name, description, scenario.id);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['characters'] });
            onSuccess(data.id);
            onClose();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description) return;
        mutate();
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm p-4 font-pixel">
            <PixelCard title="IDENTITY REGISTRATION" className="w-full max-w-lg" variant="cyber">
                <form onSubmit={handleSubmit} className="p-4 space-y-6">
                    {/* Scenario Context */}
                    {scenario && (
                        <div className="bg-black/40 border border-dashed border-sanabi-cyan/20 p-4 rounded-sm relative">
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-sanabi-cyan/40" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-sanabi-cyan/40" />
                            <h4 className="text-xs text-sanabi-cyan font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                                <FileText size={12} /> TARGET SCENARIO:
                            </h4>
                            <p className="text-base font-bold text-gray-200">{scenario.name}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{scenario.description}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-sanabi-cyan font-bold tracking-widest uppercase block flex items-center gap-1">
                                <User size={12} /> OPERATOR NAME
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/50 border border-sanabi-cyan/30 text-gray-200 p-3 focus:border-sanabi-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] font-pixel text-lg transition-all placeholder:text-gray-600 rounded-sm"
                                placeholder="Enter callsign..."
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-sanabi-cyan font-bold tracking-widest uppercase block flex items-center gap-1">
                                <FileText size={12} /> BACKGROUND DATA
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-black/50 border border-sanabi-cyan/30 text-gray-200 p-3 h-32 resize-none focus:border-sanabi-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] font-pixel text-sm transition-all placeholder:text-gray-600 rounded-sm leading-relaxed"
                                placeholder="Who are you? A rogue agent? A cyber-enhanced mercenary?"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-sanabi-pink/10 border border-sanabi-pink/50 p-2 text-sanabi-pink text-xs font-bold text-center shadow-[0_0_10px_rgba(255,0,85,0.2)]">
                            SYSTEM_ERROR: {error.message}
                        </div>
                    )}

                    <div className="flex gap-4 pt-4 border-t border-sanabi-cyan/10">
                        <PixelButton
                            type="button"
                            onClick={onClose}
                            variant="secondary"
                            className="flex-1 opacity-70 hover:opacity-100"
                            size="sm"
                        >
                            ABORT
                        </PixelButton>
                        <PixelButton
                            type="submit"
                            disabled={isPending || !name || !description}
                            variant="primary"
                            className="flex-1"
                            size="sm"
                        >
                            {isPending ? 'INITIALIZING...' : 'BEGIN OPERATION'}
                        </PixelButton>
                    </div>
                </form>
            </PixelCard>
        </div>
    );
}
