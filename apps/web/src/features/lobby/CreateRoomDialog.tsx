import { useId, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
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
    <div
      className="fixed inset-0 z-50 flex flex-col bg-bg-base/80 backdrop-blur-md"
      onClick={onCancel}
    >
      <motion.form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="mt-auto w-full rounded-t-sheet border border-line-mid bg-bg-card p-6 safe-pb sm:m-auto sm:max-w-md sm:rounded-sheet sm:p-7"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line-mid sm:hidden" />

        <span className="label-eyebrow">Neuer Tisch</span>
        <h2
          className="mt-1 font-serif text-2xl text-text-primary"
          style={{ fontWeight: 500, letterSpacing: '-0.015em' }}
        >
          Wie soll er heißen?
        </h2>

        <label htmlFor={inputId} className="label-eyebrow mt-6 block">
          Name
        </label>
        <input
          id={inputId}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={48}
          autoFocus
          className="mt-2 w-full rounded-card border border-line-mid bg-bg-mid px-4 py-3.5 font-sans text-base text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20"
        />

        <p className="label-eyebrow mt-6">Max. Spieler</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {options.map((n) => (
            <button
              key={n}
              type="button"
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
      </motion.form>
    </div>
  );
};
