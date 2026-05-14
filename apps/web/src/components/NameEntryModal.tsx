import { useId, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { WordMark } from '@/App';
import { BrassButton } from './BrassButton';

interface Props {
  reason?: 'lobby' | 'invite';
}

/**
 * Blocking modal asking the user to choose a display name before they can
 * use the lobby or join an invite link. Persists via the store (which mirrors
 * to LocalStorage via useNamePersistence).
 */
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
      setError('Name muss mindestens 2 Zeichen haben');
      return;
    }
    // Store only the name here. playerId comes back from JOIN_LOBBY ack;
    // useLobbyJoin will emit it as soon as we set the name.
    setIdentity(playerId ?? '', trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-mahogany-dark/85 backdrop-blur-sm safe-pt safe-pb">
      <motion.div
        className="m-auto w-full max-w-sm px-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <div className="relative overflow-hidden rounded-card border border-gold/40 bg-mahogany-dark/90 p-7 shadow-raised">
          {/* Inner border halo — engraved feel */}
          <div className="pointer-events-none absolute inset-2 rounded-[0.4rem] border border-gold/20" />

          <div className="relative mb-6 text-center">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.4em] text-gold-light">
              · ♣  ♦ ·
            </p>
            <div className="mt-2">
              <WordMark size="lg" />
            </div>
            <p className="mt-3 font-serif text-base italic text-cream">
              {reason === 'invite'
                ? 'Tritt dem Tisch bei.'
                : 'Wähle deinen Namen — er bleibt für die nächste Runde gespeichert.'}
            </p>
          </div>

          <form onSubmit={submit} className="relative flex flex-col gap-3">
            <label
              htmlFor={inputId}
              className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-gold-light"
            >
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
              className="rounded-card border border-gold/40 bg-mahogany-dark/80 px-4 py-3.5 font-serif text-lg italic text-cream placeholder:text-cream-dim/60 focus:border-gold-light focus:outline-none"
            />
            {error ? <p className="text-sm font-serif italic text-red">{error}</p> : null}
            <div className="mt-3 flex justify-center">
              <BrassButton variant="primary" type="submit" label="Beitreten" />
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
