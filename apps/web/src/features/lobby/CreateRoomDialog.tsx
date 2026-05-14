import { useId, useState, type FormEvent } from 'react';
import { MIN_PLAYERS, MAX_PLAYERS } from '@durak/shared';
import { BrassButton } from '@/components/BrassButton';
import { cn } from '@/lib/cn';

interface Props {
  onCancel: () => void;
  onCreate: (name: string, maxPlayers: number) => void | Promise<void>;
  defaultName: string;
}

export const CreateRoomDialog = ({ onCancel, onCreate, defaultName }: Props): JSX.Element => {
  const [name, setName] = useState(defaultName);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const inputId = useId();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onCreate(name, maxPlayers);
  };

  const options = Array.from(
    { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
    (_, i) => MIN_PLAYERS + i,
  );

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-mahogany-dark/80 px-4 pb-8 sm:items-center sm:pb-0 safe-pb">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-card border border-gold/40 bg-mahogany-dark/95 p-5 shadow-raised"
      >
        <h2 className="font-serif text-xl italic text-cream">Neuen Tisch erstellen</h2>

        <label
          htmlFor={inputId}
          className="mt-4 block font-serif text-[10px] uppercase tracking-[0.2em] text-gold-light"
        >
          Name
        </label>
        <input
          id={inputId}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={48}
          autoFocus
          className="mt-1 w-full rounded-card border border-gold/40 bg-mahogany-dark/70 px-3 py-3 font-serif text-cream placeholder:text-cream-dim focus:border-gold-light focus:outline-none"
        />

        <p className="mt-4 font-serif text-[10px] uppercase tracking-[0.2em] text-gold-light">
          Max. Spieler
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMaxPlayers(n)}
              className={cn(
                'min-h-11 min-w-11 rounded-pill border px-4 py-2 text-sm font-bold transition-colors',
                maxPlayers === n
                  ? 'border-gold-highlight bg-gold text-ink'
                  : 'border-gold/40 bg-mahogany-dark/60 text-gold-light',
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <BrassButton variant="secondary" label="Abbrechen" onClick={onCancel} />
          <BrassButton variant="primary" type="submit" label="Erstellen" />
        </div>
      </form>
    </div>
  );
};
