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
  normal: { cardW: 22, avatar: 26, fontName: 11, fontCount: 10, maxStack: 5 },
  compact: { cardW: 14, avatar: 20, fontName: 9, fontCount: 9, maxStack: 4 },
} as const;

const initial = (name: string): string => (name.trim()[0] ?? '?').toUpperCase();

/**
 * Opponent at the table perimeter: fanned card backs above a glass pill.
 * Tone (attacker / defender / wait) drives the avatar gradient and the
 * pill's ring tint.
 */
const OpponentSeatImpl = ({ player, role, size = 'normal' }: Props): JSX.Element => {
  const t = SIZE_TOKENS[size];
  const isAttack = role === 'attacker';
  const isDefend = role === 'defender';
  const showCount = Math.min(player.handCount, t.maxStack);

  const stackWidth = t.cardW * 2;
  const stackHeight = t.cardW * 1.2;

  const pillRing = isAttack
    ? 'ring-1 ring-crimson-500/50 shadow-crimson'
    : isDefend
      ? 'ring-1 ring-mint-400/50'
      : 'ring-1 ring-white/10';

  const avatarTone = isAttack ? 'attacker' : isDefend ? 'defender' : 'neutral';

  return (
    <div className={cn('flex flex-col items-center gap-1.5', !player.isConnected && 'opacity-40')}>
      <div
        className="relative"
        style={{
          width: stackWidth,
          height: stackHeight,
          marginBottom: -t.cardW * 0.4,
        }}
      >
        {Array.from({ length: showCount }).map((_, i) => {
          const k = showCount === 1 ? 0 : (i - (showCount - 1) / 2) / ((showCount - 1) / 2);
          const translate = k * t.cardW * 0.4;
          const angle = k * 14;
          return (
            <div
              key={i}
              className="absolute left-1/2 top-0"
              style={{
                marginLeft: -t.cardW / 2,
                transform: `translateX(${translate}px) rotate(${angle}deg)`,
                width: t.cardW,
              }}
            >
              <Card
                card={null}
                faceDown
                size="sm"
                style={{ width: t.cardW, height: t.cardW * 1.45 }}
              />
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          'glass-bare flex items-center gap-1.5 rounded-pill py-0.5 pl-0.5 pr-2',
          pillRing,
        )}
      >
        <RingedAvatar
          initials={initial(player.name)}
          active={isAttack || isDefend}
          size={t.avatar}
          tone={avatarTone}
        />
        <span
          className="max-w-[68px] truncate font-sans font-semibold text-bone"
          style={{ fontSize: t.fontName }}
        >
          {player.name}
        </span>
        <span
          className={cn(
            'rounded-pill bg-black/40 px-1.5 py-0.5 font-mono tnum',
            isAttack ? 'text-crimson-400' : isDefend ? 'text-mint-300' : 'text-bone-mute',
          )}
          style={{ fontSize: t.fontCount }}
        >
          {player.handCount}
        </span>
      </div>
    </div>
  );
};

export const OpponentSeat = memo(OpponentSeatImpl);
