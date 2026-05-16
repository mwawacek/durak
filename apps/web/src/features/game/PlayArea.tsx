import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  children: ReactNode;
  /** When a hand card is selected, the panel shows a dashed accent outline
   *  as a drop-target hint. The actual commit happens via tapping a candidate
   *  attack card in the BattleField, not via the panel itself. */
  awaitingDrop?: boolean;
  empty?: boolean;
}

/**
 * The play surface — a single rounded panel, no oval, no felt. A subtle
 * radial highlight from the top adds atmosphere; when the player has a
 * card selected, a dashed accent outline marks the drop target.
 */
export const PlayArea = ({ children, awaitingDrop, empty }: Props): JSX.Element => (
  <div
    className={cn(
      'relative mx-4 mt-3.5 min-h-[180px] rounded-panel border border-line-subtle p-4 shadow-panel',
      'bg-surface-panel',
    )}
    style={{
      backgroundImage:
        'radial-gradient(120% 80% at 50% 30%, rgba(255,255,255,0.035) 0%, transparent 100%)',
    }}
  >
    <span className="label-eyebrow absolute left-4 top-3">Spielfeld</span>

    {awaitingDrop ? (
      <div
        className="pointer-events-none absolute rounded-panel"
        style={{
          inset: 6,
          border: '1px dashed rgba(255,111,94,0.35)',
        }}
      />
    ) : null}

    <div className="flex min-h-[160px] items-center justify-center pt-5">
      {empty ? (
        <p className="px-6 text-center font-sans text-[12.5px] italic text-text-tertiary">
          Karte aus der Hand wählen, dann hier ablegen.
        </p>
      ) : (
        children
      )}
    </div>
  </div>
);
