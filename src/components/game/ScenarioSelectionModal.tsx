import { RetroWindow } from '../layout/RetroWindow';
import type { ScenarioResponse } from '../../types/api';
import { Play } from 'lucide-react';

interface ScenarioSelectionModalProps {
    scenarios: ScenarioResponse[];
    onSelect: (scenarioId: string) => void;
}

export function ScenarioSelectionModal({ scenarios, onSelect }: ScenarioSelectionModalProps) {
    // If no scenarios are available, show a message instead of nothing (which causes blank screen)
    if (!scenarios || scenarios.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                <RetroWindow title="SYSTEM NOTICE" className="w-full max-w-md" variant="red">
                    <div className="p-8 text-center space-y-4">
                        <div className="text-cyber-secondary animate-pulse text-4xl mb-4">⚠</div>
                        <h2 className="text-xl text-cyber-secondary font-bold tracking-widest">NO SCENARIOS FOUND</h2>
                        <p className="text-xs text-cyber-muted leading-relaxed">
                            UNABLE TO RETRIEVE SIMULATION PROTOCOLS FROM SERVER.
                            PLEASE CHECK DATABASE CONNECTION OR CONTACT ADMINISTRATOR.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2 border border-cyber-secondary text-cyber-secondary hover:bg-cyber-secondary hover:text-black transition-colors text-xs font-bold"
                        >
                            RETRY CONNECTION
                        </button>
                    </div>
                </RetroWindow>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <RetroWindow title="SELECT SIMULATION PARAMETERS" className="w-full max-w-4xl max-h-[80vh] flex flex-col" variant="blue">
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl text-cyber-primary font-bold tracking-widest">AVAILABLE SCENARIOS</h2>
                        <p className="text-xs text-cyber-muted">CHOOSE A NARRATIVE PROTOCOL TO INITIATE</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scenarios.map((scenario) => (
                            <div
                                key={scenario.id}
                                className="border border-cyber-dim bg-black/40 hover:bg-cyber-primary/10 hover:border-cyber-primary transition-all p-4 cursor-pointer group flex flex-col justify-between gap-4 relative overflow-hidden"
                                onClick={() => onSelect(scenario.id)}
                            >
                                {/* Hover Effect Background */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-white group-hover:text-cyber-primary">{scenario.name}</h3>
                                        <span className="text-[10px] border border-cyber-secondary text-cyber-secondary px-1 py-0.5 rounded uppercase">
                                            {scenario.genre}
                                        </span>
                                    </div>
                                    <p className="text-xs text-cyber-muted leading-relaxed line-clamp-3">
                                        {scenario.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-mono mt-2">
                                    <div className="flex gap-4 text-gray-500">
                                        <span>DIFFICULTY: <span className="text-white">{scenario.difficulty}</span></span>
                                        <span>TURNS: <span className="text-white">{scenario.max_turns}</span></span>
                                    </div>
                                    <button className="bg-cyber-dark border border-cyber-dim text-cyber-dim px-3 py-1 group-hover:bg-cyber-primary group-hover:text-black transition-colors flex items-center gap-1">
                                        <Play size={10} /> INITIALIZE
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </RetroWindow>
        </div>
    );
}
