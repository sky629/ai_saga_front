import React, { useState, useEffect } from 'react';
import type { DiceResult } from '../../types/api';
import { PixelButton } from '../layout/PixelButton';

interface DiceResultPanelProps {
  diceResult: DiceResult | null | undefined;
  onComplete?: () => void;
}

export const DiceResultPanel: React.FC<DiceResultPanelProps> = ({ diceResult, onComplete }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentValue, setCurrentValue] = useState(1);

  // Reset when a new dice result comes in
  useEffect(() => {
    if (diceResult) {
      setIsRolling(false);
      setShowResult(false);
    }
  }, [diceResult]);

  if (!diceResult) {
    return null;
  }

  const handleRoll = () => {
    setIsRolling(true);
    
    // Animation effect
    let count = 0;
    const interval = setInterval(() => {
      setCurrentValue(Math.floor(Math.random() * 20) + 1);
      count++;
      if (count > 15) {
        clearInterval(interval);
        setIsRolling(false);
        setShowResult(true);
        if (onComplete) onComplete();
      }
    }, 80);
  };

  const getStatusStyles = () => {
    if (!showResult) return {
      bg: 'bg-sanabi-panel/80',
      border: 'border-sanabi-cyan/30',
      text: 'text-sanabi-cyan',
      glow: '',
      label: '판정 대기 중...',
    };

    if (diceResult.is_critical) {
      return {
        bg: 'bg-yellow-900/80',
        border: 'border-yellow-500',
        text: 'text-yellow-300',
        glow: 'shadow-[0_0_15px_rgba(255,215,0,0.5)]',
        label: 'CRITICAL SUCCESS!',
      };
    }
    if (diceResult.is_fumble) {
      return {
        bg: 'bg-red-950/80',
        border: 'border-red-600',
        text: 'text-red-400',
        glow: 'shadow-[0_0_10px_rgba(220,38,38,0.4)]',
        label: 'FUMBLE...',
      };
    }
    if (diceResult.is_success) {
      return {
        bg: 'bg-green-900/60',
        border: 'border-green-500',
        text: 'text-green-300',
        glow: '',
        label: 'SUCCESS',
      };
    }
    return {
      bg: 'bg-red-900/60',
      border: 'border-red-500',
      text: 'text-red-300',
      glow: '',
      label: 'FAILURE',
    };
  };

  const styles = getStatusStyles();

  return (
    <div
      className={`
        mb-4 p-4 rounded-sm border-2 font-mono relative overflow-hidden
        ${styles.bg} ${styles.border} ${styles.glow}
        transition-all duration-500
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
            ${isRolling ? 'animate-bounce border-sanabi-gold' : showResult ? styles.border : 'border-sanabi-cyan/40'}
            rounded-md transition-colors
          `}>
            <span className={`text-2xl font-bold ${isRolling ? 'text-sanabi-gold' : showResult ? styles.text : 'text-sanabi-cyan/40'}`}>
              {isRolling ? currentValue : showResult ? (diceResult.total - diceResult.modifier) : '?'}
            </span>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-sanabi-cyan/60 uppercase tracking-widest">Requirement</span>
              <span className="text-xs font-bold text-sanabi-cyan underline decoration-sanabi-gold/50 underline-offset-4">
                DC {diceResult.dc} ({diceResult.check_type})
              </span>
            </div>
            
            {showResult && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-lg font-bold text-white">{diceResult.total}</span>
                <span className="text-[10px] text-gray-500">
                  ( {diceResult.total - diceResult.modifier} {diceResult.modifier >= 0 ? '+' : ''} {diceResult.modifier} )
                </span>
              </div>
            )}
          </div>
        </div>

        {!showResult ? (
          <PixelButton 
            onClick={handleRoll} 
            disabled={isRolling}
            variant="primary"
            size="sm"
            className="w-full sm:w-auto min-w-[120px] animate-pulse shadow-[0_0_15px_rgba(255,215,0,0.3)]"
          >
            {isRolling ? '_CALCULATING...' : 'ROLL DICE'}
          </PixelButton>
        ) : (
          <div
            className={`
              px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-[0.2em]
              ${styles.text} bg-black/40 border ${styles.border}
            `}
          >
            {styles.label}
          </div>
        )}
      </div>
      
      {showResult && diceResult.damage !== null && diceResult.damage > 0 && (
        <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-sanabi-pink font-bold flex items-center gap-2 uppercase tracking-widest">
          <span className="opacity-50">Impact_Detected:</span>
          <span className="text-sm">-{diceResult.damage} HP</span>
        </div>
      )}
    </div>
  );
};
