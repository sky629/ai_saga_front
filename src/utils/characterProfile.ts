import type { CharacterProfile } from '../types/api';

export function formatCharacterProfile(profile?: CharacterProfile | null): string {
    if (!profile) {
        return '기록된 캐릭터 프로필이 없습니다.';
    }

    const parts = [
        `${profile.age}세 ${profile.gender}`,
        profile.appearance,
    ];

    if (profile.goal) {
        parts.push(`목표: ${profile.goal}`);
    }

    return parts.join(' · ');
}
