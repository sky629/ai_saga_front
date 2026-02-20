import type { DiceResult } from '../../types/api';

interface DiceResultPanelProps {
  diceResult: DiceResult | null | undefined;
}

export const DiceResultPanel: React.FC<DiceResultPanelProps> = ({ diceResult }) => {
  if (!diceResult) {
    return null;
  }

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

  return (
    <div
      className={`
        mb-4 p-4 rounded-lg border-2 font-mono
        ${styles.bg} ${styles.border} ${styles.glow}
        transition-all duration-300
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎲</span>
          <span className="text-lg text-cyan-300">
            1d20{diceResult.modifier >= 0 ? '+' : ''}{diceResult.modifier}
          </span>
          <span className="text-sanabi-text-dim">=</span>
          <span className="text-xl font-bold text-white">
            {diceResult.total}
          </span>
          <span className="text-sanabi-text-dim">vs DC</span>
          <span className="text-lg text-cyan-300">{diceResult.dc}</span>
        </div>
        <div
          className={`
            px-3 py-1 rounded-full text-sm font-bold
            ${styles.text} bg-black/30
          `}
        >
          {styles.label}
        </div>
      </div>
      
      {diceResult.damage !== null && diceResult.damage > 0 && (
        <div className="mt-2 text-sm text-sanabi-text-dim">
          데미지: <span className="text-red-400 font-bold">{diceResult.damage}</span>
        </div>
      )}
    </div>
  );
};
