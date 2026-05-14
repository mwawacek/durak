import { motion } from 'framer-motion';
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg-base/80 px-6 backdrop-blur-md safe-pt safe-pb">
      <motion.div
        className="relative w-full max-w-sm overflow-hidden rounded-sheet border border-line-mid bg-bg-card p-8 text-center"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <span className="label-eyebrow">Spielende</span>
        <h2
          className="mt-3 font-serif text-3xl leading-tight text-text-primary"
          style={{ letterSpacing: '-0.015em', fontWeight: 500 }}
        >
          {iAmLoser ? 'Du bist Durak' : loserName ? `${loserName} ist Durak` : 'Unentschieden'}
        </h2>
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
      </motion.div>
    </div>
  );
};
