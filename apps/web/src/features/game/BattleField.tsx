import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AttackPair } from '@durak/shared';
import { Card } from '@/components/Card';
import { PLAY_CARD_W, cardDims } from '@/components/cardSizes';

// Constant per-render, hoisted out of the BattlePair body.
const PLAY_DIMS = cardDims(PLAY_CARD_W);
const PAIR_OFFSET = PLAY_CARD_W * 0.22;
const CELL_W = PLAY_DIMS.w + PAIR_OFFSET;
const CELL_H = PLAY_DIMS.h + PAIR_OFFSET;

interface Props {
  pairs: AttackPair[];
  onAttackPress?: (attackCardId: string) => void;
  highlightedAttackIds?: Set<string>;
}

/**
 * Inside the PlayArea: a 3-column grid of attack/defense pairs. The defense
 * card sits offset over the attack with a small rotation. New pairs ease
 * in via Framer Motion.
 */
const BattleFieldImpl = ({ pairs, onAttackPress, highlightedAttackIds }: Props): JSX.Element => {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <AnimatePresence initial={false}>
        {pairs.map((p) => (
          <motion.div
            key={p.attack.id}
            layout
            initial={{ opacity: 0, y: -10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <BattlePair
              pair={p}
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
  highlighted: boolean;
  onClick: (() => void) | undefined;
}

const BattlePair = ({ pair, highlighted, onClick }: PairProps): JSX.Element => {
  return (
    <div className="relative" style={{ width: CELL_W, height: CELL_H }}>
      <Card
        card={pair.attack}
        width={PLAY_CARD_W}
        selected={highlighted}
        onClick={onClick}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      {pair.defense ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: 14 }}
          transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ position: 'absolute', top: PAIR_OFFSET, left: PAIR_OFFSET * 0.75 }}
        >
          <Card card={pair.defense} width={PLAY_CARD_W} defended />
        </motion.div>
      ) : null}
    </div>
  );
};
