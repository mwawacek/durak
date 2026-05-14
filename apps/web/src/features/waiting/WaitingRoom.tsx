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
    <main className="flex h-dvh flex-col text-text-primary safe-pt safe-pb">
      <header className="px-5 pt-10">
        <span className="label-eyebrow">Wartebereich</span>
        <h1
          className="mt-2 truncate font-serif text-3xl leading-tight text-text-primary"
          style={{ fontWeight: 500, letterSpacing: '-0.015em' }}
        >
          {room.name}
        </h1>
        <div className="mt-3 inline-flex items-center gap-2 rounded-pill border border-line-subtle bg-white/[0.03] px-3 py-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              room.players.length >= MIN_PLAYERS ? 'bg-accent' : 'bg-text-tertiary',
            )}
          />
          <span className="font-mono text-[11px] text-text-secondary tnum">
            {room.players.length}/{room.maxPlayers}
          </span>
        </div>
      </header>

      <section className="mt-7 flex flex-col gap-3 px-5">
        <h2 className="label-eyebrow">Am Tisch</h2>
        <ul className="flex flex-col gap-2.5">
          {room.players.map((p, i) => (
            <motion.li
              key={p.id}
              className="flex items-center gap-3 rounded-panel border border-line-subtle bg-bg-card/60 px-4 py-3.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  p.isConnected ? 'bg-accent' : 'bg-text-tertiary',
                )}
              />
              <span className="flex-1 truncate font-sans text-[15px] text-text-primary">
                {p.name}
              </span>
              {p.id === room.ownerId ? <span className="label-eyebrow">Host</span> : null}
              {p.id === playerId ? <span className="label-eyebrow">Du</span> : null}
            </motion.li>
          ))}
        </ul>

        {room.players.length < MIN_PLAYERS ? (
          <p className="mt-2 font-sans text-sm text-text-secondary">
            Mindestens {MIN_PLAYERS} Spieler nötig. Lade Freunde ein.
          </p>
        ) : !isHost ? (
          <p className="mt-2 font-sans text-sm italic text-text-secondary">
            Warte, bis der Host startet …
          </p>
        ) : null}
      </section>

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
