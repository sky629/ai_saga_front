import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gameService } from '../services/gameService';
import { CyberpunkLayout } from '../components/layout/CyberpunkLayout';
import { RetroWindow } from '../components/layout/RetroWindow';
import { CreateCharacterModal } from '../components/game/CreateCharacterModal';
import { ScenarioSelectionModal } from '../components/game/ScenarioSelectionModal';
import { User, Plus, Play, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ScenarioResponse } from '../types/api';

export default function Dashboard() {
    const navigate = useNavigate();

    // Modal & Selection State
    const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState<ScenarioResponse | null>(null);

    // Fetch Sessions (instead of characters)
    const { data: sessionsData, isLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: () => gameService.getSessions(20)
    });

    const sessions = sessionsData?.items;

    // Fetch Scenarios (Prefetch or fetch on demand, here we fetch for the modal)
    const { data: scenarios } = useQuery({
        queryKey: ['scenarios'],
        queryFn: gameService.getScenarios
    });

    // Flow Step 1: User clicks "Create New Game" -> Open Scenario Selection
    const handleNewGameClick = () => {
        setIsScenarioModalOpen(true);
    };

    // Flow Step 2: User Selects Scenario -> Open Character Creation
    const handleScenarioSelect = (scenarioId: string) => {
        const scenario = scenarios?.find(s => s.id === scenarioId);
        if (scenario) {
            setSelectedScenario(scenario);
            setIsScenarioModalOpen(false);
            setIsCreateModalOpen(true);
        }
    };

    // Flow Step 3: Character Created -> Start Game with Selected Scenario
    const handleCharacterCreated = async (characterId: string) => {
        if (!selectedScenario) return;

        try {
            console.log(`Starting game: Char=${characterId}, Scenario=${selectedScenario.id}`);
            await gameService.startGame(characterId, selectedScenario.id);
            navigate(`/game/${characterId}`);
        } catch (error) {
            console.error("Failed to auto-start game:", error);
            // Fallback: just close modal, user sees character in list
            setIsCreateModalOpen(false);
        }
    };

    return (
        <CyberpunkLayout>
            <div className="h-full flex flex-col gap-6 p-4">
                {/* Header Bar */}
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-cyber-primary/50 pb-4">
                    <div>
                        <h1 className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] tracking-tighter">
                            SESSION DASHBOARD
                        </h1>
                        <p className="text-sm text-cyber-primary mt-2 flex items-center gap-2">
                            <Terminal size={14} />
                            <span>RESUME SIMULATION OR INITIALIZE NEW RUN</span>
                        </p>
                    </div>
                    <div className="text-right text-[10px] text-cyber-muted font-mono mt-2 md:mt-0">
                        <p>SYSTEM_STATUS: <span className="text-green-400">OPTIMAL</span></p>
                        <p>CONNECTION: <span className="text-blue-400">SECURE</span></p>
                    </div>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-cyber-primary animate-pulse font-mono text-xl">
                        LOADING SESSION DATA...
                    </div>
                ) : (
                    <>
                        {sessions && sessions.length === 0 && (
                            <div className="bg-cyber-dark/80 border border-cyber-secondary p-6 text-center text-cyber-text-secondary max-w-2xl mx-auto rounded">
                                <h3 className="text-xl text-cyber-secondary mb-2">NO ACTIVE SESSIONS</h3>
                                <p>Initialize a new simulation to begin.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Session Cards */}
                            {sessions?.map((session) => (
                                <RetroWindow
                                    key={session.id}
                                    title={session.character_name.toUpperCase()}
                                    className="hover:border-cyber-primary hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all group h-[280px]"
                                >
                                    <div className="h-full flex flex-col justify-between p-2">
                                        <div className="flex gap-4 items-start">
                                            <div className="w-20 h-20 bg-black/50 border border-cyber-dim flex items-center justify-center shrink-0">
                                                <User size={40} className="text-cyber-muted group-hover:text-cyber-primary transition-colors" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-xl text-white font-bold truncate">{session.character_name}</h3>
                                                    <span className="text-xs font-mono text-cyber-secondary border border-cyber-secondary/50 px-1 rounded">
                                                        LVL {session.character.stats.level}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-cyber-muted mt-1">
                                                    {session.scenario_name}
                                                </p>
                                                <p className="text-xs text-cyber-muted mt-1 line-clamp-2 h-8">
                                                    {session.character.description || "No description provided."}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 font-mono text-xs my-4">
                                            <div className="flex justify-between items-center bg-black/40 p-2 border-l-2 border-green-500">
                                                <span className="text-gray-400">HEALTH</span>
                                                <span className="text-green-400 font-bold">{session.character.stats.hp} / {session.character.stats.max_hp}</span>
                                            </div>
                                            <div className={`flex justify-between items-center bg-black/40 p-2 border-l-2 ${session.status === 'completed' ? 'border-yellow-500' :
                                                    session.status === 'abandoned' ? 'border-red-500' :
                                                        'border-blue-500'
                                                }`}>
                                                <span className="text-gray-400">STATUS</span>
                                                <span className={`font-bold ${session.status === 'completed' ? 'text-yellow-400' :
                                                        session.status === 'abandoned' ? 'text-red-400' :
                                                            'text-blue-400'
                                                    }`}>
                                                    {session.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/game/${session.character.id}`)}
                                            className="w-full bg-cyber-primary text-black font-bold py-3 hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all flex items-center justify-center gap-2"
                                        >
                                            <Play size={16} fill="currentColor" />
                                            RESUME
                                        </button>
                                    </div>
                                </RetroWindow>
                            ))}

                            {/* New Game Button */}
                            <div
                                onClick={handleNewGameClick}
                                className="h-[280px] border-2 border-dashed border-cyber-dim hover:border-cyber-primary bg-black/20 hover:bg-black/40 flex flex-col items-center justify-center gap-6 cursor-pointer text-cyber-muted hover:text-white transition-all group rounded-lg"
                            >
                                <div className="p-6 rounded-full border-2 border-current group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all">
                                    <Plus size={40} />
                                </div>
                                <div className="text-center">
                                    <span className="text-sm font-bold tracking-widest uppercase block animate-pulse">NEW RUN</span>
                                    <span className="text-[10px] text-cyber-text-secondary mt-1 block">INITIALIZE NEW SCENARIO</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {isScenarioModalOpen && scenarios && (
                <ScenarioSelectionModal
                    scenarios={scenarios}
                    onSelect={handleScenarioSelect}
                />
            )}

            {isCreateModalOpen && (
                <CreateCharacterModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={handleCharacterCreated}
                    scenario={selectedScenario}
                />
            )}
        </CyberpunkLayout>
    );
}
