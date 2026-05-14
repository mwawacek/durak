import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { BrassButton } from '@/components/BrassButton';
import { SerifTitle } from '@/components/SerifTitle';
import { ModalShell } from '@/components/ModalShell';

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
  const titleId = 'gameover-title';

  return (
    <ModalShell onClose={handleClose} labelledById={titleId}>
      <div className="relative overflow-hidden rounded-sheet border border-line-mid bg-bg-card p-8 text-center">
        <span className="label-eyebrow">Spielende</span>
        <SerifTitle id={titleId} size="lg" className="mt-3 leading-tight">
          {iAmLoser ? 'Du bist Durak' : loserName ? `${loserName} ist Durak` : 'Unentschieden'}
        </SerifTitle>
        <p className="mt-2 font-sans text-sm text-text-secondary">
          {iAmLoser ? 'Beim nächsten Mal die anderen.' : 'Gut gespielt.'}
        </p>
        <div className="mt-7 flex justify-center">
          <BrassButton
            variant="primary"
            size="lg"
            label="Zurück zur Lobby"
            onClick={handleClose}
          />
        </div>
      </div>
    </ModalShell>
  );
};
