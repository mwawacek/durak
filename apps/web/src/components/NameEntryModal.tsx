import { useId, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { WordMark } from './WordMark';
import { BrassButton } from './BrassButton';

interface Props {
  reason?: 'lobby' | 'invite';
}

export const NameEntryModal = ({ reason = 'lobby' }: Props): JSX.Element => {
  const setIdentity = useGameStore((s) => s.setIdentity);
  const playerId = useGameStore((s) => s.playerId);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Mindestens 2 Zeichen');
      return;
    }
    setIdentity(playerId ?? '', trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-base/85 backdrop-blur-md">
      <motion.div
        className="mt-auto w-full px-3 pb-3 safe-pb sm:mt-0 sm:m-auto sm:max-w-md sm:p-6"
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <div className="rounded-sheet border border-line-mid bg-bg-card p-7">
          <div className="mb-7 text-center">
            <span className="label-eyebrow">
              {reason === 'invite' ? 'Einladung · Tisch' : 'Willkommen'}
            </span>
            <div className="mt-3">
              <WordMark size="md" />
            </div>
            <p className="mx-auto mt-3 max-w-[30ch] font-sans text-sm leading-relaxed text-text-secondary">
              {reason === 'invite'
                ? 'Wähle deinen Namen — du bist gleich am Tisch.'
                : 'Wähle deinen Namen. Wir merken ihn uns für die nächste Runde.'}
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <label htmlFor={inputId} className="label-eyebrow">
              Dein Name
            </label>
            <input
              id={inputId}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="z. B. Anna"
              autoFocus
              autoComplete="given-name"
              maxLength={32}
              className="rounded-card border border-line-mid bg-bg-mid px-4 py-3.5 font-sans text-base text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20"
            />
            {error ? <p className="text-sm text-accent">{error}</p> : null}
            <div className="mt-3 flex justify-center">
              <BrassButton variant="primary" type="submit" label="Beitreten" size="lg" />
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
