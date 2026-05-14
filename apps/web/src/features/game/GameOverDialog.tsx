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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/80 backdrop-blur-md px-6 safe-pt safe-pb">
      <motion.div
        className="glass-strong relative w-full max-w-sm overflow-hidden rounded-sheet p-8 text-center"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      >
        {/* Accent rail along the top */}
        <span
          className="absolute inset-x-6 top-0 h-[3px] rounded-b-full"
          style={{
            background: iAmLoser
              ? 'linear-gradient(90deg, transparent, #ff3b5f, transparent)'
              : 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
          }}
        />

        <p className="font-display text-[10px] font-bold uppercase tracking-[0.5em] text-bone-mute">
          Spielende
        </p>

        <h2
          className="mt-5 font-display text-4xl leading-tight text-bone"
          style={{ fontVariationSettings: '"wdth" 95, "wght" 800' }}
        >
          {iAmLoser ? 'Du bist Durak' : loserName ? `${loserName} ist Durak` : 'Unentschieden'}
        </h2>
        <p className="mt-3 font-sans text-base text-bone-mute">
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
