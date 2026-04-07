import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    ChevronDown,
    ChevronUp,
    Compass,
    Layers3,
    MapPinned,
    Sparkles,
    Swords,
} from 'lucide-react';
import { PixelLayout } from '../components/layout/PixelLayout';
import { PixelButton } from '../components/layout/PixelButton';
import { CreateCharacterModal } from '../components/game/CreateCharacterModal';
import { gameService } from '../services/gameService';
import type { ScenarioResponse } from '../types/api';
import { cn } from '../utils/cn';
import {
    getGameTypeBadgeClass,
    getGameTypeDescription,
    getGameTypeLabel,
    getScenarioTimeLabel,
} from '../utils/gameType';

const DIFFICULTY_LABELS: Record<string, string> = {
    easy: '쉬움',
    normal: '보통',
    hard: '어려움',
};
const DEFAULT_SCENARIO_THUMBNAIL_URL =
    'https://pub-3c25697921ae4f12aac4c4cfdbb57cc4.r2.dev/dummy.png';

function ScenarioCard({
    scenario,
    onSelect,
}: {
    scenario: ScenarioResponse;
    onSelect: (scenario: ScenarioResponse) => void;
}) {
    const difficultyLabel =
        DIFFICULTY_LABELS[scenario.difficulty] || scenario.difficulty;
    const [isWorldExpanded, setIsWorldExpanded] = useState(false);
    const thumbnailUrl =
        scenario.thumbnail_url || DEFAULT_SCENARIO_THUMBNAIL_URL;
    const gameTypeLabel = getGameTypeLabel(scenario.game_type);
    const gameTypeDescription = getGameTypeDescription(scenario.game_type);
    const timeLabel = getScenarioTimeLabel(scenario.game_type);

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(scenario)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(scenario);
                }
            }}
            className={cn(
                'group relative overflow-hidden rounded-sm border text-left',
                'border-sanabi-cyan/20 bg-black/35 transition-all duration-300',
                'cursor-pointer',
                'hover:-translate-y-1 hover:border-sanabi-cyan hover:shadow-[0_0_30px_rgba(0,240,255,0.18)]'
            )}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,240,255,0.16),transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.02),transparent)]" />
            <div
                className="relative h-72 w-full overflow-hidden border-b border-sanabi-cyan/10 bg-cover bg-center"
                style={{
                    backgroundImage: `linear-gradient(rgba(11,12,21,0.18), rgba(11,12,21,0.72)), url(${thumbnailUrl})`,
                }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(3,5,12,0.88),rgba(3,5,12,0.14)_55%,rgba(3,5,12,0.05))]" />
                <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-5">
                    <div className="flex flex-wrap gap-2 max-w-[72%]">
                        <span
                            className={cn(
                                'rounded-sm border px-2.5 py-1 text-[11px] backdrop-blur-sm',
                                getGameTypeBadgeClass(scenario.game_type)
                            )}
                        >
                            {gameTypeLabel}
                        </span>
                        {scenario.tags.slice(0, 4).map((tag) => (
                            <span
                                key={tag}
                                className="rounded-sm border border-sanabi-cyan/30 bg-black/35 px-2.5 py-1 text-[11px] text-sanabi-cyan backdrop-blur-sm"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                    <span className="rounded-sm border border-sanabi-pink/40 bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-sanabi-pink backdrop-blur-sm">
                        {difficultyLabel}
                    </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="space-y-3 max-w-3xl">
                        <div className="flex items-center gap-2 text-sanabi-cyan/80 text-xs tracking-[0.25em] uppercase">
                            <Compass size={13} />
                            Scenario Archive
                        </div>
                        <div className="text-4xl font-semibold text-white leading-tight md:text-5xl">
                            {scenario.name}
                        </div>
                        {scenario.hook && (
                            <div className="max-w-2xl text-base leading-7 text-sanabi-gold">
                                "{scenario.hook}"
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative z-10 p-6 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-sm border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] text-gray-300">
                        최대 {scenario.max_turns}
                        {timeLabel}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] text-gray-300">
                        <MapPinned size={12} className="text-sanabi-cyan/70" />
                        {scenario.initial_location || '시작 지점 미정'}
                    </span>
                </div>

                <div className="rounded-sm border border-white/5 bg-black/25 p-4">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-sanabi-cyan/70">
                        게임 타입
                    </div>
                    <p className="mt-2 text-sm leading-7 text-gray-300">
                        <span
                            className={cn(
                                'mr-2 inline-flex rounded-sm border px-2 py-1 text-[11px] font-semibold',
                                getGameTypeBadgeClass(scenario.game_type)
                            )}
                        >
                            {gameTypeLabel}
                        </span>
                        {gameTypeDescription}
                    </p>
                </div>

                <p className="max-w-4xl text-base leading-8 text-gray-300">
                    {scenario.description}
                </p>

                <div className="rounded-sm border border-white/5 bg-black/25 p-4">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-sanabi-cyan/70">
                        추천 대상
                    </div>
                    <p className="mt-2 text-sm leading-7 text-gray-300">
                        {scenario.recommended_for || '모든 탐험가'}
                    </p>
                </div>

                <div className="space-y-3 border-t border-sanabi-cyan/10 pt-5">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setIsWorldExpanded((current) => !current);
                        }}
                        className="flex w-full items-center justify-between rounded-sm border border-sanabi-cyan/10 bg-black/20 px-4 py-3 text-left transition-colors hover:border-sanabi-cyan/30"
                    >
                        <span className="text-[11px] uppercase tracking-[0.25em] text-sanabi-cyan/70">
                            세계관 미리보기
                        </span>
                        {isWorldExpanded ? (
                            <ChevronUp size={16} className="text-sanabi-cyan/70" />
                        ) : (
                            <ChevronDown size={16} className="text-sanabi-cyan/70" />
                        )}
                    </button>
                    {isWorldExpanded && (
                        <div className="rounded-sm border border-sanabi-cyan/10 bg-black/25 p-4">
                            <p className="text-sm leading-7 text-gray-300">
                                {scenario.world_setting || '상세 세계관 정보는 게임 시작 후 드러납니다.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [selectedScenario, setSelectedScenario] =
        useState<ScenarioResponse | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isStartingGame, setIsStartingGame] = useState(false);

    const { data: scenarios, isLoading } = useQuery({
        queryKey: ['scenarios'],
        queryFn: gameService.getScenarios,
    });

    const startGameMutation = useMutation({
        mutationFn: async ({
            characterId,
            scenarioId,
        }: {
            characterId: string;
            scenarioId: string;
        }) => {
            return gameService.startGame(characterId, scenarioId);
        },
        onSuccess: (session) => {
            navigate(`/game/${session.id}`);
        },
        onSettled: () => {
            setIsStartingGame(false);
        },
    });

    const handleScenarioSelect = (scenario: ScenarioResponse) => {
        setSelectedScenario(scenario);
        setIsCreateModalOpen(true);
    };

    const handleCharacterCreated = async (characterId: string) => {
        if (!selectedScenario) return;
        setIsStartingGame(true);
        await startGameMutation.mutateAsync({
            characterId,
            scenarioId: selectedScenario.id,
        });
    };

    return (
        <PixelLayout className="max-w-[1500px]">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 border-b border-sanabi-cyan/10 pb-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-sanabi-cyan/70">
                            <Sparkles size={14} />
                            Scenario Discover
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-4xl leading-tight text-white md:text-5xl">
                                시작할 모험을 선택하세요
                            </h1>
                            <p className="max-w-3xl text-sm leading-relaxed text-gray-400 md:text-base">
                                시나리오를 고르면 곧바로 설문형 캐릭터 온보딩으로
                                이어집니다. 이름, 나이, 성별, 외형을 정하고
                                선택적으로 목표를 더해 첫 턴을 시작합니다.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <PixelButton
                            variant="secondary"
                            className="flex items-center gap-2"
                            onClick={() => navigate('/stories')}
                        >
                            <Layers3 size={16} />
                            내 스토리
                        </PixelButton>
                    </div>
                </div>

                <div className="grid gap-4 rounded-sm border border-sanabi-cyan/10 bg-black/20 p-4 text-xs text-gray-400 md:grid-cols-3">
                    <div className="rounded-sm border border-white/5 bg-black/30 p-4">
                        <div className="text-sanabi-cyan">1. 시나리오 선택</div>
                        <p className="mt-2 leading-relaxed">태그와 설정을 보고 오늘의 분위기에 맞는 모험을 고릅니다.</p>
                    </div>
                        <div className="rounded-sm border border-white/5 bg-black/30 p-4">
                            <div className="text-sanabi-cyan">2. 캐릭터 온보딩</div>
                            <p className="mt-2 leading-relaxed">이름과 기본 프로필은 필수로 정하고, 목표만 선택적으로 더합니다.</p>
                        </div>
                    <div className="rounded-sm border border-white/5 bg-black/30 p-4">
                        <div className="text-sanabi-cyan">3. 첫 턴 진입</div>
                        <p className="mt-2 leading-relaxed">생성된 프로필이 GM 프롬프트에 반영된 상태로 바로 게임이 시작됩니다.</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex min-h-[50vh] items-center justify-center text-xl tracking-[0.3em] text-sanabi-cyan">
                        SCENARIO_FEED_LOADING
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        {scenarios?.map((scenario) => (
                            <ScenarioCard
                                key={scenario.id}
                                scenario={scenario}
                                onSelect={handleScenarioSelect}
                            />
                        ))}
                    </div>
                )}
            </div>

            {isCreateModalOpen && selectedScenario && (
                <CreateCharacterModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={handleCharacterCreated}
                    scenario={selectedScenario}
                />
            )}

            {isStartingGame && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
                    <div className="space-y-6 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-sanabi-cyan/40 bg-sanabi-cyan/10">
                            <Swords size={28} className="text-sanabi-cyan" />
                        </div>
                        <div className="space-y-2">
                            <div className="text-2xl tracking-[0.3em] text-sanabi-cyan">
                                WORLD BOOT
                            </div>
                            <p className="text-sm text-gray-400">
                                캐릭터 프로필을 세계관에 동기화하고 있습니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </PixelLayout>
    );
}
