import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Trash2, User } from 'lucide-react';
import { PixelLayout } from '../components/layout/PixelLayout';
import { PixelCard } from '../components/layout/PixelCard';
import { PixelButton } from '../components/layout/PixelButton';
import { gameService } from '../services/gameService';
import { formatCharacterProfile } from '../utils/characterProfile';
import { cn } from '../utils/cn';

export default function Stories() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const deleteSessionMutation = useMutation({
        mutationFn: async (sessionId: string) => {
            await gameService.deleteSession(sessionId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            queryClient.invalidateQueries({ queryKey: ['characters'] });
        },
    });

    const { data: sessionsData, isLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: () => gameService.getSessions(20),
    });

    const sessions = sessionsData?.items;

    const handleDeleteSession = async (sessionId: string) => {
        if (!window.confirm('이 게임 세션을 삭제할까요? 진행 상황은 복구할 수 없습니다.')) {
            return;
        }

        await deleteSessionMutation.mutateAsync(sessionId);
    };

    return (
        <PixelLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 border-b border-sanabi-cyan/10 pb-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-[0.35em] text-sanabi-cyan/70">
                            Story Archive
                        </div>
                        <h1 className="mt-3 text-4xl text-white">내 스토리</h1>
                        <p className="mt-2 text-sm text-gray-400">
                            진행 중인 모험과 종료된 세션을 여기서 이어가거나 정리합니다.
                        </p>
                    </div>
                    <PixelButton
                        variant="secondary"
                        onClick={() => navigate('/')}
                    >
                        시나리오 찾기
                    </PixelButton>
                </div>

                {isLoading ? (
                    <div className="flex min-h-[50vh] items-center justify-center text-xl tracking-[0.3em] text-sanabi-cyan">
                        STORY_ARCHIVE_LOADING
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sessions?.map((session) => (
                            <PixelCard
                                key={session.id}
                                variant="cyber"
                                className="h-[320px]"
                            >
                                <div className="flex h-full flex-col justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-sanabi-cyan/50 bg-black">
                                            <User size={40} className="z-10 text-sanabi-cyan/60" />
                                            <div className="absolute inset-0 bg-sanabi-cyan/5" />
                                        </div>

                                        <div className="flex-1 overflow-hidden">
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className="text-xs uppercase tracking-wider text-sanabi-gold">
                                                    Level {session.character.stats.level}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'rounded-sm border px-2 py-0.5 text-[10px] font-bold',
                                                        session.status === 'completed'
                                                            ? 'border-sanabi-gold/30 bg-sanabi-gold/10 text-sanabi-gold'
                                                            : 'border-sanabi-green/30 bg-sanabi-green/10 text-sanabi-green'
                                                    )}
                                                >
                                                    {session.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <h3 className="truncate text-2xl font-bold tracking-[0.08em] text-sanabi-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.18)]">
                                                {session.character_name}
                                            </h3>
                                            <h4 className="mt-2 truncate text-lg text-gray-200">
                                                {session.scenario_name}
                                            </h4>
                                            <p className="mt-1 line-clamp-2 h-8 text-xs text-gray-500">
                                                {formatCharacterProfile(session.character.profile)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="my-4 space-y-3 rounded-sm border border-sanabi-pink/20 bg-black/30 p-3 font-mono text-xs">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Heart size={14} className="text-sanabi-pink" />
                                                <span>HP</span>
                                            </div>
                                            <div className="flex items-center gap-2 font-bold text-gray-300">
                                                <span>{session.character.stats.hp}</span>
                                                <span className="text-gray-600">/</span>
                                                <span>{session.character.stats.max_hp}</span>
                                            </div>
                                        </div>
                                        <div className="h-2.5 w-full overflow-hidden rounded-sm border border-sanabi-pink/20 bg-black/50">
                                            <div
                                                className="h-full bg-sanabi-pink"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (session.character.stats.hp /
                                                            session.character.stats.max_hp) *
                                                            100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <PixelButton
                                            variant="primary"
                                            className="flex-1"
                                            onClick={() => navigate(`/game/${session.id}`)}
                                        >
                                            계속하기
                                        </PixelButton>
                                        <PixelButton
                                            variant="danger"
                                            className="px-3"
                                            disabled={deleteSessionMutation.isPending}
                                            onClick={() => handleDeleteSession(session.id)}
                                        >
                                            <Trash2 size={16} />
                                        </PixelButton>
                                    </div>
                                </div>
                            </PixelCard>
                        ))}
                    </div>
                )}
            </div>
        </PixelLayout>
    );
}
