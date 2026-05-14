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

export const WaitingRoom = ({ room }: Props): JSX.Element => {
  const playerId = useGameStore((s) => s.playerId);
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
  const navigate = useNavigate();
  const isHost = room.ownerId === playerId;
  const canStart = isHost && room.players.length >= MIN_PLAYERS;

  const handleStart = async () => {
    await emitAckOrToast(SOCKET_EVENTS.START_GAME, { roomId: room.id });
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
    <main className="flex min-h-dvh flex-col text-bone safe-pt safe-pb">
      <header className="px-5 pt-10">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-bone-mute">
          Wartebereich
        </p>
        <h1 className="mt-2 truncate font-display text-3xl leading-tight text-bone">
          {room.name}
        </h1>
        <div className="mt-3 inline-flex items-center gap-2 rounded-pill bg-white/5 px-3 py-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              room.players.length >= MIN_PLAYERS
                ? 'bg-mint-400 shadow-[0_0_8px_rgba(94,234,212,0.6)]'
                : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]',
            )}
          />
          <span className="font-mono text-[11px] text-bone-mute tnum">
            {room.players.length}/{room.maxPlayers}
          </span>
        </div>
      </header>

      <section className="mt-7 flex flex-col gap-3 px-5">
        <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-bone-mute">
          Am Tisch
        </h2>
        <ul className="flex flex-col gap-2.5">
          {room.players.map((p, i) => (
            <motion.li
              key={p.id}
              className="glass flex items-center gap-3 rounded-card px-4 py-3.5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  p.isConnected
                    ? 'bg-mint-400 shadow-[0_0_8px_rgba(94,234,212,0.5)]'
                    : 'bg-bone-ghost',
                )}
              />
              <span className="flex-1 truncate font-sans text-base text-bone">{p.name}</span>
              {p.id === room.ownerId ? (
                <span className="rounded-pill bg-amber-400/15 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.2em] text-amber-300">
                  Host
                </span>
              ) : null}
              {p.id === playerId ? (
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-bone-mute">
                  Du
                </span>
              ) : null}
            </motion.li>
          ))}
        </ul>

        {room.players.length < MIN_PLAYERS ? (
          <p className="mt-2 font-sans text-sm text-bone-mute">
            Mindestens {MIN_PLAYERS} Spieler nötig. Lade Freunde ein.
          </p>
        ) : !isHost ? (
          <p className="mt-2 font-sans text-sm italic text-bone-mute">
            Warte, bis der Host startet …
          </p>
        ) : null}
      </section>

      {/* Bottom action zone — sticky on mobile */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 px-5 pt-8 pb-2">
        <ShareButton url={shareUrl} />
        <div className="flex gap-2">
          <BrassButton variant="secondary" label="Verlassen" onClick={handleLeave} />
          {isHost ? (
            <BrassButton
              variant="primary"
              size="lg"
              label="Starten"
              onClick={handleStart}
              disabled={!canStart}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
};
