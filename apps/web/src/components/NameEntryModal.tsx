import { useId, useState, type FormEvent } from 'react';
import { useGameStore } from '@/store/gameStore';
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
    <div className="fixed inset-0 z-50 flex flex-col bg-mahogany-dark/85 safe-pt safe-pb">
      <div className="m-auto w-full max-w-sm px-6">
        <div className="rounded-card border border-gold/40 bg-mahogany-dark/90 p-6 shadow-raised">
          <div className="mb-5 text-center">
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-light">Durak</p>
            <h1 className="mt-1 font-serif text-3xl italic text-gold-highlight">
              {reason === 'invite' ? 'Tritt dem Tisch bei' : 'Willkommen'}
            </h1>
            <p className="mt-2 text-xs text-cream-dim">Wähle deinen Namen — er bleibt gespeichert.</p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <label
              htmlFor={inputId}
              className="font-serif text-[10px] uppercase tracking-[0.2em] text-gold-light"
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
              className="rounded-card border border-gold/40 bg-mahogany-dark/80 px-4 py-3 font-serif text-base text-cream placeholder:text-cream-dim focus:border-gold-light focus:outline-none"
            />
            {error ? <p className="text-sm text-red">{error}</p> : null}
            <div className="mt-2 flex justify-center">
              <BrassButton variant="primary" type="submit" label="Beitreten" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
