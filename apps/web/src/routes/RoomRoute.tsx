import { Link, useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { NameEntryModal } from '@/components/NameEntryModal';
import { BrassButton } from '@/components/BrassButton';

/**
 * /r/:roomId stub.
 *
 * The full lobby-/in-game-switch logic and the WaitingRoom + GameTable
 * components arrive in later steps. For now this route renders a placeholder
 * so the router is wired end-to-end and deep-link entry (with a name modal
 * for invited friends) already works.
 */
export const RoomRoute = (): JSX.Element => {
  const { roomId } = useParams();
  const playerName = useGameStore((s) => s.playerName);

  if (!playerName) return <NameEntryModal reason="invite" />;
  if (!roomId) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-cream">
        <h1 className="font-serif text-2xl italic">Kein Raum angegeben</h1>
        <Link to="/">
          <BrassButton variant="primary" label="Zur Lobby" />
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-cream safe-pt safe-pb">
      <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold-light">Raum</p>
      <h1 className="font-serif text-xl italic text-cream">{roomId}</h1>
      <p className="text-sm text-cream-dim">Wartebereich folgt im nächsten Schritt.</p>
      <Link to="/">
        <BrassButton variant="secondary" label="Zur Lobby" />
      </Link>
    </main>
  );
};
