import { memo } from 'react';
import type { PlayerPublic } from '@durak/shared';
import { Card } from '@/components/Card';
import { RingedAvatar } from '@/components/RingedAvatar';
import { cn } from '@/lib/cn';

export type SeatRole = 'attacker' | 'defender' | 'wait';

interface OpponentSeat {
  player: PlayerPublic;
  role: SeatRole;
}

interface Props {
  seats: OpponentSeat[];
}

/**
 * Horizontal strip with up to N opponents. Each opponent: small fan of card
 * backs above a chip showing name + status. Active opponent (attacker or
 * defender) is tinted with the accent.
 */
export const OpponentRow = memo(function OpponentRow({ seats }: Props) {
  if (seats.length === 0) return null;
  return (
    <div className="flex h-[90px] items-end justify-around gap-2 px-4 pt-2">
      {seats.map((s) => (
        <OpponentColumn key={s.player.id} seat={s} />
      ))}
    </div>
  );
});

const BACK_W = 24;

function OpponentColumn({ seat }: { seat: OpponentSeat }) {
  const active = seat.role !== 'wait';
  const showCount = Math.min(seat.player.handCount, 5);
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1.5',
        !seat.player.isConnected && 'opacity-40',
      )}
    >
      <div className="relative" style={{ width: BACK_W * 2.2, height: BACK_W * 1.6 }}>
        {Array.from({ length: showCount }).map((_, i) => {
          const k = showCount === 1 ? 0 : (i - (showCount - 1) / 2) / ((showCount - 1) / 2);
          const translate = k * BACK_W * 0.4;
          const angle = k * 12;
          return (
            <div
              key={i}
              className="absolute left-1/2 top-0"
              style={{
                marginLeft: -BACK_W / 2,
                transform: `translateX(${translate}px) rotate(${angle}deg)`,
              }}
            >
              <Card card={null} faceDown width={BACK_W} />
            </div>
          );
        })}
        {/* Count badge */}
        <span
          className={cn(
            'absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-pill border px-1.5 font-mono text-[10px] font-bold tnum',
            active
              ? 'border-transparent bg-accent text-bg-base'
              : 'border-line-mid bg-bg-card/80 text-text-secondary',
          )}
        >
          {seat.player.handCount}
        </span>
      </div>

      <OpponentChip seat={seat} />
    </div>
  );
}

function OpponentChip({ seat }: { seat: OpponentSeat }) {
  const isAttack = seat.role === 'attacker';
  const isDefend = seat.role === 'defender';
  const active = isAttack || isDefend;
  const status = isAttack
    ? 'greift an'
    : isDefend
      ? 'verteidigt'
      : `${seat.player.handCount} ${seat.player.handCount === 1 ? 'karte' : 'karten'}`;
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-pill py-1 pl-1 pr-2.5',
        active
          ? 'border border-accent-ring bg-accent-soft'
          : 'border border-line-subtle bg-transparent',
      )}
    >
      <RingedAvatar
        initials={(seat.player.name[0] ?? '?').toUpperCase()}
        active={active}
        size={22}
      />
      <div className="leading-tight">
        <p className="max-w-[60px] truncate font-sans text-[11px] font-medium text-text-primary">
          {seat.player.name}
        </p>
        <p
          className={cn(
            'mt-0.5 font-sans text-[8.5px] font-semibold uppercase tracking-[0.08em]',
            active ? 'text-accent' : 'text-text-tertiary',
          )}
        >
          {status}
        </p>
      </div>
    </div>
  );
}
