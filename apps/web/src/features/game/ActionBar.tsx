import { RingedAvatar } from '@/components/RingedAvatar';
import { BrassButton } from '@/components/BrassButton';

interface Props {
  playerName: string | null;
  /** Banner headline (typically derived from game state). */
  headline: string;
  subline: string;
  /** Role label shown under the player's name. */
  roleLabel: string;
  active: boolean;
  /** Primary CTA — usually "Bito" or "Nehmen". Hidden when neither applies. */
  primary?: { label: string; onClick: () => void; badge?: string | number } | null;
  /** Optional ghost button for the rare "Schieben" (Weiterschieben) state. */
  ghost?: { label: string; onClick: () => void; toggled?: boolean } | null;
  busy: boolean;
}

export const ActionBar = ({
  playerName,
  headline,
  subline,
  roleLabel,
  active,
  primary,
  ghost,
  busy,
}: Props): JSX.Element => (
  <div className="flex flex-col gap-2 pb-2">
    {/* Headline block */}
    <div className="px-4 text-center">
      <p
        className="font-serif text-[22px] font-medium leading-tight text-text-primary"
        style={{ letterSpacing: '-0.015em' }}
      >
        {headline}
      </p>
      <p className="mt-0.5 font-sans text-[11.5px] text-text-secondary">{subline}</p>
    </div>

    {/* Action bar */}
    <div className="flex h-[50px] items-center justify-between gap-3 px-4">
      <div className="flex shrink-0 items-center gap-2">
        <RingedAvatar
          initials={(playerName?.[0] ?? '?').toUpperCase()}
          active={active}
          size={30}
        />
        <div className="leading-tight">
          <p className="max-w-[110px] truncate font-sans text-[14px] font-medium text-text-primary">
            {playerName ?? 'Du'}
          </p>
          <p className="mt-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
            {roleLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {ghost ? (
          <BrassButton
            variant={ghost.toggled ? 'secondary-active' : 'secondary'}
            label={ghost.label}
            onClick={ghost.onClick}
            disabled={busy}
          />
        ) : null}
        {primary ? (
          <BrassButton
            variant="primary"
            size="lg"
            label={primary.label}
            badge={primary.badge}
            onClick={primary.onClick}
            disabled={busy}
          />
        ) : null}
      </div>
    </div>
  </div>
);
