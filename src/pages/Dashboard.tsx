import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gameService } from '../services/gameService';
import { PixelLayout } from '../components/layout/PixelLayout';
import { PixelCard } from '../components/layout/PixelCard';
import { PixelButton } from '../components/layout/PixelButton';
import { CreateCharacterModal } from '../components/game/CreateCharacterModal';
import { ScenarioSelectionModal } from '../components/game/ScenarioSelectionModal';
import { User, Plus, Sword, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ScenarioResponse } from '../types/api';
import { cn } from '../utils/cn';

export default function Dashboard() {
    const navigate = useNavigate();

    // Modal & Selection State
    const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState<ScenarioResponse | null>(null);
    const [isStartingGame, setIsStartingGame] = useState(false);

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
            setIsStartingGame(true);
            console.log(`Starting game: Char=${characterId}, Scenario=${selectedScenario.id}`);
            await gameService.startGame(characterId, selectedScenario.id);
            navigate(`/game/${characterId}`);
        } catch (error) {
            console.error("Failed to auto-start game:", error);
            setIsStartingGame(false);
            // Fallback: just close modal, user sees character in list
            setIsCreateModalOpen(false);
        }
    };

    return (
        <PixelLayout>
            <div className="h-full flex flex-col gap-6">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-sanabi-cyan/20 pb-4">
                    <div>
                        <h1 className="text-4xl font-bold text-sanabi-cyan tracking-wider drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
                            GAME LIST
                        </h1>
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-2 tracking-wider">
                            <span className="text-sanabi-cyan/50">//</span>
                            <span>Your active and archived games</span>
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-sanabi-cyan animate-pulse text-xl tracking-widest">
                        LOADING_DATA...
                    </div>
                ) : (
                    <>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Session Cards */}
                            {sessions?.map((session) => (
                                <PixelCard
                                    key={session.id}
                                    title={session.character_name}
                                    variant="cyber"
                                    className="h-[320px] hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,240,255,0.2)]"
                                >
                                    <div className="h-full flex flex-col justify-between">
                                        {/* Character Info */}
                                        <div className="flex gap-4 items-start">
                                            {/* Avatar */}
                                            <div className="w-20 h-20 bg-black border border-sanabi-cyan/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.3)] relative overflow-hidden">
                                                <User size={40} className="text-sanabi-cyan/60 z-10" />
                                                <div className="absolute inset-0 bg-sanabi-cyan/5 animate-pulse" />
                                            </div>

                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-sanabi-gold uppercase tracking-wider">
                                                        Level {session.character.stats.level}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 font-bold rounded-sm border",
                                                        session.status === 'completed'
                                                            ? 'bg-sanabi-gold/10 text-sanabi-gold border-sanabi-gold/30'
                                                            : session.status === 'abandoned'
                                                                ? 'bg-sanabi-pink/10 text-sanabi-pink border-sanabi-pink/30'
                                                                : 'bg-sanabi-green/10 text-sanabi-green border-sanabi-green/30 shadow-[0_0_5px_rgba(0,255,157,0.3)]'
                                                    )}>
                                                        {session.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-gray-200 truncate text-lg">
                                                    {session.scenario_name}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 h-8">
                                                    "{session.character.description || "Unknown operator..."}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stats Area */}
                                        <div className="space-y-3 font-mono text-xs my-4 bg-black/30 p-3 rounded-sm border border-sanabi-pink/20">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Heart size={14} className="text-sanabi-pink" />
                                                    <span>Integrity</span>
                                                </div>
                                                <div className="flex items-center gap-2 font-bold text-gray-300">
                                                    <span>{session.character.stats.hp}</span>
                                                    <span className="text-gray-600">/</span>
                                                    <span>{session.character.stats.max_hp}</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-2.5 w-full bg-black/50 rounded-sm overflow-hidden border border-sanabi-pink/20">
                                                <div
                                                    className="h-full bg-sanabi-pink shadow-[0_0_10px_rgba(255,0,85,0.6)]"
                                                    style={{ width: `${Math.min(100, (session.character.stats.hp / session.character.stats.max_hp) * 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <PixelButton
                                            variant="primary"
                                            className="w-full flex justify-center items-center gap-2"
                                            onClick={() => navigate(`/game/${session.character.id}`)}
                                        >
                                            <Sword size={16} />
                                            CONTINUE
                                        </PixelButton>
                                    </div>
                                </PixelCard>
                            ))}

                            {/* New Game Button */}
                            <div
                                onClick={handleNewGameClick}
                                className="h-[320px] border border-dashed border-sanabi-cyan/30 hover:border-sanabi-cyan bg-sanabi-panel/30 hover:bg-sanabi-cyan/5 flex flex-col items-center justify-center gap-4 cursor-pointer text-gray-600 hover:text-sanabi-cyan transition-all group rounded-sm hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]"
                            >
                                <div className="p-4 rounded-sm border border-current group-hover:scale-110 transition-transform bg-black/30 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                                    <Plus size={32} />
                                </div>
                                <div className="text-center">
                                    <span className="font-bold tracking-widest uppercase block text-lg">NEW GAME</span>
                                    <span className="text-xs opacity-70 mt-1 block tracking-wider">Start a new adventure</span>
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

            {/* Loading Overlay */}
            {isStartingGame && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm cursor-wait">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-sanabi-cyan/30 rounded-full animate-spin"></div>
                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-sanabi-cyan rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sword size={24} className="text-sanabi-cyan animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-sanabi-cyan tracking-[0.2em] animate-pulse">NOOSPHERE SYNC</h2>
                            <p className="text-sm text-gray-400 font-mono tracking-wider">Generating game world... please wait.</p>
                        </div>
                    </div>
                </div>
            )}
        </PixelLayout>
    );
}
