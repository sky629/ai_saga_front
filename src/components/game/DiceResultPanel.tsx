import React, { useState } from 'react';
import type { DiceResult } from '../../types/api';

interface DiceResultPanelProps {
  diceResult: DiceResult | null | undefined;
  onComplete?: () => void;
}

export const DiceResultPanel: React.FC<DiceResultPanelProps> = ({ diceResult, onComplete }) => {
  const [phase, setPhase] = useState<'idle' | 'revealed'>('idle');

  if (!diceResult) {
    return null;
  }

  const handleRollDice = () => {
    if (phase !== 'idle') {
      return;
    }

    setPhase('revealed');
    onComplete?.();
  };

  const getStatusStyles = () => {
    if (diceResult.is_critical) {
      return {
        bg: 'bg-yellow-900/80',
        border: 'border-yellow-500',
        text: 'text-yellow-300',
        glow: 'shadow-[0_0_15px_rgba(255,215,0,0.5)]',
        label: '대성공!',
      };
    }
    if (diceResult.is_fumble) {
      return {
        bg: 'bg-red-950/80',
        border: 'border-red-600',
        text: 'text-red-400',
        glow: 'shadow-[0_0_10px_rgba(220,38,38,0.4)]',
        label: '대실패!',
      };
    }
    if (diceResult.is_success) {
      return {
        bg: 'bg-green-900/60',
        border: 'border-green-500',
        text: 'text-green-300',
        glow: '',
        label: '성공!',
      };
    }
    return {
      bg: 'bg-red-900/60',
      border: 'border-red-500',
      text: 'text-red-300',
      glow: '',
      label: '실패...',
    };
  };

  const styles = getStatusStyles();

  if (phase !== 'revealed') {
    return (
      <div
        className="
          mb-4 p-4 rounded-sm border-2 border-sanabi-cyan/60 font-mono
          bg-black/70 shadow-[0_0_18px_rgba(0,240,255,0.12)]
        "
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-sanabi-cyan/60">
              Dice Check
            </div>
            <div className="mt-1 text-sm font-bold text-white">
              행동을 시도할 순간입니다
            </div>
            <div className="mt-1 text-[11px] text-gray-400">
              주사위를 굴리면 결과와 다음 상황이 이어집니다.
            </div>
          </div>

          <button
            type="button"
            onClick={handleRollDice}
            className="
              min-w-36 rounded-sm border border-sanabi-gold bg-sanabi-gold/90
              px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-black
              transition-all hover:bg-sanabi-gold
            "
          >
            주사위 굴리기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        mb-4 p-4 rounded-sm border-2 font-mono relative overflow-hidden
        ${styles.bg} ${styles.border} ${styles.glow}
      `}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-1 opacity-10 text-[8px] uppercase tracking-tighter">
        Neural_Logic_Gate_0x{diceResult.dc.toString(16)}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`
            w-12 h-12 flex items-center justify-center border-2 border-dashed
            ${styles.border}
            rounded-md
          `}>
            <span className={`text-2xl font-bold ${styles.text}`}>
              {diceResult.total - diceResult.modifier}
            </span>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-sanabi-cyan/60 uppercase tracking-widest">Requirement</span>
              <span className="text-xs font-bold text-sanabi-cyan underline decoration-sanabi-gold/50 underline-offset-4">
                DC {diceResult.dc} ({diceResult.check_type})
              </span>
            </div>
            
            <div className="flex items-center gap-1 mt-1">
              <span className="text-lg font-bold text-white">{diceResult.total}</span>
              <span className="text-[10px] text-gray-500">🎲 1d20{diceResult.modifier >= 0 ? '+' : ''}{diceResult.modifier} = {diceResult.total} vs DC {diceResult.dc}</span>
            </div>
          </div>
        </div>

        <div
          className={`
            px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-[0.2em]
            ${styles.text} bg-black/40 border ${styles.border}
          `}
        >
          {diceResult.is_fumble && <span className="mr-1">⚠️</span>}
          {styles.label}
        </div>
      </div>

      {diceResult.damage !== null && diceResult.damage > 0 && (
        <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-sanabi-pink font-bold flex items-center gap-2 uppercase tracking-widest">
          <span className="text-sm">데미지: {diceResult.damage}</span>
        </div>
      )}
    </div>
  );
};
