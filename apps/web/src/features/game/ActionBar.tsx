import { RingedAvatar } from '@/components/RingedAvatar';
import { BrassButton } from '@/components/BrassButton';
import { cn } from '@/lib/cn';

interface BannerProps {
  line: string;
  sub: string;
}

interface Props {
  playerName: string | null;
  bannerHeight: number;
  actionRowHeight: number;
  banner: BannerProps;
  isAttacker: boolean;
  isDefender: boolean;
  needsConfirm: boolean;
  canEndTurn: boolean;
  canTake: boolean;
  canRedirect: boolean;
  redirectMode: boolean;
  undefendedCount: number;
  busy: boolean;
  onEndTurn: () => void;
  onTake: () => void;
  onToggleRedirect: () => void;
}

const roleLabel = (isAttacker: boolean, isDefender: boolean, needsConfirm: boolean): string => {
  if (needsConfirm) return 'BITO';
  if (isDefender) return 'VERTEIDIGUNG';
  if (isAttacker) return 'ANGRIFF';
  return 'WARTEN';
};

const roleColor = (isAttacker: boolean, isDefender: boolean, needsConfirm: boolean): string => {
  if (needsConfirm) return 'text-gold-light';
  if (isDefender) return 'text-defending';
  if (isAttacker) return 'text-red-count';
  return 'text-cream-dim';
};

export const ActionBar = ({
  playerName,
  bannerHeight,
  actionRowHeight,
  banner,
  isAttacker,
  isDefender,
  needsConfirm,
  canEndTurn,
  canTake,
  canRedirect,
  redirectMode,
  undefendedCount,
  busy,
  onEndTurn,
  onTake,
  onToggleRedirect,
}: Props): JSX.Element => {
  const active = isAttacker || isDefender || needsConfirm;
  return (
    <>
      <div
        className="flex items-center justify-center px-4 text-center"
        style={{ height: bannerHeight }}
      >
        <div>
          <p
            className="truncate font-serif text-xl font-bold text-cream"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
          >
            {banner.line}
          </p>
          <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.25em] text-cream-dim">
            {banner.sub}
          </p>
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-3 px-3"
        style={{ height: actionRowHeight }}
      >
        <div className="flex shrink-0 items-center gap-2 rounded-pill border border-gold/40 bg-mahogany-dark/70 py-1 pl-1 pr-3">
          <RingedAvatar initials={(playerName?.[0] ?? 'D').toUpperCase()} active={active} size={26} />
          <div className="min-w-0">
            <p className="max-w-[80px] truncate font-serif text-xs font-bold text-cream-soft leading-tight">
              {playerName ?? 'Du'}
            </p>
            <p className={cn('text-[8px] font-bold tracking-widest', roleColor(isAttacker, isDefender, needsConfirm))}>
              {roleLabel(isAttacker, isDefender, needsConfirm)}
            </p>
          </div>
        </div>

        <div className="flex shrink flex-wrap justify-end gap-2">
          {canEndTurn ? (
            <BrassButton variant="primary" label="Fertig" onClick={onEndTurn} disabled={busy} />
          ) : null}
          {canTake ? (
            <BrassButton
              variant="danger"
              label="Nehmen"
              badge={undefendedCount > 0 ? `+${undefendedCount}` : undefined}
              onClick={onTake}
              disabled={busy}
            />
          ) : null}
          {canRedirect ? (
            <BrassButton
              variant={redirectMode ? 'secondary-active' : 'secondary'}
              label={redirectMode ? 'Abbrechen' : 'Weiterschieben'}
              onClick={onToggleRedirect}
              disabled={busy}
            />
          ) : null}
        </div>
      </div>
    </>
  );
};
