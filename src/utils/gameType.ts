import type { ScenarioGameType } from '../types/api';

const GAME_TYPE_LABELS: Record<ScenarioGameType, string> = {
    trpg: 'TRPG',
    progression: '성장형',
};

const GAME_TYPE_DESCRIPTIONS: Record<ScenarioGameType, string> = {
    trpg: '선택마다 턴이 진행되는 전통적인 GM 진행형 모험',
    progression: '개월 단위 선택과 상태 누적으로 성장하는 육성형 플레이',
};

const GAME_TYPE_BADGE_STYLES: Record<ScenarioGameType, string> = {
    trpg: 'border-sanabi-cyan/30 bg-sanabi-cyan/10 text-sanabi-cyan',
    progression:
        'border-sanabi-gold/30 bg-sanabi-gold/10 text-sanabi-gold',
};

export function getGameTypeLabel(gameType: ScenarioGameType): string {
    return GAME_TYPE_LABELS[gameType] || gameType.toUpperCase();
}

export function getGameTypeDescription(
    gameType: ScenarioGameType
): string {
    return GAME_TYPE_DESCRIPTIONS[gameType] || '';
}

export function getGameTypeBadgeClass(
    gameType: ScenarioGameType
): string {
    return (
        GAME_TYPE_BADGE_STYLES[gameType] ||
        'border-white/10 bg-white/5 text-gray-300'
    );
}

export function getScenarioTimeLabel(gameType: ScenarioGameType): string {
    return gameType === 'progression' ? '개월' : '턴';
}

export function getManualCategoryLabel(category: string): string {
    const normalized = category.trim().toLowerCase();
    if (normalized === 'internal') return '심법';
    if (normalized === 'external') return '외공';
    if (normalized === 'movement') return '신법';
    return '미분류';
}
