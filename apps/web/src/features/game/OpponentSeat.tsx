import { memo } from 'react';
import type { PlayerPublic } from '@durak/shared';
import { Card } from '@/components/Card';
import { RingedAvatar } from '@/components/RingedAvatar';
import { cn } from '@/lib/cn';

export type SeatRole = 'attacker' | 'defender' | 'wait';
export type SeatSize = 'normal' | 'compact';

interface Props {
  player: PlayerPublic;
  role: SeatRole;
  size?: SeatSize;
}

const SIZE_TOKENS = {
  normal: { cardW: 22, avatar: 22, fontName: 10, fontCount: 9, maxStack: 5 },
  compact: { cardW: 14, avatar: 18, fontName: 9, fontCount: 8, maxStack: 4 },
} as const;

const initial = (name: string): string => (name.trim()[0] ?? '?').toUpperCase();

/**
 * Opponent at the perimeter of the table: fanned card backs above a name pill.
 * The pill's background reflects role (attacker = red, defender = gold, wait
 * = brass). Card backs scale with seat size (compact for crowded layouts).
 */
const OpponentSeatImpl = ({ player, role, size = 'normal' }: Props): JSX.Element => {
  const tokens = SIZE_TOKENS[size];
  const isAttack = role === 'attacker';
  const isDefend = role === 'defender';
  const showCount = Math.min(player.handCount, tokens.maxStack);

  const stackWidth = tokens.cardW * 2;
  const stackHeight = tokens.cardW * 1.2;

  const pillBg = isAttack
    ? 'bg-gradient-to-b from-[rgba(168,32,31,0.55)] to-[rgba(50,8,7,0.85)] border-red/70'
    : isDefend
      ? 'bg-gradient-to-b from-[rgba(212,165,72,0.4)] to-[rgba(40,28,18,0.9)] border-gold-light'
      : 'bg-gradient-to-b from-[rgba(40,28,18,0.85)] to-[rgba(15,8,4,0.9)] border-gold/40';

  return (
    <div className={cn('flex flex-col items-center gap-1', !player.isConnected && 'opacity-40')}>
      <div
        className="relative"
        style={{
          width: stackWidth,
          height: stackHeight,
          marginBottom: -tokens.cardW * 0.4,
        }}
      >
        {Array.from({ length: showCount }).map((_, i) => {
          const t = showCount === 1 ? 0 : (i - (showCount - 1) / 2) / ((showCount - 1) / 2);
          const translate = t * tokens.cardW * 0.4;
          const angle = t * 14;
          return (
            <div
              key={i}
              className="absolute left-1/2 top-0"
              style={{
                marginLeft: -tokens.cardW / 2,
                transform: `translateX(${translate}px) rotate(${angle}deg)`,
                width: tokens.cardW,
              }}
            >
              <Card card={null} faceDown size="sm" style={{ width: tokens.cardW, height: tokens.cardW * 1.45 }} />
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          'flex items-center gap-1.5 rounded-pill border py-0.5 pl-0.5 pr-2.5',
          pillBg,
        )}
      >
        <RingedAvatar initials={initial(player.name)} active={isAttack || isDefend} size={tokens.avatar} />
        <span
          className="max-w-[60px] truncate font-bold text-cream-soft"
          style={{ fontSize: tokens.fontName }}
        >
          {player.name}
        </span>
        <span
          className={cn(
            'rounded-pill bg-black/40 px-1 py-0.5 font-extrabold',
            isAttack ? 'text-red-count' : 'text-gold-light',
          )}
          style={{ fontSize: tokens.fontCount }}
        >
          {player.handCount}
        </span>
      </div>
    </div>
  );
};

export const OpponentSeat = memo(OpponentSeatImpl);
