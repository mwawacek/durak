import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { persistence } from '@/lib/persistence';
import { BrassButton } from '@/components/BrassButton';
import { SerifTitle } from '@/components/SerifTitle';
import { ModalShell } from '@/components/ModalShell';

interface Props {
  iAmLoser: boolean;
  loserName: string | null;
  /** No Durak declared and every other seat at the table left mid-game. */
  iWonByForfeit: boolean;
}

const buildOutcome = ({
  iAmLoser,
  loserName,
  iWonByForfeit,
}: Props): { headline: string; sub: string } => {
  if (iAmLoser) return { headline: 'Du bist Durak', sub: 'Beim nächsten Mal die anderen.' };
  if (loserName) return { headline: `${loserName} ist Durak`, sub: 'Gut gespielt.' };
  if (iWonByForfeit) {
    return { headline: 'Du hast gewonnen', sub: 'Die anderen haben aufgegeben.' };
  }
  return { headline: 'Unentschieden', sub: 'Gut gespielt.' };
};

export const GameOverDialog = (props: Props): JSX.Element => {
  const navigate = useNavigate();
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
  const setGame = useGameStore((s) => s.setGame);
  const handleClose = () => {
    // Clear LS synchronously — otherwise useBootReconnect on the next
    // LobbyRoute mount could read a stale lastRoom and bounce the user back
    // into the finished game. The store subscriber in useNamePersistence
    // mirrors back too, but we want zero ambiguity at the navigation edge.
    persistence.setLastRoom(null);
    setGame(null);
    setCurrentRoom(null);
    navigate('/', { replace: true });
  };
  const titleId = 'gameover-title';
  const { headline, sub } = buildOutcome(props);

  return (
    <ModalShell onClose={handleClose} labelledById={titleId}>
      <div className="relative overflow-hidden rounded-sheet border border-line-mid bg-bg-card p-8 text-center">
        <span className="label-eyebrow">Spielende</span>
        <SerifTitle id={titleId} size="lg" className="mt-3 leading-tight">
          {headline}
        </SerifTitle>
        <p className="mt-2 font-sans text-sm text-text-secondary">{sub}</p>
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
