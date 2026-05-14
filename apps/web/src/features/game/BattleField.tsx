import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
 * Battle field — recessed glass slot where attacks and defenses sit.
 * Cards animate in / out smoothly. Undefended attacks get a soft amber
 * outline (modern, no dashed lines).
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
        'glass-bare flex max-w-full flex-wrap items-center justify-center rounded-card p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]',
        className,
      )}
      style={{ gap }}
    >
      <AnimatePresence initial={false}>
        {pairs.map((p) => (
          <motion.div
            key={p.attack.id}
            layout
            initial={{ opacity: 0, y: -14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.88 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <BattlePair
              pair={p}
              size={size}
              cardW={cardW}
              highlighted={highlightedAttackIds?.has(p.attack.id) ?? false}
              onClick={onAttackPress ? () => onAttackPress(p.attack.id) : undefined}
            />
          </motion.div>
        ))}
      </AnimatePresence>
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
        <motion.div
          initial={{ opacity: 0, scale: 0.85, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: 14 }}
          transition={{ duration: 0.34, ease: [0.2, 0.7, 0.2, 1] }}
          style={{
            position: 'absolute',
            top: cardW * 0.28,
            left: cardW * 0.18,
          }}
        >
          <Card card={pair.defense} size={size} defended />
        </motion.div>
      ) : null}
      {undefended ? (
        <div
          className="pointer-events-none absolute animate-pulse-ring rounded-[12%]"
          style={{
            top: cardW * 0.32,
            left: cardW * 0.16,
            width: cardW,
            height: cardW * 1.45,
            background: 'rgba(251,191,36,0.06)',
            border: '1.5px solid rgba(251,191,36,0.8)',
            boxShadow: '0 0 16px rgba(251,191,36,0.3)',
          }}
        />
      ) : null}
    </div>
  );
};
