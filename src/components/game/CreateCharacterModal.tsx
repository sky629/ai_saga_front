import React, { useState } from 'react';
import { RetroWindow } from '../layout/RetroWindow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameService } from '../../services/gameService';
import type { ScenarioResponse } from '../../types/api';

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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <RetroWindow title="NEW_IDENTITY_REGISTRATION.exe" className="w-full max-w-lg" variant="blue">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Scenario Context */}
                    {scenario && (
                        <div className="bg-blue-900/20 border border-blue-500/30 p-3 mb-4">
                            <h4 className="text-xs text-blue-400 font-bold mb-1">TARGET SCENARIO:</h4>
                            <p className="text-sm text-white">{scenario.name}</p>
                            <p className="text-[10px] text-blue-300/70 mt-1 line-clamp-2">{scenario.description}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-cyber-primary tracking-widest uppercase block">
                                Subject Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/50 border border-cyber-primary/50 text-white p-3 focus:border-cyber-primary focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.3)] font-mono text-sm transition-all placeholder:text-gray-700"
                                placeholder="ENTER_NAME..."
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-cyber-primary tracking-widest uppercase block">
                                BACKGROUND DATA (BIO / DESCRIPTION)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-black/50 border border-cyber-primary/50 text-white p-3 h-32 resize-none focus:border-cyber-primary focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.3)] font-mono text-sm transition-all placeholder:text-gray-500"
                                placeholder="ex: Elite hacker with a mysterious past who distrusts mega-corporations..."
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-900/20 border border-red-500/50 p-2 text-red-400 text-xs font-mono">
                            ERROR: {error.message}
                        </div>
                    )}

                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border border-cyber-muted text-cyber-muted hover:bg-cyber-muted hover:text-black transition-colors font-bold text-xs tracking-widest uppercase"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !name || !description}
                            className="flex-1 py-3 bg-cyber-primary text-black hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all font-bold text-xs tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'PROCESSING...' : 'INITIALIZE IDENTITY'}
                        </button>
                    </div>
                </form>
            </RetroWindow>
        </div>
    );
}
