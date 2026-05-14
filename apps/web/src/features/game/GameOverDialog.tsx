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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-mahogany-dark/90 backdrop-blur-sm px-6 safe-pt safe-pb">
      <motion.div
        className="relative w-full max-w-sm overflow-hidden rounded-card border border-gold/40 bg-gradient-to-br from-mahogany/80 to-mahogany-dark/95 p-8 text-center shadow-raised"
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      >
        {/* Double engraved border */}
        <div className="pointer-events-none absolute inset-3 rounded-[0.35rem] border border-gold/25" />

        <p className="relative font-display text-[10px] font-bold uppercase tracking-[0.5em] text-gold-light">
          {iAmLoser ? 'Durak' : 'Spielende'}
        </p>
        <div className="relative mt-2 text-5xl tracking-[0.05em]">
          <span className="font-display font-extrabold text-cream-soft">
            {iAmLoser ? '♣' : '♦'}
          </span>
        </div>
        <h2 className="relative mt-3 font-serif text-3xl italic leading-tight text-cream">
          {iAmLoser ? 'Du bist der Durak!' : loserName ? `Durak: ${loserName}` : 'Unentschieden'}
        </h2>
        <p className="relative mt-3 font-serif text-base italic text-cream-dim">
          {iAmLoser ? 'Beim nächsten Mal die anderen.' : 'Gut gespielt.'}
        </p>
        <div className="relative mt-7 flex justify-center">
          <BrassButton variant="primary" label="Zurück zur Lobby" onClick={handleClose} />
        </div>
      </motion.div>
    </div>
  );
};
