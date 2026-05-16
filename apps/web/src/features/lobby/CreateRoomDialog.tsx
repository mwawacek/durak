import { useId, useState, type FormEvent } from 'react';
import { MIN_PLAYERS, MAX_PLAYERS } from '@durak/shared';
import { BrassButton } from '@/components/BrassButton';
import { SerifTitle } from '@/components/SerifTitle';
import { ModalShell } from '@/components/ModalShell';
import { cn } from '@/lib/cn';

interface Props {
  onCancel: () => void;
  onCreate: (name: string, maxPlayers: number) => void | Promise<void>;
  defaultName: string;
}

const DEFAULT_MAX_PLAYERS = 4;
const ROOM_NAME_MAX_LEN = 48;

export const CreateRoomDialog = ({ onCancel, onCreate, defaultName }: Props): JSX.Element => {
  const [name, setName] = useState(defaultName);
  const [maxPlayers, setMaxPlayers] = useState(DEFAULT_MAX_PLAYERS);
  const inputId = useId();
  const titleId = useId();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onCreate(name, maxPlayers);
  };

  const options = Array.from(
    { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
    (_, i) => MIN_PLAYERS + i,
  );

  return (
    <ModalShell onClose={onCancel} variant="bottom-sheet" labelledById={titleId}>
      <form
        onSubmit={handleSubmit}
        className="rounded-t-sheet border border-line-mid bg-bg-card p-6 sm:rounded-sheet sm:p-7"
      >
        <span className="label-eyebrow">Neuer Tisch</span>
        <SerifTitle id={titleId} size="md" className="mt-1">
          Wie soll er heißen?
        </SerifTitle>

        <label htmlFor={inputId} className="label-eyebrow mt-6 block">
          Name
        </label>
        <input
          id={inputId}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={ROOM_NAME_MAX_LEN}
          autoFocus
          className="mt-2 w-full rounded-card border border-line-mid bg-bg-mid px-4 py-3.5 font-sans text-base text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20"
        />

        <p className="label-eyebrow mt-6">Max. Spieler</p>
        <div className="mt-2 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Maximale Spielerzahl">
          {options.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={maxPlayers === n}
              onClick={() => setMaxPlayers(n)}
              className={cn(
                'flex h-12 items-center justify-center rounded-card border font-sans text-base font-semibold transition-all active:scale-[0.97]',
                maxPlayers === n
                  ? 'border-accent bg-accent-soft text-text-primary'
                  : 'border-line-mid bg-bg-mid/60 text-text-secondary',
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <BrassButton variant="secondary" label="Abbrechen" onClick={onCancel} />
          <BrassButton variant="primary" type="submit" label="Erstellen" size="lg" />
        </div>
      </form>
    </ModalShell>
  );
};
