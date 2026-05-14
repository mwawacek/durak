import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { BrassButton } from '@/components/BrassButton';

interface Props {
  iAmLoser: boolean;
  loserName: string | null;
}

export const GameOverDialog = ({ iAmLoser, loserName }: Props): JSX.Element => {
  const navigate = useNavigate();
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
  const setGame = useGameStore((s) => s.setGame);
  const handleClose = () => {
    setGame(null);
    setCurrentRoom(null);
    navigate('/', { replace: true });
  };
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-mahogany-dark/85 px-6 safe-pt safe-pb">
      <div className="w-full max-w-sm rounded-card border border-gold/40 bg-mahogany-dark/95 p-6 text-center shadow-raised">
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold-light">Spielende</p>
        <h2 className="mt-2 font-serif text-3xl italic text-cream">
          {iAmLoser ? 'Du bist der Durak!' : 'Spielende'}
        </h2>
        <p className="mt-3 text-sm text-cream-dim">
          {iAmLoser
            ? 'Beim nächsten Mal!'
            : loserName
              ? `Durak: ${loserName}`
              : 'Unentschieden'}
        </p>
        <div className="mt-6 flex justify-center">
          <BrassButton variant="primary" label="Zurück zur Lobby" onClick={handleClose} />
        </div>
      </div>
    </div>
  );
};
