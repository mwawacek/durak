import { memo } from 'react';
import type { AttackPair } from '@durak/shared';
import { Card } from '@/components/Card';
import { cn } from '@/lib/cn';

interface Props {
  pairs: AttackPair[];
  size?: 'sm' | 'md';
  onAttackPress?: (attackCardId: string) => void;
  highlightedAttackIds?: Set<string>;
  className?: string;
}

/**
 * Up to 6 attack/defense pairs in a flex-wrap grid. Defended cards sit at
 * an offset over the attack with a 16° rotation. Undefended attacks get a
 * pulsing warm-orange outline (CSS keyframes — no JS timer per cell).
 */
const BattleFieldImpl = ({
  pairs,
  size = 'md',
  onAttackPress,
  highlightedAttackIds,
  className,
}: Props): JSX.Element => {
  const cardW = size === 'sm' ? 44 : 64;
  const gap = size === 'sm' ? 6 : 10;
  return (
    <div
      className={cn(
        'flex max-w-full flex-wrap items-center justify-center rounded-2xl bg-black/20 p-2.5',
        className,
      )}
      style={{ gap }}
    >
      {pairs.map((p) => (
        <BattlePair
          key={p.attack.id}
          pair={p}
          size={size}
          cardW={cardW}
          highlighted={highlightedAttackIds?.has(p.attack.id) ?? false}
          onClick={onAttackPress ? () => onAttackPress(p.attack.id) : undefined}
        />
      ))}
    </div>
  );
};

export const BattleField = memo(BattleFieldImpl);

interface PairProps {
  pair: AttackPair;
  size: 'sm' | 'md';
  cardW: number;
  highlighted: boolean;
  onClick: (() => void) | undefined;
}

const BattlePair = ({ pair, size, cardW, highlighted, onClick }: PairProps): JSX.Element => {
  const undefended = !pair.defense;
  // Cell is wide enough for the attack card + the offset defence card.
  const cellW = cardW + cardW * 0.22;
  const cellH = cardW * 1.45 + cardW * 0.28;
  return (
    <div className="relative" style={{ width: cellW, height: cellH }}>
      <Card
        card={pair.attack}
        size={size}
        selected={highlighted}
        onClick={onClick}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      {pair.defense ? (
        <Card
          card={pair.defense}
          size={size}
          defended
          rotate={16}
          style={{
            position: 'absolute',
            top: cardW * 0.28,
            left: cardW * 0.18,
          }}
        />
      ) : null}
      {undefended ? (
        <div
          className="pointer-events-none absolute animate-pulse-outline rounded-card border-[1.5px] border-dashed border-warm-alert"
          style={{
            top: cardW * 0.32,
            left: cardW * 0.16,
            width: cardW,
            height: cardW * 1.45,
            background: 'rgba(255,170,80,0.06)',
            borderColor: '#ffaa50',
          }}
        />
      ) : null}
    </div>
  );
};
