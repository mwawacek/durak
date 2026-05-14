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
      className="fixed inset-0 z-50 flex flex-col bg-ink-950/70 backdrop-blur-md"
      onClick={onCancel}
    >
      <motion.form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="glass-strong mt-auto w-full rounded-t-sheet p-6 safe-pb sm:m-auto sm:max-w-md sm:rounded-sheet sm:p-7"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      >
        {/* Drag-handle ornament */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

        <p className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-bone-mute">
          Neuer Tisch
        </p>
        <h2 className="mt-1 font-display text-2xl text-bone">Wie soll er heißen?</h2>

        <label
          htmlFor={inputId}
          className="mt-6 block font-display text-[10px] font-bold uppercase tracking-[0.3em] text-bone-mute"
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
          className="mt-2 w-full rounded-card border border-white/10 bg-ink-900/60 px-4 py-3.5 font-sans text-base text-bone placeholder:text-bone-ghost focus:border-crimson-400 focus:outline-none focus:ring-4 focus:ring-crimson-500/20"
        />

        <p className="mt-6 font-display text-[10px] font-bold uppercase tracking-[0.3em] text-bone-mute">
          Max. Spieler
        </p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {options.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMaxPlayers(n)}
              className={cn(
                'flex h-12 items-center justify-center rounded-card border font-display text-base font-bold transition-all',
                'active:scale-[0.97]',
                maxPlayers === n
                  ? 'border-crimson-400 bg-crimson-500/20 text-bone shadow-crimson'
                  : 'border-white/10 bg-white/5 text-bone-mute',
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
