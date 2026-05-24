import { memo } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import type { AttackPair } from '@durak/shared';
import { Card } from '@/components/Card';
import { PLAY_CARD_W, cardDims } from '@/components/cardSizes';
import { EASE_OUT_EXPO } from '@/lib/motion';

// Hoisted out of the BattlePair body so React.memo on Card actually
// short-circuits (a fresh inline style literal would invalidate the prop
// comparison on every render).
const PLAY_DIMS = cardDims(PLAY_CARD_W);
const PAIR_OFFSET = PLAY_CARD_W * 0.22;
const CELL_W = PLAY_DIMS.w + PAIR_OFFSET;
const CELL_H = PLAY_DIMS.h + PAIR_OFFSET;
const ATTACK_STYLE = { position: 'absolute' as const, top: 0, left: 0 };
const DEFENSE_WRAPPER_STYLE = {
  position: 'absolute' as const,
  top: PAIR_OFFSET,
  left: PAIR_OFFSET * 0.75,
};
const CELL_STYLE = { width: CELL_W, height: CELL_H };

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
        {/* No `layout` prop: the grid is fixed grid-cols-3 and cards don't
            reorder within the round, so FLIP measurements are wasted. */}
        {pairs.map((p) => (
          <m.div
            key={p.attack.id}
            initial={{ opacity: 0, y: -10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
          >
            <BattlePair
              pair={p}
              highlighted={highlightedAttackIds?.has(p.attack.id) ?? false}
              onClick={onAttackPress ? () => onAttackPress(p.attack.id) : undefined}
            />
          </m.div>
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
    <div className="relative" style={CELL_STYLE}>
      <Card
        card={pair.attack}
        width={PLAY_CARD_W}
        selected={highlighted}
        onClick={onClick}
        style={ATTACK_STYLE}
      />
      {pair.defense ? (
        <m.div
          initial={{ opacity: 0, scale: 0.85, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: 14 }}
          transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
          style={DEFENSE_WRAPPER_STYLE}
        >
          <Card card={pair.defense} width={PLAY_CARD_W} defended />
        </m.div>
      ) : null}
    </div>
  );
};
