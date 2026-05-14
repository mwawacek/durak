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
 * Horizontal opponent strip. Adapts to seat count: fewer seats → full chip
 * with status, more seats → compact chip (just name + count). Active player
 * (attacker or defender) is tinted with the coral accent.
 */
const COMPACT_THRESHOLD = 4;
const BACK_W_FULL = 24;
const BACK_W_COMPACT = 18;

export const OpponentRow = memo(function OpponentRow({ seats }: Props) {
  if (seats.length === 0) return null;
  const compact = seats.length >= COMPACT_THRESHOLD;
  return (
    <div
      className={cn(
        'flex items-end px-3 pt-1',
        compact ? 'h-[80px] justify-between gap-1' : 'h-[90px] justify-around gap-2',
      )}
    >
      {seats.map((seat) => (
        <OpponentColumn key={seat.player.id} seat={seat} compact={compact} />
      ))}
    </div>
  );
});

function OpponentColumn({ seat, compact }: { seat: OpponentSeat; compact: boolean }) {
  const active = seat.role !== 'wait';
  const backW = compact ? BACK_W_COMPACT : BACK_W_FULL;
  const showCount = Math.min(seat.player.handCount, compact ? 3 : 5);
  return (
    <div
      className={cn(
        'flex flex-col items-center',
        compact ? 'gap-1' : 'gap-1.5',
        !seat.player.isConnected && 'opacity-40',
      )}
    >
      <CardFan count={showCount} cardWidth={backW} active={active} hand={seat.player.handCount} />
      <OpponentChip seat={seat} compact={compact} />
    </div>
  );
}

function CardFan({
  count,
  cardWidth,
  active,
  hand,
}: {
  count: number;
  cardWidth: number;
  active: boolean;
  hand: number;
}) {
  const w = cardWidth;
  return (
    <div className="relative" style={{ width: w * 2.2, height: w * 1.6 }}>
      {Array.from({ length: count }).map((_, i) => {
        const k = count === 1 ? 0 : (i - (count - 1) / 2) / ((count - 1) / 2);
        return (
          <div
            key={i}
            className="absolute left-1/2 top-0"
            style={{
              marginLeft: -w / 2,
              transform: `translateX(${k * w * 0.4}px) rotate(${k * 12}deg)`,
            }}
          >
            <Card card={null} faceDown width={w} />
          </div>
        );
      })}
      <span
        className={cn(
          'absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-pill border px-1.5 font-mono text-[10px] font-bold tnum',
          active
            ? 'border-transparent bg-accent text-bg-base'
            : 'border-line-mid bg-bg-card/80 text-text-secondary',
        )}
      >
        {hand}
      </span>
    </div>
  );
}

function OpponentChip({ seat, compact }: { seat: OpponentSeat; compact: boolean }) {
  const isAttack = seat.role === 'attacker';
  const isDefend = seat.role === 'defender';
  const active = isAttack || isDefend;
  const status = isAttack ? 'greift an' : isDefend ? 'verteidigt' : null;
  return (
    <div
      className={cn(
        'flex items-center rounded-pill',
        compact ? 'gap-1 py-0.5 pl-0.5 pr-2' : 'gap-1.5 py-1 pl-1 pr-2.5',
        active
          ? 'border border-accent-ring bg-accent-soft'
          : 'border border-line-subtle bg-transparent',
      )}
    >
      <RingedAvatar
        initials={(seat.player.name[0] ?? '?').toUpperCase()}
        active={active}
        size={compact ? 18 : 22}
      />
      <div className="leading-tight">
        <p
          className={cn(
            'truncate font-sans font-medium text-text-primary',
            compact ? 'max-w-[44px] text-[10px]' : 'max-w-[60px] text-[11px]',
          )}
        >
          {seat.player.name}
        </p>
        {!compact && status ? (
          <p className="mt-0.5 font-sans text-[8.5px] font-semibold uppercase tracking-[0.08em] text-accent">
            {status}
          </p>
        ) : null}
      </div>
    </div>
  );
}
