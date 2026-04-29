import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ChevronLeft,
    ChevronRight,
    FileText,
    User,
} from 'lucide-react';
import { gameService } from '../../services/gameService';
import type { CharacterProfile, ScenarioResponse } from '../../types/api';
import { cn } from '../../utils/cn';
import {
    getGameTypeBadgeClass,
    getGameTypeDescription,
    getGameTypeLabel,
    getScenarioTimeLabel,
} from '../../utils/gameType';
import { PixelButton } from '../layout/PixelButton';
import { PixelCard } from '../layout/PixelCard';

interface CreateCharacterModalProps {
    onClose: () => void;
    onSuccess: (characterId: string) => void;
    scenario?: ScenarioResponse | null;
}

const GENDER_OPTIONS = ['남성', '여성', '비공개'] as const;
type GenderOption = (typeof GENDER_OPTIONS)[number];
const APPEARANCE_OPTIONS = [
    '단정한 복장',
    '전투 흔적',
    '귀족풍',
    '남루한 여행자',
    '신비로운 분위기',
    '날렵한 인상',
];
const GOAL_OPTIONS = ['복수', '생존', '진실 추적', '명예 회복', '돈', '누군가를 구하기'];

function OptionChip({
    active,
    label,
    onClick,
}: {
    active: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-sm border px-3 py-2 text-sm transition-all',
                active
                    ? 'border-sanabi-cyan bg-sanabi-cyan/15 text-sanabi-cyan shadow-[0_0_12px_rgba(0,240,255,0.18)]'
                    : 'border-sanabi-cyan/20 bg-black/30 text-gray-400 hover:border-sanabi-cyan/40 hover:text-gray-200'
            )}
        >
            {label}
        </button>
    );
}

export function CreateCharacterModal({
    onClose,
    onSuccess,
    scenario,
}: CreateCharacterModalProps) {
    const [name, setName] = useState('');
    const [age, setAge] = useState<number | ''>('');
    const [gender, setGender] = useState<GenderOption | ''>('');
    const [appearance, setAppearance] = useState(APPEARANCE_OPTIONS[0]);
    const [goal, setGoal] = useState('');
    const [step, setStep] = useState(1);
    const queryClient = useQueryClient();
    const normalizedAppearance = appearance.trim();
    const normalizedGoal = goal.trim();

    const { mutate, isPending, error } = useMutation({
        mutationFn: async () => {
            if (!scenario) {
                throw new Error('Scenario not selected');
            }
            if (!gender) {
                throw new Error('Gender not selected');
            }
            if (
                age === '' ||
                age < 0
            ) {
                throw new Error('Age is invalid');
            }
            if (!normalizedAppearance) {
                throw new Error('Appearance is required');
            }

            const profile: CharacterProfile = {
                age,
                gender,
                appearance: normalizedAppearance,
                ...(normalizedGoal ? { goal: normalizedGoal } : {}),
            };

            return gameService.createCharacter({
                name,
                scenarioId: scenario.id,
                profile,
            });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['characters'] });
            onSuccess(data.id);
            onClose();
        },
    });

    const canContinue = Boolean(
        name.trim().length > 0 &&
        age !== '' &&
        age >= 0 &&
        gender
    );

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        mutate();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 p-2 py-4 backdrop-blur-sm font-pixel sm:items-center sm:p-4">
            <PixelCard
                className="w-full max-w-3xl border-sanabi-cyan/70"
                variant="cyber"
            >
                <div className="space-y-2 border-b border-sanabi-cyan/10 px-4 pb-5 pt-2">
                    <div className="text-[11px] uppercase tracking-[0.32em] text-sanabi-cyan/70">
                        Character Setup
                    </div>
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-semibold text-white">
                                캐릭터 설정
                            </h2>
                            <p className="mt-2 text-sm leading-7 text-gray-400">
                                채팅으로 드러나기 어려운 기본 정보만 먼저 정합니다.
                            </p>
                        </div>
                        <div className="rounded-sm border border-sanabi-cyan/20 bg-black/35 px-3 py-2 text-right">
                            <div className="text-[10px] uppercase tracking-[0.25em] text-gray-500">
                                STEP
                            </div>
                            <div className="mt-1 text-sm text-sanabi-cyan">
                                {step}/2
                            </div>
                        </div>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 p-4">
                    {scenario && (
                        <div className="relative space-y-3 rounded-sm border border-sanabi-cyan/15 bg-[linear-gradient(135deg,rgba(0,240,255,0.05),rgba(255,255,255,0.02))] p-4">
                            <div className="absolute right-0 top-0 h-2 w-2 border-r border-t border-sanabi-cyan/40" />
                            <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-sanabi-cyan/40" />
                            <h4 className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-sanabi-cyan">
                                <FileText size={12} /> 선택한 시나리오
                            </h4>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-bold text-gray-200">
                                    {scenario.name}
                                </p>
                                <span
                                    className={cn(
                                        'rounded-sm border px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
                                        getGameTypeBadgeClass(
                                            scenario.game_type
                                        )
                                    )}
                                >
                                    {getGameTypeLabel(scenario.game_type)}
                                </span>
                                <span className="rounded-sm border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-gray-400">
                                    최대 {scenario.max_turns}
                                    {getScenarioTimeLabel(
                                        scenario.game_type
                                    )}
                                </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-400">
                                {scenario.description}
                            </p>
                            <p className="text-xs leading-6 text-gray-500">
                                {getGameTypeDescription(scenario.game_type)}
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-between rounded-sm border border-sanabi-cyan/10 bg-black/30 px-4 py-3 text-xs tracking-[0.18em] text-gray-500">
                        <span className={step === 1 ? 'text-sanabi-cyan' : ''}>
                            1. 기본 정보
                        </span>
                        <span className={step === 2 ? 'text-sanabi-cyan' : ''}>
                            2. 목표 설정
                        </span>
                    </div>

                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-sanabi-cyan">
                                    <User size={12} /> 이름
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    className="w-full rounded-sm border border-sanabi-cyan/30 bg-black/50 p-3 text-lg text-gray-200 transition-all placeholder:text-gray-600 focus:border-sanabi-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                                    placeholder="인물의 이름을 입력하세요"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="text-xs font-bold uppercase tracking-widest text-sanabi-cyan">
                                    나이
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={age}
                                    onChange={(event) => {
                                        const digitsOnly = event.target.value.replace(/[^0-9]/g, '');
                                        setAge(
                                            digitsOnly === ''
                                                ? ''
                                                : Number.parseInt(
                                                      digitsOnly,
                                                      10
                                                  )
                                        );
                                    }}
                                    className="w-full rounded-sm border border-sanabi-cyan/30 bg-black/50 p-3 text-lg text-gray-200 transition-all placeholder:text-gray-600 focus:border-sanabi-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                                    placeholder="나이를 숫자로 입력하세요"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="text-xs font-bold uppercase tracking-widest text-sanabi-cyan">
                                    성별
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {GENDER_OPTIONS.map((option) => (
                                        <OptionChip
                                            key={option}
                                            active={gender === option}
                                            label={option}
                                            onClick={() => setGender(option)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="text-xs font-bold uppercase tracking-widest text-sanabi-cyan">
                                    외형
                                    <span className="ml-2 text-[10px] text-gray-500">
                                        필수
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {APPEARANCE_OPTIONS.map((option) => (
                                        <OptionChip
                                            key={option}
                                            active={appearance === option}
                                            label={option}
                                            onClick={() => setAppearance(option)}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={appearance}
                                    onChange={(event) => setAppearance(event.target.value)}
                                    className="w-full rounded-sm border border-sanabi-cyan/30 bg-black/50 p-3 text-base text-gray-200 transition-all placeholder:text-gray-600 focus:border-sanabi-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                                    placeholder="직접 외형을 입력할 수도 있습니다"
                                />
                                <p className="text-xs leading-6 text-gray-500">
                                    기본값이 자동으로 선택됩니다. 필요하면 칩을 고르거나 직접 수정하세요.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="text-xs font-bold uppercase tracking-widest text-sanabi-cyan">
                                    목표
                                    <span className="ml-2 text-[10px] text-gray-500">
                                        선택
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {GOAL_OPTIONS.map((option) => (
                                        <OptionChip
                                            key={option}
                                            active={goal === option}
                                            label={option}
                                            onClick={() =>
                                                setGoal((current) =>
                                                    current === option ? '' : option
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={goal}
                                    onChange={(event) => setGoal(event.target.value)}
                                    className="w-full rounded-sm border border-sanabi-cyan/30 bg-black/50 p-3 text-base text-gray-200 transition-all placeholder:text-gray-600 focus:border-sanabi-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                                    placeholder="직접 목표를 입력할 수도 있습니다"
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="border border-sanabi-pink/50 bg-sanabi-pink/10 p-3 text-center text-xs font-bold text-sanabi-pink shadow-[0_0_10px_rgba(255,0,85,0.2)]">
                            설정 화면 오류: {error.message}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-sanabi-cyan/10 pt-4 md:flex-row md:items-center md:justify-between">
                        <PixelButton
                            type="button"
                            onClick={onClose}
                            variant="secondary"
                            className="w-full opacity-85 hover:opacity-100 md:w-auto md:min-w-[140px]"
                            size="sm"
                        >
                            닫기
                        </PixelButton>
                        {step === 1 ? (
                            <PixelButton
                                type="button"
                                disabled={!canContinue}
                                variant="primary"
                                className="w-full md:w-auto md:min-w-[180px] flex items-center justify-center gap-2"
                                size="sm"
                                onClick={() => setStep(2)}
                            >
                                다음
                                <ChevronRight size={14} />
                            </PixelButton>
                        ) : (
                            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                                <PixelButton
                                    type="button"
                                    variant="secondary"
                                    className="w-full md:w-auto md:min-w-[120px] flex items-center justify-center gap-2"
                                    size="sm"
                                    onClick={() => setStep(1)}
                                >
                                    <ChevronLeft size={14} />
                                    이전
                                </PixelButton>
                                <PixelButton
                                    type="submit"
                                    disabled={isPending}
                                    variant="primary"
                                    className="w-full md:w-auto md:min-w-[220px]"
                                    size="sm"
                                >
                                    {isPending
                                        ? '설정 적용 중...'
                                        : '모험 시작하기'}
                                </PixelButton>
                            </div>
                        )}
                    </div>
                </form>
            </PixelCard>
        </div>
    );
}
