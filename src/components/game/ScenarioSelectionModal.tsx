import { PixelCard } from '../layout/PixelCard';
import { PixelButton } from '../layout/PixelButton';
import type { ScenarioResponse } from '../../types/api';
import { Play, Database, Scroll, Skull } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ScenarioSelectionModalProps {
    scenarios: ScenarioResponse[];
    onSelect: (scenarioId: string) => void;
}

export function ScenarioSelectionModal({ scenarios, onSelect }: ScenarioSelectionModalProps) {
    // If no scenarios are available
    if (!scenarios || scenarios.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                <PixelCard title="SYSTEM ALERT" className="w-full max-w-md" variant="cyber">
                    <div className="p-8 text-center space-y-4">
                        <div className="text-sanabi-pink animate-pulse text-4xl mb-4 flex justify-center">
                            <Skull size={48} />
                        </div>
                        <h2 className="text-xl text-sanabi-pink font-bold tracking-widest">NO SCENARIOS</h2>
                        <p className="text-sm text-gray-500 leading-relaxed font-pixel">
                            서버에서 시나리오를 불러올 수 없습니다. 백엔드 서버가 실행 중인지 확인해 주세요.
                        </p>
                        <PixelButton
                            onClick={() => window.location.reload()}
                            variant="danger"
                            className="mt-4"
                        >
                            RETRY
                        </PixelButton>
                    </div>
                </PixelCard>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm p-4 font-pixel">
            <PixelCard title="SCENARIO SELECT" className="w-full max-w-5xl max-h-[85vh] flex flex-col" variant="cyber">
                <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide flex-1">
                    <div className="text-center space-y-2 mb-8">
                        <h2 className="text-2xl text-sanabi-cyan font-bold tracking-[0.2em] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">AVAILABLE SCENARIOS</h2>
                        <p className="text-sm text-gray-500 flex items-center justify-center gap-2 tracking-wider">
                            <Database size={16} className="text-sanabi-cyan/50" />
                            <span>Select a scenario to begin your adventure</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {scenarios.map((scenario) => (
                            <div
                                key={scenario.id}
                                className={cn(
                                    "relative group cursor-pointer overflow-hidden transition-all duration-300",
                                    "bg-black/40 border border-sanabi-cyan/20",
                                    "hover:-translate-y-1 hover:border-sanabi-cyan hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                                )}
                                onClick={() => onSelect(scenario.id)}
                            >
                                {/* Top-right corner decoration */}
                                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-sanabi-cyan/30 group-hover:border-sanabi-cyan transition-colors" />
                                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-sanabi-cyan/30 group-hover:border-sanabi-cyan transition-colors" />

                                {/* Left accent bar */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-sanabi-cyan/20 group-hover:bg-sanabi-cyan transition-colors" />

                                <div className="p-5 flex flex-col h-full gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <Scroll size={20} className="text-sanabi-cyan/60 group-hover:text-sanabi-cyan transition-colors" />
                                            <h3 className="text-lg font-bold text-gray-200 group-hover:text-sanabi-cyan transition-colors tracking-wide">
                                                {scenario.name}
                                            </h3>
                                        </div>
                                        <span className="text-[10px] bg-sanabi-pink/10 text-sanabi-pink px-2 py-1 rounded-sm border border-sanabi-pink/30 font-bold uppercase tracking-wider">
                                            {scenario.genre}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 border-l border-sanabi-cyan/20 pl-3">
                                        "{scenario.description}"
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-dashed border-sanabi-cyan/10 flex items-center justify-between text-xs font-bold text-gray-500">
                                        <div className="flex gap-4">
                                            <span className="flex items-center gap-1">
                                                <span className="opacity-50">THREAT:</span>
                                                <span className={cn(
                                                    scenario.difficulty === 'hard' ? "text-sanabi-pink" :
                                                        scenario.difficulty === 'medium' ? "text-sanabi-gold" : "text-sanabi-green"
                                                )}>
                                                    {scenario.difficulty.toUpperCase()}
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="opacity-50">CYCLES:</span>
                                                <span className="text-sanabi-cyan">{scenario.max_turns}</span>
                                            </span>
                                        </div>
                                        <div className="group-hover:translate-x-1 transition-transform text-sanabi-cyan bg-sanabi-cyan/10 rounded-sm p-1 border border-sanabi-cyan/30">
                                            <Play size={12} fill="currentColor" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </PixelCard>
        </div>
    );
}
