import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MIN_PLAYERS, SOCKET_EVENTS, type RoomPublic } from '@durak/shared';
import { useGameStore } from '@/store/gameStore';
import { emitAckOrToast } from '@/services/socket';
import { BrassButton } from '@/components/BrassButton';
import { ShareButton } from '@/components/ShareButton';
import { cn } from '@/lib/cn';

interface Props {
  room: RoomPublic;
}

/**
 * Pre-game waiting room shown while the room is in lobby status. The host
 * gets a "Spiel starten" button (active once min-players is reached). Others
 * see "Warte auf Host". The share button copies the /r/<id> URL for invites.
 */
export const WaitingRoom = ({ room }: Props): JSX.Element => {
  const playerId = useGameStore((s) => s.playerId);
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
  const navigate = useNavigate();
  const isHost = room.ownerId === playerId;
  const canStart = isHost && room.players.length >= MIN_PLAYERS;

  const handleStart = async () => {
    const ok = await emitAckOrToast(SOCKET_EVENTS.START_GAME, { roomId: room.id });
    if (ok === null) return;
    // The server flips status to in-game; RoomRoute will pick up the change.
  };

  const handleLeave = async () => {
    const ok = await emitAckOrToast(SOCKET_EVENTS.LEAVE_ROOM, { roomId: room.id });
    if (ok !== null) {
      setCurrentRoom(null);
      navigate('/', { replace: true });
    }
  };

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/r/${room.id}`
      : `/r/${room.id}`;

  return (
    <main className="flex min-h-dvh flex-col text-cream safe-pt safe-pb">
      <header className="flex items-end justify-between gap-3 px-5 pt-8">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-gold-light">
            Wartebereich
          </p>
          <h1 className="mt-1 truncate font-serif text-3xl italic leading-tight text-cream">
            {room.name}
          </h1>
        </div>
        <span className="mb-1 rounded-pill border border-gold/40 bg-mahogany-dark/70 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.3em] text-gold-light">
          {room.players.length}/{room.maxPlayers}
        </span>
      </header>

      <div className="mx-5 mt-5 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <section className="mt-6 flex flex-col gap-4 px-5">
        <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-gold-light">
          Am Tisch
        </h2>
        <ul className="flex flex-col gap-2.5">
          {room.players.map((p, i) => (
            <motion.li
              key={p.id}
              className="relative flex items-center gap-3 overflow-hidden rounded-card border border-gold/30 bg-gradient-to-br from-mahogany/70 to-mahogany-dark/80 px-4 py-3.5"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <span className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-gold/0 via-gold/70 to-gold/0" />
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full ring-2 ring-offset-2 ring-offset-mahogany-dark',
                  p.isConnected
                    ? 'bg-defending ring-defending/30'
                    : 'bg-cream-dim ring-cream-dim/20',
                )}
              />
              <span className="flex-1 truncate font-serif italic text-lg text-cream">{p.name}</span>
              {p.id === room.ownerId ? (
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.3em] text-gold-light">
                  Host
                </span>
              ) : null}
              {p.id === playerId ? (
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.3em] text-cream-dim">
                  Du
                </span>
              ) : null}
            </motion.li>
          ))}
        </ul>

        {room.players.length < MIN_PLAYERS ? (
          <p className="mt-2 font-serif italic text-cream-dim">
            Mindestens {MIN_PLAYERS} Spieler nötig. Lade Freunde ein.
          </p>
        ) : !isHost ? (
          <p className="mt-2 font-serif italic text-cream-dim">Warte, bis der Host startet …</p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <ShareButton url={shareUrl} />
          {isHost ? (
            <BrassButton
              variant="primary"
              label="Spiel starten"
              onClick={handleStart}
              disabled={!canStart}
            />
          ) : null}
          <BrassButton variant="secondary" label="Verlassen" onClick={handleLeave} />
        </div>
      </section>
    </main>
  );
};
